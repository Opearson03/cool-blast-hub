import { useState } from "react";
import { ChevronDown, Lock, Users, Package, Truck, Wrench, HelpCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ScopeEntry {
  scopeAnswers?: Record<string, any>;
  moduleAnswers?: Record<string, Record<string, any>>;
  calculatedTotal?: number;
  customExclusions?: string[];
  [key: string]: any;
}

interface ScopeData {
  [scopeId: string]: ScopeEntry | any;
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
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatScopeName = (scopeId: string): string => {
  return scopeId
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatAnswerKey = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .trim();
};

const formatAnswerValue = (key: string, value: any): string => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    // Check if it looks like a currency value
    if (key.toLowerCase().includes("price") || key.toLowerCase().includes("rate") || key.toLowerCase().includes("cost")) {
      return formatCurrency(value);
    }
    // Format with appropriate precision
    return value % 1 === 0 ? value.toString() : value.toFixed(2);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "-";
    // Handle multi-area arrays
    if (typeof value[0] === "object" && value[0] !== null) {
      return `${value.length} area(s)`;
    }
    return value.join(", ");
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

// Keys to skip showing in the breakdown
const skipKeys = new Set(["areas", "enabled", "visible"]);

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

  // Determine which scopes to display - the actual structure has scope IDs at the top level
  const availableScopes = Object.keys(scopeData).filter(key => {
    const entry = scopeData[key];
    return (
      typeof entry === "object" &&
      entry !== null &&
      (entry.scopeAnswers || entry.moduleAnswers || entry.calculatedTotal !== undefined)
    );
  });

  const scopes = selectedScopes?.filter(s => availableScopes.includes(s)) || availableScopes;

  if (scopes.length === 0) return null;

  // Calculate overall totals
  let overallSubtotal = 0;
  scopes.forEach(scopeId => {
    const entry = scopeData[scopeId] as ScopeEntry;
    overallSubtotal += entry?.calculatedTotal || 0;
  });

  // Default margin (15%) and GST (10%)
  const marginPercent = 15;
  const marginAmount = overallSubtotal * (marginPercent / 100);
  const subtotalWithMargin = overallSubtotal + marginAmount;
  const gst = subtotalWithMargin * 0.1;
  const grandTotal = subtotalWithMargin + gst;

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
        {/* Per-Scope Breakdown */}
        {scopes.map((scopeId) => {
          const scopeEntry = scopeData[scopeId] as ScopeEntry;
          if (!scopeEntry) return null;

          const scopeAnswers = scopeEntry.scopeAnswers || {};
          const moduleAnswers = scopeEntry.moduleAnswers || {};
          const scopeTotal = scopeEntry.calculatedTotal || 0;

          // Filter out empty/meta values from scope answers
          const displayableScopeAnswers = Object.entries(scopeAnswers).filter(
            ([key, value]) => !skipKeys.has(key) && value !== null && value !== undefined && value !== ""
          );

          // Get modules with answers
          const modulesWithAnswers = Object.entries(moduleAnswers).filter(([_, answers]) => {
            if (!answers || typeof answers !== "object") return false;
            return Object.keys(answers).length > 0;
          });

          return (
            <div key={scopeId} className="border rounded-lg overflow-hidden">
              {/* Scope Header */}
              <div className="bg-primary/10 px-3 py-2 flex justify-between items-center">
                <span className="text-sm font-semibold">{formatScopeName(scopeId)}</span>
                <span className="text-sm font-semibold text-primary">{formatCurrency(scopeTotal)}</span>
              </div>

              <div className="p-3 space-y-3">
                {/* Scope Measurements */}
                {displayableScopeAnswers.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Measurements</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      {displayableScopeAnswers.map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground">{formatAnswerKey(key)}</span>
                          <span className="font-medium">{formatAnswerValue(key, value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Module Inputs */}
                {modulesWithAnswers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Module Inputs</p>
                    {modulesWithAnswers.map(([moduleId, answers]) => {
                      const answerEntries = Object.entries(answers as Record<string, any>).filter(
                        ([key, value]) => !skipKeys.has(key) && value !== null && value !== undefined && value !== ""
                      );

                      if (answerEntries.length === 0) return null;

                      return (
                        <div key={moduleId} className="bg-muted/30 rounded p-2 space-y-1">
                          <p className="text-xs font-medium">{formatModuleName(moduleId)}</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                            {answerEntries.map(([key, value]) => (
                              <div key={key} className="flex justify-between text-muted-foreground">
                                <span>{formatAnswerKey(key)}</span>
                                <span className="font-medium text-foreground">{formatAnswerValue(key, value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <Separator />

        {/* Financial Summary */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase">Financial Summary</p>
          <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal (ex GST)</span>
              <span>{formatCurrency(overallSubtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Margin ({marginPercent}%)</span>
              <span>{formatCurrency(marginAmount)}</span>
            </div>
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
