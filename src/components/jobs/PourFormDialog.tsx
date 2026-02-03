import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { PourSubbieStep } from "./PourSubbieStep";
import { useSendSubTradeInvite, SubTradeInvite } from "@/hooks/useSubTradeInvites";
import type { PastSubbie } from "@/hooks/useBusinessSubbies";
import { SubbieRescheduleDialog } from "@/components/schedule/SubbieRescheduleDialog";

const pourSchema = z.object({
  pour_name: z.string().min(1, "Name is required"),
  visit_type: z.string().default("pour"),
  pour_date: z.string().optional(),
  scheduled_time: z.string().optional(),
  estimated_m3: z.string().optional(),
  actual_m3: z.string().optional(),
  concrete_supplier: z.string().optional(),
  mpa_strength: z.string().optional(),
  slump: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().default("scheduled"),
});

type PourFormData = z.infer<typeof pourSchema>;

interface PourFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  editPour?: {
    id: string;
    pour_name: string;
    visit_type: string | null;
    pour_date: string | null;
    scheduled_time: string | null;
    estimated_m3: number | null;
    actual_m3: number | null;
    concrete_supplier: string | null;
    mpa_strength: string | null;
    slump: string | null;
    notes: string | null;
    status: string | null;
  } | null;
}

const visitTypeOptions = [
  { value: "pour", label: "Concrete Pour" },
  { value: "earthworks", label: "Earthworks" },
  { value: "formwork_place", label: "Place Formwork" },
  { value: "formwork_strip", label: "Strip Formwork" },
  { value: "cure", label: "Cure" },
  { value: "seal", label: "Seal" },
  { value: "other", label: "Other" },
];

