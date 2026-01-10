import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ScopeDefinition,
  ScopeQuestion,
  EstimateModule,
  ComponentCost,
  ExclusionItem,
  PriceMap,
  createPriceMap,
} from "@/lib/estimate-components/types";
import { MODULE_REGISTRY } from "@/lib/estimate-components/modules";
import { usePriceList } from "@/hooks/usePriceList";
import { ModuleSection } from "./ModuleSection";
import { ModularCostSummary } from "./ModularCostSummary";
import { ExclusionsSummary } from "./ExclusionsSummary";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface ModularCalculatorProps {
  scope: ScopeDefinition;
  initialScopeAnswers?: Record<string, any>;
  initialModuleAnswers?: Record<string, Record<string, any>>;
  initialCustomExclusions?: ExclusionItem[];
  onStateChange?: (state: {
    scopeAnswers: Record<string, any>;
    moduleAnswers: Record<string, Record<string, any>>;
    calculatedCosts: ComponentCost[];
    exclusions: ExclusionItem[];
    customExclusions: ExclusionItem[];
    marginPercent: number;
    subtotal: number;
    marginAmount: number;
    gst: number;
    total: number;
  }) => void;
}

export function ModularCalculator({
  scope,
  initialScopeAnswers = {},
  initialModuleAnswers = {},
  initialCustomExclusions = [],
  onStateChange,
}: ModularCalculatorProps) {
  const { priceListItems, isLoading: priceListLoading } = usePriceList();

  // State for scope-level answers (dimensions, quantities)
  const [scopeAnswers, setScopeAnswers] = useState<Record<string, any>>(() => {
    // Initialize with defaults
    const defaults: Record<string, any> = {};
    scope.questions.forEach((q) => {
      if (q.defaultValue !== undefined) {
        defaults[q.id] = q.defaultValue;
      }
    });
    return { ...defaults, ...initialScopeAnswers };
  });

  // State for module-level answers
  const [moduleAnswers, setModuleAnswers] = useState<Record<string, Record<string, any>>>(
    initialModuleAnswers
  );

  // Custom exclusions
  const [customExclusions, setCustomExclusions] = useState<ExclusionItem[]>(
    initialCustomExclusions
  );

  // Track open accordion sections
  const [openModuleId, setOpenModuleId] = useState<string | null>(
    scope.moduleIds[0] || null
  );

  // Build price map from price list
  const priceMap = useMemo<PriceMap>(() => {
    if (!priceListItems) return {};
    return createPriceMap(priceListItems);
  }, [priceListItems]);

  // Get modules for this scope
  const modules = useMemo(() => {
    return scope.moduleIds
      .map((id) => MODULE_REGISTRY[id])
      .filter((m): m is EstimateModule => m !== undefined);
  }, [scope.moduleIds]);

  // Initialize module answers with defaults when price list loads
  useEffect(() => {
    if (!priceListLoading && priceListItems && Object.keys(moduleAnswers).length === 0) {
      const initialAnswers: Record<string, Record<string, any>> = {};

      modules.forEach((module) => {
        initialAnswers[module.id] = {};
        module.questions.forEach((q) => {
          if (q.defaultValue !== undefined) {
            initialAnswers[module.id][q.id] = q.defaultValue;
          }
          // Auto-fill from price list if linked
          if (q.priceListKey) {
            const [category, itemCode] = q.priceListKey.split('.');
            const price = priceMap[category]?.[itemCode];
            if (price !== undefined) {
              initialAnswers[module.id][q.id] = price;
            }
          }
        });
      });

      setModuleAnswers(initialAnswers);
    }
  }, [priceListLoading, priceListItems, modules, priceMap, moduleAnswers]);

  // Calculate volume from scope answers
  const scopeVolume = useMemo(() => {
    if (scope.calculateVolume) {
      return scope.calculateVolume(scopeAnswers);
    }
    return 0;
  }, [scope, scopeAnswers]);

  // Build scope data for calculations
  const scopeData = useMemo(() => {
    return {
      ...scopeAnswers,
      volume: scopeVolume,
    };
  }, [scopeAnswers, scopeVolume]);

  // Calculate costs for each module
  const moduleCosts = useMemo<ComponentCost[]>(() => {
    return modules.map((module) => {
      const answers = moduleAnswers[module.id] || {};
      return module.calculate(answers, priceMap, scopeData);
    });
  }, [modules, moduleAnswers, priceMap, scopeData]);

  // Gather all auto-generated exclusions
  const autoExclusions = useMemo<ExclusionItem[]>(() => {
    const exclusions: ExclusionItem[] = [];

    // Add default scope exclusions
    if (scope.defaultExclusions) {
      exclusions.push(...scope.defaultExclusions);
    }

    // Add module-generated exclusions
    modules.forEach((module) => {
      const answers = moduleAnswers[module.id] || {};
      exclusions.push(...module.getExclusions(answers));
    });

    return exclusions;
  }, [scope, modules, moduleAnswers]);

  // Get margin from margin module
  const marginPercent = useMemo(() => {
    const marginAnswers = moduleAnswers['margin'] || {};
    return Number(marginAnswers.margin_percent) || 0;
  }, [moduleAnswers]);

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = moduleCosts.reduce((sum, mc) => sum + mc.subtotal, 0);
    const marginAmount = subtotal * (marginPercent / 100);
    const subtotalWithMargin = subtotal + marginAmount;
    const gst = subtotalWithMargin * 0.1;
    const total = subtotalWithMargin + gst;

    return { subtotal, marginAmount, gst, total };
  }, [moduleCosts, marginPercent]);

  // Notify parent of state changes
  const notifyStateChange = useCallback(() => {
    if (onStateChange) {
      onStateChange({
        scopeAnswers,
        moduleAnswers,
        calculatedCosts: moduleCosts,
        exclusions: autoExclusions,
        customExclusions,
        marginPercent,
        subtotal: totals.subtotal,
        marginAmount: totals.marginAmount,
        gst: totals.gst,
        total: totals.total,
      });
    }
  }, [
    onStateChange,
    scopeAnswers,
    moduleAnswers,
    moduleCosts,
    autoExclusions,
    customExclusions,
    marginPercent,
    totals,
  ]);

  // Notify on changes
  useEffect(() => {
    notifyStateChange();
  }, [notifyStateChange]);

  // Handlers
  const handleScopeAnswerChange = (questionId: string, value: any) => {
    setScopeAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleModuleAnswerChange = (moduleId: string, questionId: string, value: any) => {
    setModuleAnswers((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [questionId]: value,
      },
    }));
  };

  const handleAddCustomExclusion = (text: string) => {
    setCustomExclusions((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        text,
        moduleId: 'custom',
      },
    ]);
  };

  const handleRemoveCustomExclusion = (id: string) => {
    setCustomExclusions((prev) => prev.filter((e) => e.id !== id));
  };

  if (priceListLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Internal cost notice */}
      <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          These calculations are for internal costing only. The client quote will show summarized line items without detailed breakdowns.
        </AlertDescription>
      </Alert>

      {/* Scope-level questions (dimensions) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{scope.name} Dimensions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {scope.questions.map((question) => (
              <ScopeQuestionInput
                key={question.id}
                question={question}
                value={scopeAnswers[question.id]}
                onChange={(val) => handleScopeAnswerChange(question.id, val)}
              />
            ))}
          </div>
          {scopeVolume > 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              Calculated Volume: <span className="font-medium">{scopeVolume.toFixed(2)} m³</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module sections */}
        <div className="lg:col-span-2 space-y-4">
          {modules.map((module) => {
            const cost = moduleCosts.find((c) => c.moduleId === module.id);
            return (
              <ModuleSection
                key={module.id}
                module={module}
                answers={moduleAnswers[module.id] || {}}
                onAnswerChange={(qId, val) => handleModuleAnswerChange(module.id, qId, val)}
                isOpen={openModuleId === module.id}
                onToggle={() =>
                  setOpenModuleId((prev) => (prev === module.id ? null : module.id))
                }
                subtotal={cost?.subtotal || 0}
                lineItems={cost?.lineItems || []}
              />
            );
          })}

          {/* Exclusions section */}
          <ExclusionsSummary
            autoExclusions={autoExclusions}
            customExclusions={customExclusions}
            onAddCustom={handleAddCustomExclusion}
            onRemoveCustom={handleRemoveCustomExclusion}
          />
        </div>

        {/* Cost summary sidebar */}
        <div className="lg:col-span-1">
          <ModularCostSummary
            moduleCosts={moduleCosts}
            marginPercent={marginPercent}
            scopeVolume={scopeVolume}
          />
        </div>
      </div>
    </div>
  );
}

// Helper component for scope-level question inputs
function ScopeQuestionInput({
  question,
  value,
  onChange,
}: {
  question: ScopeQuestion;
  value: any;
  onChange: (value: any) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={question.id} className="text-sm font-medium">
        {question.label}
        {question.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="relative">
        <Input
          id={question.id}
          type="number"
          value={value ?? ''}
          onChange={(e) =>
            onChange(e.target.value === '' ? undefined : Number(e.target.value))
          }
          min={question.min}
          max={question.max}
          step={question.step ?? 1}
          placeholder={question.placeholder}
          className={question.unit ? 'pr-12' : ''}
        />
        {question.unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {question.unit}
          </span>
        )}
      </div>
    </div>
  );
}
