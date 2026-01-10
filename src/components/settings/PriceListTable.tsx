import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Pencil, Check, X } from "lucide-react";
import { PriceListItemWithId } from "@/hooks/usePriceList";
import { PRICE_LIST_CATEGORIES } from "@/lib/price-list-defaults";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface PriceListTableProps {
  items: PriceListItemWithId[];
  onUpdateItem: (id: string, customPrice: number | null, notes?: string | null) => void;
  onResetItem: (id: string) => void;
  searchQuery: string;
}

export function PriceListTable({ items, onUpdateItem, onResetItem, searchQuery }: PriceListTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const filteredItems = items.filter(item => 
    item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.item_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedItems = PRICE_LIST_CATEGORIES.reduce((acc, category) => {
    acc[category.id] = filteredItems.filter(item => item.category === category.id);
    return acc;
  }, {} as Record<string, PriceListItemWithId[]>);

  const handleEdit = (item: PriceListItemWithId) => {
    setEditingId(item.id);
    setEditValue((item.custom_price ?? item.default_price).toString());
  };

  const handleSave = (id: string) => {
    const price = parseFloat(editValue);
    if (!isNaN(price)) {
      onUpdateItem(id, price);
    }
    setEditingId(null);
    setEditValue("");
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue("");
  };

  const formatPrice = (price: number, unit: string) => {
    if (unit === '%') {
      return `${price}%`;
    }
    return `$${price.toFixed(2)}`;
  };

  return (
    <Accordion 
      type="multiple" 
      defaultValue={[]}
      className="space-y-2"
    >
      {PRICE_LIST_CATEGORIES.map(category => {
        const categoryItems = groupedItems[category.id] || [];
        if (categoryItems.length === 0) return null;

        const customCount = categoryItems.filter(i => i.custom_price !== null).length;

        return (
          <AccordionItem 
            key={category.id} 
            value={category.id}
            className="border rounded-lg px-4"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <span className="font-medium">{category.label}</span>
                <Badge variant="secondary" className="text-xs">
                  {categoryItems.length} items
                </Badge>
                {customCount > 0 && (
                  <Badge variant="default" className="text-xs">
                    {customCount} custom
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1 pb-2">
                {categoryItems.map(item => (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between py-2 px-2 rounded hover:bg-muted/50 group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{item.item_name}</span>
                        <span className="text-xs text-muted-foreground">({item.item_code})</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          Default: {formatPrice(item.default_price, item.unit)} {item.unit !== '%' && item.unit}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {editingId === item.id ? (
                        <>
                          <Input
                            type="number"
                            step="0.01"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-24 h-8 text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSave(item.id);
                              if (e.key === 'Escape') handleCancel();
                            }}
                          />
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleSave(item.id)}>
                            <Check className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancel}>
                            <X className="w-4 h-4 text-destructive" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1">
                            {item.custom_price !== null ? (
                              <span className="font-semibold text-primary">
                                {formatPrice(item.custom_price, item.unit)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                {formatPrice(item.default_price, item.unit)}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {item.unit !== '%' && item.unit}
                            </span>
                          </div>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          {item.custom_price !== null && (
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => onResetItem(item.id)}
                              title="Reset to default"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
