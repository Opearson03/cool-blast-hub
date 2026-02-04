import { useState } from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, X } from "lucide-react";
import { BOQItem, BOQ_CATEGORIES, BOQ_UNITS } from "./BOQTypes";
import { roundToCents } from "@/lib/format-currency";

interface BOQInlineItemRowProps {
  onSave: (item: Omit<BOQItem, 'id'>) => void;
  onCancel: () => void;
}

export function BOQInlineItemRow({ onSave, onCancel }: BOQInlineItemRowProps) {
  const [category, setCategory] = useState<BOQItem['category']>("other");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [unit, setUnit] = useState("units");
  const [unitPrice, setUnitPrice] = useState<number | "">("");

  const calculatedTotal = quantity && unitPrice ? roundToCents(Number(quantity) * Number(unitPrice)) : 0;

  const handleSave = () => {
    if (!description.trim() || !quantity) return;
    
    onSave({
      category,
      description: description.trim(),
      quantity: Number(quantity),
      unit,
      unitPrice: unitPrice ? Number(unitPrice) : undefined,
      totalPrice: calculatedTotal || undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <TableRow className="bg-muted/30">
      <TableCell className="p-1">
        {/* Empty checkbox cell */}
      </TableCell>
      <TableCell className="p-1">
        <div className="flex gap-1">
          <Select value={category} onValueChange={(v) => setCategory(v as BOQItem['category'])}>
            <SelectTrigger className="h-8 w-24 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(BOQ_CATEGORIES).map(([key, { label }]) => (
                <SelectItem key={key} value={key} className="text-xs">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Description..."
            className="h-8 text-sm flex-1"
            autoFocus
          />
        </div>
      </TableCell>
      <TableCell className="p-1">
        <Input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value ? parseFloat(e.target.value) : "")}
          onKeyDown={handleKeyDown}
          placeholder="Qty"
          className="h-8 w-16 text-sm text-right"
          step="0.01"
        />
      </TableCell>
      <TableCell className="p-1">
        <Select value={unit} onValueChange={setUnit}>
          <SelectTrigger className="h-8 w-16 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BOQ_UNITS.map((u) => (
              <SelectItem key={u} value={u} className="text-xs">
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="p-1">
        <Input
          type="number"
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value ? parseFloat(e.target.value) : "")}
          onKeyDown={handleKeyDown}
          placeholder="$0.00"
          className="h-8 w-20 text-sm text-right"
          step="0.01"
        />
      </TableCell>
      <TableCell className="p-1 text-right text-sm font-medium">
        {calculatedTotal > 0 ? `$${calculatedTotal.toFixed(2)}` : '-'}
      </TableCell>
      <TableCell className="p-1">
        <div className="flex gap-1 justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-primary hover:text-primary hover:bg-primary/10"
            onClick={handleSave}
            disabled={!description.trim() || !quantity}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
