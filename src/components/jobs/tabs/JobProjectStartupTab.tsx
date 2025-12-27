import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ClipboardCheck, Check } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type ProjectStartup = Tables<"project_startup">;

interface JobProjectStartupTabProps {
  jobId: string;
  job?: {
    name: string;
    builder_client?: string | null;
    concrete_supplier?: string | null;
  };
}

export function JobProjectStartupTab({ jobId, job }: JobProjectStartupTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitialized = useRef(false);

  const { data: startup, isLoading } = useQuery({
    queryKey: ["project-startup", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_startup")
        .select("*")
        .eq("job_id", jobId)
        .maybeSingle();
      if (error) throw error;
      return data as ProjectStartup | null;
    },
  });

  const [formData, setFormData] = useState<Partial<ProjectStartup>>({});

  // Initialize form data from startup or with job defaults
  useEffect(() => {
    if (hasInitialized.current) return;
    
    if (startup) {
      setFormData(startup);
      hasInitialized.current = true;
    } else if (!isLoading) {
      // No startup record exists - set defaults from job
      setFormData({
        project_name: job?.name || "",
        client: job?.builder_client || "",
        concrete_supplier: job?.concrete_supplier || "",
      });
      hasInitialized.current = true;
    }
  }, [startup, isLoading, job]);

  // Items with just checkboxes (not yes/no)
  const checklistItems = [
    { key: "plans_printed", label: "Plans Printed" },
    { key: "itps_prepared", label: "ITPs Prepared & Approved" },
    { key: "swms_prepared", label: "SWMS Prepared" },
    { key: "risk_assessment_completed", label: "Risk Assessment Completed" },
  ] as const;

  // Items with YES/NO selection
  const yesNoItems = [
    { key: "concrete_supply", label: "Concrete Supply", supplierKey: "concrete_supplier" },
    { key: "concrete_testing", label: "Concrete Testing" },
    { key: "mix_design_approval", label: "Mix Design Approved", notesKey: "mix_design_approval_notes" },
    { key: "reo_supply", label: "REO Supply", supplierKey: "reo_supplier" },
    { key: "reo_fixing_subcontractor", label: "REO Fixing", subcontractorKey: "reo_fixing_who" },
    { key: "curing_required", label: "Curing Required" },
    { key: "caulking_required", label: "Caulking Required" },
    { key: "long_longs_required", label: "Long Longs Required" },
  ] as const;

  const calculateProgress = useCallback((data: Partial<ProjectStartup>) => {
    const allKeys = [...checklistItems.map(i => i.key), ...yesNoItems.map(i => i.key)];
    // Only count as completed if the value is explicitly true or false (not just "set")
    const completed = allKeys.filter((key) => {
      const value = data[key as keyof ProjectStartup];
      return value === true || value === false;
    }).length;
    return Math.round((completed / allKeys.length) * 100);
  }, []);

  const saveData = useCallback(async (dataToSave: Partial<ProjectStartup>) => {
    setIsSaving(true);
    try {
      const progress = calculateProgress(dataToSave);
      
      // Only include fields that have been explicitly set
      const payload: Record<string, any> = {
        job_id: jobId,
        completion_percentage: progress,
      };
      
      // Copy over only defined fields
      Object.entries(dataToSave).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
          payload[key] = value;
        }
      });

      if (startup) {
        const { error } = await supabase
          .from("project_startup")
          .update(payload)
          .eq("id", startup.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("project_startup").insert(payload as any);
        if (error) throw error;
      }
      
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: ["project-startup", jobId] });
    } catch (error: any) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }, [startup, jobId, calculateProgress, queryClient, toast]);

  // Debounced auto-save
  const debouncedSave = useCallback((newData: Partial<ProjectStartup>) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveData(newData);
    }, 800);
  }, [saveData]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleCheckChange = (key: string, checked: boolean) => {
    const newData = { ...formData, [key]: checked };
    setFormData(newData);
    debouncedSave(newData);
  };

  const handleYesNoChange = (key: string, value: string) => {
    const newData = { ...formData, [key]: value === "yes" };
    setFormData(newData);
    debouncedSave(newData);
  };

  const handleInputChange = (key: string, value: string) => {
    const newData = { ...formData, [key]: value };
    setFormData(newData);
    debouncedSave(newData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const progress = calculateProgress(formData);

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary" />
              <span className="font-semibold">Completion Progress</span>
            </div>
            <div className="flex items-center gap-3">
              {isSaving && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </span>
              )}
              {!isSaving && lastSaved && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-500" />
                  Saved
                </span>
              )}
              <span className="text-2xl font-bold text-primary">{progress}%</span>
            </div>
          </div>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>

      {/* Project Setup & Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>1. Project Setup & Documentation</CardTitle>
          <CardDescription>Client and site information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Project Name</Label>
              <Input
                value={formData.project_name || ""}
                onChange={(e) => handleInputChange("project_name", e.target.value)}
                placeholder="Project name"
                className="touch-target"
              />
            </div>
            <div>
              <Label>Client</Label>
              <Input
                value={formData.client || ""}
                onChange={(e) => handleInputChange("client", e.target.value)}
                placeholder="Client name"
                className="touch-target"
              />
            </div>
            <div>
              <Label>Primary Contact Name</Label>
              <Input
                value={formData.client_contact_name || ""}
                onChange={(e) => handleInputChange("client_contact_name", e.target.value)}
                placeholder="Contact name"
                className="touch-target"
              />
            </div>
            <div>
              <Label>Contact Phone</Label>
              <Input
                value={formData.client_contact_phone || ""}
                onChange={(e) => handleInputChange("client_contact_phone", e.target.value)}
                placeholder="Phone number"
                className="touch-target"
              />
            </div>
            <div>
              <Label>Contact Email</Label>
              <Input
                type="email"
                value={formData.client_contact_email || ""}
                onChange={(e) => handleInputChange("client_contact_email", e.target.value)}
                placeholder="Email address"
                className="touch-target"
              />
            </div>
            <div>
              <Label>Site Manager</Label>
              <Input
                value={formData.site_manager || ""}
                onChange={(e) => handleInputChange("site_manager", e.target.value)}
                placeholder="Site manager name"
                className="touch-target"
              />
            </div>
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div>
              <Label>Invoice Billing Address</Label>
              <Input
                value={formData.invoice_billing_address || ""}
                onChange={(e) => handleInputChange("invoice_billing_address", e.target.value)}
                placeholder="Billing address"
                className="touch-target"
              />
            </div>
            <div>
              <Label>Payment Terms</Label>
              <Input
                value={formData.invoice_payment_terms || ""}
                onChange={(e) => handleInputChange("invoice_payment_terms", e.target.value)}
                placeholder="e.g., Net 30"
                className="touch-target"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planning & Design Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>2. Planning & Design</CardTitle>
          <CardDescription>Documentation and planning checklist</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {checklistItems.map((item) => (
            <div key={item.key} className="flex items-center space-x-3">
              <Checkbox
                id={item.key}
                checked={!!formData[item.key as keyof ProjectStartup]}
                onCheckedChange={(checked) => handleCheckChange(item.key, !!checked)}
              />
              <Label htmlFor={item.key} className="cursor-pointer">
                {item.label}
              </Label>
            </div>
          ))}

          <div className="pt-4">
            <Label>Concrete Mix Design</Label>
            <Input
              value={formData.mix_design_text || ""}
              onChange={(e) => handleInputChange("mix_design_text", e.target.value)}
              placeholder="Mix design details"
              className="touch-target mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Procurement & Suppliers - YES/NO format */}
      <Card>
        <CardHeader>
          <CardTitle>3. Procurement & Suppliers</CardTitle>
          <CardDescription>Material and supplier confirmation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {yesNoItems.map((item) => {
            const currentValue = formData[item.key as keyof ProjectStartup];
            const yesNoValue = currentValue === true ? "yes" : currentValue === false ? "no" : undefined;

            return (
              <div key={item.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base">{item.label}</Label>
                  <RadioGroup
                    value={yesNoValue}
                    onValueChange={(v) => handleYesNoChange(item.key, v)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id={`${item.key}-yes`} />
                      <Label htmlFor={`${item.key}-yes`} className="cursor-pointer font-normal">
                        YES
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id={`${item.key}-no`} />
                      <Label htmlFor={`${item.key}-no`} className="cursor-pointer font-normal">
                        NO
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Conditional supplier/subcontractor input */}
                {"supplierKey" in item && item.supplierKey && yesNoValue === "yes" && (
                  <Input
                    value={(formData[item.supplierKey as keyof ProjectStartup] as string) || ""}
                    onChange={(e) => handleInputChange(item.supplierKey!, e.target.value)}
                    placeholder="Supplier name"
                    className="mt-2"
                  />
                )}
                {"subcontractorKey" in item && item.subcontractorKey && yesNoValue === "yes" && (
                  <Input
                    value={(formData[item.subcontractorKey as keyof ProjectStartup] as string) || ""}
                    onChange={(e) => handleInputChange(item.subcontractorKey!, e.target.value)}
                    placeholder="Subcontractor name"
                    className="mt-2"
                  />
                )}
                {"notesKey" in item && item.notesKey && yesNoValue === "yes" && (
                  <Input
                    value={(formData[item.notesKey as keyof ProjectStartup] as string) || ""}
                    onChange={(e) => handleInputChange(item.notesKey!, e.target.value)}
                    placeholder="Approval notes"
                    className="mt-2"
                  />
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

    </div>
  );
}