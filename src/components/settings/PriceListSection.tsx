import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, Download, Upload, Search, RefreshCw } from "lucide-react";
import { usePriceList } from "@/hooks/usePriceList";
import { PriceListTable } from "./PriceListTable";
import { PriceListImportDialog } from "./PriceListImportDialog";
import { generatePriceListCSV } from "@/lib/price-list-defaults";
import { Skeleton } from "@/components/ui/skeleton";

export function PriceListSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  
  const { 
    priceListItems, 
    isLoading, 
    initializePriceList, 
    updateItem, 
    resetToDefault, 
    bulkUpdate,
    getMergedPriceList,
  } = usePriceList();

  // Initialize price list on first load
  useEffect(() => {
    if (!isLoading && (!priceListItems || priceListItems.length === 0)) {
      initializePriceList.mutate();
    }
  }, [isLoading, priceListItems]);

  const handleExport = () => {
    const items = getMergedPriceList();
    const csv = generatePriceListCSV(items);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `price-list-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (items: Array<{ item_code: string; category: string; custom_price: number | null; notes?: string | null }>) => {
    bulkUpdate.mutate(items);
  };

  const handleUpdateItem = (id: string, customPrice: number | null, notes?: string | null) => {
    updateItem.mutate({ id, custom_price: customPrice, notes });
  };

  const handleResetItem = (id: string) => {
    resetToDefault.mutate(id);
  };

  const customPricesCount = priceListItems?.filter(i => i.custom_price !== null).length || 0;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>My Price List</CardTitle>
                <CardDescription>
                  Set your custom prices for materials and labour. These will auto-fill new estimates.
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats & Search */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {customPricesCount > 0 ? (
                <span className="text-primary font-medium">{customPricesCount} custom prices set</span>
              ) : (
                <span>Using all default prices</span>
              )}
            </div>
          </div>

          {/* Price List Table */}
          {isLoading || initializePriceList.isPending ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : priceListItems && priceListItems.length > 0 ? (
            <PriceListTable
              items={priceListItems}
              onUpdateItem={handleUpdateItem}
              onResetItem={handleResetItem}
              searchQuery={searchQuery}
            />
          ) : (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Initializing price list...</p>
            </div>
          )}
        </CardContent>
      </Card>

      <PriceListImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handleImport}
      />
    </>
  );
}
