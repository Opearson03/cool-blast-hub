import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ClipboardCheck, Check, Sparkles } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { extractStartupDataFromScopeData, type StartupPrefillResult } from "@/lib/project-startup-prefill";

type ProjectStartup = Tables<"project_startup">;

interface JobProjectStartupTabProps {
  jobId: string;
  job?: {
    name: string;
    builder_client?: string | null;
    concrete_supplier?: string | null;
    source_estimate_id?: string | null;
  };
}

export function JobProjectStartupTab({ jobId, job }: JobProjectStartupTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInitialized = useRef(false);
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([]);

  // Fetch existing project startup record
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

  // Fetch source estimate if job was converted from a quote
  const { data: sourceEstimate } = useQuery({
    queryKey: ["source-estimate", job?.source_estimate_id],
    queryFn: async () => {
      if (!job?.source_estimate_id) return null;
      const { data, error } = await supabase
        .from("estimates")
        .select("scope_data, client_email, client_phone, client_name")
        .eq("id", job.source_estimate_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!job?.source_estimate_id,
  });

  // Calculate prefill data from source estimate
  const prefillResult: StartupPrefillResult = useMemo(() => {
    if (!sourceEstimate?.scope_data) {
      return {
        data: {},
        hasReinforcement: true, // Show all by default if no quote
        hasSurfaceFinishing: true,
        hasJoints: true,
        hasCuring: true,
        hasCaulking: true,
        autoFilledFields: [],
      };
    }
    return extractStartupDataFromScopeData(sourceEstimate.scope_data as Record<string, unknown>);
  }, [sourceEstimate?.scope_data]);

  const [formData, setFormData] = useState<Partial<ProjectStartup>>({});

  // Initialize form data from startup or with prefill from quote
  useEffect(() => {
    if (hasInitialized.current) return;
    
    if (startup) {
      // Existing startup record - use it
      setFormData(startup);
      hasInitialized.current = true;
    } else if (!isLoading) {
      // No startup record exists - set defaults from job and quote
      const baseData: Partial<ProjectStartup> = {
        project_name: job?.name || "",
        client: job?.builder_client || "",
        concrete_supplier: job?.concrete_supplier || "",
      };

      // Add contact info from estimate if available
      if (sourceEstimate) {
        if (sourceEstimate.client_email) {
          baseData.client_contact_email = sourceEstimate.client_email;
        }
        if (sourceEstimate.client_phone) {
          baseData.client_contact_phone = sourceEstimate.client_phone;
        }
        if (sourceEstimate.client_name) {
          baseData.client_contact_name = sourceEstimate.client_name;
        }
      }

      // Merge in auto-filled data from quote
      const mergedData = { ...baseData, ...prefillResult.data };
      setFormData(mergedData);
      setAutoFilledFields(prefillResult.autoFilledFields);
      hasInitialized.current = true;
    }
  }, [startup, isLoading, job, sourceEstimate, prefillResult]);

  // Items with just checkboxes (not yes/no)
  const checklistItems = [
    { key: "plans_printed", label: "Plans Printed" },
    { key: "itps_prepared", label: "ITPs Prepared & Approved" },
    { key: "swms_prepared", label: "SWMS Prepared" },
    { key: "risk_assessment_completed", label: "Risk Assessment Completed" },
  ] as const;

  // Items with YES/NO selection - filtered based on quote relevance
  const yesNoItems = useMemo(() => {
    const allItems = [
      { key: "concrete_supply", label: "Concrete Supply", supplierKey: "concrete_supplier", alwaysShow: true },
      { key: "concrete_testing", label: "Concrete Testing", alwaysShow: true },
      { key: "mix_design_approval", label: "Mix Design Approved", notesKey: "mix_design_approval_notes", alwaysShow: true },
      { key: "reo_supply", label: "REO Supply", supplierKey: "reo_supplier", showIf: "hasReinforcement" as const },
      { key: "reo_fixing_subcontractor", label: "REO Fixing", subcontractorKey: "reo_fixing_who", showIf: "hasReinforcement" as const },
      { key: "curing_required", label: "Curing Required", showIf: "hasCuring" as const },
      { key: "caulking_required", label: "Caulking Required", showIf: "hasCaulking" as const },
      { key: "long_longs_required", label: "Long Longs Required", alwaysShow: true },
    ];

    // If no source estimate, show all items
    if (!job?.source_estimate_id) {
      return allItems;
    }

    // Filter based on what's in the quote
    return allItems.filter((item) => {
      if (item.alwaysShow) return true;
      if (item.showIf) {
        return prefillResult[item.showIf] === true;
      }
      return true;
    });
  }, [job?.source_estimate_id, prefillResult]);

  const calculateProgress = useCallback((data: Partial<ProjectStartup>) => {
    const allKeys = [...checklistItems.map(i => i.key), ...yesNoItems.map(i => i.key)];
    const completed = allKeys.filter((key) => {
      const value = data[key as keyof ProjectStartup];
      return value === true || value === false;
    }).length;
    return Math.round((completed / allKeys.length) * 100);
  }, [yesNoItems]);

  const saveData = useCallback(async (dataToSave: Partial<ProjectStartup>) => {
    setIsSaving(true);
    try {
      const progress = calculateProgress(dataToSave);
      
      const payload: Record<string, unknown> = {
        job_id: jobId,
        completion_percentage: progress,
      };
      
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
        const { error } = await supabase.from("project_startup").insert(payload as never);
        if (error) throw error;
      }
      
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: ["project-startup", jobId] });
    } catch (error: unknown) {
      toast({ title: "Error saving", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }, [startup, jobId, calculateProgress, queryClient, toast]);

  const debouncedSave = useCallback((newData: Partial<ProjectStartup>) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveData(newData);
    }, 800);
  }, [saveData]);

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
    // Remove from auto-filled when user manually changes
    setAutoFilledFields(prev => prev.filter(f => f !== key));
    debouncedSave(newData);
  };

  const handleYesNoChange = (key: string, value: string) => {
    const newData = { ...formData, [key]: value === "yes" };
    setFormData(newData);
    setAutoFilledFields(prev => prev.filter(f => f !== key));
    debouncedSave(newData);
  };

  const handleInputChange = (key: string, value: string) => {
    const newData = { ...formData, [key]: value };
    setFormData(newData);
    setAutoFilledFields(prev => prev.filter(f => f !== key));
    debouncedSave(newData);
  };

  const isFieldAutoFilled = (key: string) => autoFilledFields.includes(key) && !startup;

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
          
          {/* Show auto-fill notice if fields were pre-populated */}
          {autoFilledFields.length > 0 && !startup && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Some fields were auto-filled from your quote</span>
            </div>
          )}
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
            <div className="flex items-center gap-2">
              <Label>Concrete Mix Design</Label>
              {isFieldAutoFilled("mix_design_text") && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Sparkles className="w-3 h-3" />
                  from quote
                </Badge>
              )}
            </div>
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
            const isAutoFilled = isFieldAutoFilled(item.key);

            return (
              <div key={item.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-base">{item.label}</Label>
                    {isAutoFilled && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Sparkles className="w-3 h-3" />
                        from quote
                      </Badge>
                    )}
                  </div>
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
