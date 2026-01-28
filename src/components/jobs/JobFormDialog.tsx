import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { generateBOQFromEstimate } from "@/lib/boq-generator";

type Crew = {
  id: string;
  name: string;
};

type JobFormData = {
  name: string;
  site_address: string;
  builder_client: string;
  po_number: string;
  estimated_m3: string;
  ordered_m3: string;
  concrete_supplier: string;
  mpa_strength: string;
  slump: string;
  finish_type: string;
  crew_id: string;
  job_notes: string;
};

type PourData = {
  pour_name: string;
  estimated_m3: number;
  mpa_strength: string;
  slump: string;
  notes: string;
};

type InitialJobData = Partial<JobFormData> & {
  pours?: PourData[];
  estimate_id?: string;
  source_estimate_id?: string;
  scope_data?: Record<string, unknown>;
  selected_scopes?: string[];
  estimate_description?: string;
};

const initialFormData: JobFormData = {
  name: "",
  site_address: "",
  builder_client: "",
  po_number: "",
  estimated_m3: "",
  ordered_m3: "",
  concrete_supplier: "",
  mpa_strength: "",
  slump: "",
  finish_type: "",
  crew_id: "",
  job_notes: "",
};

interface JobFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crews: Crew[];
  editJob?: any;
  initialData?: InitialJobData;
}

