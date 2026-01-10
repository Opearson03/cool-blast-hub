import { useState, useRef, useEffect, type Dispatch, type SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search, Check, X } from "lucide-react";
import { DEFAULT_PRICE_LIST, PRICE_LIST_CATEGORIES, PriceListItem } from "@/lib/price-list-defaults";

interface PriceOverride {
  category: string;
  item_code: string;
  custom_price: number;
}

interface OnboardingPriceListProps {
  priceOverrides: PriceOverride[];
  onPriceOverridesChange: Dispatch<SetStateAction<PriceOverride[]>>;
}

export function OnboardingPriceList({ priceOverrides, onPriceOverridesChange }: OnboardingPriceListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editDirty, setEditDirty] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingKey && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingKey]);

  // Filter items based on search
  const filteredItems = DEFAULT_PRICE_LIST.filter(item =>
    item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.item_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by category
  const groupedItems = PRICE_LIST_CATEGORIES.reduce((acc, category) => {
    acc[category.id] = filteredItems.filter(item => item.category === category.id);
    return acc;
  }, {} as Record<string, PriceListItem[]>);

  const getOverride = (category: string, item_code: string): number | null => {
    const override = priceOverrides.find(
      o => o.category === category && o.item_code === item_code
    );
    return override?.custom_price ?? null;
  };

  const getCategoryCustomCount = (categoryId: string): number => {
    return priceOverrides.filter(o => o.category === categoryId).length;
  };

  const handleStartEdit = (item: PriceListItem) => {
    const key = `${item.category}-${item.item_code}`;
    setEditingKey(key);
    const override = getOverride(item.category, item.item_code);
    setEditValue((override ?? item.default_price).toString());
    setEditDirty(false);
  };

  const handleSaveEdit = (item: PriceListItem) => {
    const price = parseFloat(editValue);

    // If invalid, keep the editor open
    if (Number.isNaN(price)) return;

    if (price !== item.default_price) {
      // Add/update override
      onPriceOverridesChange((prev) => {
        const existingIndex = prev.findIndex(
          (o) => o.category === item.category && o.item_code === item.item_code
        );

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { category: item.category, item_code: item.item_code, custom_price: price };
          return updated;
        }

        return [...prev, { category: item.category, item_code: item.item_code, custom_price: price }];
      });
    } else {
      // Remove override if set back to default
      onPriceOverridesChange((prev) =>
        prev.filter(
          (o) => !(o.category === item.category && o.item_code === item.item_code)
        )
      );
    }

    setEditingKey(null);
    setEditValue("");
    setEditDirty(false);
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditValue("");
    setEditDirty(false);
  };

  const formatPrice = (price: number, unit: string) => {
    if (unit === '%') {
      return `${price}%`;
    }
    return `$${price.toFixed(2)}`;
  };

  const customCount = priceOverrides.length;

  // Determine which accordions to open based on search
  const openCategories = searchQuery
    ? PRICE_LIST_CATEGORIES.filter(c => (groupedItems[c.id] || []).length > 0).map(c => c.id)
    : [];

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{DEFAULT_PRICE_LIST.length} items</span>
        {customCount > 0 && (
          <Badge className="bg-primary/20 text-primary border border-primary/30">
            {customCount} customized
          </Badge>
        )}
      </div>

      {/* Price List with Accordions */}
      <ScrollArea className="h-[320px] pr-3">
        <Accordion
          type="multiple"
          defaultValue={openCategories}
          className="space-y-2"
        >
          {PRICE_LIST_CATEGORIES.map(category => {
            const categoryItems = groupedItems[category.id] || [];
            if (categoryItems.length === 0) return null;

            const categoryCustomCount = getCategoryCustomCount(category.id);

            return (
              <AccordionItem
                key={category.id}
                value={category.id}
                className="border border-border/50 rounded-lg overflow-hidden bg-card/50"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 [&[data-state=open]]:bg-muted/20">
                  <div className="flex items-center justify-between w-full pr-2">
                    <span className="font-medium text-sm">{category.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {categoryItems.length} items
                      </span>
                      {categoryCustomCount > 0 && (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs px-1.5 py-0">
                          {categoryCustomCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="divide-y divide-border/30">
                    {categoryItems.map(item => {
                      const key = `${item.category}-${item.item_code}`;
                      const isEditing = editingKey === key;
                      const override = getOverride(item.category, item.item_code);
                      const hasCustomPrice = override !== null;

                      return (
                        <div
                          key={key}
                          className={`grid grid-cols-[1fr,auto,auto] gap-2 items-center py-2.5 px-4 text-sm transition-colors ${
                            hasCustomPrice ? 'bg-primary/5' : 'hover:bg-muted/20'
                          }`}
                        >
                          {/* Item name */}
                          <div className="min-w-0">
                            <span className="truncate block text-foreground">{item.item_name}</span>
                            <span className="text-xs text-muted-foreground">{item.unit}</span>
                          </div>

                          {/* Default price */}
                          <div className={`text-right whitespace-nowrap px-2 py-0.5 rounded text-xs ${
                            !hasCustomPrice 
                              ? 'bg-muted/50 text-foreground font-medium' 
                              : 'text-muted-foreground'
                          }`}>
                            {formatPrice(item.default_price, item.unit)}
                          </div>

                          {/* Custom price input/display */}
                          <div className="w-28">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  ref={inputRef}
                                  type="number"
                                  step="0.01"
                                  value={editValue}
                                  onChange={(e) => {
                                    setEditValue(e.target.value);
                                    setEditDirty(true);
                                  }}
                                  className="h-7 text-sm w-16"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleSaveEdit(item);
                                    }
                                    if (e.key === 'Escape') {
                                      e.preventDefault();
                                      handleCancelEdit();
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSaveEdit(item);
                                  }}
                                  className="p-1 hover:bg-primary/20 rounded"
                                >
                                  <Check className="w-3 h-3 text-primary" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelEdit();
                                  }}
                                  className="p-1 hover:bg-destructive/20 rounded"
                                >
                                  <X className="w-3 h-3 text-destructive" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEdit(item);
                                }}
                                className={`w-full px-2 py-1 rounded text-xs font-medium transition-all border flex items-center justify-end gap-1 ${
                                  hasCustomPrice
                                    ? 'bg-primary/20 text-primary border-primary/30'
                                    : 'bg-muted/20 text-foreground border-border/60 hover:border-primary/40'
                                }`}
                                aria-label={
                                  hasCustomPrice
                                    ? `Custom price ${formatPrice(override!, item.unit)}. Click to edit.`
                                    : `Default price ${formatPrice(item.default_price, item.unit)}. Click to set a custom price.`
                                }
                              >
                                <span>{formatPrice(hasCustomPrice ? override! : item.default_price, item.unit)}</span>
                                {!hasCustomPrice && (
                                  <span className="text-[10px] font-normal text-muted-foreground">Default</span>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </ScrollArea>

      <p className="text-xs text-muted-foreground">
        Click any price to edit. Custom prices are highlighted in orange. You can always change these later in Settings.
      </p>
    </div>
  );
}
