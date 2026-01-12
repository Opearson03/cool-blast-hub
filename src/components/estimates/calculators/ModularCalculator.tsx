import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ScopeDefinition,
  ScopeQuestion,
  EstimateModule,
  ComponentCost,
  ExclusionItem,
  PriceMap,
  MeasurementArea,
  PierConfig,
  FootingConfig,
  createPriceMap,
} from "@/lib/estimate-components/types";
import { MODULE_REGISTRY } from "@/lib/estimate-components/modules";
import { usePriceList } from "@/hooks/usePriceList";
import { ModuleSection } from "./ModuleSection";
import { ModularCostSummary } from "./ModularCostSummary";
import { ExclusionsSummary } from "./ExclusionsSummary";
import { MultiAreaInput } from "./MultiAreaInput";
import { MultiPierInput } from "./MultiPierInput";
import { MultiFootingInput } from "./MultiFootingInput";
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
    
    // Initialize arrays for multi-area, multi-pier, and multi-footing scopes
    if (scope.supportsMultipleAreas && !initialScopeAnswers.areas) {
      defaults.areas = [{ id: 'area-1', name: 'Area 1', length: 0, width: 0 }];
    }
    
    if (scope.supportsMultiplePiers && !initialScopeAnswers.piers) {
      defaults.piers = [{ id: 'pier-1', name: 'Pier Type 1', quantity: 1, diameter: 450, depth: 600 }];
    }
    
    if (scope.supportsMultipleFootings && !initialScopeAnswers.footings) {
      defaults.footings = [{ id: 'footing-1', name: 'Footing 1', length: 0, width: 450, depth: 300 }];
    }
    
    return { ...defaults, ...initialScopeAnswers };
  });

  // State for module-level answers
  const [moduleAnswers, setModuleAnswers] = useState<Record<string, Record<string, any>>>(
    initialModuleAnswers
  );

  // Track which fields have been manually overridden by user
  const [userOverrides, setUserOverrides] = useState<Record<string, Set<string>>>({});

  // Custom exclusions
  const [customExclusions, setCustomExclusions] = useState<ExclusionItem[]>(
    initialCustomExclusions
  );

  // Track open accordion sections - start closed by default
  const [openModuleId, setOpenModuleId] = useState<string | null>(null);

  // Track which modules have been manually marked as done
  const [doneModules, setDoneModules] = useState<Set<string>>(new Set());

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

  // Apply derived values and auto-fill from price list when fields become visible
  useEffect(() => {
    if (priceListLoading || !priceListItems) return;

    const newModuleAnswers = { ...moduleAnswers };
    let hasChanges = false;

    modules.forEach((module) => {
      const currentModuleAnswers = moduleAnswers[module.id] || {};
      
      module.questions.forEach((question) => {
        // Check if user has manually overridden this field
        const isOverridden = userOverrides[module.id]?.has(question.id);
        
        // Check if field is visible (using showIf)
        const isVisible = !question.showIf || question.showIf(currentModuleAnswers);
        
        if (!isOverridden && isVisible) {
          // Handle deriveFrom values
          if (question.deriveFrom) {
            const derivedValue = question.deriveFrom(scopeData, currentModuleAnswers, priceMap);
            
            // Only update if derived value is defined and different from current
            if (derivedValue !== undefined && derivedValue !== currentModuleAnswers[question.id]) {
              if (!newModuleAnswers[module.id]) {
                newModuleAnswers[module.id] = {};
              }
              newModuleAnswers[module.id] = {
                ...newModuleAnswers[module.id],
                [question.id]: derivedValue,
              };
              hasChanges = true;
            }
          }
          
          // Handle priceListKey auto-fill when field becomes visible
          if (question.priceListKey && currentModuleAnswers[question.id] === undefined) {
            const [category, itemCode] = question.priceListKey.split('.');
            const price = priceMap[category]?.[itemCode];
            // Use price from price list, or fall back to defaultValue
            const valueToUse = price !== undefined ? price : question.defaultValue;
            if (valueToUse !== undefined) {
              if (!newModuleAnswers[module.id]) {
                newModuleAnswers[module.id] = {};
              }
              newModuleAnswers[module.id] = {
                ...newModuleAnswers[module.id],
                [question.id]: valueToUse,
              };
              hasChanges = true;
            }
          }
        }
      });
    });

    if (hasChanges) {
      setModuleAnswers(newModuleAnswers);
    }
  }, [scopeData, priceMap, modules, priceListLoading, priceListItems, userOverrides, moduleAnswers]);

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

  // Handler for multi-area changes
  const handleAreasChange = (areas: MeasurementArea[]) => {
    // Calculate combined area and perimeter from areas
    const totalArea = areas.reduce((sum, area) => {
      const l = Number(area.length) || 0;
      const w = Number(area.width) || 0;
      return sum + l * w;
    }, 0);
    
    const totalPerimeter = areas.reduce((sum, area) => {
      const l = Number(area.length) || 0;
      const w = Number(area.width) || 0;
      if (l > 0 && w > 0) {
        return sum + 2 * (l + w);
      }
      return sum;
    }, 0);
    
    setScopeAnswers((prev) => ({
      ...prev,
      areas,
      area: totalArea,
      perimeter: totalPerimeter,
    }));
  };

  // Handler for multi-pier changes
  const handlePiersChange = (piers: PierConfig[]) => {
    // Calculate totals from pier configs
    const totalPiers = piers.reduce((sum, pier) => sum + (Number(pier.quantity) || 0), 0);
    
    // Calculate weighted averages for diameter and depth
    let weightedDiameter = 0;
    let weightedDepth = 0;
    if (totalPiers > 0) {
      piers.forEach(pier => {
        const qty = Number(pier.quantity) || 0;
        weightedDiameter += qty * (Number(pier.diameter) || 0);
        weightedDepth += qty * (Number(pier.depth) || 0);
      });
      weightedDiameter = weightedDiameter / totalPiers;
      weightedDepth = weightedDepth / totalPiers;
    }
    
    setScopeAnswers((prev) => ({
      ...prev,
      piers,
      num_piers: totalPiers,
      diameter: weightedDiameter,
      depth: weightedDepth,
    }));
  };

  // Handler for multi-footing changes
  const handleFootingsChange = (footings: FootingConfig[]) => {
    // Calculate totals from footing configs
    const totalLength = footings.reduce((sum, footing) => sum + (Number(footing.length) || 0), 0);
    
    // Calculate weighted averages for width and depth
    let weightedWidth = 0;
    let weightedDepth = 0;
    if (totalLength > 0) {
      footings.forEach(footing => {
        const length = Number(footing.length) || 0;
        weightedWidth += length * (Number(footing.width) || 0);
        weightedDepth += length * (Number(footing.depth) || 0);
      });
      weightedWidth = weightedWidth / totalLength;
      weightedDepth = weightedDepth / totalLength;
    }
    
    setScopeAnswers((prev) => ({
      ...prev,
      footings,
      total_length: totalLength,
      width: weightedWidth,
      depth: weightedDepth,
      footing_width: weightedWidth,
      footing_depth: weightedDepth,
    }));
  };

  const handleModuleAnswerChange = (moduleId: string, questionId: string, value: any, isUserInput = true) => {
    // When user manually changes a derived field, mark it as overridden
    const module = modules.find((m) => m.id === moduleId);
    const question = module?.questions.find((q) => q.id === questionId);
    
    if (isUserInput && question?.deriveFrom && !question.derivedReadOnly) {
      setUserOverrides((prev) => ({
        ...prev,
        [moduleId]: new Set([...(prev[moduleId] || []), questionId]),
      }));
    }
    
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

      {/* Multi-area input */}
      {scope.supportsMultipleAreas && (
        <MultiAreaInput
          label={scope.areasLabel || `${scope.name} Areas`}
          areas={scopeAnswers.areas || [{ id: 'area-1', name: 'Area 1', length: 0, width: 0 }]}
          onChange={handleAreasChange}
          thickness={scopeAnswers.thickness || scope.questions.find(q => q.id === 'thickness')?.defaultValue || 100}
          onThicknessChange={(val) => handleScopeAnswerChange('thickness', val)}
          thicknessDefault={scope.questions.find(q => q.id === 'thickness')?.defaultValue as number || 100}
          thicknessMin={scope.questions.find(q => q.id === 'thickness')?.min || 50}
          // Thickening/edge beam support (for driveway scope)
          showThickeningOption={scope.id === 'driveway'}
          hasThickening={scopeAnswers.hasThickening || false}
          onThickeningChange={(val) => handleScopeAnswerChange('hasThickening', val)}
          thickeningDepth={scopeAnswers.thickeningDepth || 300}
          onThickeningDepthChange={(val) => handleScopeAnswerChange('thickeningDepth', val)}
          thickeningWidth={scopeAnswers.thickeningWidth || 300}
          onThickeningWidthChange={(val) => handleScopeAnswerChange('thickeningWidth', val)}
        />
      )}

      {/* Multi-pier input */}
      {scope.supportsMultiplePiers && (
        <MultiPierInput
          label={scope.piersLabel || 'Pier Configurations'}
          piers={scopeAnswers.piers || [{ id: 'pier-1', name: 'Pier Type 1', quantity: 1, diameter: 450, depth: 600 }]}
          onChange={handlePiersChange}
        />
      )}

      {/* Multi-footing input */}
      {scope.supportsMultipleFootings && (
        <MultiFootingInput
          label={scope.footingsLabel || 'Footing Sections'}
          footings={scopeAnswers.footings || [{ id: 'footing-1', name: 'Footing 1', length: 0, width: 450, depth: 300 }]}
          onChange={handleFootingsChange}
          widthLabel={scope.id === 'retaining_wall_footings' ? 'Footing Width' : 'Width'}
          depthLabel={scope.id === 'retaining_wall_footings' ? 'Footing Depth' : 'Depth'}
        />
      )}

      {/* Standard scope-level questions (for scopes without multi-input) */}
      {!scope.supportsMultipleAreas && !scope.supportsMultiplePiers && !scope.supportsMultipleFootings && (
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
      )}

      {/* Show calculated volume for multi-input scopes */}
      {(scope.supportsMultipleAreas || scope.supportsMultiplePiers || scope.supportsMultipleFootings) && scopeVolume > 0 && (
        <p className="text-sm text-muted-foreground -mt-4 px-1">
          Calculated Volume: <span className="font-medium">{scopeVolume.toFixed(2)} m³</span>
        </p>
      )}

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
                onToggle={() => {
                  setOpenModuleId((prev) => (prev === module.id ? null : module.id));
                }}
                subtotal={cost?.subtotal || 0}
                lineItems={cost?.lineItems || []}
                isMarkedDone={doneModules.has(module.id)}
                onMarkDone={() => {
                  // Mark as done and close accordion
                  setDoneModules((prev) => new Set([...prev, module.id]));
                  setOpenModuleId(null);
                }}
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
