import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBusinessData } from "./useBusinessData";
import { DEFAULT_PRICE_LIST, PriceListItem } from "@/lib/price-list-defaults";
import { toast } from "sonner";

export interface PriceListItemWithId extends PriceListItem {
  id: string;
  business_id: string;
  custom_price: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function usePriceList() {
  const { businessId } = useBusinessData();
  const queryClient = useQueryClient();

  // Fetch price list items for the business
  const { data: priceListItems, isLoading, refetch } = useQuery({
    queryKey: ['price-list', businessId],
    queryFn: async () => {
      if (!businessId) return [];

      const { data, error } = await supabase
        .from('price_list_items')
        .select('*')
        .eq('business_id', businessId)
        .order('category')
        .order('item_code');

      if (error) throw error;
      return data as PriceListItemWithId[];
    },
    enabled: !!businessId,
  });

  // Initialize price list with defaults if empty
  const initializePriceList = useMutation({
    mutationFn: async () => {
      if (!businessId) throw new Error('No business ID');

      // Check if already initialized
      const { count } = await supabase
        .from('price_list_items')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId);

      if (count && count > 0) return; // Already initialized

      // Insert default items
      const itemsToInsert = DEFAULT_PRICE_LIST.map(item => ({
        business_id: businessId,
        ...item,
        custom_price: null,
        notes: null,
      }));

      const { error } = await supabase
        .from('price_list_items')
        .insert(itemsToInsert);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-list', businessId] });
    },
  });

  // Re-sync price list with latest defaults (preserves custom prices)
  const resyncPriceList = useMutation({
    mutationFn: async () => {
      if (!businessId) throw new Error('No business ID');

      // Fetch current custom prices to preserve
      const { data: currentItems } = await supabase
        .from('price_list_items')
        .select('item_code, category, custom_price, notes')
        .eq('business_id', businessId);

      const customPricesMap = new Map<string, { custom_price: number | null; notes: string | null }>();
      currentItems?.forEach(item => {
        if (item.custom_price !== null) {
          customPricesMap.set(`${item.category}:${item.item_code}`, {
            custom_price: item.custom_price,
            notes: item.notes,
          });
        }
      });

      // Delete all existing items
      const { error: deleteError } = await supabase
        .from('price_list_items')
        .delete()
        .eq('business_id', businessId);

      if (deleteError) throw deleteError;

      // Insert fresh items from defaults, preserving custom prices
      const itemsToInsert = DEFAULT_PRICE_LIST.map(item => {
        const key = `${item.category}:${item.item_code}`;
        const customData = customPricesMap.get(key);
        return {
          business_id: businessId,
          ...item,
          custom_price: customData?.custom_price ?? null,
          notes: customData?.notes ?? null,
        };
      });

      const { error: insertError } = await supabase
        .from('price_list_items')
        .insert(itemsToInsert);

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-list', businessId] });
      toast.success('Price list synced with latest catalog');
    },
    onError: (error) => {
      toast.error('Failed to sync price list: ' + error.message);
    },
  });

  // Update a single price list item
  const updateItem = useMutation({
    mutationFn: async ({ id, custom_price, notes }: { id: string; custom_price: number | null; notes?: string | null }) => {
      const { error } = await supabase
        .from('price_list_items')
        .update({ custom_price, notes, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-list', businessId] });
    },
    onError: (error) => {
      toast.error('Failed to update price: ' + error.message);
    },
  });

  // Reset item to default
  const resetToDefault = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('price_list_items')
        .update({ custom_price: null, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-list', businessId] });
      toast.success('Price reset to default');
    },
  });

  // Bulk update from CSV import
  const bulkUpdate = useMutation({
    mutationFn: async (items: Array<{ item_code: string; category: string; custom_price: number | null; notes?: string | null }>) => {
      if (!businessId) throw new Error('No business ID');

      for (const item of items) {
        const { error } = await supabase
          .from('price_list_items')
          .update({ 
            custom_price: item.custom_price, 
            notes: item.notes,
            updated_at: new Date().toISOString() 
          })
          .eq('business_id', businessId)
          .eq('category', item.category)
          .eq('item_code', item.item_code);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-list', businessId] });
      toast.success('Price list updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to import prices: ' + error.message);
    },
  });

  // Get effective price (custom or default)
  const getPrice = (category: string, itemCode: string): number => {
    const item = priceListItems?.find(
      i => i.category === category && i.item_code === itemCode
    );
    if (item) {
      return item.custom_price ?? item.default_price;
    }
    // Fallback to hardcoded defaults if not in database
    const defaultItem = DEFAULT_PRICE_LIST.find(
      i => i.category === category && i.item_code === itemCode
    );
    return defaultItem?.default_price ?? 0;
  };

  // Get all items for a category
  const getCategoryItems = (category: string): PriceListItemWithId[] => {
    return priceListItems?.filter(i => i.category === category) ?? [];
  };

  // Get items merged with defaults (for display when DB not yet initialized)
  const getMergedPriceList = (): Array<PriceListItem & { id?: string; custom_price?: number | null; notes?: string | null }> => {
    if (!priceListItems || priceListItems.length === 0) {
      return DEFAULT_PRICE_LIST.map(item => ({ ...item, custom_price: null, notes: null }));
    }
    return priceListItems;
  };

  return {
    priceListItems,
    isLoading,
    refetch,
    initializePriceList,
    resyncPriceList,
    updateItem,
    resetToDefault,
    bulkUpdate,
    getPrice,
    getCategoryItems,
    getMergedPriceList,
    businessId,
  };
}