export function JobFormDialog({ open, onOpenChange, crews, editJob, initialData }: JobFormDialogProps) {
  const getFormData = (): JobFormData => {
    if (editJob) {
      return {
        name: editJob.name || "",
        site_address: editJob.site_address || "",
        builder_client: editJob.builder_client || "",
        po_number: editJob.po_number || "",
        estimated_m3: editJob.estimated_m3?.toString() || "",
        ordered_m3: editJob.ordered_m3?.toString() || "",
        concrete_supplier: editJob.concrete_supplier || "",
        mpa_strength: editJob.mpa_strength || "",
        slump: editJob.slump || "",
        finish_type: editJob.finish_type || "",
        crew_id: editJob.crew_id || "",
        job_notes: editJob.job_notes || "",
      };
    }
    if (initialData) {
      return { 
        ...initialFormData, 
        name: initialData.name || "",
        site_address: initialData.site_address || "",
        builder_client: initialData.builder_client || "",
        po_number: initialData.po_number || "",
        estimated_m3: initialData.estimated_m3 || "",
        ordered_m3: initialData.ordered_m3 || "",
        concrete_supplier: initialData.concrete_supplier || "",
        mpa_strength: initialData.mpa_strength || "",
        slump: initialData.slump || "",
        finish_type: initialData.finish_type || "",
        crew_id: initialData.crew_id || "",
        job_notes: initialData.job_notes || "",
      };
    }
    return initialFormData;
  };

  const [formData, setFormData] = useState<JobFormData>(getFormData());

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open) {
      setFormData(getFormData());
    }
  }, [open, editJob, initialData]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: JobFormData) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      // First try to get business_id from profile (for employees)
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", userData.user.id)
        .maybeSingle();

      let businessId = profile?.business_id;

      // If no business_id in profile, check if user owns a business (for admins)
      if (!businessId) {
        const { data: ownedBusiness } = await supabase
          .from("businesses")
          .select("id")
          .eq("owner_id", userData.user.id)
          .maybeSingle();
        
        businessId = ownedBusiness?.id;
      }

      if (!businessId) {
        throw new Error("No business found. Please set up your business in Settings first.");
      }

      const jobData = {
        name: data.name,
        site_address: data.site_address,
        builder_client: data.builder_client || null,
        po_number: data.po_number || null,
        estimated_m3: data.estimated_m3 ? parseFloat(data.estimated_m3) : null,
        ordered_m3: data.ordered_m3 ? parseFloat(data.ordered_m3) : null,
        concrete_supplier: data.concrete_supplier || null,
        mpa_strength: data.mpa_strength || null,
        slump: data.slump || null,
        finish_type: data.finish_type || null,
        crew_id: data.crew_id || null,
        job_notes: data.job_notes || null,
        business_id: businessId,
        created_by: userData.user.id,
        source_estimate_id: initialData?.source_estimate_id || null,
        // Mark as needing startup wizard if created from estimate
        startup_completed: initialData?.source_estimate_id ? false : true,
      };

      if (editJob) {
        const { error } = await supabase
          .from("jobs")
          .update(jobData)
          .eq("id", editJob.id);
        if (error) throw error;
      } else {
        // Create the job
        const { data: newJob, error } = await supabase
          .from("jobs")
          .insert(jobData)
          .select("id")
          .single();
        if (error) throw error;

        // If we have pours from estimate conversion, create job_pours
        if (newJob && initialData?.pours && initialData.pours.length > 0) {
          const poursToInsert = initialData.pours.map((pour, index) => ({
            job_id: newJob.id,
            pour_name: pour.pour_name,
            estimated_m3: pour.estimated_m3 || null,
            mpa_strength: pour.mpa_strength || null,
            slump: pour.slump || null,
            notes: pour.notes || null,
            status: "scheduled",
          }));

          const { error: poursError } = await supabase
            .from("job_pours")
            .insert(poursToInsert);
          
          if (poursError) {
            console.error("Failed to create pours:", poursError);
            // Don't throw - job was created successfully
          }
        }

        // Generate BOQ from estimate data or description
        if (newJob && initialData) {
          const boqItems = generateBOQFromEstimate(
            initialData.scope_data as Record<string, unknown> || null,
            initialData.selected_scopes || null,
            initialData.estimate_description
          );
          
          if (boqItems.length > 0) {
            const { error: boqError } = await supabase
              .from("job_boq")
              .insert({
                job_id: newJob.id,
                items: JSON.parse(JSON.stringify(boqItems)),
                notes: `Auto-generated from estimate${initialData.estimate_id ? ` (${initialData.estimate_id})` : ''}`,
              });
            
            if (boqError) {
              console.error("Failed to create BOQ:", boqError);
              // Don't throw - job was created successfully
            }
          }

          // Copy building plans from estimate to job documents (now uses takeoff_files table)
          if (initialData.source_estimate_id) {
            try {
              // First get the takeoff for this estimate
              const { data: takeoff } = await supabase
                .from("estimate_takeoffs")
                .select("id")
                .eq("estimate_id", initialData.source_estimate_id)
                .maybeSingle();
              
              if (takeoff?.id) {
                // Get all files from takeoff_files table
                const { data: files } = await supabase
                  .from("takeoff_files")
                  .select("file_url, file_type, file_name")
                  .eq("takeoff_id", takeoff.id)
                  .order("sort_order", { ascending: true });
                
                // Copy each file to job documents
                for (const file of files || []) {
                  if (!file.file_url) continue;
                  
                  // Get a fresh signed URL for the private bucket
                  const urlParts = file.file_url.split('/estimate-plans/');
                  if (!urlParts[1]) continue;
                  
                  const filePath = decodeURIComponent(urlParts[1].split('?')[0]);
                  const { data: signedData } = await supabase.storage
                    .from("estimate-plans")
                    .createSignedUrl(filePath, 60); // 1 minute for download
                  
                  if (!signedData?.signedUrl) continue;
                  
                  // Download the file
                  const response = await fetch(signedData.signedUrl);
                  const blob = await response.blob();
                  
                  // Determine extension
                  const ext = file.file_type === 'pdf' ? 'pdf' : 
                              filePath.includes('.png') ? 'png' : 'jpg';
                  const fileName = `${newJob.id}/${Date.now()}-${file.file_name || 'building-plan'}.${ext}`;
                  
                  // Upload to documents bucket
                  const { error: uploadError } = await supabase.storage
                    .from("documents")
                    .upload(fileName, blob);
                  
                  if (!uploadError) {
                    // Get public URL
                    const { data: urlData } = supabase.storage
                      .from("documents")
                      .getPublicUrl(fileName);
                    
                    // Create document record
                    await supabase.from("documents").insert({
                      business_id: businessId,
                      file_name: file.file_name || `Building Plan.${ext}`,
                      file_type: file.file_type === 'pdf' ? 'application/pdf' : `image/${ext}`,
                      file_url: urlData.publicUrl,
                      category: "job",
                      reference_id: newJob.id,
                    });
                  }
                }
              }
            } catch (err) {
              console.error("Failed to copy plan to job documents:", err);
              // Don't throw - job was created successfully
            }
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job-pours"] });
      toast({ 
        title: editJob ? "Job updated successfully" : "Job created successfully",
        description: initialData?.pours?.length 
          ? `Created ${initialData.pours.length} pour(s) from estimate.`
          : undefined,
      });
      onOpenChange(false);
      setFormData(initialFormData);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.site_address) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }
    mutation.mutate(formData);
  };

  const handleChange = (field: keyof JobFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editJob ? "Edit Job" : "Create New Job"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="name">Job Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g., Smith Residence Slab"
                className="touch-target"
              />
            </div>

            <div>
              <Label htmlFor="site_address">Site Address *</Label>
              <Input
                id="site_address"
                value={formData.site_address}
                onChange={(e) => handleChange("site_address", e.target.value)}
                placeholder="123 Main St, Sydney NSW"
                className="touch-target"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="builder_client">Builder/Client</Label>
                <Input
                  id="builder_client"
                  value={formData.builder_client}
                  onChange={(e) => handleChange("builder_client", e.target.value)}
                  placeholder="Client name"
                  className="touch-target"
                />
              </div>
              <div>
                <Label htmlFor="po_number">PO Number</Label>
                <Input
                  id="po_number"
                  value={formData.po_number}
                  onChange={(e) => handleChange("po_number", e.target.value)}
                  placeholder="PO-12345"
                  className="touch-target"
                />
              </div>
            </div>
          </div>

          {/* Crew Assignment - Hidden for now - keeping code for future:
          <div>
            <Label htmlFor="crew_id">Assign Crew</Label>
            <Select value={formData.crew_id} onValueChange={(v) => handleChange("crew_id", v)}>
              <SelectTrigger className="touch-target">
                <SelectValue placeholder="Select a crew" />
              </SelectTrigger>
              <SelectContent>
                {crews.map((crew) => (
                  <SelectItem key={crew.id} value={crew.id}>
                    {crew.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          */}

          {/* Concrete Info */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Concrete Details</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="estimated_m3">Estimated m³</Label>
                <Input
                  id="estimated_m3"
                  type="number"
                  step="0.1"
                  value={formData.estimated_m3}
                  onChange={(e) => handleChange("estimated_m3", e.target.value)}
                  placeholder="0.0"
                  className="touch-target"
                />
              </div>
              <div>
                <Label htmlFor="ordered_m3">Ordered m³</Label>
                <Input
                  id="ordered_m3"
                  type="number"
                  step="0.1"
                  value={formData.ordered_m3}
                  onChange={(e) => handleChange("ordered_m3", e.target.value)}
                  placeholder="0.0"
                  className="touch-target"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="concrete_supplier">Concrete Supplier</Label>
              <Input
                id="concrete_supplier"
                value={formData.concrete_supplier}
                onChange={(e) => handleChange("concrete_supplier", e.target.value)}
                placeholder="e.g., Boral, Hanson"
                className="touch-target"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="mpa_strength">MPa</Label>
                <Input
                  id="mpa_strength"
                  value={formData.mpa_strength}
                  onChange={(e) => handleChange("mpa_strength", e.target.value)}
                  placeholder="32"
                  className="touch-target"
                />
              </div>
              <div>
                <Label htmlFor="slump">Slump</Label>
                <Input
                  id="slump"
                  value={formData.slump}
                  onChange={(e) => handleChange("slump", e.target.value)}
                  placeholder="100"
                  className="touch-target"
                />
              </div>
              <div>
                <Label htmlFor="finish_type">Finish</Label>
                <Input
                  id="finish_type"
                  value={formData.finish_type}
                  onChange={(e) => handleChange("finish_type", e.target.value)}
                  placeholder="Burnished"
                  className="touch-target"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="job_notes">Job Notes</Label>
            <Textarea
              id="job_notes"
              value={formData.job_notes}
              onChange={(e) => handleChange("job_notes", e.target.value)}
              placeholder="Any special requirements or notes..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 touch-target">
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending} className="flex-1 touch-target">
              {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editJob ? "Update Job" : "Create Job"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
