import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Camera, Check, X, Loader2, Printer, Pencil, Trash2, Save, Clock, Send, Shield } from "lucide-react";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";
import { SignaturePad } from "./SignaturePad";
import { PrintableITP } from "../documents/PrintableITP";

type JobITP = Tables<"job_itps">;

interface ChecklistItem {
  id: number;
  item: string;
  required: boolean;
  checked: boolean;
  comment: string;
  photo_url: string | null;
}

interface ITPDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itp: JobITP | null;
  jobId: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  in_progress: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  completed: "bg-green-500/20 text-green-600 border-green-500/30",
};

export function ITPDetailSheet({ open, onOpenChange, itp, jobId }: ITPDetailSheetProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [checklistData, setChecklistData] = useState<ChecklistItem[]>([]);
  const [uploadingItemId, setUploadingItemId] = useState<number | null>(null);
  const [signingType, setSigningType] = useState<"employee" | "supervisor" | null>(null);
  const [signatureName, setSignatureName] = useState("");
  const [showPrintView, setShowPrintView] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user ID
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id || null);
    };
    getUser();
  }, []);

  // Reset edit state when ITP changes
  useEffect(() => {
    if (itp) {
      setEditName(itp.name);
    }
  }, [itp]);

  // Initialize checklist data when ITP changes
  useEffect(() => {
    if (itp?.checklist_data) {
      setChecklistData(itp.checklist_data as unknown as ChecklistItem[]);
    } else {
      setChecklistData([]);
    }
  }, [itp?.id, itp?.checklist_data]);

  // Fetch current user profile
  const { data: currentUserProfile } = useQuery({
    queryKey: ["current-user-profile", currentUserId],
    queryFn: async () => {
      if (!currentUserId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", currentUserId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!currentUserId,
  });

  // Fetch assigned employee details
  const { data: assignedEmployee } = useQuery({
    queryKey: ["assigned-employee", itp?.assigned_to],
    queryFn: async () => {
      if (!itp?.assigned_to) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("id", itp.assigned_to)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!itp?.assigned_to,
  });

  // Fetch job details for print
  const { data: job } = useQuery({
    queryKey: ["job-for-print", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("name, site_address, business_id")
        .eq("id", jobId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!jobId,
  });

  // Fetch business details for print
  const { data: business } = useQuery({
    queryKey: ["business-for-print", job?.business_id],
    queryFn: async () => {
      if (!job?.business_id) return null;
      const { data, error } = await supabase
        .from("businesses")
        .select("name, logo_url, address, phone, abn")
        .eq("id", job.business_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!job?.business_id,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<JobITP>) => {
      if (!itp) throw new Error("No ITP selected");
      
      const { error } = await supabase
        .from("job_itps")
        .update(updates)
        .eq("id", itp.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-itps", jobId] });
    },
    onError: (error) => {
      toast.error("Failed to update: " + error.message);
    },
  });

  const updateNameMutation = useMutation({
    mutationFn: async () => {
      if (!itp) throw new Error("No ITP selected");

      const { error } = await supabase
        .from("job_itps")
        .update({ name: editName.trim() })
        .eq("id", itp.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-itps", jobId] });
      toast.success("ITP updated successfully");
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error("Failed to update ITP: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!itp) throw new Error("No ITP selected");

      const { error } = await supabase
        .from("job_itps")
        .delete()
        .eq("id", itp.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-itps", jobId] });
      toast.success("ITP deleted successfully");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to delete ITP: " + error.message);
    },
  });

  const handleCheckChange = (itemId: number, checked: boolean) => {
    const updated = checklistData.map((item) =>
      item.id === itemId ? { ...item, checked } : item
    );
    setChecklistData(updated);
    
    // Determine new status
    const anyChecked = updated.some((item) => item.checked);
    const allRequiredChecked = updated
      .filter((item) => item.required)
      .every((item) => item.checked);
    
    let newStatus = "pending";
    if (allRequiredChecked && itp?.employee_signature && itp?.supervisor_signature) {
      newStatus = "completed";
    } else if (anyChecked) {
      newStatus = "in_progress";
    }

    updateMutation.mutate({
      checklist_data: updated as unknown as JobITP["checklist_data"],
      status: newStatus,
    });
  };

  const handleCommentChange = (itemId: number, comment: string) => {
    const updated = checklistData.map((item) =>
      item.id === itemId ? { ...item, comment } : item
    );
    setChecklistData(updated);
  };

  const handleCommentBlur = () => {
    updateMutation.mutate({
      checklist_data: checklistData as unknown as JobITP["checklist_data"],
    });
  };

  const handlePhotoUpload = async (itemId: number, file: File) => {
    if (!itp) return;
    
    setUploadingItemId(itemId);
    
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `itp-photos/${itp.id}/${itemId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      const updated = checklistData.map((item) =>
        item.id === itemId ? { ...item, photo_url: urlData.publicUrl } : item
      );
      setChecklistData(updated);
      
      await updateMutation.mutateAsync({
        checklist_data: updated as unknown as JobITP["checklist_data"],
      });
      
      toast.success("Photo uploaded");
    } catch (error: any) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setUploadingItemId(null);
    }
  };

  const handleRemovePhoto = async (itemId: number) => {
    const updated = checklistData.map((item) =>
      item.id === itemId ? { ...item, photo_url: null } : item
    );
    setChecklistData(updated);
    
    await updateMutation.mutateAsync({
      checklist_data: updated as unknown as JobITP["checklist_data"],
    });
    
    toast.success("Photo removed");
  };

  const handleSignature = async (type: "employee" | "supervisor", signatureData: string) => {
    if (!signatureName.trim()) {
      toast.error("Please type your full name to confirm");
      return;
    }

    const updates: Partial<JobITP> = {};
    
    if (type === "employee") {
      updates.employee_signature = signatureData;
      updates.employee_signed_at = new Date().toISOString();
    } else {
      updates.supervisor_signature = signatureData;
      updates.supervisor_signed_at = new Date().toISOString();
    }

    // Check if all required items are checked and both signatures present
    const allRequiredChecked = checklistData
      .filter((item) => item.required)
      .every((item) => item.checked);
    
    const hasEmployeeSig = type === "employee" ? true : !!itp?.employee_signature;
    const hasSupervisorSig = type === "supervisor" ? true : !!itp?.supervisor_signature;
    
    if (allRequiredChecked && hasEmployeeSig && hasSupervisorSig) {
      updates.status = "completed";
      updates.completed_at = new Date().toISOString();
    }

    await updateMutation.mutateAsync(updates);
    toast.success(`${type === "employee" ? "Employee" : "Supervisor"} signature saved`);
    setSigningType(null);
    setSignatureName("");
  };

  const handleSubmit = async () => {
    if (!itp) return;

    // Check if supervisor signature is present
    if (!itp.supervisor_signature) {
      toast.error("Supervisor signature is required to submit the ITP");
      return;
    }

    // Submit the ITP and mark as completed
    await updateMutation.mutateAsync({
      status: "completed",
      completed_at: new Date().toISOString(),
      completed_by: currentUserId,
    });

    toast.success("ITP marked as completed");
  };

  const handlePrint = () => {
    setShowPrintView(true);
    // Small delay to render, then wait for images, then print
    setTimeout(async () => {
      const { waitForPrintImages } = await import("@/lib/wait-for-print-images");
      await waitForPrintImages();
      window.print();
      setShowPrintView(false);
    }, 100);
  };

  if (!itp) return null;

  const completedCount = checklistData.filter((item) => item.checked).length;
  const totalCount = checklistData.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Determine if current user is the assigned employee
  const isAssignedEmployee = currentUserId && itp.assigned_to === currentUserId;
  const canEmployeeSign = isAssignedEmployee && !itp.employee_signature;
  const canSupervisorSign = !itp.supervisor_signature;
  const canSubmit = itp.supervisor_signature && itp.status !== "completed";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center justify-between">
              {isEditing ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="max-w-[200px]"
                />
              ) : (
                <SheetTitle>{itp.name}</SheetTitle>
              )}
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setIsEditing(false);
                        setEditName(itp.name);
                      }}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => updateNameMutation.mutate()}
                      disabled={updateNameMutation.isPending}
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrint}>
                      <Printer className="w-4 h-4" />
                    </Button>
                    <Badge variant="outline" className={statusColors[itp.status || "pending"]}>
                      {itp.status === "completed" ? "Completed" : itp.status === "in_progress" ? "In Progress" : "Pending"}
                    </Badge>
                  </>
                )}
              </div>
            </div>
            {!isEditing && (
              <div className="text-sm text-muted-foreground">
                {completedCount}/{totalCount} items complete ({progress}%)
              </div>
            )}
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Checklist Items */}
            {checklistData.map((item) => (
              <Card key={item.id} className={item.checked ? "border-green-500/30 bg-green-500/5" : ""}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={(checked) => handleCheckChange(item.id, !!checked)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <Label className="font-normal cursor-pointer">
                        {item.item}
                        {item.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                    </div>
                    {item.checked && <Check className="w-4 h-4 text-green-500" />}
                  </div>

                  {/* Comment */}
                  <Textarea
                    placeholder="Add comment..."
                    value={item.comment}
                    onChange={(e) => handleCommentChange(item.id, e.target.value)}
                    onBlur={handleCommentBlur}
                    className="text-sm min-h-[60px]"
                  />

                  {/* Photo */}
                  <div className="flex items-center gap-2">
                    {item.photo_url ? (
                      <div className="relative">
                        <img
                          src={item.photo_url}
                          alt="Checklist item photo"
                          className="h-20 w-20 object-cover rounded-md border"
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => handleRemovePhoto(item.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={uploadingItemId === item.id}
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*";
                          input.capture = "environment";
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) handlePhotoUpload(item.id, file);
                          };
                          input.click();
                        }}
                      >
                        {uploadingItemId === item.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4 mr-2" />
                        )}
                        Add Photo
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Separator className="my-6" />

            {/* Signatures Section */}
            <div className="space-y-4">
              <h3 className="font-semibold">Digital Signatures</h3>

              {/* Employee Signature */}
              <Card 
                className={`${itp.employee_signature ? "border-green-500/30 bg-green-500/5" : "border-yellow-500/30"} ${
                  canEmployeeSign && signingType !== "employee" ? "cursor-pointer hover:border-primary transition-colors" : ""
                }`}
                onClick={() => {
                  if (canEmployeeSign && signingType !== "employee") {
                    setSigningType("employee");
                    setSignatureName(currentUserProfile?.full_name || "");
                  }
                }}
              >
                <CardContent className="p-4">
                  {signingType === "employee" ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        <span className="font-medium">Sign as Employee</span>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Confirm Your Full Name</label>
                        <Input
                          value={signatureName}
                          onChange={(e) => setSignatureName(e.target.value)}
                          placeholder="Type your full name to confirm"
                          className="mt-1"
                        />
                      </div>
                      <SignaturePad
                        onSave={(data) => handleSignature("employee", data)}
                        onCancel={() => {
                          setSigningType(null);
                          setSignatureName("");
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      {itp.employee_signature ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-500" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">
                          Employee Signature
                          {assignedEmployee && (
                            <span className="ml-1 text-muted-foreground">
                              ({assignedEmployee.full_name})
                            </span>
                          )}
                          {canEmployeeSign && (
                            <span className="ml-2 text-xs text-primary">(Click to sign)</span>
                          )}
                        </p>
                        {itp.employee_signed_at ? (
                          <p className="text-xs text-muted-foreground">
                            Signed: {format(new Date(itp.employee_signed_at), "d MMM yyyy, HH:mm")}
                          </p>
                        ) : (
                          <p className="text-xs text-yellow-500">Awaiting signature</p>
                        )}
                      </div>
                      {itp.employee_signature && (
                        <img
                          src={itp.employee_signature}
                          alt="Employee signature"
                          className="h-12 border rounded"
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Supervisor Signature */}
              <Card 
                className={`${itp.supervisor_signature ? "border-green-500/30 bg-green-500/5" : "border-yellow-500/30"} ${
                  canSupervisorSign && signingType !== "supervisor" ? "cursor-pointer hover:border-primary transition-colors" : ""
                }`}
                onClick={() => {
                  if (canSupervisorSign && signingType !== "supervisor") {
                    setSigningType("supervisor");
                    setSignatureName(currentUserProfile?.full_name || "");
                  }
                }}
              >
                <CardContent className="p-4">
                  {signingType === "supervisor" ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        <span className="font-medium">Sign as Site Supervisor</span>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Confirm Your Full Name</label>
                        <Input
                          value={signatureName}
                          onChange={(e) => setSignatureName(e.target.value)}
                          placeholder="Type your full name to confirm"
                          className="mt-1"
                        />
                      </div>
                      <SignaturePad
                        onSave={(data) => handleSignature("supervisor", data)}
                        onCancel={() => {
                          setSigningType(null);
                          setSignatureName("");
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      {itp.supervisor_signature ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-500" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">
                          Site Supervisor Signature
                          {canSupervisorSign && (
                            <span className="ml-2 text-xs text-primary">(Click to sign)</span>
                          )}
                        </p>
                        {itp.supervisor_signed_at ? (
                          <p className="text-xs text-muted-foreground">
                            Signed: {format(new Date(itp.supervisor_signed_at), "d MMM yyyy, HH:mm")}
                          </p>
                        ) : (
                          <p className="text-xs text-yellow-500">Awaiting signature - Required to submit</p>
                        )}
                      </div>
                      {itp.supervisor_signature && (
                        <img
                          src={itp.supervisor_signature}
                          alt="Supervisor signature"
                          className="h-12 border rounded"
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea
                placeholder="Add any additional notes..."
                defaultValue={itp.notes || ""}
                onBlur={(e) => updateMutation.mutate({ notes: e.target.value })}
                className="min-h-[80px]"
              />
            </div>

            {/* Submit Button */}
            {itp.status !== "completed" && (
              <div className="pt-4">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={!canSubmit || updateMutation.isPending}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {canSubmit ? "Submit ITP" : "Supervisor signature required to submit"}
                </Button>
                {!itp.supervisor_signature && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    A site supervisor must sign before the ITP can be submitted
                  </p>
                )}
              </div>
            )}

            {itp.status === "completed" && (
              <div className="pt-4">
                <div className="flex items-center justify-center gap-2 text-green-600 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">ITP Submitted</span>
                  {itp.completed_at && (
                    <span className="text-sm text-muted-foreground">
                      on {format(new Date(itp.completed_at), "d MMM yyyy, HH:mm")}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Print View */}
      {showPrintView && itp && (
        <div className="fixed inset-0 bg-white z-[100] overflow-auto print:static">
          <PrintableITP
            ref={printRef}
            itp={itp}
            jobName={job?.name || ""}
            jobAddress={job?.site_address || ""}
            business={business || null}
          />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete ITP?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this ITP and all associated data including photos and signatures. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .fixed.inset-0.bg-white {
            display: block !important;
            visibility: visible !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          .fixed.inset-0.bg-white * {
            visibility: visible !important;
          }
          .fixed.inset-0.bg-white .print-container {
            width: 100% !important;
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </>
  );
}
