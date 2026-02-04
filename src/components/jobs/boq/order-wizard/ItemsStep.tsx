import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { BOQItem, BOQ_CATEGORIES } from "../BOQTypes";

interface ItemsStepProps {
  items: BOQItem[];
  selectedItems: string[];
  onToggle: (itemId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function ItemsStep({
  items,
  selectedItems,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: ItemsStepProps) {
  const unorderedItems = items.filter(item => !item.ordered);

  if (unorderedItems.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">All items have already been ordered.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-lg">
          Select Items
          <span className="text-muted-foreground font-normal ml-2">
            ({selectedItems.length} of {unorderedItems.length})
          </span>
        </h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onSelectAll}>
            Select All
          </Button>
          <Button variant="ghost" size="sm" onClick={onDeselectAll}>
            Clear
          </Button>
        </div>
      </div>

      <div className="border rounded-lg divide-y max-h-80 overflow-y-auto">
        {unorderedItems.map((item) => (
          <label
            key={item.id}
            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <Checkbox
              checked={selectedItems.includes(item.id)}
              onCheckedChange={() => onToggle(item.id)}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{item.description}</p>
              <p className="text-sm text-muted-foreground">
                {item.quantity} {item.unit} • {BOQ_CATEGORIES[item.category]?.label}
              </p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
