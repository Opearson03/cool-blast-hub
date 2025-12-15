import { useState, useEffect } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Check, X, Calendar, AlertTriangle, MapPin, Clock } from "lucide-react";

interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  review_notes: string | null;
  created_at: string;
  profiles?: { full_name: string };
}

interface ConflictingPour {
  id: string;
  pour_name: string;
  pour_date: string;
  scheduled_time: string | null;
  job: { name: string; site_address: string } | null;
}

interface LeaveRequestsListProps {
  requests: LeaveRequest[];
  isAdmin: boolean;
  onUpdate: () => void;
}

const leaveTypeLabels: Record<string, string> = {
  annual: "Annual Leave",
  sick: "Sick Leave",
  personal: "Personal Leave",
  unpaid: "Unpaid Leave",
  other: "Other",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-500",
  approved: "bg-green-500/20 text-green-500",
  rejected: "bg-red-500/20 text-red-500",
};

export function LeaveRequestsList({ requests, isAdmin, onUpdate }: LeaveRequestsListProps) {
  const [reviewDialog, setReviewDialog] = useState<{ 
    open: boolean; 
    request: LeaveRequest | null; 
    action: "approve" | "reject" | null;
    step: "confirm" | "conflicts";
  }>({
    open: false,
    request: null,
    action: null,
    step: "confirm",
  });
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictingPours, setConflictingPours] = useState<ConflictingPour[]>([]);
  const [poursToRemove, setPoursToRemove] = useState<Set<string>>(new Set());
  const [loadingConflicts, setLoadingConflicts] = useState(false);

  const fetchConflictingPours = async (request: LeaveRequest) => {
    setLoadingConflicts(true);
    try {
      const { data, error } = await supabase
        .from("pour_employees")
        .select(`
          pour_id,
          job_pours!inner(
            id,
            pour_name,
            pour_date,
            scheduled_time,
            jobs(name, site_address)
          )
        `)
        .eq("employee_id", request.employee_id);

      if (error) throw error;

      const conflicts: ConflictingPour[] = [];
      const startDate = new Date(request.start_date);
      const endDate = new Date(request.end_date);

      data?.forEach((item: any) => {
        const pour = item.job_pours;
        if (pour?.pour_date) {
          const pourDate = new Date(pour.pour_date);
          if (pourDate >= startDate && pourDate <= endDate) {
            conflicts.push({
              id: pour.id,
              pour_name: pour.pour_name,
              pour_date: pour.pour_date,
              scheduled_time: pour.scheduled_time,
              job: pour.jobs,
            });
          }
        }
      });

      setConflictingPours(conflicts);
      setPoursToRemove(new Set(conflicts.map(p => p.id)));
    } catch (error) {
      console.error("Error fetching conflicting pours:", error);
    } finally {
      setLoadingConflicts(false);
    }
  };

  const handleApproveClick = async (request: LeaveRequest) => {
    setReviewDialog({ open: true, request, action: "approve", step: "confirm" });
    await fetchConflictingPours(request);
  };

  const handleProceedWithApproval = () => {
    if (conflictingPours.length > 0) {
      setReviewDialog(prev => ({ ...prev, step: "conflicts" }));
    } else {
      handleReview();
    }
  };

  const togglePourRemoval = (pourId: string) => {
    const newSet = new Set(poursToRemove);
    if (newSet.has(pourId)) {
      newSet.delete(pourId);
    } else {
      newSet.add(pourId);
    }
    setPoursToRemove(newSet);
  };

  const handleReview = async () => {
    if (!reviewDialog.request || !reviewDialog.action) return;
    
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // If approving and there are pours to remove, remove the employee from those pours
      if (reviewDialog.action === "approve" && poursToRemove.size > 0) {
        const pourIds = Array.from(poursToRemove);
        const { error: removeError } = await supabase
          .from("pour_employees")
          .delete()
          .eq("employee_id", reviewDialog.request.employee_id)
          .in("pour_id", pourIds);

        if (removeError) throw removeError;
      }

      const { error } = await supabase
        .from("leave_requests")
        .update({
          status: reviewDialog.action === "approve" ? "approved" : "rejected",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null,
        })
        .eq("id", reviewDialog.request.id);

      if (error) throw error;

      const removedCount = poursToRemove.size;
      toast({
        title: `Leave request ${reviewDialog.action === "approve" ? "approved" : "rejected"}`,
        description: reviewDialog.action === "approve" && removedCount > 0
          ? `Employee removed from ${removedCount} pour${removedCount > 1 ? "s" : ""}.`
          : `The leave request has been ${reviewDialog.action === "approve" ? "approved" : "rejected"}.`,
      });

      setReviewDialog({ open: false, request: null, action: null, step: "confirm" });
      setReviewNotes("");
      setConflictingPours([]);
      setPoursToRemove(new Set());
      onUpdate();
    } catch (error) {
      console.error("Error reviewing leave request:", error);
      toast({
        title: "Error",
        description: "Failed to update leave request.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeDialog = () => {
    setReviewDialog({ open: false, request: null, action: null, step: "confirm" });
    setReviewNotes("");
    setConflictingPours([]);
    setPoursToRemove(new Set());
  };

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No leave requests found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {isAdmin && <TableHead>Employee</TableHead>}
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  {isAdmin && (
                    <TableCell className="font-medium">
                      {request.profiles?.full_name || "Unknown"}
                    </TableCell>
                  )}
                  <TableCell>{leaveTypeLabels[request.leave_type] || request.leave_type}</TableCell>
                  <TableCell>
                    {format(new Date(request.start_date), "MMM d")} - {format(new Date(request.end_date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[request.status]}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      {request.status === "pending" && (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-500 hover:text-green-600"
                            onClick={() => handleApproveClick(request)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => setReviewDialog({ open: true, request, action: "reject", step: "confirm" })}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={reviewDialog.open} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {reviewDialog.action === "approve" ? "Approve" : "Reject"} Leave Request
            </DialogTitle>
            {reviewDialog.request && (
              <DialogDescription>
                {reviewDialog.request.profiles?.full_name} - {format(new Date(reviewDialog.request.start_date), "MMM d")} to {format(new Date(reviewDialog.request.end_date), "MMM d, yyyy")}
              </DialogDescription>
            )}
          </DialogHeader>

          {reviewDialog.step === "confirm" && reviewDialog.action === "reject" && (
            <div className="space-y-4">
              <p>Are you sure you want to reject this leave request?</p>
              <Textarea
                placeholder="Add notes (optional)..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>
          )}

          {reviewDialog.step === "confirm" && reviewDialog.action === "approve" && (
            <div className="space-y-4">
              {loadingConflicts ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : conflictingPours.length > 0 ? (
                <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-500">Schedule Conflict</p>
                    <p className="text-sm text-muted-foreground">
                      This employee is assigned to {conflictingPours.length} pour{conflictingPours.length > 1 ? "s" : ""} during this leave period.
                    </p>
                  </div>
                </div>
              ) : (
                <p>No schedule conflicts found. Approve this leave request?</p>
              )}
              <Textarea
                placeholder="Add notes (optional)..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>
          )}

          {reviewDialog.step === "conflicts" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select the pours to remove this employee from:
              </p>
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {conflictingPours.map((pour) => (
                  <div
                    key={pour.id}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    <Checkbox
                      checked={poursToRemove.has(pour.id)}
                      onCheckedChange={() => togglePourRemoval(pour.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{pour.pour_name}</p>
                      {pour.job && (
                        <p className="text-xs text-muted-foreground truncate">{pour.job.name}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(pour.pour_date), "EEE, MMM d")}
                        </span>
                        {pour.scheduled_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {pour.scheduled_time.slice(0, 5)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {poursToRemove.size} of {conflictingPours.length} pours selected for removal
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            {reviewDialog.step === "confirm" ? (
              <Button
                onClick={reviewDialog.action === "approve" && conflictingPours.length > 0 ? handleProceedWithApproval : handleReview}
                disabled={isSubmitting || loadingConflicts}
                className={reviewDialog.action === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
              >
                {isSubmitting ? "Processing..." : reviewDialog.action === "approve" && conflictingPours.length > 0 ? "Review Conflicts" : reviewDialog.action === "approve" ? "Approve" : "Reject"}
              </Button>
            ) : (
              <Button
                onClick={handleReview}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? "Processing..." : "Approve & Update Schedule"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
