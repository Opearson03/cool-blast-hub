import { useState } from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, Pencil } from "lucide-react";
import { BOQItem } from "./BOQTypes";
import { formatCurrency, roundToCents } from "@/lib/format-currency";
import { cn } from "@/lib/utils";

interface BOQTableRowProps {
  item: BOQItem;
  isSelected: boolean;
  onToggleSelect: () => void;
  onUpdateItem: (updates: Partial<BOQItem>) => void;
}

type EditingField = "unitPrice" | "totalPrice" | null;

export function BOQTableRow({ item, isSelected, onToggleSelect, onUpdateItem }: BOQTableRowProps) {
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [editValue, setEditValue] = useState<string>("");

  const isOrdered = item.ordered;

  const startEditing = (field: EditingField, currentValue: number | undefined) => {
    if (isOrdered) return;
    setEditingField(field);
    setEditValue(currentValue?.toString() || "");
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue("");
  };

  const saveEditing = () => {
    if (editingField === null) return;

    const newValue = editValue ? roundToCents(parseFloat(editValue)) : undefined;

    if (editingField === "unitPrice") {
      const newTotal = newValue && item.quantity ? roundToCents(newValue * item.quantity) : undefined;
      onUpdateItem({ unitPrice: newValue, totalPrice: newTotal });
    } else if (editingField === "totalPrice") {
      onUpdateItem({ totalPrice: newValue });
    }

    cancelEditing();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEditing();
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't toggle selection if clicking on editable cells or if item is ordered
    const target = e.target as HTMLElement;
    if (
      isOrdered ||
      target.closest('input') ||
      target.closest('button') ||
      target.closest('[data-editable]')
    ) {
      return;
    }
    onToggleSelect();
  };

  return (
    <TableRow
      className={cn(
        "cursor-pointer transition-colors",
        isOrdered && "opacity-60 cursor-not-allowed",
        !isOrdered && isSelected && "bg-primary/5 border-l-2 border-l-primary",
        !isOrdered && !isSelected && "hover:bg-muted/50"
      )}
      onClick={handleRowClick}
    >
      <TableCell className="w-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          disabled={isOrdered}
          onClick={(e) => e.stopPropagation()}
        />
      </TableCell>
      <TableCell className={cn(isOrdered && "line-through text-muted-foreground")}>
        {item.description}
      </TableCell>
      <TableCell className="text-right">{item.quantity}</TableCell>
      <TableCell>{item.unit}</TableCell>
      
      {/* Unit Price - Editable */}
      <TableCell
        className="text-right"
        data-editable
        onClick={(e) => {
          e.stopPropagation();
          if (!isOrdered && editingField !== "unitPrice") {
            startEditing("unitPrice", item.unitPrice);
          }
        }}
      >
        {editingField === "unitPrice" ? (
          <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
            <Input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-7 w-24 text-sm text-right"
              step="0.01"
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-primary hover:text-primary hover:bg-primary/10"
              onClick={saveEditing}
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={cancelEditing}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className={cn(
            "group inline-flex items-center gap-1",
            !isOrdered && "cursor-pointer hover:text-primary"
          )}>
            {item.unitPrice ? formatCurrency(item.unitPrice) : '-'}
            {!isOrdered && (
              <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50" />
            )}
          </div>
        )}
      </TableCell>

      {/* Total Price - Editable */}
      <TableCell
        className="text-right font-medium"
        data-editable
        onClick={(e) => {
          e.stopPropagation();
          if (!isOrdered && editingField !== "totalPrice") {
            startEditing("totalPrice", item.totalPrice);
          }
        }}
      >
        {editingField === "totalPrice" ? (
          <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
            <Input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-7 w-24 text-sm text-right"
              step="0.01"
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-primary hover:text-primary hover:bg-primary/10"
              onClick={saveEditing}
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={cancelEditing}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className={cn(
            "group inline-flex items-center gap-1",
            !isOrdered && "cursor-pointer hover:text-primary"
          )}>
            {item.totalPrice ? formatCurrency(item.totalPrice) : '-'}
            {!isOrdered && (
              <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50" />
            )}
          </div>
        )}
      </TableCell>

      <TableCell className="text-center">
        {item.ordered ? (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs dark:bg-green-950 dark:text-green-400 dark:border-green-800">
            Ordered
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs">
            Pending
          </Badge>
        )}
      </TableCell>
    </TableRow>
  );
}
