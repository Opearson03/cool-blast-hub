import { ComponentCost } from "@/lib/estimate-components/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/format-currency";

interface ModularCostSummaryProps {
  moduleCosts: ComponentCost[];
  marginPercent: number;
  scopeVolume?: number;
  scopeArea?: number;
}

export function ModularCostSummary({
  moduleCosts,
  marginPercent,
  scopeVolume,
  scopeArea,
}: ModularCostSummaryProps) {
  // Calculate totals
  const subtotal = moduleCosts.reduce((sum, mc) => sum + mc.subtotal, 0);
  const marginAmount = subtotal * (marginPercent / 100);
  const subtotalWithMargin = subtotal + marginAmount;
  const gst = subtotalWithMargin * 0.1;
  const grandTotal = subtotalWithMargin + gst;

  return (
    <Card className="bg-muted/30 sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Cost Summary</CardTitle>
        {scopeVolume !== undefined && scopeVolume > 0 && (
          <p className="text-sm text-muted-foreground">
            Concrete Volume: {scopeVolume.toFixed(2)} m³
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Module breakdown */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            By Module
          </h4>
          {moduleCosts
            .filter((mc) => mc.subtotal > 0)
            .map((mc) => (
              <div key={mc.moduleId} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{mc.moduleName}</span>
                <span>{formatCurrency(mc.subtotal)}</span>
              </div>
            ))}
        </div>

        <Separator />

        {/* Totals */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span>Subtotal (ex GST)</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>

          {marginPercent > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Margin ({marginPercent}%)
              </span>
              <span>{formatCurrency(marginAmount)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">GST (10%)</span>
            <span>{formatCurrency(gst)}</span>
          </div>

          <div className="flex justify-between text-lg font-bold pt-2 border-t">
            <span>Total (inc GST)</span>
            <span className="text-primary">{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        {/* Per m² rate if area available - industry standard for contractors */}
        {scopeArea !== undefined && scopeArea > 0 && grandTotal > 0 && (
          <div className="pt-2 border-t">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Rate per m²</span>
              <span>{formatCurrency(grandTotal / scopeArea)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
