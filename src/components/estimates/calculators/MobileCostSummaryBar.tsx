import { useState } from "react";
import { ComponentCost } from "@/lib/estimate-components/types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronUp, ChevronDown } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface MobileCostSummaryBarProps {
  moduleCosts: ComponentCost[];
  marginPercent: number;
  scopeVolume?: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function MobileCostSummaryBar({
  moduleCosts,
  marginPercent,
  scopeVolume,
}: MobileCostSummaryBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Calculate totals
  const subtotal = moduleCosts.reduce((sum, mc) => sum + mc.subtotal, 0);
  const marginAmount = subtotal * (marginPercent / 100);
  const subtotalWithMargin = subtotal + marginAmount;
  const gst = subtotalWithMargin * 0.1;
  const grandTotal = subtotalWithMargin + gst;

  // Group costs by category
  const labourTotal = moduleCosts.reduce(
    (sum, mc) =>
      sum +
      mc.lineItems
        .filter((item) => item.category === 'labour')
        .reduce((s, i) => s + i.total, 0),
    0
  );

  const materialsTotal = moduleCosts.reduce(
    (sum, mc) =>
      sum +
      mc.lineItems
        .filter((item) => item.category === 'materials')
        .reduce((s, i) => s + i.total, 0),
    0
  );

  const plantTotal = moduleCosts.reduce(
    (sum, mc) =>
      sum +
      mc.lineItems
        .filter((item) => item.category === 'plant')
        .reduce((s, i) => s + i.total, 0),
    0
  );

  const subcontractorTotal = moduleCosts.reduce(
    (sum, mc) =>
      sum +
      mc.lineItems
        .filter((item) => item.category === 'subcontractor')
        .reduce((s, i) => s + i.total, 0),
    0
  );

  const ratePerM3 = scopeVolume && scopeVolume > 0 && grandTotal > 0 
    ? grandTotal / scopeVolume 
    : null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <div 
          className={cn(
            "fixed bottom-0 left-0 right-0 z-40",
            "bg-background border-t shadow-lg",
            "px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]",
            "cursor-pointer active:bg-muted/50 transition-colors"
          )}
        >
          <div className="flex items-center justify-between max-w-screen-xl mx-auto">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Total (inc GST)</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(grandTotal)}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              {ratePerM3 && (
                <div className="flex flex-col items-end">
                  <span className="text-xs text-muted-foreground">Rate</span>
                  <span className="text-sm font-medium">{formatCurrency(ratePerM3)}/m³</span>
                </div>
              )}
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <ChevronUp className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-[70vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>Cost Summary</SheetTitle>
          {scopeVolume !== undefined && scopeVolume > 0 && (
            <p className="text-sm text-muted-foreground">
              Concrete Volume: {scopeVolume.toFixed(2)} m³
            </p>
          )}
        </SheetHeader>
        
        <div className="space-y-4">
          {/* Module breakdown */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              By Module
            </h4>
            {moduleCosts
              .filter((mc) => mc.subtotal > 0)
              .map((mc) => (
                <div key={mc.moduleId} className="flex justify-between text-sm py-1">
                  <span className="text-muted-foreground">{mc.moduleName}</span>
                  <span className="font-medium">{formatCurrency(mc.subtotal)}</span>
                </div>
              ))}
          </div>

          <Separator />

          {/* Category breakdown */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              By Category
            </h4>
            {labourTotal > 0 && (
              <div className="flex justify-between text-sm py-1">
                <span className="text-muted-foreground">Labour</span>
                <span className="font-medium">{formatCurrency(labourTotal)}</span>
              </div>
            )}
            {materialsTotal > 0 && (
              <div className="flex justify-between text-sm py-1">
                <span className="text-muted-foreground">Materials</span>
                <span className="font-medium">{formatCurrency(materialsTotal)}</span>
              </div>
            )}
            {plantTotal > 0 && (
              <div className="flex justify-between text-sm py-1">
                <span className="text-muted-foreground">Plant & Equipment</span>
                <span className="font-medium">{formatCurrency(plantTotal)}</span>
              </div>
            )}
            {subcontractorTotal > 0 && (
              <div className="flex justify-between text-sm py-1">
                <span className="text-muted-foreground">Subcontractors</span>
                <span className="font-medium">{formatCurrency(subcontractorTotal)}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm font-medium py-1">
              <span>Subtotal (ex GST)</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>

            {marginPercent > 0 && (
              <div className="flex justify-between text-sm py-1">
                <span className="text-muted-foreground">
                  Margin ({marginPercent}%)
                </span>
                <span>{formatCurrency(marginAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm py-1">
              <span className="text-muted-foreground">GST (10%)</span>
              <span>{formatCurrency(gst)}</span>
            </div>

            <div className="flex justify-between text-xl font-bold pt-3 border-t">
              <span>Total (inc GST)</span>
              <span className="text-primary">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {/* Per m³ rate if volume available */}
          {ratePerM3 && (
            <div className="pt-3 border-t">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Rate per m³</span>
                <span className="font-medium">{formatCurrency(ratePerM3)}</span>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
