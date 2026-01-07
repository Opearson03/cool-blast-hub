import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileSpreadsheet, AlertCircle, Check } from "lucide-react";
import { parsePriceListCSV, PRICE_LIST_CATEGORIES } from "@/lib/price-list-defaults";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PriceListImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (items: Array<{ item_code: string; category: string; custom_price: number | null; notes?: string | null }>) => void;
}

export function PriceListImportDialog({ open, onOpenChange, onImport }: PriceListImportDialogProps) {
  const [parsedItems, setParsedItems] = useState<Array<{ 
    category: string; 
    item_code: string; 
    item_name: string;
    custom_price: number | null; 
    notes?: string | null 
  }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const items = parsePriceListCSV(content);
        
        if (items.length === 0) {
          setError('No valid items found in CSV file');
          setParsedItems([]);
          return;
        }

        // Filter to only items with custom prices
        const itemsWithPrices = items.filter(item => 
          item.category && item.item_code && item.custom_price !== null
        ).map(item => ({
          category: item.category!,
          item_code: item.item_code!,
          item_name: item.item_name || item.item_code!,
          custom_price: item.custom_price!,
          notes: item.notes,
        }));

        setParsedItems(itemsWithPrices);
      } catch (err) {
        setError('Failed to parse CSV file. Please check the format.');
        setParsedItems([]);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    onImport(parsedItems);
    onOpenChange(false);
    setParsedItems([]);
    setFileName(null);
    setError(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    setParsedItems([]);
    setFileName(null);
    setError(null);
  };

  const getCategoryLabel = (categoryId: string) => {
    return PRICE_LIST_CATEGORIES.find(c => c.id === categoryId)?.label || categoryId;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Import Price List
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to update your custom prices. The file should have columns: 
            category, item_code, item_name, unit, default_price, custom_price, notes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div 
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            {fileName ? (
              <p className="text-sm font-medium">{fileName}</p>
            ) : (
              <>
                <p className="text-sm font-medium">Click to upload CSV file</p>
                <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {parsedItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Check className="w-4 h-4" />
                {parsedItems.length} items with custom prices found
              </div>
              <ScrollArea className="h-[200px] border rounded-lg">
                <div className="p-3 space-y-1">
                  {parsedItems.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm py-1 border-b border-border/50 last:border-0">
                      <span className="text-muted-foreground">
                        [{getCategoryLabel(item.category)}] {item.item_name}
                      </span>
                      <span className="font-medium">${item.custom_price?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={parsedItems.length === 0}
          >
            Import {parsedItems.length} Prices
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