export function PourFormDialog({
  open,
  onOpenChange,
  jobId,
  editPour,
}: PourFormDialogProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [pendingFormData, setPendingFormData] = useState<PourFormData | null>(null);
  const [selectedSubbies, setSelectedSubbies] = useState<PastSubbie[]>([]);
  const [createdPourId, setCreatedPourId] = useState<string | null>(null);
  const sendInvite = useSendSubTradeInvite();
  
  // Reschedule dialog state for date changes with existing invites
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [pendingDateChange, setPendingDateChange] = useState<{
    oldDate: string;
    newDate: string;
    invites: SubTradeInvite[];
    formData: PourFormData;
  } | null>(null);
  
  // Track original date when editing
  const originalDateRef = useRef<string | null>(null);
  
  // Set original date when edit pour changes
  useEffect(() => {
    if (editPour?.pour_date) {
      originalDateRef.current = editPour.pour_date;
    }
  }, [editPour?.pour_date]);

  const form = useForm<PourFormData>({
    resolver: zodResolver(pourSchema),
    defaultValues: {
      pour_name: "",
      visit_type: "pour",
      pour_date: "",
      scheduled_time: "",
      estimated_m3: "",
      actual_m3: "",
      concrete_supplier: "",
      mpa_strength: "",
      slump: "",
      notes: "",
      status: "scheduled",
    },
    values: editPour
      ? {
          pour_name: editPour.pour_name,
          visit_type: editPour.visit_type || "pour",
          pour_date: editPour.pour_date || "",
          scheduled_time: editPour.scheduled_time?.slice(0, 5) || "",
          estimated_m3: editPour.estimated_m3?.toString() || "",
          actual_m3: editPour.actual_m3?.toString() || "",
          concrete_supplier: editPour.concrete_supplier || "",
          mpa_strength: editPour.mpa_strength || "",
          slump: editPour.slump || "",
          notes: editPour.notes || "",
          status: editPour.status || "scheduled",
        }
      : undefined,
  });

  const visitType = form.watch("visit_type");
  const isPour = visitType === "pour";

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep(1);
      setPendingFormData(null);
      setSelectedSubbies([]);
      setCreatedPourId(null);
      setShowRescheduleDialog(false);
      setPendingDateChange(null);
      originalDateRef.current = null;
      form.reset();
    }
  }, [open, form]);

  // Create pour mutation
  const createPourMutation = useMutation({
    mutationFn: async (data: PourFormData): Promise<string> => {
      const pourData = {
        job_id: jobId,
        pour_name: data.pour_name,
        visit_type: data.visit_type,
        pour_date: data.pour_date || null,
        scheduled_time: data.scheduled_time || null,
        estimated_m3: data.estimated_m3 ? parseFloat(data.estimated_m3) : null,
        actual_m3: data.actual_m3 ? parseFloat(data.actual_m3) : null,
        concrete_supplier: data.concrete_supplier || null,
        mpa_strength: data.mpa_strength || null,
        slump: data.slump || null,
        notes: data.notes || null,
        status: data.status,
      };

      if (editPour) {
        const { error } = await supabase
          .from("job_pours")
          .update(pourData)
          .eq("id", editPour.id);
        if (error) throw error;
        return editPour.id;
      } else {
        const { data: newPour, error } = await supabase
          .from("job_pours")
          .insert(pourData)
          .select("id")
          .single();
        if (error) throw error;

        // Auto-update job status when pour is scheduled
        if (data.pour_date) {
          await supabase
            .from("jobs")
            .update({ status: "in_progress" })
            .eq("id", jobId)
            .eq("status", "scheduled");
        }

        return newPour.id;
      }
    },
  });

  // Handle step 1 "Next" button - go to subbie selection for new pours
  const handleNextStep = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    const data = form.getValues();
    setPendingFormData(data);
    setStep(2);
  };

  // Handle final submission (step 2 complete or edit mode submit)
  const handleFinalSubmit = async () => {
    const dataToSave = pendingFormData || form.getValues();

    try {
      // Create/update the pour
      const pourId = await createPourMutation.mutateAsync(dataToSave);
      setCreatedPourId(pourId);

      // Send invites to selected subbies
      if (selectedSubbies.length > 0 && !editPour) {
        const invitePromises = selectedSubbies.map((subbie) =>
          sendInvite.mutateAsync({
            job_pour_id: pourId,
            recipient_name: subbie.recipient_name,
            role: subbie.role,
            recipient_phone: subbie.recipient_phone || undefined,
            recipient_email: subbie.recipient_email || undefined,
          })
        );

        try {
          await Promise.all(invitePromises);
          toast.success(
            `Pour created & ${selectedSubbies.length} invite${selectedSubbies.length > 1 ? "s" : ""} sent`
          );
        } catch {
          toast.warning("Pour created but some invites failed to send");
        }
      } else {
        toast.success(editPour ? "Updated successfully" : "Created successfully");
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["job-pours", jobId] });
      queryClient.invalidateQueries({ queryKey: ["schedule-pours"] });
      queryClient.invalidateQueries({ queryKey: ["job", jobId] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["sub-trade-invites-job", jobId] });
      queryClient.invalidateQueries({ queryKey: ["business-subbies"] });

      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save");
    }
  };

  // For edit mode, check for date change affecting subbies before saving
  const handleFormSubmit = async (data: PourFormData) => {
    if (editPour) {
      const dateChanged = originalDateRef.current && 
        data.pour_date && 
        data.pour_date !== originalDateRef.current;
      
      if (dateChanged) {
        // Check for active sub-trade invites
        const { data: invites } = await supabase
          .from("external_invites")
          .select("*")
          .eq("job_pour_id", editPour.id)
          .eq("invite_type", "sub_trade")
          .in("status", ["sent", "viewed", "accepted"]);

        if (invites && invites.length > 0) {
          // Show reschedule dialog instead of saving directly
          setPendingDateChange({
            oldDate: originalDateRef.current!,
            newDate: data.pour_date,
            invites: invites as SubTradeInvite[],
            formData: data,
          });
          setShowRescheduleDialog(true);
          return;
        }
      }
      
      // No date change or no affected invites - proceed with normal save
      setPendingFormData(data);
      handleFinalSubmit();
    }
  };
  
  // Handle reschedule confirmation from dialog
  const handleRescheduleConfirm = async (action: "cancel" | "reschedule" | "silent") => {
    if (!pendingDateChange || !editPour) return;

    // Save the pour with the new date
    setPendingFormData(pendingDateChange.formData);
    
    try {
      await handleFinalSubmit();
      
      // Handle silent move - skip notifications
      if (action === "silent") {
        toast.success("Pour moved - sub-trades were not notified");
      } else {
        // Call the notification edge function for cancel/reschedule actions
        const { error: notifyError } = await supabase.functions.invoke("notify-subtrade-reschedule", {
          body: {
            pour_id: editPour.id,
            action,
            old_date: pendingDateChange.oldDate,
            new_date: pendingDateChange.newDate,
          },
        });

        if (notifyError) {
          console.error("Notification error:", notifyError);
          toast.error("Failed to notify some sub-trades");
        } else {
          const actionText = action === "cancel" ? "cancelled" : "notified";
          toast.success(`Pour updated - ${pendingDateChange.invites.length} sub-trade(s) ${actionText}`);
        }
        
        queryClient.invalidateQueries({ queryKey: ["sub-trade-invites"] });
      }
    } catch (err) {
      console.error("Failed to save:", err);
    }
    
    setShowRescheduleDialog(false);
    setPendingDateChange(null);
  };
  
  const handleRescheduleCancel = () => {
    setShowRescheduleDialog(false);
    setPendingDateChange(null);
  };

  const isSubmitting = createPourMutation.isPending || sendInvite.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editPour ? "Edit" : step === 1 ? "Add" : "Invite Subbies"}
            {step === 1 ? " Site Visit" : ""}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Schedule a pour or other site activity"
              : `For: ${pendingFormData?.pour_name || ""}`}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <Form {...form}>
            <form
              onSubmit={
                editPour
                  ? form.handleSubmit(handleFormSubmit)
                  : (e) => {
                      e.preventDefault();
                      handleNextStep();
                    }
              }
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="visit_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visit Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {visitTypeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pour_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Slab Pour 1, Footings" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pour_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="scheduled_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Concrete-specific fields - only show for pour type */}
              {isPour && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="estimated_m3"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated m³</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="actual_m3"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Actual m³</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="concrete_supplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Concrete Supplier</FormLabel>
                        <FormControl>
                          <Input placeholder="Supplier name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="mpa_strength"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>MPa Strength</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 32" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="slump"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slump</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 100mm" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : editPour ? "Update" : "Next"}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <PourSubbieStep
            jobId={jobId}
            pourId={createdPourId || "pending"}
            pourName={pendingFormData?.pour_name || ""}
            pourDate={pendingFormData?.pour_date || null}
            selectedSubbies={selectedSubbies}
            onSelectedSubbiesChange={setSelectedSubbies}
            onBack={() => setStep(1)}
            onComplete={handleFinalSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </DialogContent>
      
      {/* Reschedule dialog for date changes with existing sub-trade invites */}
      {pendingDateChange && (
        <SubbieRescheduleDialog
          open={showRescheduleDialog}
          onOpenChange={setShowRescheduleDialog}
          pourName={editPour?.pour_name || ""}
          oldDate={pendingDateChange.oldDate}
          newDate={pendingDateChange.newDate}
          invites={pendingDateChange.invites}
          onConfirm={handleRescheduleConfirm}
          onCancel={handleRescheduleCancel}
        />
      )}
    </Dialog>
  );
}
