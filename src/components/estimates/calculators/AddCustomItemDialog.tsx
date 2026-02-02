import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { ExtraItem } from "@/lib/estimate-components/types";
import { formatCurrency } from "@/lib/format-currency";

interface AddCustomItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (item: ExtraItem) => void;
}

export function AddCustomItemDialog({
  open,
  onOpenChange,
  onAdd,
}: AddCustomItemDialogProps) {
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState("ea");
  const [rate, setRate] = useState<number>(0);

  const total = (quantity || 0) * (rate || 0);

  const handleAdd = () => {
    if (!description.trim()) return;

    const newItem: ExtraItem = {
      id: crypto.randomUUID(),
      description: description.trim(),
      quantity: quantity || 1,
      unit: unit || "ea",
      rate: rate || 0,
      total,
    };

    onAdd(newItem);
    
    // Reset form
    setDescription("");
    setQuantity(1);
    setUnit("ea");
    setRate(0);
    onOpenChange(false);
  };

  const handleCancel = () => {
    // Reset form
    setDescription("");
    setQuantity(1);
    setUnit("ea");
    setRate(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Custom Item
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="item-description">Description</Label>
            <Input
              id="item-description"
              placeholder="Enter item description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-10"
              autoFocus
            />
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="item-quantity">Quantity</Label>
              <Input
                id="item-quantity"
                type="number"
                inputMode="decimal"
                placeholder="1"
                value={quantity ?? ""}
                onChange={(e) => setQuantity(e.target.value === "" ? 0 : Number(e.target.value))}
                className="h-10"
                min={0}
                step="any"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-unit">Unit</Label>
              <Input
                id="item-unit"
                placeholder="ea, m², hrs, etc."
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          {/* Rate */}
          <div className="space-y-2">
            <Label htmlFor="item-rate">Rate ($)</Label>
            <Input
              id="item-rate"
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={rate ?? ""}
              onChange={(e) => setRate(e.target.value === "" ? 0 : Number(e.target.value))}
              className="h-10"
              min={0}
              step="any"
            />
          </div>

          {/* Total Preview */}
          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border">
            <span className="text-sm font-medium">Total</span>
            <span className="text-lg font-semibold text-primary">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!description.trim()}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
