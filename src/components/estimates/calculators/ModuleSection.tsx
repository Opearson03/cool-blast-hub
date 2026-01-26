import { useState } from "react";
import { ComponentQuestion, EstimateModule, CostLineItem, BeamConfig, MeasurementArea, PierGroup, FootingConfig, LinearSection, PadFootingGroup, ExtraItem, PumpVisit, LabourPlacement } from "@/lib/estimate-components/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AccordionDoneBadge } from "./shared/AccordionDoneBadge";
import { HelpCircle, Check, ChevronDown, Plus, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BeamReinforcementInput } from "./BeamReinforcementInput";
import { AreaReinforcementInput } from "./AreaReinforcementInput";
import { PierReinforcementInput } from "./PierReinforcementInput";
import { FootingReinforcementInput } from "./FootingReinforcementInput";
import { LinearSectionReinforcementInput } from "./LinearSectionReinforcementInput";
import { PadFootingGroupReinforcementInput } from "./PadFootingGroupReinforcementInput";
import { ExtraItemsInput } from "./ExtraItemsInput";
import { MultiPumpVisitInput } from "./MultiPumpVisitInput";
import { MultiPlacementInput } from "./MultiPlacementInput";
import { AddCustomItemDialog } from "./AddCustomItemDialog";
import { formatCurrency } from "@/lib/format-currency";
import { aggregateRaftReinforcementItems, AggregatedMaterial } from "./shared/aggregateMaterials";

interface ModuleSectionProps {
  module: EstimateModule;
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, value: any, isUserInput?: boolean) => void;
  isOpen: boolean;
  onToggle: () => void;
  subtotal: number;
  lineItems: CostLineItem[];
  isMarkedDone: boolean;
  onMarkDone: () => void;
  scopeData?: Record<string, any>;
  onScopeDataChange?: (key: string, value: any) => void;
  priceMap?: Record<string, Record<string, number>>;
}

