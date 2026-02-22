import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";

export interface CustomSummaryLineItem {
  id: string;
  description: string;
  amount: number;
}

interface SummaryLineItemsProps {
  items: CustomSummaryLineItem[];
  onChange: (items: CustomSummaryLineItem[]) => void;
  marginPercent?: number;
}

export function SummaryLineItems({ items, onChange, marginPercent = 0 }: SummaryLineItemsProps) {
  const handleAdd = () => {
    onChange([
      ...items,
      { id: crypto.randomUUID(), description: "", amount: 0 },
    ]);
  };

  const handleRemove = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const handleUpdate = (id: string, field: keyof CustomSummaryLineItem, value: any) => {
    onChange(
      items.map((item) => (item.id !== id ? item : { ...item, [field]: value }))
    );
  };

  const total = items.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-2 bg-muted/50 hover:bg-muted/70 transition-colors px-4 py-2.5 rounded-lg"
        >
          <Input
            placeholder="Description (e.g. Crane hire)"
            value={item.description}
            onChange={(e) => handleUpdate(item.id, "description", e.target.value)}
            className="h-7 text-sm flex-1 border-none bg-transparent shadow-none focus-visible:ring-1 px-1"
          />
          <Input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={item.amount ?? ""}
            onChange={(e) =>
              handleUpdate(
                item.id,
                "amount",
                e.target.value === "" ? 0 : Number(e.target.value)
              )
            }
            className="h-7 w-28 text-sm font-semibold font-mono text-right"
            min={0}
            step="0.01"
          />
          <span className="text-sm font-bold font-mono text-primary w-28 text-right shrink-0">
            {formatCurrency((item.amount || 0) * (1 + marginPercent / 100))}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => handleRemove(item.id)}
          >
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAdd}
        className="w-full border-dashed"
      >
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        Add Line Item
      </Button>

    </div>
  );
}
