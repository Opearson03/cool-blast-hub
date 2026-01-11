import { useState } from "react";
import { ChevronDown, Lock, Users, Package, Truck, Wrench, HelpCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ScopeAnswers {
  area?: number;
  totalVolume?: number;
  thickness?: number;
  perimeter?: number;
  concreteType?: string;
  [key: string]: any;
}

interface LineItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  category: string;
}

interface ModuleCost {
  moduleId: string;
  moduleName: string;
  lineItems: LineItem[];
  subtotal: number;
}

interface ScopeData {
  scopeAnswers?: Record<string, ScopeAnswers>;
  moduleAnswers?: Record<string, Record<string, any>>;
  moduleCosts?: Record<string, ModuleCost[]>;
  calculatedTotal?: {
    subtotal?: number;
    marginPercent?: number;
    marginAmount?: number;
    subtotalWithMargin?: number;
    gst?: number;
    grandTotal?: number;
  };
  [key: string]: any;
}

interface InternalBreakdownSectionProps {
  scopeData: ScopeData;
  selectedScopes?: string[] | null;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
  }).format(value);
};

const formatModuleName = (moduleId: string): string => {
  return moduleId
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatScopeName = (scopeId: string): string => {
  return scopeId
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

const categoryConfig: Record<string, { label: string; icon: typeof Users; className: string }> = {
  labour: { label: "Labour", icon: Users, className: "bg-green-500/20 text-green-700 dark:text-green-400" },
  materials: { label: "Materials", icon: Package, className: "bg-blue-500/20 text-blue-700 dark:text-blue-400" },
  plant: { label: "Plant & Equipment", icon: Truck, className: "bg-orange-500/20 text-orange-700 dark:text-orange-400" },
  subcontractor: { label: "Subcontractors", icon: Wrench, className: "bg-purple-500/20 text-purple-700 dark:text-purple-400" },
  other: { label: "Other", icon: HelpCircle, className: "bg-gray-500/20 text-gray-700 dark:text-gray-400" },
};

export function InternalBreakdownSection({ scopeData, selectedScopes }: InternalBreakdownSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!scopeData) return null;

  const { scopeAnswers, moduleCosts, calculatedTotal } = scopeData;
  const scopes = selectedScopes || Object.keys(scopeAnswers || {});

  // Aggregate all module costs across scopes
  const allModuleCosts: ModuleCost[] = [];
  const categoryTotals: Record<string, number> = {
    labour: 0,
    materials: 0,
    plant: 0,
    subcontractor: 0,
    other: 0,
  };

  // Process each scope
  scopes.forEach((scopeId) => {
    const scopeCosts = moduleCosts?.[scopeId] || [];
    scopeCosts.forEach((moduleCost) => {
      if (moduleCost.subtotal > 0) {
        allModuleCosts.push({ ...moduleCost, moduleName: `${formatScopeName(scopeId)} - ${moduleCost.moduleName}` });
        
        // Aggregate by category
        moduleCost.lineItems.forEach((item) => {
          const cat = item.category || "other";
          categoryTotals[cat] = (categoryTotals[cat] || 0) + item.total;
        });
      }
    });
  });

  // Get project summary from first scope's answers
  const firstScopeId = scopes[0];
  const firstScopeAnswers = scopeAnswers?.[firstScopeId] || {};

  // Calculate totals
  const subtotal = calculatedTotal?.subtotal || allModuleCosts.reduce((acc, m) => acc + m.subtotal, 0);
  const marginPercent = calculatedTotal?.marginPercent || 0;
  const marginAmount = calculatedTotal?.marginAmount || (subtotal * marginPercent) / 100;
  const subtotalWithMargin = calculatedTotal?.subtotalWithMargin || subtotal + marginAmount;
  const gst = calculatedTotal?.gst || subtotalWithMargin * 0.1;
  const grandTotal = calculatedTotal?.grandTotal || subtotalWithMargin + gst;

  // Check if there's any data to show
  if (allModuleCosts.length === 0 && !calculatedTotal) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full py-2 text-left group">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">
              Internal Breakdown
            </h3>
            <Badge variant="outline" className="text-xs gap-1 font-normal">
              <Lock className="w-3 h-3" />
              Internal Only
            </Badge>
          </div>
          <ChevronDown 
            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-4 pt-2">
        {/* Project Summary */}
        {(firstScopeAnswers.area || firstScopeAnswers.totalVolume || firstScopeAnswers.thickness) && (
          <div className="bg-muted/30 rounded-lg p-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Project Summary</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {firstScopeAnswers.area && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Area</span>
                  <span className="font-medium">{firstScopeAnswers.area} m²</span>
                </div>
              )}
              {firstScopeAnswers.totalVolume && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Volume</span>
                  <span className="font-medium">{firstScopeAnswers.totalVolume.toFixed(2)} m³</span>
                </div>
              )}
              {firstScopeAnswers.thickness && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Thickness</span>
                  <span className="font-medium">{firstScopeAnswers.thickness} mm</span>
                </div>
              )}
              {firstScopeAnswers.perimeter && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Perimeter</span>
                  <span className="font-medium">{firstScopeAnswers.perimeter} m</span>
                </div>
              )}
              {firstScopeAnswers.concreteType && (
                <div className="flex justify-between col-span-2">
                  <span className="text-muted-foreground">Concrete</span>
                  <span className="font-medium">{firstScopeAnswers.concreteType}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Module Breakdown */}
        {allModuleCosts.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase">Module Breakdown</p>
            {allModuleCosts.map((moduleCost, idx) => (
              <div key={idx} className="border rounded-lg overflow-hidden">
                <div className="bg-muted/30 px-3 py-2 flex justify-between items-center">
                  <span className="text-sm font-medium">{moduleCost.moduleName}</span>
                  <span className="text-sm font-semibold">{formatCurrency(moduleCost.subtotal)}</span>
                </div>
                {moduleCost.lineItems.length > 0 && (
                  <div className="px-3 py-2 space-y-1 text-xs">
                    {moduleCost.lineItems.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex justify-between text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                          {item.description}
                          {item.quantity > 1 && (
                            <span className="text-muted-foreground/60">
                              ({item.quantity} {item.unit} × {formatCurrency(item.unitPrice)})
                            </span>
                          )}
                        </span>
                        <span>{formatCurrency(item.total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Category Totals */}
        {Object.values(categoryTotals).some(v => v > 0) && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase">By Category</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(categoryTotals)
                .filter(([_, value]) => value > 0)
                .map(([category, value]) => {
                  const config = categoryConfig[category] || categoryConfig.other;
                  const Icon = config.icon;
                  return (
                    <Badge key={category} variant="secondary" className={`${config.className} gap-1`}>
                      <Icon className="w-3 h-3" />
                      {config.label}: {formatCurrency(value)}
                    </Badge>
                  );
                })}
            </div>
          </div>
        )}

        <Separator />

        {/* Financial Breakdown */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase">Financial Summary</p>
          <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal (ex GST)</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {marginPercent > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Margin ({marginPercent}%)</span>
                <span>{formatCurrency(marginAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal + Margin</span>
              <span>{formatCurrency(subtotalWithMargin)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST (10%)</span>
              <span>{formatCurrency(gst)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total (inc GST)</span>
              <span className="text-primary">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
