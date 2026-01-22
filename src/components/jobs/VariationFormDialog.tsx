import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface VariationItem {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
}

interface EditVariation {
  id: string;
  variation_number: string;
  description: string;
  reason: string | null;
  items: VariationItem[];
  amount: number;
  days_extension: number;
  notes: string | null;
}

interface VariationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  businessId: string;
  existingCount: number;
  editVariation?: EditVariation | null;
  /** Called with the created variation data when a new variation is successfully created */
  onCreated?: (variation: EditVariation) => void;
}

const UNITS = ["m²", "m³", "m", "ea", "hrs", "days", "kg", "t", "lump sum"];

const REASONS = [
  { value: "client_request", label: "Client Request" },
  { value: "site_condition", label: "Site Condition" },
  { value: "design_change", label: "Design Change" },
  { value: "regulatory", label: "Regulatory" },
  { value: "other", label: "Other" },
];

export function VariationFormDialog({
  open,
  onOpenChange,
  jobId,
  businessId,
  existingCount,
  editVariation,
  onCreated,
}: VariationFormDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [description, setDescription] = useState("");
  const [reason, setReason] = useState<string>("");
  const [daysExtension, setDaysExtension] = useState(0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<VariationItem[]>([
    { description: "", quantity: 1, unit: "ea", unit_price: 0, total: 0 },
  ]);

  const isEditing = !!editVariation;

  useEffect(() => {
    if (open) {
      if (editVariation) {
        setDescription(editVariation.description);
        setReason(editVariation.reason || "");
        setDaysExtension(editVariation.days_extension || 0);
        setNotes(editVariation.notes || "");
        setItems(editVariation.items.length > 0 ? editVariation.items : [
          { description: "", quantity: 1, unit: "ea", unit_price: 0, total: 0 },
        ]);
      } else {
        setDescription("");
        setReason("");
        setDaysExtension(0);
        setNotes("");
        setItems([{ description: "", quantity: 1, unit: "ea", unit_price: 0, total: 0 }]);
      }
    }
  }, [open, editVariation]);

  const updateItem = (index: number, field: keyof VariationItem, value: string | number) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      // Recalculate total
      updated[index].total = updated[index].quantity * updated[index].unit_price;
      return updated;
    });
  };

  const addItem = () => {
    setItems((prev) => [...prev, { description: "", quantity: 1, unit: "ea", unit_price: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

  const createMutation = useMutation({
    mutationFn: async () => {
      const variationNumber = `VO-${String(existingCount + 1).padStart(3, "0")}`;
      const filteredItems = items.filter((i) => i.description.trim());
      
      const { data, error } = await supabase.from("job_variations").insert([{
        job_id: jobId,
        business_id: businessId,
        variation_number: variationNumber,
        description,
        reason: reason || null,
        items: JSON.parse(JSON.stringify(filteredItems)),
        amount: totalAmount,
        days_extension: daysExtension,
        notes: notes || null,
        created_by: user?.id,
        status: "draft",
      }]).select().single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["job-variations", jobId] });
      toast({ title: "Variation created" });
      onOpenChange(false);
      
      // Call the onCreated callback with the new variation data
      if (onCreated && data) {
        const createdVariation: EditVariation = {
          id: data.id,
          variation_number: data.variation_number,
          description: data.description,
          reason: data.reason,
          items: (data.items as unknown as VariationItem[]) || [],
          amount: Number(data.amount),
          days_extension: data.days_extension || 0,
          notes: data.notes,
        };
        onCreated(createdVariation);
      }
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editVariation) return;
      
      const { error } = await supabase
        .from("job_variations")
        .update({
          description,
          reason: reason || null,
          items: JSON.parse(JSON.stringify(items.filter((i) => i.description.trim()))),
          amount: totalAmount,
          days_extension: daysExtension,
          notes: notes || null,
        })
        .eq("id", editVariation.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-variations", jobId] });
      toast({ title: "Variation updated" });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast({ title: "Description required", variant: "destructive" });
      return;
    }
    if (isEditing) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Variation" : "Add Variation"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the variation..."
              rows={2}
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Line Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-12 sm:col-span-4">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                      placeholder="Item description"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Label className="text-xs">Unit</Label>
                    <Select value={item.unit} onValueChange={(v) => updateItem(index, "unit", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <Label className="text-xs">Unit Price</Label>
                    <Input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-1">
                    <Label className="text-xs">Total</Label>
                    <p className="text-sm font-medium py-2">
                      ${item.total.toFixed(2)}
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      className="h-9 w-9"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex justify-end pt-2 border-t">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total (ex GST)</p>
                <p className={`text-xl font-bold ${totalAmount >= 0 ? "text-foreground" : "text-red-600"}`}>
                  ${totalAmount.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Days Extension */}
          <div className="space-y-2">
            <Label htmlFor="days">Days Extension</Label>
            <Input
              id="days"
              type="number"
              value={daysExtension}
              onChange={(e) => setDaysExtension(parseInt(e.target.value) || 0)}
              className="w-32"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Variation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
