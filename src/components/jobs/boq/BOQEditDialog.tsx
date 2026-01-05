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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BOQItem, BOQ_CATEGORIES, BOQ_UNITS, JobBOQ } from "./BOQTypes";

interface BOQEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boq: JobBOQ;
  jobId: string;
}

export function BOQEditDialog({ open, onOpenChange, boq, jobId }: BOQEditDialogProps) {
  const [items, setItems] = useState<BOQItem[]>(boq.items);
  const [notes, setNotes] = useState(boq.notes || "");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setItems(boq.items);
      setNotes(boq.notes || "");
    }
  }, [open, boq]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("job_boq")
        .update({
          items: JSON.parse(JSON.stringify(items)),
          notes: notes || null,
        })
        .eq("id", boq.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-boq", jobId] });
      toast({ title: "Bill of Quantities saved" });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const addItem = () => {
    const newItem: BOQItem = {
      id: Date.now().toString(),
      category: "concrete",
      description: "",
      quantity: 0,
      unit: "m³",
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, updates: Partial<BOQItem>) => {
    setItems(items.map((item) => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        // Auto-calculate total if both quantity and unitPrice are set
        if (updated.quantity && updated.unitPrice) {
          updated.totalPrice = updated.quantity * updated.unitPrice;
        }
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Bill of Quantities</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No items yet. Click "Add Item" to start building your BOQ.
              </p>
            ) : (
              items.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Item {index + 1}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Category</Label>
                      <Select
                        value={item.category}
                        onValueChange={(v) => updateItem(item.id, { category: v as BOQItem['category'] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(BOQ_CATEGORIES).map(([key, { label }]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                        placeholder="e.g. N32 Concrete"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.quantity || ""}
                        onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Unit</Label>
                      <Select
                        value={item.unit}
                        onValueChange={(v) => updateItem(item.id, { unit: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BOQ_UNITS.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Unit Price ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unitPrice || ""}
                        onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <Label>Total ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.totalPrice || ""}
                        onChange={(e) => updateItem(item.id, { totalPrice: parseFloat(e.target.value) || 0 })}
                        placeholder="Auto-calculated"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Notes (optional)</Label>
                    <Input
                      value={item.notes || ""}
                      onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>
              ))
            )}

            <Button variant="outline" onClick={addItem} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>

            <div>
              <Label>General Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="General notes for the Bill of Quantities..."
                rows={3}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
