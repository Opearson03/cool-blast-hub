import { useState } from "react";
import { ComponentQuestion, EstimateModule, CostLineItem, BeamConfig, MeasurementArea, PierGroup, FootingConfig, LinearSection, PadFootingGroup, ExtraItem } from "@/lib/estimate-components/types";
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
import { HelpCircle, Check, ChevronDown } from "lucide-react";
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
import { PadFootingGroupReinforcementInput } from "./PadFootingGroupReinforcementInput";
import { ExtraItemsInput } from "./ExtraItemsInput";
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
}: ModuleSectionProps) {
  // Check module types for inline inputs
  const isRaftReoModule = module.id === 'reinforcement-raft';
  const isPiersReoModule = module.id === 'reinforcement-piers';
  const isFootingReoModule = module.id === 'reinforcement-footing';
  const isPadReoModule = module.id === 'reinforcement-pad';
  
  const areas = (scopeData?.areas || []) as MeasurementArea[];
  const edgeBeams = (scopeData?.edgeBeams || []) as BeamConfig[];
  const internalBeams = (scopeData?.beams || []) as BeamConfig[];
  const pierGroups = (scopeData?.pierGroups || []) as PierGroup[];
  const padGroups = (scopeData?.padGroups || []) as PadFootingGroup[];
  const footings = (scopeData?.footings || scopeData?.linearSections || []) as (FootingConfig | LinearSection)[];
  // Get visible questions
  const visibleQuestions = module.questions.filter(
    (q) => !q.showIf || q.showIf(answers, scopeData)
  );

  // Handle accordion toggle without scroll jumping
  const handleValueChange = (val: string) => {
    if (val === module.id || val === '') {
      onToggle();
    }
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
                  
                  // Check if this section should have inline inputs
                  const isSlabSurfaceSection = isRaftReoModule && currentSection === 'Slab Surface';
                  const isEdgeBeamsSection = isRaftReoModule && currentSection === 'Edge Beams';
                  const isInternalBeamsSection = isRaftReoModule && currentSection === 'Internal Beams';
                  // Note: Pier reinforcement is rendered as a standalone section after flushSection
                  const isFootingTmSection = isFootingReoModule && currentSection === 'Trench Mesh';
                  const isFootingLigsSection = isFootingReoModule && currentSection === 'Ligatures';
                  const isFootingStartersSection = isFootingReoModule && currentSection === 'Vertical Starters';
                  
                  elements.push(
                    <div key={`section-${sectionKey}`} className="space-y-4">
                      {currentSection && (
                        <div className="flex items-center gap-2 pt-2 first:pt-0">
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {currentSection}
                          </h4>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-x-6">
                        {sectionQuestions.map((question) => (
                          <QuestionInput
                            key={question.id}
                            question={question}
                            value={answers[question.id]}
                            onChange={(val) => onAnswerChange(question.id, val)}
                            allAnswers={answers}
                            scopeData={scopeData}
                          />
                        ))}
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
                          />
                        </div>
                      )}
                      
                      {/* Note: Pier reinforcement is now rendered as a standalone section after flushSection */}
                      {/* Inline per-footing inputs for Footing reinforcement */}
                      {(isFootingTmSection || isFootingLigsSection || isFootingStartersSection) && onScopeDataChange && footings.length > 0 && (answers.include_trench_mesh || answers.add_ligs || answers.add_vertical_bars) && (
                        <div className="mt-4">
                          <FootingReinforcementInput
                            footings={footings}
                            onChange={(newFootings) => {
                              if (scopeData?.footings) {
                                onScopeDataChange('footings', newFootings);
                              } else {
                                onScopeDataChange('linearSections', newFootings);
                              }
                            }}
                            defaultReoType={answers.include_trench_mesh ? 'trench_mesh' : 'none'}
                            defaultTmType="L11TM4"
                            defaultAddLigs={answers.add_ligs || false}
                            defaultLigSize="R10"
                            defaultLigCentres={200}
                            defaultAddVerticalBars={answers.add_vertical_bars || false}
                            defaultVerticalBarSize="N16"
                            defaultVerticalBarCentres={400}
                            label="Footing Sections"
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
                      defaultHasBottomReo={answers.has_bottom_reo ?? true}
                      defaultBottomASize={answers.bottom_a_size || 'N16'}
                      defaultBottomACentres={answers.bottom_a_centres ?? 200}
                      defaultBottomBSize={answers.bottom_b_size || 'N16'}
                      defaultBottomBCentres={answers.bottom_b_centres ?? 200}
                      defaultHasTopReo={answers.has_top_reo ?? false}
                      defaultTopASize={answers.top_a_size || 'N16'}
                      defaultTopACentres={answers.top_a_centres ?? 200}
                      defaultTopBSize={answers.top_b_size || 'N16'}
                      defaultTopBCentres={answers.top_b_centres ?? 200}
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

            {/* Mark as Done button */}
            {!isMarkedDone && (
              <div className="border-t pt-4 mt-4">
                <Button
                  onClick={onMarkDone}
                  className="w-full h-12 sm:h-10 text-base sm:text-sm"
                  variant="default"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Mark as Done
                </Button>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
