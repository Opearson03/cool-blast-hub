import { useState, useMemo } from "react";
import { Plus, Trash2, Copy, Ruler, ChevronDown, ChevronRight, Settings2, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { MarkupPromptDialog } from "./MarkupPromptDialog";

export interface LinearSection {
  id: string;
  name: string;
  length: number;      // meters
  dimension1: number;  // mm (width or thickness)
  dimension2: number;  // mm (depth or height)
  _fromTakeoff?: boolean;
  _actualLength?: number;
}

// Scope-specific configuration for labels and defaults
const LINEAR_SCOPE_CONFIG: Record<string, {
  sectionLabel: string;
  itemName: string;
  dimension1Label: string;
  dimension2Label: string;
  showSurfaceArea: boolean;
  dimension1Default: number;
  dimension2Default: number;
}> = {
  strip_footings: {
    sectionLabel: 'Strip Footing Sections',
    itemName: 'Footing',
    dimension1Label: 'Width',
    dimension2Label: 'Depth',
    showSurfaceArea: false,
    dimension1Default: 450,
    dimension2Default: 300,
  },
  retaining_wall_footings: {
    sectionLabel: 'Retaining Wall Footing Sections',
    itemName: 'Footing',
    dimension1Label: 'Width',
    dimension2Label: 'Depth',
    showSurfaceArea: false,
    dimension1Default: 600,
    dimension2Default: 400,
  },
  kerbs_channels: {
    sectionLabel: 'Kerb Sections',
    itemName: 'Kerb',
    dimension1Label: 'Width',
    dimension2Label: 'Height',
    showSurfaceArea: true,
    dimension1Default: 300,
    dimension2Default: 450,
  },
  retaining_walls: {
    sectionLabel: 'Wall Sections',
    itemName: 'Wall',
    dimension1Label: 'Thickness',
    dimension2Label: 'Height',
    showSurfaceArea: true,
    dimension1Default: 200,
    dimension2Default: 1200,
  },
};

// Default config for unknown scopes
const DEFAULT_CONFIG = {
  sectionLabel: 'Sections',
  itemName: 'Section',
  dimension1Label: 'Width',
  dimension2Label: 'Depth',
  showSurfaceArea: false,
  dimension1Default: 450,
  dimension2Default: 300,
};

interface MultiLinearInputProps {
  scopeId: string;
  label?: string;
  sections: LinearSection[];
  onChange: (sections: LinearSection[]) => void;
  // Markup prompt support
  onRequestMarkup?: () => void;
  hasPlans?: boolean;
  skipMarkupPrompt?: boolean;
  onSkipMarkupPromptChange?: (skip: boolean) => void;
}

export function MultiLinearInput({
  scopeId,
  label,
  sections,
  onChange,
  onRequestMarkup,
  hasPlans = false,
  skipMarkupPrompt = false,
  onSkipMarkupPromptChange,
}: MultiLinearInputProps) {
  const [newSectionName, setNewSectionName] = useState("");
  const [showMarkupPrompt, setShowMarkupPrompt] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(skipMarkupPrompt);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(sections.map(s => s.id)));

  // Get scope-specific configuration
  const config = LINEAR_SCOPE_CONFIG[scopeId] || DEFAULT_CONFIG;

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    const allOpen = sections.every(s => openSections.has(s.id));
    if (allOpen) {
      setOpenSections(new Set());
    } else {
      setOpenSections(new Set(sections.map(s => s.id)));
    }
  };

  // Summary calculations
  const summary = useMemo(() => {
    let totalLength = 0;
    let totalVolume = 0;
    let totalSurfaceArea = 0;
    let fromTakeoffCount = 0;

    sections.forEach(section => {
      const length = section._actualLength && section._actualLength > 0 
        ? section._actualLength 
        : (Number(section.length) || 0);
      const dim1M = (Number(section.dimension1) || 0) / 1000;
      const dim2M = (Number(section.dimension2) || 0) / 1000;
      
      totalLength += length;
      totalVolume += length * dim1M * dim2M;
      totalSurfaceArea += length * dim2M;
      if (section._fromTakeoff) fromTakeoffCount++;
    });

    return { totalLength, totalVolume, totalSurfaceArea, fromTakeoffCount, total: sections.length };
  }, [sections]);

  const addSection = () => {
    const sectionNumber = sections.length + 1;
    const name = newSectionName.trim() || `${config.itemName} ${sectionNumber}`;
    const newSection: LinearSection = {
      id: `section-${Date.now()}`,
      name,
      length: 0,
      dimension1: config.dimension1Default,
      dimension2: config.dimension2Default,
    };
    onChange([...sections, newSection]);
    setNewSectionName("");
    setOpenSections(prev => new Set([...prev, newSection.id]));
  };

  const handleAddClick = () => {
    if (hasPlans && onRequestMarkup && !skipMarkupPrompt) {
      setShowMarkupPrompt(true);
    } else {
      addSection();
    }
  };

  const handleMarkOnPlans = () => {
    if (dontAskAgain) {
      onSkipMarkupPromptChange?.(true);
    }
    setShowMarkupPrompt(false);
    onRequestMarkup?.();
  };

  const handleEnterManually = () => {
    if (dontAskAgain) {
      onSkipMarkupPromptChange?.(true);
    }
    setShowMarkupPrompt(false);
    addSection();
  };

  const removeSection = (id: string) => {
    if (sections.length > 1) {
      onChange(sections.filter((s) => s.id !== id));
    }
  };

  const duplicateSection = (section: LinearSection) => {
    const newSection: LinearSection = {
      ...section,
      id: `section-${Date.now()}`,
      name: `${section.name} (copy)`,
      _fromTakeoff: false,
    };
    onChange([...sections, newSection]);
    setOpenSections(prev => new Set([...prev, newSection.id]));
  };

  const updateSection = (id: string, field: keyof LinearSection, value: any) => {
    onChange(
      sections.map((section) =>
        section.id === id 
          ? { 
              ...section, 
              [field]: value,
              ...(field !== 'name' && section._fromTakeoff ? { _fromTakeoff: false } : {})
            } 
          : section
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="flex items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1.5">
            <Ruler className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{summary.total}</span>
            <span>{config.itemName.toLowerCase()}{summary.total !== 1 ? 's' : ''}</span>
            <span className="text-muted-foreground/60">({summary.totalLength.toFixed(1)}m)</span>
          </div>
          <span className="text-border">•</span>
          <span>{summary.totalVolume.toFixed(3)} m³</span>
          {config.showSurfaceArea && (
            <>
              <span className="text-border">•</span>
              <span>{summary.totalSurfaceArea.toFixed(2)} m²</span>
            </>
          )}
          {summary.fromTakeoffCount > 0 && (
            <>
              <span className="text-border">•</span>
              <span className="text-blue-600 dark:text-blue-400">{summary.fromTakeoffCount} from takeoff</span>
            </>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleAll}
          className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
        >
          <ChevronsUpDown className="h-3.5 w-3.5" />
          {sections.every(s => openSections.has(s.id)) ? 'Collapse' : 'Expand'}
        </Button>
      </div>

      {/* Section Cards */}
      <div className="space-y-2">
        {sections.map((section) => {
          const isOpen = openSections.has(section.id);
          const length = section._actualLength && section._actualLength > 0 
            ? section._actualLength 
            : (Number(section.length) || 0);
          const dim1M = (Number(section.dimension1) || 0) / 1000;
          const dim2M = (Number(section.dimension2) || 0) / 1000;
          const volume = length * dim1M * dim2M;
          const surfaceArea = length * dim2M;

          return (
            <Collapsible key={section.id} open={isOpen} onOpenChange={() => toggleSection(section.id)}>
              <div className={cn(
                "border rounded-lg overflow-hidden transition-colors",
                section._fromTakeoff ? "border-blue-500/30 bg-blue-500/[0.02]" : "bg-card"
              )}>
                {/* Header */}
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{section.name}</span>
                        <Badge variant="outline" className="text-xs font-normal h-5">
                          {length.toFixed(1)}m
                        </Badge>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {section.dimension1}×{section.dimension2}mm
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {section._fromTakeoff && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400">
                                Takeoff
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Measured from plan takeoff</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {volume > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {volume.toFixed(3)} m³
                        </span>
                      )}
                      <Settings2 className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                {/* Content */}
                <CollapsibleContent>
                  <div className="px-3 pb-3 pt-2 border-t bg-muted/30 space-y-3">
                    {/* Name Input */}
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Name</Label>
                      <Input
                        value={section.name}
                        onChange={(e) => updateSection(section.id, "name", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>

                    {/* Dimensions */}
                    <div className={cn(
                      "grid gap-2",
                      config.showSurfaceArea ? "grid-cols-5" : "grid-cols-4"
                    )}>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Length</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            inputMode="decimal"
                            value={section.length ?? ""}
                            onChange={(e) =>
                              updateSection(section.id, "length", e.target.value === "" ? 0 : Number(e.target.value))
                            }
                            min={0}
                            step={0.1}
                            className="pr-8 h-8 text-sm"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                            m
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">{config.dimension1Label}</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            inputMode="numeric"
                            value={section.dimension1 ?? ""}
                            onChange={(e) =>
                              updateSection(section.id, "dimension1", e.target.value === "" ? 0 : Number(e.target.value))
                            }
                            min={50}
                            step={50}
                            className="pr-10 h-8 text-sm"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                            mm
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">{config.dimension2Label}</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            inputMode="numeric"
                            value={section.dimension2 ?? ""}
                            onChange={(e) =>
                              updateSection(section.id, "dimension2", e.target.value === "" ? 0 : Number(e.target.value))
                            }
                            min={50}
                            step={50}
                            className="pr-10 h-8 text-sm"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                            mm
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Volume</Label>
                        <div className="h-8 flex items-center px-3 bg-muted rounded-md text-sm">
                          {volume > 0 ? `${volume.toFixed(3)} m³` : "—"}
                        </div>
                      </div>

                      {config.showSurfaceArea && (
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Surface</Label>
                          <div className="h-8 flex items-center px-3 bg-muted rounded-md text-sm">
                            {surfaceArea > 0 ? `${surfaceArea.toFixed(2)} m²` : "—"}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end pt-2 border-t gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => duplicateSection(section)}
                      >
                        <Copy className="h-3 w-3" />
                        Duplicate
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                        onClick={() => removeSection(section.id)}
                        disabled={sections.length <= 1}
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>

      {/* Add section input */}
      <div className="flex items-center gap-2 pt-2 border-t">
        <Input
          placeholder={`New ${config.itemName.toLowerCase()} name (optional)`}
          value={newSectionName}
          onChange={(e) => setNewSectionName(e.target.value)}
          className="flex-1 h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddClick();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddClick}
          className="gap-1 h-8"
        >
          <Plus className="h-4 w-4" />
          Add {config.itemName}
        </Button>
      </div>

      <MarkupPromptDialog
        open={showMarkupPrompt}
        onOpenChange={setShowMarkupPrompt}
        itemType={config.itemName.toLowerCase()}
        onMarkOnPlans={handleMarkOnPlans}
        onEnterManually={handleEnterManually}
        dontAskAgain={dontAskAgain}
        onDontAskAgainChange={setDontAskAgain}
      />
    </div>
  );
}
