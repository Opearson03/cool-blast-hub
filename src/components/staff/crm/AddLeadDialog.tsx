import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadAdded: () => void;
}

export function AddLeadDialog({ open, onOpenChange, onLeadAdded }: AddLeadDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", full_name: "", company_name: "", phone: "", notes: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim()) {
      toast.error("Email is required");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("crm_leads").insert({
        email: form.email.trim(),
        full_name: form.full_name.trim() || null,
        company_name: form.company_name.trim() || null,
        phone: form.phone.trim() || null,
        notes: form.notes.trim() || null,
        source: "manual",
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("A lead with this email already exists");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Lead added");
      setForm({ email: "", full_name: "", company_name: "", phone: "", notes: "" });
      onOpenChange(false);
      onLeadAdded();
    } catch (err: any) {
      toast.error(err.message || "Failed to add lead");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="lead-email">Email *</Label>
            <Input id="lead-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="lead-name">Full Name</Label>
            <Input id="lead-name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="lead-company">Company</Label>
            <Input id="lead-company" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="lead-phone">Phone</Label>
            <Input id="lead-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="lead-notes">Notes</Label>
            <Textarea id="lead-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add Lead
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
