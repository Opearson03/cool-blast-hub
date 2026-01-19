import { useState } from "react";
import { Plus, Trash2, Copy, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
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

  // Get scope-specific configuration
  const config = LINEAR_SCOPE_CONFIG[scopeId] || DEFAULT_CONFIG;

  // Check if any section is from takeoff
  const hasAnyFromTakeoff = sections.some(s => s._fromTakeoff);

  // Calculate totals
  const totalLength = sections.reduce((sum, section) => {
    const length = section._actualLength && section._actualLength > 0 
      ? section._actualLength 
      : (Number(section.length) || 0);
    return sum + length;
  }, 0);

  const totalVolume = sections.reduce((sum, section) => {
    const length = section._actualLength && section._actualLength > 0 
      ? section._actualLength 
      : (Number(section.length) || 0);
    const dim1M = (Number(section.dimension1) || 0) / 1000;
    const dim2M = (Number(section.dimension2) || 0) / 1000;
    return sum + length * dim1M * dim2M;
  }, 0);

  const totalSurfaceArea = sections.reduce((sum, section) => {
    const length = section._actualLength && section._actualLength > 0 
      ? section._actualLength 
      : (Number(section.length) || 0);
    const dim2M = (Number(section.dimension2) || 0) / 1000; // height for walls/kerbs
    return sum + length * dim2M;
  }, 0);

  const addSection = () => {
    const sectionNumber = sections.length + 1;
    const name = newSectionName.trim() || `${config.itemName} ${sectionNumber}`;
    onChange([
      ...sections,
      {
        id: `section-${Date.now()}`,
        name,
        length: 0,
        dimension1: config.dimension1Default,
        dimension2: config.dimension2Default,
      },
    ]);
    setNewSectionName("");
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
    onChange([
      ...sections,
      {
        ...section,
        id: `section-${Date.now()}`,
        name: `${section.name} (copy)`,
        _fromTakeoff: false,
      },
    ]);
  };

  const updateSection = (id: string, field: keyof LinearSection, value: any) => {
    onChange(
      sections.map((section) =>
        section.id === id 
          ? { 
              ...section, 
              [field]: value,
              // Clear takeoff flag when user edits dimensions
              ...(field !== 'name' && section._fromTakeoff ? { _fromTakeoff: false } : {})
            } 
          : section
      )
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{label || config.sectionLabel}</CardTitle>
          {hasAnyFromTakeoff && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="gap-1 bg-blue-500/10 text-blue-600 border-blue-500/30">
                    <Ruler className="h-3 w-3" />
                    From plan takeoff
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Measurements imported from plan takeoff</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Section list */}
        <div className="space-y-3">
          {sections.map((section, index) => {
            const length = section._actualLength && section._actualLength > 0 
              ? section._actualLength 
              : (Number(section.length) || 0);
            const dim1M = (Number(section.dimension1) || 0) / 1000;
            const dim2M = (Number(section.dimension2) || 0) / 1000;
            const sectionVolume = length * dim1M * dim2M;
            const sectionSurfaceArea = length * dim2M;
            const isFromTakeoff = section._fromTakeoff;

            return (
              <div
                key={section.id}
                className={cn(
                  "border rounded-lg p-3 space-y-3",
                  isFromTakeoff 
                    ? "bg-blue-500/5 border-blue-500/20" 
                    : "bg-muted/30"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={section.name}
                      onChange={(e) => updateSection(section.id, "name", e.target.value)}
                      placeholder={`${config.itemName} ${index + 1}`}
                      className="font-medium flex-1"
                    />
                    {isFromTakeoff && (
                      <Ruler className="h-4 w-4 text-blue-500 shrink-0" />
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 sm:h-8 sm:w-8"
                      onClick={() => duplicateSection(section)}
                      title="Duplicate section"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 sm:h-8 sm:w-8 text-destructive hover:text-destructive"
                      onClick={() => removeSection(section.id)}
                      disabled={sections.length <= 1}
                      title="Remove section"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className={cn(
                  "grid gap-3",
                  config.showSurfaceArea 
                    ? "grid-cols-2 sm:grid-cols-5" 
                    : "grid-cols-2 sm:grid-cols-4"
                )}>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Length
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={section.length || ""}
                        onChange={(e) =>
                          updateSection(
                            section.id,
                            "length",
                            e.target.value === "" ? 0 : Number(e.target.value)
                          )
                        }
                        min={0}
                        step={0.1}
                        className="pr-8 h-11 sm:h-9"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        m
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      {config.dimension1Label}
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={section.dimension1 || ""}
                        onChange={(e) =>
                          updateSection(
                            section.id,
                            "dimension1",
                            e.target.value === "" ? 0 : Number(e.target.value)
                          )
                        }
                        min={50}
                        step={50}
                        className="pr-12 h-11 sm:h-9"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        mm
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      {config.dimension2Label}
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={section.dimension2 || ""}
                        onChange={(e) =>
                          updateSection(
                            section.id,
                            "dimension2",
                            e.target.value === "" ? 0 : Number(e.target.value)
                          )
                        }
                        min={50}
                        step={50}
                        className="pr-12 h-11 sm:h-9"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        mm
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Volume
                    </Label>
                    <div className="h-11 sm:h-9 flex items-center px-3 bg-muted rounded-md text-sm">
                      {sectionVolume > 0 ? `${sectionVolume.toFixed(3)} m³` : "—"}
                    </div>
                  </div>

                  {config.showSurfaceArea && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Surface Area
                      </Label>
                      <div className="h-11 sm:h-9 flex items-center px-3 bg-muted rounded-md text-sm">
                        {sectionSurfaceArea > 0 ? `${sectionSurfaceArea.toFixed(2)} m²` : "—"}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add section button */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder={`New ${config.itemName.toLowerCase()} name (optional)`}
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            className="flex-1 h-11 sm:h-9"
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
            onClick={handleAddClick}
            className="shrink-0 h-11 sm:h-9"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add {config.itemName}
          </Button>
        </div>

        {/* Combined totals */}
        <div className="flex flex-wrap gap-4 pt-3 border-t text-sm">
          <div>
            <span className="text-muted-foreground">Total Length: </span>
            <span className="font-medium">{totalLength.toFixed(1)} m</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Volume: </span>
            <span className="font-medium">{totalVolume.toFixed(3)} m³</span>
          </div>
          {config.showSurfaceArea && (
            <div>
              <span className="text-muted-foreground">Total Surface Area: </span>
              <span className="font-medium">{totalSurfaceArea.toFixed(2)} m²</span>
            </div>
          )}
        </div>
      </CardContent>

      <MarkupPromptDialog
        open={showMarkupPrompt}
        onOpenChange={setShowMarkupPrompt}
        itemType={config.itemName.toLowerCase()}
        onMarkOnPlans={handleMarkOnPlans}
        onEnterManually={handleEnterManually}
        dontAskAgain={dontAskAgain}
        onDontAskAgainChange={setDontAskAgain}
      />
    </Card>
  );
}
