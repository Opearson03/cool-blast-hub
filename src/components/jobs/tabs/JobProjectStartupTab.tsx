import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, ClipboardCheck } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type ProjectStartup = Tables<"project_startup">;

interface JobProjectStartupTabProps {
  jobId: string;
}

export function JobProjectStartupTab({ jobId }: JobProjectStartupTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  useEffect(() => {
    if (startup) {
      setFormData(startup);
    }
  }, [startup]);

  const checklistItems = [
    { key: "communication_setup", label: "Communication Setup (Teams/Chat)" },
    { key: "plans_printed", label: "Plans Printed" },
    { key: "itps_prepared", label: "ITPs Prepared & Approved" },
    { key: "swms_prepared", label: "SWMS Prepared" },
    { key: "risk_assessment_completed", label: "Risk Assessment Completed" },
    { key: "concrete_supply", label: "Concrete Supply Confirmed" },
    { key: "concrete_testing", label: "Concrete Testing Required" },
    { key: "mix_design_approval", label: "Mix Design Approval" },
    { key: "reo_supply", label: "REO Supply Confirmed" },
    { key: "reo_fixing_subcontractor", label: "REO Fixing by Subcontractor" },
    { key: "curing_required", label: "Curing Required" },
    { key: "caulking_required", label: "Caulking Required" },
    { key: "long_longs_required", label: "Long Longs Required" },
  ] as const;

  const calculateProgress = () => {
    const checks = checklistItems.map((item) => formData[item.key as keyof ProjectStartup]);
    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const progress = calculateProgress();
      const dataToSave = {
        ...formData,
        job_id: jobId,
        completion_percentage: progress,
      };

      if (startup) {
        const { error } = await supabase
          .from("project_startup")
          .update(dataToSave)
          .eq("id", startup.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("project_startup").insert(dataToSave);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-startup", jobId] });
      toast({ title: "Project startup saved" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleCheckChange = (key: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [key]: checked }));
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const progress = calculateProgress();

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
            <span className="text-2xl font-bold text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>

      {/* Project Setup & Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Project Setup & Documentation</CardTitle>
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
              <Label>Client Contact Name</Label>
              <Input
                value={formData.client_contact_name || ""}
                onChange={(e) => handleInputChange("client_contact_name", e.target.value)}
                placeholder="Contact name"
                className="touch-target"
              />
            </div>
            <div>
              <Label>Client Contact Phone</Label>
              <Input
                value={formData.client_contact_phone || ""}
                onChange={(e) => handleInputChange("client_contact_phone", e.target.value)}
                placeholder="Phone number"
                className="touch-target"
              />
            </div>
            <div>
              <Label>Client Contact Email</Label>
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
          <CardTitle>Planning & Design</CardTitle>
          <CardDescription>Documentation and planning checklist</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {checklistItems.slice(0, 5).map((item) => (
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
            <Label>Mix Design Notes</Label>
            <Input
              value={formData.mix_design_text || ""}
              onChange={(e) => handleInputChange("mix_design_text", e.target.value)}
              placeholder="Mix design details"
              className="touch-target mt-1"
            />
          </div>

          <div>
            <Label>Mix Design Approval Notes</Label>
            <Input
              value={formData.mix_design_approval_notes || ""}
              onChange={(e) => handleInputChange("mix_design_approval_notes", e.target.value)}
              placeholder="Approval notes"
              className="touch-target mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Procurement & Suppliers */}
      <Card>
        <CardHeader>
          <CardTitle>Procurement & Suppliers</CardTitle>
          <CardDescription>Material and supplier confirmation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {checklistItems.slice(5).map((item) => (
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div>
              <Label>Concrete Supplier</Label>
              <Input
                value={formData.concrete_supplier || ""}
                onChange={(e) => handleInputChange("concrete_supplier", e.target.value)}
                placeholder="Supplier name"
                className="touch-target"
              />
            </div>
            <div>
              <Label>REO Supplier</Label>
              <Input
                value={formData.reo_supplier || ""}
                onChange={(e) => handleInputChange("reo_supplier", e.target.value)}
                placeholder="REO supplier"
                className="touch-target"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>REO Fixing - Who?</Label>
              <Input
                value={formData.reo_fixing_who || ""}
                onChange={(e) => handleInputChange("reo_fixing_who", e.target.value)}
                placeholder="REO fixing subcontractor details"
                className="touch-target"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="touch-target"
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Project Startup
        </Button>
      </div>
    </div>
  );
}
