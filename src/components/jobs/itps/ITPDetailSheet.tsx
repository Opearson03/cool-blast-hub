import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Camera, Check, X, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";
import { SignaturePad } from "./SignaturePad";

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
  const [checklistData, setChecklistData] = useState<ChecklistItem[]>([]);
  const [uploadingItemId, setUploadingItemId] = useState<number | null>(null);
  const [showEmployeeSignature, setShowEmployeeSignature] = useState(false);
  const [showSupervisorSignature, setShowSupervisorSignature] = useState(false);

  // Initialize checklist data when ITP changes
  useState(() => {
    if (itp?.checklist_data) {
      setChecklistData(itp.checklist_data as unknown as ChecklistItem[]);
    }
  });

  // Update local state when itp changes
  if (itp && JSON.stringify(itp.checklist_data) !== JSON.stringify(checklistData) && checklistData.length === 0) {
    setChecklistData(itp.checklist_data as unknown as ChecklistItem[]);
  }

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
    const updates: Partial<JobITP> = {};
    
    if (type === "employee") {
      updates.employee_signature = signatureData;
      updates.employee_signed_at = new Date().toISOString();
      setShowEmployeeSignature(false);
    } else {
      updates.supervisor_signature = signatureData;
      updates.supervisor_signed_at = new Date().toISOString();
      setShowSupervisorSignature(false);
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
  };

  if (!itp) return null;

  const completedCount = checklistData.filter((item) => item.checked).length;
  const totalCount = checklistData.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>{itp.name}</SheetTitle>
            <Badge variant="outline" className={statusColors[itp.status || "pending"]}>
              {itp.status === "completed" ? "Completed" : itp.status === "in_progress" ? "In Progress" : "Pending"}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {completedCount}/{totalCount} items complete ({progress}%)
          </div>
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
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Employee Signature</p>
                    {itp.employee_signed_at && (
                      <p className="text-xs text-muted-foreground">
                        Signed: {format(new Date(itp.employee_signed_at), "d MMM yyyy, HH:mm")}
                      </p>
                    )}
                  </div>
                  {itp.employee_signature ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={itp.employee_signature}
                        alt="Employee signature"
                        className="h-12 border rounded"
                      />
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                  ) : (
                    <Button size="sm" onClick={() => setShowEmployeeSignature(true)}>
                      Sign
                    </Button>
                  )}
                </div>
                {showEmployeeSignature && (
                  <div className="mt-4">
                    <SignaturePad
                      onSave={(data) => handleSignature("employee", data)}
                      onCancel={() => setShowEmployeeSignature(false)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Supervisor Signature */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Supervisor Signature</p>
                    {itp.supervisor_signed_at && (
                      <p className="text-xs text-muted-foreground">
                        Signed: {format(new Date(itp.supervisor_signed_at), "d MMM yyyy, HH:mm")}
                      </p>
                    )}
                  </div>
                  {itp.supervisor_signature ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={itp.supervisor_signature}
                        alt="Supervisor signature"
                        className="h-12 border rounded"
                      />
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                  ) : (
                    <Button size="sm" onClick={() => setShowSupervisorSignature(true)}>
                      Sign
                    </Button>
                  )}
                </div>
                {showSupervisorSignature && (
                  <div className="mt-4">
                    <SignaturePad
                      onSave={(data) => handleSignature("supervisor", data)}
                      onCancel={() => setShowSupervisorSignature(false)}
                    />
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
