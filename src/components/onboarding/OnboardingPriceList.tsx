import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Check } from "lucide-react";
import { DEFAULT_PRICE_LIST, PRICE_LIST_CATEGORIES, PriceListItem } from "@/lib/price-list-defaults";

interface PriceOverride {
  category: string;
  item_code: string;
  custom_price: number;
}

interface OnboardingPriceListProps {
  priceOverrides: PriceOverride[];
  onPriceOverridesChange: (overrides: PriceOverride[]) => void;
}

export function OnboardingPriceList({ priceOverrides, onPriceOverridesChange }: OnboardingPriceListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

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

  const handleStartEdit = (item: PriceListItem) => {
    const key = `${item.category}-${item.item_code}`;
    setEditingKey(key);
    const override = getOverride(item.category, item.item_code);
    setEditValue((override ?? item.default_price).toString());
  };

  const handleSaveEdit = (item: PriceListItem) => {
    const price = parseFloat(editValue);
    if (!isNaN(price) && price !== item.default_price) {
      // Add or update override
      const existingIndex = priceOverrides.findIndex(
        o => o.category === item.category && o.item_code === item.item_code
      );
      if (existingIndex >= 0) {
        const updated = [...priceOverrides];
        updated[existingIndex] = { category: item.category, item_code: item.item_code, custom_price: price };
        onPriceOverridesChange(updated);
      } else {
        onPriceOverridesChange([...priceOverrides, { category: item.category, item_code: item.item_code, custom_price: price }]);
      }
    } else if (!isNaN(price) && price === item.default_price) {
      // Remove override if set back to default
      onPriceOverridesChange(priceOverrides.filter(
        o => !(o.category === item.category && o.item_code === item.item_code)
      ));
    }
    setEditingKey(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditValue("");
  };

  const formatPrice = (price: number, unit: string) => {
    if (unit === '%') {
      return `${price}%`;
    }
    return `$${price.toFixed(2)}`;
  };

  const customCount = priceOverrides.length;

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
          <Badge className="bg-primary text-primary-foreground">
            {customCount} customized
          </Badge>
        )}
      </div>

      {/* Price List */}
      <ScrollArea className="h-[300px] border rounded-lg">
        <div className="p-2 space-y-4">
          {PRICE_LIST_CATEGORIES.map(category => {
            const categoryItems = groupedItems[category.id] || [];
            if (categoryItems.length === 0) return null;

            return (
              <div key={category.id}>
                <div className="sticky top-0 bg-background/95 backdrop-blur py-1 px-2 mb-1">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {category.label}
                  </h4>
                </div>
                <div className="space-y-0.5">
                  {categoryItems.map(item => {
                    const key = `${item.category}-${item.item_code}`;
                    const isEditing = editingKey === key;
                    const override = getOverride(item.category, item.item_code);
                    const hasCustomPrice = override !== null;

                    return (
                      <div
                        key={key}
                        className="grid grid-cols-[1fr,auto,auto] gap-2 items-center py-1.5 px-2 rounded hover:bg-muted/50 text-sm"
                      >
                        {/* Item name */}
                        <div className="min-w-0">
                          <span className="truncate block">{item.item_name}</span>
                          <span className="text-xs text-muted-foreground">{item.unit}</span>
                        </div>

                        {/* Default price - highlighted when using default */}
                        <div className={`text-right whitespace-nowrap px-2 py-0.5 rounded ${!hasCustomPrice ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground'}`}>
                          {formatPrice(item.default_price, item.unit)}
                        </div>

                        {/* Custom price input/display */}
                        <div className="w-24">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                step="0.01"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="h-7 text-sm w-16"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit(item);
                                  if (e.key === 'Escape') handleCancelEdit();
                                }}
                                onBlur={() => handleSaveEdit(item)}
                              />
                              <button
                                onClick={() => handleSaveEdit(item)}
                                className="p-1 hover:bg-primary/20 rounded"
                              >
                                <Check className="w-3 h-3 text-primary" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartEdit(item)}
                              className={`w-full text-right px-2 py-0.5 rounded border border-dashed transition-colors ${
                                hasCustomPrice
                                  ? 'bg-primary/10 border-primary text-primary font-semibold'
                                  : 'border-muted-foreground/30 text-muted-foreground hover:border-primary/50'
                              }`}
                            >
                              {hasCustomPrice
                                ? formatPrice(override!, item.unit)
                                : 'Set price'
                              }
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <p className="text-xs text-muted-foreground">
        Click "Set price" to customize any item. Your prices will be highlighted in orange. You can always change these later in Settings.
      </p>
    </div>
  );
}
