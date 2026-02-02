import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Loader2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BOQ_CATEGORIES } from "./BOQTypes";

interface SupplierContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (supplier: { id: string; name: string }) => void;
  initialData?: {
    id?: string;
    name?: string;
    company?: string;
    phone?: string;
    email?: string;
    category?: string;
    notes?: string;
  };
}

const SUPPLIER_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "concrete", label: "Concrete" },
  { value: "reinforcement", label: "Reinforcement" },
  { value: "formwork", label: "Formwork" },
  { value: "finishing", label: "Finishing" },
  { value: "other", label: "Other" },
];

export function SupplierContactDialog({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: SupplierContactDialogProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [company, setCompany] = useState(initialData?.company || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [category, setCategory] = useState(initialData?.category || "general");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const { toast } = useToast();

  const resetForm = () => {
    setName("");
    setCompany("");
    setPhone("");
    setEmail("");
    setCategory("general");
    setNotes("");
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.business_id) throw new Error("No business found");

      if (initialData?.id) {
        // Update existing
        const { data, error } = await supabase
          .from("supplier_contacts")
          .update({
            name,
            company: company || null,
            phone: phone || null,
            email: email || null,
            category,
            notes: notes || null,
          })
          .eq("id", initialData.id)
          .select("id, name")
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from("supplier_contacts")
          .insert({
            business_id: profile.business_id,
            name,
            company: company || null,
            phone: phone || null,
            email: email || null,
            category,
            notes: notes || null,
          })
          .select("id, name")
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      toast({
        title: initialData?.id ? "Supplier updated" : "Supplier added",
        description: `${data.name} has been saved.`,
      });
      resetForm();
      onOpenChange(false);
      onSuccess?.(data);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            {initialData?.id ? "Edit Supplier Contact" : "Add Supplier Contact"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Contact Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
            />
          </div>

          <div>
            <Label>Company</Label>
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="ABC Concrete Supplies"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Phone</Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0400 000 000"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@supplier.com"
              />
            </div>
          </div>

          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPLIER_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!name || saveMutation.isPending}
          >
            {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {initialData?.id ? "Update" : "Add"} Supplier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
