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
  BeamConfig,
  DemolitionArea,
  LinearSection,
  CostLineItem,
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
import { MultiLinearInput } from "./MultiLinearInput";
import { MultiBeamInput } from "./MultiBeamInput";
import { MultiDemolitionInput } from "./MultiDemolitionInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Info, Ruler } from "lucide-react";

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
  onModuleDone?: () => void;
  // Markup prompt support
  onRequestMarkup?: () => void;
  hasPlans?: boolean;
  skipMarkupPrompt?: boolean;
  onSkipMarkupPromptChange?: (skip: boolean) => void;
}

export function ModularCalculator({
  scope,
  initialScopeAnswers = {},
  initialModuleAnswers = {},
  initialCustomExclusions = [],
  onStateChange,
  onModuleDone,
  onRequestMarkup,
  hasPlans = false,
  skipMarkupPrompt = false,
  onSkipMarkupPromptChange,
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
    
    // Initialize arrays for multi-area, multi-pier, multi-footing, and multi-beam scopes
    if (scope.supportsMultipleAreas && !initialScopeAnswers.areas) {
      defaults.areas = [{ id: 'area-1', name: 'Area 1', length: 0, width: 0 }];
    }
    
    if (scope.supportsMultiplePiers && !initialScopeAnswers.piers) {
      defaults.piers = [{ id: 'pier-1', name: 'Pier Type 1', quantity: 1, diameter: 450, depth: 600 }];
    }
    
    if (scope.supportsMultipleFootings && !initialScopeAnswers.footings) {
      defaults.footings = [{ id: 'footing-1', name: 'Footing 1', length: 0, width: 450, depth: 300 }];
    }
    
    if (scope.supportsLinearSections && !initialScopeAnswers.linearSections) {
      defaults.linearSections = [{ id: 'section-1', name: 'Section 1', length: 0, dimension1: 450, dimension2: 300 }];
    }
    
    if (scope.supportsMultipleBeams && !initialScopeAnswers.beams) {
      defaults.beams = [{ id: 'beam-1', name: 'Internal Beam 1', length: 0, width: 300, depth: 400 }];
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

  // Build derived scope answers used for calculations (area/perimeter can come from takeoff)
  const derivedScopeAnswers = useMemo(() => {
    let totalArea = scopeAnswers.area || 0;
    let totalPerimeter = scopeAnswers.perimeter || 0;

    if (scopeAnswers.areas && Array.isArray(scopeAnswers.areas)) {
      totalArea = scopeAnswers.areas.reduce((sum: number, a: any) => {
        const areaValue = a._actualArea && a._actualArea > 0
          ? a._actualArea
          : (Number(a.length) || 0) * (Number(a.width) || 0);
        return sum + areaValue;
      }, 0);

      totalPerimeter = scopeAnswers.areas.reduce((sum: number, a: any) => {
        if (a._actualPerimeter && a._actualPerimeter > 0) {
          return sum + a._actualPerimeter;
        }
        const l = Number(a.length) || 0;
        const w = Number(a.width) || 0;
        if (l > 0 && w > 0) {
          return sum + 2 * (l + w);
        }
        return sum;
      }, 0);
    } else if (scopeAnswers.length && scopeAnswers.width) {
      totalArea = Number(scopeAnswers.length) * Number(scopeAnswers.width);
      totalPerimeter = 2 * (Number(scopeAnswers.length) + Number(scopeAnswers.width));
    }

    // Calculate excavation-specific values based on scope type
    let excavationVolume = 0;
    let averageExcavationDepth = 0;
    let excavationArea = totalArea; // Default to total area for slab scopes

    // Piers: cylindrical excavation
    if (scopeAnswers.piers && Array.isArray(scopeAnswers.piers) && scopeAnswers.piers.length > 0) {
      const totalPiers = scopeAnswers.piers.reduce((s: number, p: any) => s + (Number(p.quantity) || 0), 0);
      
      excavationVolume = scopeAnswers.piers.reduce((sum: number, pier: any) => {
        const qty = Number(pier.quantity) || 0;
        const radiusM = (Number(pier.diameter) || 0) / 2000; // mm to m
        const depthM = (Number(pier.depth) || 0) / 1000; // mm to m
        return sum + qty * Math.PI * radiusM * radiusM * depthM;
      }, 0);

      // Calculate excavation "area" as sum of pier cross-sections (for hours estimation)
      excavationArea = scopeAnswers.piers.reduce((sum: number, pier: any) => {
        const qty = Number(pier.quantity) || 0;
        const radiusM = (Number(pier.diameter) || 0) / 2000;
        return sum + qty * Math.PI * radiusM * radiusM;
      }, 0);

      // Weighted average depth
      if (totalPiers > 0) {
        averageExcavationDepth = scopeAnswers.piers.reduce((s: number, p: any) =>
          s + (Number(p.depth) || 0) * (Number(p.quantity) || 0), 0) / totalPiers;
      }
    }
    // Strip/Linear Footings: rectangular excavation
    else if (scopeAnswers.footings && Array.isArray(scopeAnswers.footings) && scopeAnswers.footings.length > 0) {
      const totalLength = scopeAnswers.footings.reduce((s: number, f: any) => {
        const length = f._actualLength && f._actualLength > 0 ? f._actualLength : (Number(f.length) || 0);
        return s + length;
      }, 0);

      excavationVolume = scopeAnswers.footings.reduce((sum: number, f: any) => {
        const length = f._actualLength && f._actualLength > 0 ? f._actualLength : (Number(f.length) || 0);
        const widthM = (Number(f.width) || 0) / 1000; // mm to m
        const depthM = (Number(f.depth) || 0) / 1000; // mm to m
        return sum + length * widthM * depthM;
      }, 0);

      // Excavation area as total trench area
      excavationArea = scopeAnswers.footings.reduce((sum: number, f: any) => {
        const length = f._actualLength && f._actualLength > 0 ? f._actualLength : (Number(f.length) || 0);
        const widthM = (Number(f.width) || 0) / 1000;
        return sum + length * widthM;
      }, 0);

      // Weighted average depth by length
      if (totalLength > 0) {
        averageExcavationDepth = scopeAnswers.footings.reduce((s: number, f: any) => {
          const length = f._actualLength && f._actualLength > 0 ? f._actualLength : (Number(f.length) || 0);
          return s + (Number(f.depth) || 0) * length;
        }, 0) / totalLength;
      }
    }
    // Pad Footings: rectangular excavation (pads array)
    else if (scopeAnswers.pads && Array.isArray(scopeAnswers.pads) && scopeAnswers.pads.length > 0) {
      const totalPads = scopeAnswers.pads.reduce((s: number, p: any) => s + (Number(p.quantity) || 1), 0);

      excavationVolume = scopeAnswers.pads.reduce((sum: number, pad: any) => {
        const qty = Number(pad.quantity) || 1;
        const lengthM = (Number(pad.length) || 0) / 1000; // mm to m
        const widthM = (Number(pad.width) || 0) / 1000; // mm to m
        const depthM = (Number(pad.depth) || 0) / 1000; // mm to m
        return sum + qty * lengthM * widthM * depthM;
      }, 0);

      excavationArea = scopeAnswers.pads.reduce((sum: number, pad: any) => {
        const qty = Number(pad.quantity) || 1;
        const lengthM = (Number(pad.length) || 0) / 1000;
        const widthM = (Number(pad.width) || 0) / 1000;
        return sum + qty * lengthM * widthM;
      }, 0);

      if (totalPads > 0) {
        averageExcavationDepth = scopeAnswers.pads.reduce((s: number, p: any) =>
          s + (Number(p.depth) || 0) * (Number(p.quantity) || 1), 0) / totalPads;
      }
    }
    // Bollards: cylindrical footing excavation
    else if (scopeAnswers.num_bollards && scopeAnswers.embedment_depth) {
      const qty = Number(scopeAnswers.num_bollards) || 0;
      const footingRadiusM = (Number(scopeAnswers.footing_diameter) || 400) / 2000; // mm to m
      const depthM = (Number(scopeAnswers.embedment_depth) || 0) / 1000; // mm to m
      excavationVolume = qty * Math.PI * footingRadiusM * footingRadiusM * depthM;
      excavationArea = qty * Math.PI * footingRadiusM * footingRadiusM;
      averageExcavationDepth = Number(scopeAnswers.embedment_depth) || 0;
    }
    // Pit Bases: rectangular + walls excavation
    else if (scopeAnswers.pit_length && scopeAnswers.pit_width && scopeAnswers.base_thickness) {
      const lengthM = (Number(scopeAnswers.pit_length) || 0) / 1000;
      const widthM = (Number(scopeAnswers.pit_width) || 0) / 1000;
      const baseDepthM = (Number(scopeAnswers.base_thickness) || 0) / 1000;
      const wallHeightM = (Number(scopeAnswers.wall_height) || 0) / 1000;
      const totalDepthM = baseDepthM + wallHeightM;
      
      excavationVolume = lengthM * widthM * totalDepthM;
      excavationArea = lengthM * widthM;
      averageExcavationDepth = (Number(scopeAnswers.base_thickness) || 0) + (Number(scopeAnswers.wall_height) || 0);
    }
    // Retaining Walls: footing excavation
    else if (scopeAnswers.wall_length && scopeAnswers.footing_width && scopeAnswers.footing_depth) {
      const lengthM = Number(scopeAnswers.wall_length) || 0;
      const widthM = (Number(scopeAnswers.footing_width) || 0) / 1000;
      const depthM = (Number(scopeAnswers.footing_depth) || 0) / 1000;
      
      excavationVolume = lengthM * widthM * depthM;
      excavationArea = lengthM * widthM;
      averageExcavationDepth = Number(scopeAnswers.footing_depth) || 0;
    }

    return {
      ...scopeAnswers,
      area: totalArea,
      perimeter: totalPerimeter,
      excavation_volume: excavationVolume,
      excavation_area: excavationArea,
      averageExcavationDepth: averageExcavationDepth,
    };
  }, [scopeAnswers]);

  // Calculate volume from derived scope answers (so takeoff area/perimeter flows through)
  const scopeVolume = useMemo(() => {
    if (scope.calculateVolume) {
      return scope.calculateVolume(derivedScopeAnswers);
    }
    return 0;
  }, [scope, derivedScopeAnswers]);

  // Build scope data for module calculations
  const scopeData = useMemo(() => {
    return {
      ...derivedScopeAnswers,
      volume: scopeVolume,
    };
  }, [derivedScopeAnswers, scopeVolume]);

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
        const isVisible = !question.showIf || question.showIf(currentModuleAnswers, scopeData);
        
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
      exclusions.push(...module.getExclusions(answers, scopeData));
    });

    return exclusions;
  }, [scope, modules, moduleAnswers]);

  // Margin is now handled globally at the estimate level
  // Module calculators report subtotals only (no margin applied)
  const marginPercent = 0;

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
      if (area._actualArea && area._actualArea > 0) {
        return sum + area._actualArea;
      }
      const l = Number(area.length) || 0;
      const w = Number(area.width) || 0;
      return sum + l * w;
    }, 0);

    const totalPerimeter = areas.reduce((sum, area) => {
      if (area._actualPerimeter && area._actualPerimeter > 0) {
        return sum + area._actualPerimeter;
      }
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

  // Handler for multi-beam changes
  const handleBeamsChange = (beams: BeamConfig[]) => {
    // Calculate totals from beam configs
    const totalLength = beams.reduce((sum, beam) => sum + (Number(beam.length) || 0), 0);
    
    // Calculate weighted averages for width and depth
    let weightedWidth = 0;
    let weightedDepth = 0;
    if (totalLength > 0) {
      beams.forEach(beam => {
        const length = Number(beam.length) || 0;
        weightedWidth += length * (Number(beam.width) || 0);
        weightedDepth += length * (Number(beam.depth) || 0);
      });
      weightedWidth = weightedWidth / totalLength;
      weightedDepth = weightedDepth / totalLength;
    }
    
    setScopeAnswers((prev) => ({
      ...prev,
      beams,
      internal_beams_length: totalLength,
      internal_beam_width: weightedWidth,
      internal_beam_depth: weightedDepth,
    }));
  };

  // Handler for linear section changes
  const handleLinearSectionsChange = (sections: LinearSection[]) => {
    // Calculate totals from section configs
    const totalLength = sections.reduce((sum, section) => {
      const length = section._actualLength && section._actualLength > 0 
        ? section._actualLength 
        : (Number(section.length) || 0);
      return sum + length;
    }, 0);
    
    // Calculate weighted averages for dimensions
    let weightedDim1 = 0;
    let weightedDim2 = 0;
    if (totalLength > 0) {
      sections.forEach(section => {
        const length = section._actualLength && section._actualLength > 0 
          ? section._actualLength 
          : (Number(section.length) || 0);
        weightedDim1 += length * (Number(section.dimension1) || 0);
        weightedDim2 += length * (Number(section.dimension2) || 0);
      });
      weightedDim1 = weightedDim1 / totalLength;
      weightedDim2 = weightedDim2 / totalLength;
    }
    
    // Calculate surface area (length × dimension2 for walls/kerbs)
    const totalSurfaceArea = sections.reduce((sum, section) => {
      const length = section._actualLength && section._actualLength > 0 
        ? section._actualLength 
        : (Number(section.length) || 0);
      const dim2M = (Number(section.dimension2) || 0) / 1000;
      return sum + length * dim2M;
    }, 0);
    
    setScopeAnswers((prev) => ({
      ...prev,
      linearSections: sections,
      // Map to legacy footing fields for backwards compatibility with scope calculations
      footings: sections.map(s => ({
        id: s.id,
        name: s.name,
        length: s._actualLength && s._actualLength > 0 ? s._actualLength : s.length,
        width: s.dimension1,
        depth: s.dimension2,
        _fromTakeoff: s._fromTakeoff,
        _actualLength: s._actualLength,
      })),
      total_length: totalLength,
      width: weightedDim1,
      depth: weightedDim2,
      wall_thickness: weightedDim1,
      wall_height: weightedDim2,
      total_surface_area: totalSurfaceArea,
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
          // Markup prompt support
          onRequestMarkup={onRequestMarkup}
          hasPlans={hasPlans}
          skipMarkupPrompt={skipMarkupPrompt}
          onSkipMarkupPromptChange={onSkipMarkupPromptChange}
        />
      )}

      {/* Multi-pier input */}
      {scope.supportsMultiplePiers && (
        <MultiPierInput
          label={scope.piersLabel || 'Pier Configurations'}
          piers={scopeAnswers.piers || [{ id: 'pier-1', name: 'Pier Type 1', quantity: 1, diameter: 450, depth: 600 }]}
          onChange={handlePiersChange}
          // Markup prompt support
          onRequestMarkup={onRequestMarkup}
          hasPlans={hasPlans}
          skipMarkupPrompt={skipMarkupPrompt}
          onSkipMarkupPromptChange={onSkipMarkupPromptChange}
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
          // Markup prompt support
          onRequestMarkup={onRequestMarkup}
          hasPlans={hasPlans}
          skipMarkupPrompt={skipMarkupPrompt}
          onSkipMarkupPromptChange={onSkipMarkupPromptChange}
        />
      )}

      {/* Multi-linear input for linear scopes (walls, kerbs, strip footings) */}
      {scope.supportsLinearSections && (
        <MultiLinearInput
          scopeId={scope.id}
          label={scope.linearSectionsLabel}
          sections={scopeAnswers.linearSections || [{ id: 'section-1', name: 'Section 1', length: 0, dimension1: 450, dimension2: 300 }]}
          onChange={handleLinearSectionsChange}
          // Markup prompt support
          onRequestMarkup={onRequestMarkup}
          hasPlans={hasPlans}
          skipMarkupPrompt={skipMarkupPrompt}
          onSkipMarkupPromptChange={onSkipMarkupPromptChange}
        />
      )}

      {/* From Plan indicator for takeoff-derived measurements */}
      {scopeAnswers._fromTakeoff && (
        <Badge variant="secondary" className="gap-1.5 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800">
          <Ruler className="h-3.5 w-3.5" />
          Measurements from plan takeoff
        </Badge>
      )}

      {/* Standard scope-level questions - rendered BEFORE multi-beam input */}
      {(() => {
        // Filter out questions that are replaced by multi-input components or explicitly hidden
        const visibleQuestions = scope.questions.filter((q) => {
          // Hide if explicitly listed in hideStandardQuestions
          if (scope.hideStandardQuestions?.includes(q.id)) return false;
          // Hide area/perimeter for multi-area scopes
          if (scope.supportsMultipleAreas && ['area', 'perimeter'].includes(q.id)) return false;
          // Hide thickness/thickening fields for multi-area scopes (already in MultiAreaInput)
          if (scope.supportsMultipleAreas && ['thickness', 'hasThickening', 'thickeningDepth', 'thickeningWidth'].includes(q.id)) return false;
          // Hide pier fields for multi-pier scopes
          if (scope.supportsMultiplePiers && ['num_piers', 'diameter', 'depth'].includes(q.id)) return false;
          // Hide footing fields for multi-footing scopes
          if (scope.supportsMultipleFootings && ['total_length', 'width', 'depth', 'footing_width', 'footing_depth'].includes(q.id)) return false;
          // Hide linear section fields for linear scopes
          if (scope.supportsLinearSections && ['total_length', 'width', 'depth', 'wall_thickness', 'wall_height'].includes(q.id)) return false;
          return true;
        });

        // Only show if there are visible questions
        if (visibleQuestions.length === 0) return null;

        return (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{scope.name} Dimensions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleQuestions.map((question) => (
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
        );
      })()}

      {/* Multi-beam input for raft slabs - optional with toggle */}
      {scope.supportsMultipleBeams && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{scope.beamsLabel || 'Internal Stiffening Beams'}</CardTitle>
              <div className="flex items-center gap-2">
                <Label htmlFor="has-internal-beams" className="text-sm font-normal text-muted-foreground">
                  Include internal beams?
                </Label>
                <Switch
                  id="has-internal-beams"
                  checked={scopeAnswers.hasInternalBeams ?? false}
                  onCheckedChange={(checked) => handleScopeAnswerChange('hasInternalBeams', checked)}
                />
              </div>
            </div>
          </CardHeader>
          {scopeAnswers.hasInternalBeams && (
            <CardContent className="pt-0">
              <MultiBeamInput
                label=""
                beams={scopeAnswers.beams || [{ id: 'beam-1', name: 'Internal Beam 1', length: 0, width: 300, depth: 400 }]}
                onChange={handleBeamsChange}
              />
            </CardContent>
          )}
        </Card>
      )}

      {/* Show calculated volume when not shown inside the dimensions card */}
      {scopeVolume > 0 && (scope.supportsMultipleAreas || scope.supportsMultiplePiers || scope.supportsMultipleFootings) && (
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
            const answers = moduleAnswers[module.id] || {};
            
            // Special handling for demolition module - render custom input
            if (module.id === 'demolition') {
              // Check if this is the standalone demolition scope (only module in the scope)
              const isStandaloneScope = scope.id === 'demolition';
              return (
                <DemolitionModuleSection
                  key={module.id}
                  module={module}
                  answers={answers}
                  onAnswerChange={(qId, val) => handleModuleAnswerChange(module.id, qId, val)}
                  isOpen={openModuleId === module.id}
                  onToggle={() => {
                    setOpenModuleId((prev) => (prev === module.id ? null : module.id));
                  }}
                  subtotal={cost?.subtotal || 0}
                  lineItems={cost?.lineItems || []}
                  isMarkedDone={doneModules.has(module.id)}
                  onMarkDone={() => {
                    setDoneModules((prev) => new Set([...prev, module.id]));
                    setOpenModuleId(null);
                    onModuleDone?.();
                  }}
                  priceMap={priceMap}
                  isStandaloneScope={isStandaloneScope}
                />
              );
            }
            
            return (
              <ModuleSection
                key={module.id}
                module={module}
                answers={answers}
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
                  // Notify parent to trigger auto-save
                  onModuleDone?.();
                }}
                scopeData={scopeData}
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

// Helper component for demolition module with custom multi-area input
function DemolitionModuleSection({
  module,
  answers,
  onAnswerChange,
  isOpen,
  onToggle,
  subtotal,
  lineItems,
  isMarkedDone,
  onMarkDone,
  priceMap,
  isStandaloneScope = false,
}: {
  module: EstimateModule;
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, value: any) => void;
  isOpen: boolean;
  onToggle: () => void;
  subtotal: number;
  lineItems: CostLineItem[];
  isMarkedDone: boolean;
  onMarkDone: () => void;
  priceMap: PriceMap;
  isStandaloneScope?: boolean;
}) {
  // Import CostLineItem for display
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  // For standalone scope, always treat as required (auto-enable on first render)
  const demolitionRequired = isStandaloneScope ? true : answers.demolition_required === true;
  
  // Auto-set demolition_required to true for standalone scope if not already set
  useEffect(() => {
    if (isStandaloneScope && answers.demolition_required !== true) {
      onAnswerChange('demolition_required', true);
    }
  }, [isStandaloneScope, answers.demolition_required, onAnswerChange]);

  const demolitionAreas: DemolitionArea[] = answers.demolition_areas || [
    { id: 'demo-1', name: 'Demo Area 1', length: 0, width: 0, thickness: 100 }
  ];
  
  const getPrice = (category: string, code: string, fallback: number) =>
    priceMap[category]?.[code] ?? fallback;

  return (
    <div className="border rounded-lg">
      {/* Header - always visible */}
      <div
        className="flex items-center justify-between px-4 py-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 flex-1">
          <span className="font-medium">{module.name}</span>
          {isMarkedDone && (
            <span className="text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
              Done
            </span>
          )}
          {subtotal > 0 && (
            <span className="ml-auto mr-4 text-sm font-medium text-primary">
              {formatCurrency(subtotal)}
            </span>
          )}
        </div>
        <svg
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Content - collapsible */}
      {isOpen && (
        <div className="px-4 pb-6 space-y-6 border-t">
          {/* Main toggle - only show if not standalone scope */}
          {!isStandaloneScope && (
            <div className="flex items-center justify-between pt-4">
              <Label className="text-sm font-medium">
                Do you need to demolish existing concrete?
              </Label>
              <Switch
                checked={demolitionRequired}
                onCheckedChange={(val) => onAnswerChange('demolition_required', val)}
              />
            </div>
          )}

          {/* Custom multi-demolition input */}
          {demolitionRequired && (
            <MultiDemolitionInput
              label="Demolition Areas"
              areas={demolitionAreas}
              onChange={(areas) => onAnswerChange('demolition_areas', areas)}
              tipRate={answers.tip_rate || getPrice('demolition', 'TIP_RATE', 400)}
              onTipRateChange={(rate) => onAnswerChange('tip_rate', rate)}
              rockBreakerRequired={answers.rock_breaker_required || false}
              onRockBreakerRequiredChange={(val) => onAnswerChange('rock_breaker_required', val)}
              rockBreakerCost={answers.rock_breaker_cost || getPrice('demolition', 'ROCK_BREAKER', 200)}
              onRockBreakerCostChange={(cost) => onAnswerChange('rock_breaker_cost', cost)}
              // Excavator hire props
              excavatorRequired={answers.excavator_required || false}
              onExcavatorRequiredChange={(val) => onAnswerChange('excavator_required', val)}
              excavatorType={answers.excavator_type || 'EXC 3.2T'}
              onExcavatorTypeChange={(type) => onAnswerChange('excavator_type', type)}
              excavatorRate={answers.excavator_rate || getPrice('excavation', answers.excavator_type || 'EXC 3.2T', 150)}
              onExcavatorRateChange={(rate) => onAnswerChange('excavator_rate', rate)}
              excavatorHours={answers.excavator_hours || 4}
              onExcavatorHoursChange={(hours) => onAnswerChange('excavator_hours', hours)}
              excavatorFloat={answers.excavator_float || getPrice('excavation', 'FLOAT', 150)}
              onExcavatorFloatChange={(float) => onAnswerChange('excavator_float', float)}
              // Saw cutting props
              sawCuttingRequired={answers.saw_cutting_required || false}
              onSawCuttingRequiredChange={(val) => onAnswerChange('saw_cutting_required', val)}
              sawCuttingMethod={answers.saw_cutting_method || 'linear'}
              onSawCuttingMethodChange={(method) => onAnswerChange('saw_cutting_method', method)}
              sawCuttingLength={answers.saw_cutting_length || 0}
              onSawCuttingLengthChange={(length) => onAnswerChange('saw_cutting_length', length)}
              sawCuttingRate={answers.saw_cutting_rate || getPrice('joint_saw_cutting', 'SAWCUT_LM', 25)}
              onSawCuttingRateChange={(rate) => onAnswerChange('saw_cutting_rate', rate)}
              sawCuttingHours={answers.saw_cutting_hours || 2}
              onSawCuttingHoursChange={(hours) => onAnswerChange('saw_cutting_hours', hours)}
              sawCuttingHourlyRate={answers.saw_cutting_hourly_rate || getPrice('joint_saw_cutting', 'SAWCUT_HR', 180)}
              onSawCuttingHourlyRateChange={(rate) => onAnswerChange('saw_cutting_hourly_rate', rate)}
              // Labour hours props
              demoLabourRequired={answers.demo_labour_required || false}
              onDemoLabourRequiredChange={(val) => onAnswerChange('demo_labour_required', val)}
              demoCrewSize={answers.demo_crew_size || 2}
              onDemoCrewSizeChange={(size) => onAnswerChange('demo_crew_size', size)}
              demoHours={answers.demo_hours || 4}
              onDemoHoursChange={(hours) => onAnswerChange('demo_hours', hours)}
              demoLabourRate={answers.demo_labour_rate || getPrice('labour', 'LABOUR HR', 75)}
              onDemoLabourRateChange={(rate) => onAnswerChange('demo_labour_rate', rate)}
            />
          )}

          {/* Line items breakdown */}
          {lineItems.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-medium mb-3 text-muted-foreground">Cost Breakdown</h4>
              <div className="space-y-2">
                {lineItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.description}
                    </span>
                    <span className="font-medium">{formatCurrency(item.total)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Module Subtotal</span>
                  <span className="text-primary">{formatCurrency(subtotal)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Mark as Done button */}
          {!isMarkedDone && (
            <div className="border-t pt-4 mt-4">
              <Button
                onClick={onMarkDone}
                className="w-full h-12 sm:h-10 text-base sm:text-sm"
                variant="default"
              >
                Mark as Done
              </Button>
            </div>
          )}
        </div>
      )}
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
