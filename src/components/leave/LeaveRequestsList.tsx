import { useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Calendar } from "lucide-react";

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
  const [reviewDialog, setReviewDialog] = useState<{ open: boolean; request: LeaveRequest | null; action: "approve" | "reject" | null }>({
    open: false,
    request: null,
    action: null,
  });
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReview = async () => {
    if (!reviewDialog.request || !reviewDialog.action) return;
    
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

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

      toast({
        title: `Leave request ${reviewDialog.action === "approve" ? "approved" : "rejected"}`,
        description: `The leave request has been ${reviewDialog.action === "approve" ? "approved" : "rejected"}.`,
      });

      setReviewDialog({ open: false, request: null, action: null });
      setReviewNotes("");
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
                            onClick={() => setReviewDialog({ open: true, request, action: "approve" })}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => setReviewDialog({ open: true, request, action: "reject" })}
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

      <Dialog open={reviewDialog.open} onOpenChange={(open) => setReviewDialog({ open, request: null, action: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewDialog.action === "approve" ? "Approve" : "Reject"} Leave Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to {reviewDialog.action} this leave request?
            </p>
            <Textarea
              placeholder="Add notes (optional)..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog({ open: false, request: null, action: null })}>
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={isSubmitting}
              className={reviewDialog.action === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {isSubmitting ? "Processing..." : reviewDialog.action === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