function QuestionInput({
  question,
  value,
  onChange,
  allAnswers,
  scopeData,
}: {
  question: ComponentQuestion;
  value: any;
  onChange: (value: any) => void;
  allAnswers: Record<string, any>;
  scopeData?: Record<string, any>;
}) {
  // Check conditional display
  if (question.showIf && !question.showIf(allAnswers, scopeData)) {
    return null;
  }

  const inputId = `question-${question.id}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={inputId} className="text-sm font-medium">
          {question.label}
          {question.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {question.helpText && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{question.helpText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {question.type === 'boolean' && (
        <div className="flex items-center gap-3">
          <Switch
            id={inputId}
            checked={Boolean(value)}
            onCheckedChange={onChange}
          />
          <span className="text-sm text-muted-foreground">
            {value ? 'Yes' : 'No'}
          </span>
        </div>
      )}

      {question.type === 'number' && (
        <div className="relative">
          <Input
            id={inputId}
            type="number"
            inputMode="decimal"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
            min={question.min}
            max={question.max}
            step={question.step ?? 1}
            placeholder={question.placeholder}
            className={`pr-12 h-11 sm:h-9 ${question.derivedReadOnly ? 'bg-muted' : ''}`}
            readOnly={question.derivedReadOnly}
          />
          {question.unit && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {question.unit}
            </span>
          )}
          {question.deriveFrom && !question.derivedReadOnly && value !== undefined && (
            <span className="absolute -top-2 right-0 text-[10px] text-muted-foreground bg-background px-1">
              Auto-filled
            </span>
          )}
        </div>
      )}

      {question.type === 'currency' && (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            $
          </span>
          <Input
            id={inputId}
            type="number"
            inputMode="decimal"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
            min={question.min}
            max={question.max}
            step={question.step ?? 0.01}
            placeholder={question.placeholder}
            className={`pl-7 h-11 sm:h-9 ${question.derivedReadOnly ? 'bg-muted' : ''}`}
            readOnly={question.derivedReadOnly}
          />
          {question.deriveFrom && !question.derivedReadOnly && value !== undefined && (
            <span className="absolute -top-2 right-0 text-[10px] text-muted-foreground bg-background px-1">
              Auto-filled
            </span>
          )}
        </div>
      )}

      {question.type === 'text' && (
        <div className="relative">
          <Input
            id={inputId}
            type="text"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            className={`h-11 sm:h-9 ${question.derivedReadOnly ? 'bg-muted cursor-not-allowed' : ''}`}
            readOnly={question.derivedReadOnly}
          />
          {question.deriveFrom && !question.derivedReadOnly && value !== undefined && (
            <span className="absolute -top-2 right-0 text-[10px] text-muted-foreground bg-background px-1">
              Auto-filled
            </span>
          )}
        </div>
      )}

      {question.type === 'select' && question.options && (
        <Select
          value={value ?? ''}
          onValueChange={onChange}
        >
          <SelectTrigger>
            <SelectValue placeholder={question.placeholder ?? 'Select...'} />
          </SelectTrigger>
          <SelectContent>
            {question.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

/**
 * Component to render aggregated material breakdown
 * Groups identical materials across beams/areas into single totals
 */
function AggregatedCostBreakdown({ lineItems }: { lineItems: CostLineItem[] }) {
  const [expandedMaterials, setExpandedMaterials] = useState<Set<string>>(new Set());
  const groups = aggregateRaftReinforcementItems(lineItems);

  const toggleMaterial = (key: string) => {
    setExpandedMaterials(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const renderMaterial = (material: AggregatedMaterial) => {
    const hasMultipleItems = material.items.length > 1;
    const isExpanded = expandedMaterials.has(material.key);

    if (!hasMultipleItems) {
      // Single item - just render it directly with unit price
      const unitPriceText = material.unitPrice !== null && material.totalQuantity > 0
        ? ` @ ${formatCurrency(material.unitPrice)}/${material.unit.replace(/s$/, '')}`
        : '';
      return (
        <div key={material.key} className="flex justify-between text-sm py-0.5">
          <span className="text-muted-foreground">
            {material.displayName}
            {material.totalQuantity > 0 && material.unit && (
              <span className="ml-1">({material.totalQuantity} {material.unit}{unitPriceText})</span>
            )}
          </span>
          <span className="font-medium ml-2 shrink-0">{formatCurrency(material.totalCost)}</span>
        </div>
      );
    }

    // Multiple items - render collapsible with aggregated total and unit price
    const unitPriceText = material.unitPrice !== null && material.totalQuantity > 0
      ? ` @ ${formatCurrency(material.unitPrice)}/${material.unit.replace(/s$/, '')}`
      : '';
    return (
      <Collapsible key={material.key} open={isExpanded} onOpenChange={() => toggleMaterial(material.key)}>
        <CollapsibleTrigger asChild>
          <button className="flex justify-between text-sm py-0.5 w-full text-left hover:bg-muted/30 rounded px-1 -mx-1 transition-colors">
            <span className="flex items-center gap-1 text-muted-foreground">
              <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              <span className="font-medium text-foreground">{material.displayName}</span>
              <span>({material.totalQuantity} {material.unit}{unitPriceText})</span>
            </span>
            <span className="font-medium ml-2 shrink-0">{formatCurrency(material.totalCost)}</span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pl-5 space-y-0.5 text-xs text-muted-foreground border-l border-muted ml-1.5 mt-1">
            {material.items.map((item) => (
              <div key={item.id} className="flex justify-between py-0.5">
                <span>{item.description}</span>
                <span className="ml-2">{formatCurrency(item.total)}</span>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <>
      {groups.map((group) => (
        <div key={group.title} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.title}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {formatCurrency(group.totalCost)}
            </span>
          </div>
          <div className="space-y-0.5 pl-2 border-l-2 border-muted">
            {group.materials.map(renderMaterial)}
          </div>
        </div>
      ))}
    </>
  );
}

export function ModuleSection({
  module,
  answers,
  onAnswerChange,
  isOpen,
  onToggle,
  subtotal,
  lineItems,
  isMarkedDone,
  onMarkDone,
  scopeData,
  onScopeDataChange,
  priceMap,
}: ModuleSectionProps) {
  // State for add custom item dialog
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  
  // Check module types for inline inputs
  const isRaftReoModule = module.id === 'reinforcement-raft';
  const isPiersReoModule = module.id === 'reinforcement-piers';
  const isFootingReoModule = module.id === 'reinforcement-footing';
  const isPadReoModule = module.id === 'reinforcement-pad';
  const isExtraItemsModule = module.id === 'extra-items';
  
  const areas = (scopeData?.areas || []) as MeasurementArea[];
  const edgeBeams = (scopeData?.edgeBeams || []) as BeamConfig[];
  const internalBeams = (scopeData?.beams || []) as BeamConfig[];
  const pierGroups = (scopeData?.pierGroups || []) as PierGroup[];
  const padGroups = (scopeData?.padGroups || []) as PadFootingGroup[];
  const footings = (scopeData?.footings || scopeData?.linearSections || []) as (FootingConfig | LinearSection)[];
  
  // Custom items for this module
  const customItems: ExtraItem[] = answers.custom_items || [];
  
  // Get visible questions - exclude custom-rendered questions (pump_visits, placements)
  const customRenderedQuestions = ['pump_visits', 'placements'];
  const visibleQuestions = module.questions.filter(
    (q) => !customRenderedQuestions.includes(q.id) && (!q.showIf || q.showIf(answers, scopeData))
  );

  // Handle accordion toggle without scroll jumping
  const handleValueChange = (val: string) => {
    if (val === module.id || val === '') {
      onToggle();
    }
  };
  
  // Handle adding a custom item
  const handleAddCustomItem = (item: ExtraItem) => {
    const updatedItems = [...customItems, item];
    onAnswerChange('custom_items', updatedItems);
  };
  
  // Handle removing a custom item
  const handleRemoveCustomItem = (itemId: string) => {
    const updatedItems = customItems.filter(item => item.id !== itemId);
    onAnswerChange('custom_items', updatedItems);
  };

  return (
    <Accordion
      type="single"
      collapsible
      value={isOpen ? module.id : ''}
      onValueChange={handleValueChange}
    >
      <AccordionItem value={module.id} className="border rounded-lg px-4">
        <AccordionTrigger 
          className="hover:no-underline py-4"
          onClick={(e) => {
            // Prevent default scroll-into-view behavior
            e.preventDefault();
            onToggle();
          }}
        >
          <div className="flex items-center gap-3 flex-1">
            <span className="font-medium">{module.name}</span>
            {isMarkedDone && <AccordionDoneBadge />}
            {subtotal > 0 && (
              <span className="ml-auto mr-4 text-sm font-medium text-primary">
                {formatCurrency(subtotal)}
              </span>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-6">
          <div className="space-y-6">
            {/* Questions - grouped by section, with inline beam/area inputs for raft reo */}
            {(() => {
              // Group questions by section
              let currentSection: string | null = null;
              const elements: React.ReactNode[] = [];
              let sectionQuestions: typeof visibleQuestions = [];

                  const flushSection = () => {
                if (sectionQuestions.length > 0) {
                  const sectionKey = currentSection || 'default';
                  
                  // Get scope ID for scope-aware labels
                  const scopeId = scopeData?.scopeId || '';
                  
                  // Check if this section should have inline inputs
                  // Support both "Edge Beams" and "Edge Thickening" for driveway scope
                  const isSlabSurfaceSection = isRaftReoModule && currentSection === 'Slab Surface';
                  const isEdgeBeamsSection = isRaftReoModule && (currentSection === 'Edge Beams' || currentSection === 'Edge Thickening');
                  const isInternalBeamsSection = isRaftReoModule && currentSection === 'Internal Beams';
                  // Footing reinforcement now uses LinearSectionReinforcementInput
                  const isFootingReoSection = isFootingReoModule && currentSection === 'Footing Reinforcement';
                  
                  // Get effective section label (scope-aware)
                  const effectiveSectionLabel = sectionQuestions[0]?.getScopeSectionLabel
                    ? sectionQuestions[0].getScopeSectionLabel(scopeId)
                    : currentSection;
                  
                  elements.push(
                    <div key={`section-${sectionKey}`} className="space-y-4">
                      {currentSection && (
                        <div className="flex items-center gap-2 pt-2 first:pt-0">
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {effectiveSectionLabel}
                          </h4>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-x-6">
                        {sectionQuestions.map((question) => {
                          // Get effective label (scope-aware)
                          const effectiveLabel = question.getScopeLabel
                            ? question.getScopeLabel(scopeId)
                            : question.label;
                          
                          return (
                            <QuestionInput
                              key={question.id}
                              question={{ ...question, label: effectiveLabel }}
                              value={answers[question.id]}
                              onChange={(val) => onAnswerChange(question.id, val)}
                              allAnswers={answers}
                              scopeData={scopeData}
                            />
                          );
                        })}
                      </div>
                      
                      {/* Inline per-area inputs for Slab Surface section */}
                      {isSlabSurfaceSection && onScopeDataChange && areas.length > 0 && (
                        <div className="mt-4">
                          <AreaReinforcementInput
                            areas={areas}
                            onChange={(newAreas) => onScopeDataChange('areas', newAreas)}
                            defaultReoType="mesh"
                            defaultMeshType="SL82"
                            defaultBarSize="N12"
                            defaultBarSpacing="200"
                            defaultBarLayers="2"
                            label="Slab Areas"
                            priceMap={priceMap}
                          />
                        </div>
                      )}
                      
                      {/* Inline per-beam inputs for Edge Beams section */}
                      {isEdgeBeamsSection && onScopeDataChange && edgeBeams.length > 0 && answers.edge_beam_reo && (
                        <div className="mt-4">
                          <BeamReinforcementInput
                            beams={edgeBeams}
                            onChange={(newBeams) => onScopeDataChange('edgeBeams', newBeams)}
                            defaultTmType="L11TM4"
                            defaultAddLigs={false}
                            defaultLigSize="R10"
                            defaultLigCentres={200}
                            label="Edge Beams"
                            priceMap={priceMap}
                          />
                        </div>
                      )}
                      
                      {/* Inline per-beam inputs for Internal Beams section */}
                      {isInternalBeamsSection && onScopeDataChange && internalBeams.length > 0 && answers.internal_beam_reo && (
                        <div className="mt-4">
                          <BeamReinforcementInput
                            beams={internalBeams}
                            onChange={(newBeams) => onScopeDataChange('beams', newBeams)}
                            defaultTmType="L11TM4"
                            defaultAddLigs={false}
                            defaultLigSize="R10"
                            defaultLigCentres={200}
                            label="Internal Beams"
                            priceMap={priceMap}
                          />
                        </div>
                      )}
                      
                      {/* Inline per-section inputs for Footing Reinforcement */}
                      {isFootingReoSection && onScopeDataChange && footings.length > 0 && (
                        <div className="mt-4">
                          <LinearSectionReinforcementInput
                            sections={footings as LinearSection[]}
                            onChange={(newSections) => {
                              if (scopeData?.footings) {
                                onScopeDataChange('footings', newSections);
                              } else {
                                onScopeDataChange('linearSections', newSections);
                              }
                            }}
                            defaultReoType={answers.include_trench_mesh ? 'trench_mesh' : 'none'}
                            defaultTmType="L11TM4"
                            defaultBarSize="N16"
                            defaultBarSpacing="200"
                            defaultBarConfig="bottom"
                            defaultAddLigs={answers.add_ligs || false}
                            defaultLigSize="R10"
                            defaultLigCentres={200}
                            defaultAddVerticalBars={answers.add_vertical_bars || false}
                            defaultVerticalBarSize="N16"
                            defaultVerticalBarCentres={400}
                            label="Footing Sections"
                            priceMap={priceMap}
                          />
                        </div>
                      )}
                    </div>
                  );
                  sectionQuestions = [];
                }
              };

              // Skip default question rendering for extra-items module (uses custom component)
              if (module.id !== 'extra-items') {
                visibleQuestions.forEach((question) => {
                  if (question.sectionLabel && question.sectionLabel !== currentSection) {
                    flushSection();
                    currentSection = question.sectionLabel;
                  }
                  sectionQuestions.push(question);
                });
                flushSection();
              }

              // Special case: Pier reinforcement module renders pier groups without global toggles
              if (isPiersReoModule && pierGroups.length > 0 && onScopeDataChange) {
                elements.push(
                  <div key="pier-groups-section" className="space-y-4">
                    <div className="flex items-center gap-2 pt-2 first:pt-0">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Pier Groups
                      </h4>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Configure reinforcement for each pier group individually.
                    </p>
                    <PierReinforcementInput
                      pierGroups={pierGroups}
                      onChange={(newPierGroups) => onScopeDataChange('pierGroups', newPierGroups)}
                      defaultHasStarters={false}
                      defaultStarterCount={4}
                      defaultStarterSize="N16"
                      defaultStarterLength={1200}
                      defaultIsReinforced={false}
                      defaultVerticalBarsCount={6}
                      defaultVerticalBarSize="N16"
                      defaultLigSize="R10"
                      defaultLigCentres={200}
                      label="Pier Groups"
                    />
                  </div>
                );
              }

              // Special case: Pad footing reinforcement module renders pad groups
              if (isPadReoModule && padGroups.length > 0 && onScopeDataChange) {
                elements.push(
                  <div key="pad-groups-section" className="space-y-4">
                    <div className="flex items-center gap-2 pt-2 first:pt-0">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Pad Footing Groups
                      </h4>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Configure reinforcement for each pad footing group individually.
                    </p>
                    <PadFootingGroupReinforcementInput
                      padGroups={padGroups}
                      onChange={(newPadGroups) => onScopeDataChange('padGroups', newPadGroups)}
                      priceMap={priceMap}
                      label="Pad Footing Groups"
                    />
                  </div>
                );
              }

              // Special case: Extra Items module renders custom input
              if (module.id === 'extra-items') {
                elements.push(
                  <div key="extra-items-section" className="space-y-4">
                    <ExtraItemsInput
                      items={(answers.extra_items || []) as ExtraItem[]}
                      onChange={(items) => onAnswerChange('extra_items', items)}
                    />
                  </div>
                );
              }

              // Special case: Concrete Pumping module renders multi-visit input
              if (module.id === 'concrete-pumping' && answers.pump_required) {
                elements.push(
                  <div key="pump-visits-section" className="space-y-4">
                    <div className="flex items-center gap-2 pt-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Pump Visits
                      </h4>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <MultiPumpVisitInput
                      visits={(answers.pump_visits || []) as PumpVisit[]}
                      onChange={(visits) => onAnswerChange('pump_visits', visits)}
                      priceMap={priceMap}
                    />
                  </div>
                );
              }

              // Special case: Labour Place module renders multi-placement input
              if (module.id === 'labour-place') {
                elements.push(
                  <div key="labour-placements-section" className="space-y-4">
                    <MultiPlacementInput
                      placements={(answers.placements || []) as LabourPlacement[]}
                      onChange={(placements) => onAnswerChange('placements', placements)}
                      priceMap={priceMap}
                    />
                  </div>
                );
              }

              return elements;
            })()}

            {/* Line items breakdown */}
            {lineItems.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Cost Breakdown</h4>
                <div className="space-y-3">
                  {isRaftReoModule ? (
                    // Aggregated breakdown for raft reinforcement
                    <AggregatedCostBreakdown lineItems={lineItems} />
                  ) : (
                    // Standard flat list for other modules
                    lineItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.description}
                          {item.quantity > 0 && item.unit && (
                            <span className="ml-1">
                              ({item.quantity} {item.unit} × {formatCurrency(item.unitPrice)})
                            </span>
                          )}
                        </span>
                        <span className="font-medium">{formatCurrency(item.total)}</span>
                      </div>
                    ))
                  )}
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>Module Subtotal</span>
                    <span className="text-primary">{formatCurrency(subtotal)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Items for this module (not shown for extra-items module which has its own UI) */}
            {!isExtraItemsModule && customItems.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Custom Items</h4>
                </div>
                <div className="space-y-2">
                  {customItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-muted/30 p-2 rounded-lg text-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-muted-foreground">
                          {item.description}
                          <span className="ml-1">
                            ({item.quantity} {item.unit} × {formatCurrency(item.rate)})
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="font-medium">{formatCurrency(item.total)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveCustomItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Item and Mark as Done buttons */}
            {!isMarkedDone && (
              <div className="border-t pt-4 mt-4">
                <div className="flex gap-2">
                  {/* Add Item button - not shown for extra-items module which has its own UI */}
                  {!isExtraItemsModule && (
                    <Button
                      onClick={() => setShowAddItemDialog(true)}
                      variant="outline"
                      className="h-12 sm:h-10 text-base sm:text-sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  )}
                  <Button
                    onClick={onMarkDone}
                    className="flex-1 h-12 sm:h-10 text-base sm:text-sm"
                    variant="default"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Done
                  </Button>
                </div>
              </div>
            )}
            
            {/* Add Custom Item Dialog */}
            <AddCustomItemDialog
              open={showAddItemDialog}
              onOpenChange={setShowAddItemDialog}
              onAdd={handleAddCustomItem}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
