import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { ExtraItem } from "@/lib/estimate-components/types";
import { formatCurrency } from "@/lib/format-currency";

interface ExtraItemsInputProps {
  items: ExtraItem[];
  onChange: (items: ExtraItem[]) => void;
}

export function ExtraItemsInput({ items, onChange }: ExtraItemsInputProps) {
  const handleAdd = () => {
    const newItem: ExtraItem = {
      id: crypto.randomUUID(),
      description: "",
      quantity: 1,
      unit: "ea",
      rate: 0,
      total: 0,
    };
    onChange([...items, newItem]);
  };

  const handleRemove = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const handleUpdate = (id: string, field: keyof ExtraItem, value: any) => {
    onChange(
      items.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };
        // Auto-calculate total when quantity or rate changes
        if (field === "quantity" || field === "rate") {
          updated.total =
            (Number(updated.quantity) || 0) * (Number(updated.rate) || 0);
        }
        return updated;
      })
    );
  };

  const grandTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium">Custom Items</Label>
        <Button variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-1" /> Add Item
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
          <p className="text-sm">No extra items added</p>
          <p className="text-xs mt-1">
            Click "Add Item" to include custom costs
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header row - hidden on mobile */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-xs text-muted-foreground px-1">
            <span className="col-span-4">Description</span>
            <span className="col-span-2 text-center">Qty</span>
            <span className="col-span-2 text-center">Unit</span>
            <span className="col-span-2 text-center">Rate</span>
            <span className="col-span-2 text-right">Total</span>
          </div>

          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:grid sm:grid-cols-12 gap-2 items-start sm:items-center bg-muted/30 p-3 sm:p-2 rounded-lg"
            >
              {/* Description */}
              <div className="w-full sm:col-span-4">
                <Label className="text-xs text-muted-foreground sm:hidden mb-1 block">
                  Description
                </Label>
                <Input
                  placeholder="Item description"
                  value={item.description}
                  onChange={(e) =>
                    handleUpdate(item.id, "description", e.target.value)
                  }
                  className="h-8 text-sm"
                />
              </div>

              {/* Qty, Unit, Rate row on mobile */}
              <div className="flex gap-2 w-full sm:contents">
                <div className="flex-1 sm:col-span-2">
                  <Label className="text-xs text-muted-foreground sm:hidden mb-1 block">
                    Qty
                  </Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="1"
                    value={item.quantity || ""}
                    onChange={(e) =>
                      handleUpdate(
                        item.id,
                        "quantity",
                        Number(e.target.value) || 0
                      )
                    }
                    className="h-8 text-sm text-center"
                    min={0}
                    step="any"
                  />
                </div>
                <div className="flex-1 sm:col-span-2">
                  <Label className="text-xs text-muted-foreground sm:hidden mb-1 block">
                    Unit
                  </Label>
                  <Input
                    placeholder="ea"
                    value={item.unit}
                    onChange={(e) =>
                      handleUpdate(item.id, "unit", e.target.value)
                    }
                    className="h-8 text-sm text-center"
                  />
                </div>
                <div className="flex-1 sm:col-span-2">
                  <Label className="text-xs text-muted-foreground sm:hidden mb-1 block">
                    Rate
                  </Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={item.rate || ""}
                    onChange={(e) =>
                      handleUpdate(item.id, "rate", Number(e.target.value) || 0)
                    }
                    className="h-8 text-sm text-center"
                    min={0}
                    step="0.01"
                  />
                </div>
              </div>

              {/* Total and delete */}
              <div className="flex items-center justify-between w-full sm:col-span-2 sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-0">
                <span className="text-sm font-medium">
                  {formatCurrency(item.total)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleRemove(item.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}

          {/* Summary footer */}
          {items.length > 0 && (
            <div className="flex justify-end items-center pt-2 border-t">
              <span className="text-sm text-muted-foreground mr-2">
                Extra Items Total:
              </span>
              <span className="text-sm font-semibold">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
