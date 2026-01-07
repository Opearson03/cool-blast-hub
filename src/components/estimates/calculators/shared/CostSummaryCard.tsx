import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "./constants";

interface CostLineItem {
  label: string;
  value: number;
  detail?: string;
}

interface CostSummaryCardProps {
  materialItems: CostLineItem[];
  materialsMarkupPercent: string;
  materialsTotal: number;
  labourItems?: CostLineItem[];
  labourMarkupPercent?: string;
  labourTotal?: number;
  grandTotal: number;
  showLabour?: boolean;
}

export function CostSummaryCard({
  materialItems,
  materialsMarkupPercent,
  materialsTotal,
  labourItems = [],
  labourMarkupPercent = "0",
  labourTotal = 0,
  grandTotal,
  showLabour = true,
}: CostSummaryCardProps) {
  return (
    <Card className="bg-muted/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Cost Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Material line items */}
        {materialItems.map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {item.label}{item.detail ? ` (${item.detail})` : ""}
            </span>
            <span>{formatCurrency(item.value)}</span>
          </div>
        ))}
        
        {/* Materials total with markup */}
        <div className="flex justify-between text-sm font-medium border-t pt-2">
          <span>Materials (inc. {materialsMarkupPercent}% markup)</span>
          <span>{formatCurrency(materialsTotal)}</span>
        </div>
        
        {/* Labour items (if shown) */}
        {showLabour && labourItems.length > 0 && labourItems.map((item, index) => (
          <div key={`labour-${index}`} className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {item.label}{item.detail ? ` (${item.detail})` : ""}
            </span>
            <span>{formatCurrency(item.value)}</span>
          </div>
        ))}
        
        {/* Labour total with markup */}
        {showLabour && (
          <div className="flex justify-between text-sm font-medium">
            <span>Labour (inc. {labourMarkupPercent}% markup)</span>
            <span>{formatCurrency(labourTotal)}</span>
          </div>
        )}
        
        {/* Grand total */}
        <div className="flex justify-between text-lg font-bold border-t pt-2">
          <span>Total</span>
          <span className="text-primary">{formatCurrency(grandTotal)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
