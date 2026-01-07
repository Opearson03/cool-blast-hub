import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { AdditionalCostItem } from "./constants";

interface AdditionalCostsSectionProps {
  title: string;
  items: AdditionalCostItem[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: "description" | "cost", value: string) => void;
}

export function AdditionalCostsSection({
  title,
  items,
  onAdd,
  onRemove,
  onUpdate,
}: AdditionalCostsSectionProps) {
  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2">
        <Label>{title}</Label>
        <Button variant="ghost" size="sm" onClick={onAdd}>
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>
      {items.map((cost) => (
        <div key={cost.id} className="flex gap-2 mb-2">
          <Input
            placeholder="Description"
            value={cost.description}
            onChange={(e) => onUpdate(cost.id, "description", e.target.value)}
            className="flex-1"
          />
          <Input
            type="number"
            placeholder="Cost"
            value={cost.cost}
            onChange={(e) => onUpdate(cost.id, "cost", e.target.value)}
            className="w-32"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(cost.id)}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ))}
    </div>
  );
}
