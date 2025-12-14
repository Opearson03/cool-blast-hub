import { useState } from "react";
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
}

export function JobFormDialog({ open, onOpenChange, crews, editJob }: JobFormDialogProps) {
  const [formData, setFormData] = useState<JobFormData>(
    editJob
      ? {
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
        }
      : initialFormData
  );

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
      };

      if (editJob) {
        const { error } = await supabase
          .from("jobs")
          .update(jobData)
          .eq("id", editJob.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("jobs").insert(jobData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast({ title: editJob ? "Job updated successfully" : "Job created successfully" });
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

          {/* Crew Assignment */}
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
