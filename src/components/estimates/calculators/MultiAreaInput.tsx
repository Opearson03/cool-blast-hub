import { useState, useMemo } from "react";
import { Plus, Trash2, Copy, Ruler, ChevronDown, ChevronRight, Settings2, ChevronsUpDown, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { MeasurementArea } from "@/lib/estimate-components/types";
import { MarkupPromptDialog } from "./MarkupPromptDialog";
import { cn } from "@/lib/utils";

interface MultiAreaInputProps {
  label: string;
  areas: MeasurementArea[];
  onChange: (areas: MeasurementArea[]) => void;
  thickness: number;
  onThicknessChange: (thickness: number) => void;
  thicknessDefault?: number;
  thicknessMin?: number;
  // Per-area thickness support
  usePerAreaThickness?: boolean;
  onUsePerAreaThicknessChange?: (usePerArea: boolean) => void;
  // Thickening/edge beam support
  showThickeningOption?: boolean;
  hasThickening?: boolean;
  onThickeningChange?: (hasThickening: boolean) => void;
  thickeningDepth?: number;
  onThickeningDepthChange?: (depth: number) => void;
  thickeningWidth?: number;
  onThickeningWidthChange?: (width: number) => void;
  // Markup prompt support
  onRequestMarkup?: () => void;
  hasPlans?: boolean;
  skipMarkupPrompt?: boolean;
  onSkipMarkupPromptChange?: (skip: boolean) => void;
  // Scope identifier - used to customize behavior per scope
  scopeId?: string;
}

export function MultiAreaInput({
  label,
  areas,
  onChange,
  thickness,
  onThicknessChange,
  thicknessDefault = 100,
  thicknessMin = 75,
  usePerAreaThickness = false,
  onUsePerAreaThicknessChange,
  showThickeningOption = false,
  hasThickening = false,
  onThickeningChange,
  thickeningDepth = 300,
  onThickeningDepthChange,
  thickeningWidth = 300,
  onThickeningWidthChange,
  onRequestMarkup,
  hasPlans = false,
  skipMarkupPrompt = false,
  onSkipMarkupPromptChange,
  scopeId,
}: MultiAreaInputProps) {
  // Waffle pods use pod thickness, not slab thickness, so don't show the warning
  const isWafflePod = scopeId === 'waffle_pod';
  const showThicknessWarning = !thickness && !isWafflePod;
  const [newAreaName, setNewAreaName] = useState("");
  const [showMarkupPrompt, setShowMarkupPrompt] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(skipMarkupPrompt);
  const [pendingAreaName, setPendingAreaName] = useState("");
  const [openAreas, setOpenAreas] = useState<Set<string>>(new Set(areas.map(a => a.id)));

  const toggleArea = (areaId: string) => {
    setOpenAreas(prev => {
      const next = new Set(prev);
      if (next.has(areaId)) {
        next.delete(areaId);
      } else {
        next.add(areaId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    const allOpen = areas.every(a => openAreas.has(a.id));
    if (allOpen) {
      setOpenAreas(new Set());
    } else {
      setOpenAreas(new Set(areas.map(a => a.id)));
    }
  };

  // Summary calculations
  const summary = useMemo(() => {
    let totalArea = 0;
    let totalPerimeter = 0;
    let fromTakeoffCount = 0;

    areas.forEach(area => {
      if (area._actualArea && area._actualArea > 0) {
        totalArea += area._actualArea;
      } else {
        const l = Number(area.length) || 0;
        const w = Number(area.width) || 0;
        totalArea += l * w;
      }

      if (area._actualPerimeter && area._actualPerimeter > 0) {
        totalPerimeter += area._actualPerimeter;
      } else {
        const l = Number(area.length) || 0;
        const w = Number(area.width) || 0;
        if (l > 0 && w > 0) {
          totalPerimeter += 2 * (l + w);
        }
      }

      if (area._fromTakeoff) fromTakeoffCount++;
    });

    return { totalArea, totalPerimeter, fromTakeoffCount, total: areas.length };
  }, [areas]);

  const addArea = (nameOverride?: string) => {
    const areaNumber = areas.length + 1;
    const nameToUse = nameOverride !== undefined ? nameOverride : newAreaName;
    const name = nameToUse.trim() || `Area ${areaNumber}`;
    const newArea: MeasurementArea = {
      id: `area-${Date.now()}`,
      name,
      length: 0,
      width: 0,
    };
    onChange([...areas, newArea]);
    setNewAreaName("");
    setPendingAreaName("");
    setOpenAreas(prev => new Set([...prev, newArea.id]));
  };

  const handleAddClick = () => {
    if (hasPlans && onRequestMarkup && !skipMarkupPrompt) {
      setPendingAreaName(newAreaName);
      setShowMarkupPrompt(true);
    } else {
      addArea();
    }
  };

  const handleMarkOnPlans = () => {
    if (dontAskAgain) {
      onSkipMarkupPromptChange?.(true);
    }
    setShowMarkupPrompt(false);
    setPendingAreaName("");
    setNewAreaName("");
    onRequestMarkup?.();
  };

  const handleEnterManually = () => {
    if (dontAskAgain) {
      onSkipMarkupPromptChange?.(true);
    }
    setShowMarkupPrompt(false);
    addArea(pendingAreaName);
  };

  const removeArea = (id: string) => {
    if (areas.length > 1) {
      onChange(areas.filter((a) => a.id !== id));
    }
  };

  const duplicateArea = (area: MeasurementArea) => {
    const newArea: MeasurementArea = {
      ...area,
      id: `area-${Date.now()}`,
      name: `${area.name} (copy)`,
      _fromTakeoff: false,
      _actualArea: undefined,
      _actualPerimeter: undefined,
    };
    onChange([...areas, newArea]);
    setOpenAreas(prev => new Set([...prev, newArea.id]));
  };

  const updateArea = (id: string, field: keyof MeasurementArea, value: any) => {
    onChange(
      areas.map((area) => {
        if (area.id !== id) return area;
        
        if (field === "length" || field === "width") {
          return {
            ...area,
            [field]: value,
            _fromTakeoff: false,
            _actualArea: undefined,
            _actualPerimeter: undefined,
          };
        }
        
        return { ...area, [field]: value };
      })
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
            <span>area{summary.total !== 1 ? 's' : ''}</span>
            <span className="text-muted-foreground/60">({summary.totalArea.toFixed(1)} m²)</span>
          </div>
          <span className="text-border">•</span>
          <span>{summary.totalPerimeter.toFixed(1)}m perimeter</span>
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
          {areas.every(a => openAreas.has(a.id)) ? 'Collapse' : 'Expand'}
        </Button>
      </div>

      {/* Area Cards */}
      <div className="space-y-2">
        {areas.map((area) => {
          const isOpen = openAreas.has(area.id);
          const displayArea = area._actualArea && area._actualArea > 0
            ? area._actualArea
            : (Number(area.length) || 0) * (Number(area.width) || 0);
          
          return (
            <Collapsible key={area.id} open={isOpen} onOpenChange={() => toggleArea(area.id)}>
              <div className={cn(
                "border rounded-lg overflow-hidden transition-colors",
                area._fromTakeoff ? "border-blue-500/30 bg-blue-500/[0.02]" : "bg-card"
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
                        <span className="font-medium text-sm">{area.name}</span>
                        <Badge variant="outline" className="text-xs font-normal h-5">
                          {displayArea.toFixed(1)} m²
                        </Badge>
                        {usePerAreaThickness && area.thickness && (
                          <Badge variant="secondary" className="text-xs font-normal h-5">
                            {area.thickness}mm
                          </Badge>
                        )}
                        {area.length > 0 && area.width > 0 && (
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {area.length.toFixed(1)}m × {area.width.toFixed(1)}m
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {area._fromTakeoff && (
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
                        value={area.name}
                        onChange={(e) => updateArea(area.id, "name", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>

                    {/* Dimensions */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Length</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            inputMode="decimal"
                            value={area.length || ""}
                            onChange={(e) =>
                              updateArea(area.id, "length", e.target.value === "" ? 0 : Number(e.target.value))
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
                        <Label className="text-[10px] text-muted-foreground">Width</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            inputMode="decimal"
                            value={area.width || ""}
                            onChange={(e) =>
                              updateArea(area.id, "width", e.target.value === "" ? 0 : Number(e.target.value))
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
                        <Label className="text-[10px] text-muted-foreground">
                          Area
                          {area._fromTakeoff && area._actualArea && (
                            <span className="ml-1 text-blue-600 dark:text-blue-400">(measured)</span>
                          )}
                        </Label>
                        <div className={cn(
                          "h-8 flex items-center px-3 rounded-md text-sm",
                          area._fromTakeoff && area._actualArea
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                            : "bg-muted"
                        )}>
                          {displayArea > 0 ? `${displayArea.toFixed(1)} m²` : "—"}
                        </div>
                      </div>
                    </div>

                    {/* Per-area Thickness (when enabled) */}
                    {usePerAreaThickness && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dashed">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Thickness</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              inputMode="numeric"
                              value={area.thickness || ""}
                              onChange={(e) =>
                                updateArea(area.id, "thickness", e.target.value === "" ? undefined : Number(e.target.value))
                              }
                              min={thicknessMin}
                              step={5}
                              placeholder={thickness ? String(thickness) : "e.g. 100"}
                              className="pr-10 h-8 text-sm"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                              mm
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Volume</Label>
                          <div className="h-8 flex items-center px-3 rounded-md text-sm bg-muted tabular-nums">
                            {displayArea > 0 && (area.thickness || thickness)
                              ? `${(displayArea * ((area.thickness || thickness) / 1000)).toFixed(2)} m³`
                              : "—"}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => duplicateArea(area)}
                        >
                          <Copy className="h-3 w-3" />
                          Duplicate
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                          onClick={() => removeArea(area.id)}
                          disabled={areas.length <= 1}
                        >
                          <Trash2 className="h-3 w-3" />
                          Remove
                        </Button>
                      </div>
                      {area._fromTakeoff && area._actualArea && (
                        <p className="text-[10px] text-blue-600 dark:text-blue-400">
                          📐 Measured from plan
                        </p>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>

      {/* Add area input */}
      <div className="flex items-center gap-2 pt-2 border-t">
        <Input
          placeholder="New area name (optional)"
          value={newAreaName}
          onChange={(e) => setNewAreaName(e.target.value)}
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
          Add Area
        </Button>
      </div>

      {/* Thickness settings - (hidden for waffle pods which use pod thickness) */}
      {!isWafflePod && (
        <div className="pt-4 border-t space-y-4">
          {/* Per-area thickness toggle */}
          {onUsePerAreaThicknessChange && areas.length > 1 && (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-medium">Different thickness per area</Label>
                <p className="text-[10px] text-muted-foreground">
                  Set individual thickness for each area measurement
                </p>
              </div>
              <div className="flex items-center gap-3 px-3 py-1.5 rounded-md border bg-background">
                <Switch
                  checked={usePerAreaThickness}
                  onCheckedChange={(checked) => onUsePerAreaThicknessChange(checked)}
                />
                <span className={cn(
                  "text-sm min-w-[3ch]",
                  usePerAreaThickness ? "text-foreground" : "text-muted-foreground"
                )}>
                  {usePerAreaThickness ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          )}

          {/* Shared thickness setting - PROMINENT when empty, hidden when per-area mode is active */}
          {!usePerAreaThickness && (
            <div className={cn(
              "transition-all",
              showThicknessWarning && "bg-amber-500/10 border border-amber-500/30 rounded-lg p-6 -mx-1"
            )}>
              <div className={cn(
                "space-y-4",
                showThicknessWarning && "flex flex-col items-center text-center"
              )}>
                {showThicknessWarning && (
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-6 w-6" />
                    <span className="font-semibold text-base">Slab Thickness Required</span>
                  </div>
                )}
                
                <Label className={cn(
                  "font-medium block",
                  showThicknessWarning ? "text-base text-muted-foreground" : "text-xs"
                )}>
                  {thickness ? (
                    <>Thickness <span className="text-muted-foreground font-normal">— shared across all areas</span></>
                  ) : (
                    "Enter the slab thickness from your drawings"
                  )}
                </Label>
                
                <div className={cn("relative", showThicknessWarning ? "w-64" : "max-w-[200px]")}>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={thickness || ""}
                    onChange={(e) =>
                      onThicknessChange(e.target.value === "" ? 0 : Number(e.target.value))
                    }
                    min={thicknessMin}
                    step={5}
                    placeholder={showThicknessWarning ? "e.g. 100" : undefined}
                    className={cn(
                      "pr-12 text-center transition-all",
                      showThicknessWarning 
                        ? "h-16 text-2xl font-medium border-2 border-amber-500/50 bg-background" 
                        : "h-8 text-sm"
                    )}
                  />
                  <span className={cn(
                    "absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground",
                    showThicknessWarning ? "text-lg" : "text-[10px]"
                  )}>
                    mm
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Thickening / Edge Beams option */}
      {showThickeningOption && (
        <div className="pt-3 border-t space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Thickening / Edge Beams</Label>
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-md border bg-background">
              <Switch
                checked={hasThickening}
                onCheckedChange={(checked) => onThickeningChange?.(checked)}
              />
              <span className={cn(
                "text-sm min-w-[3ch]",
                hasThickening ? "text-foreground" : "text-muted-foreground"
              )}>
                {hasThickening ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
          
          {hasThickening && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Thickening Depth</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={thickeningDepth || ""}
                    onChange={(e) =>
                      onThickeningDepthChange?.(e.target.value === "" ? 300 : Number(e.target.value))
                    }
                    min={100}
                    step={50}
                    className="pr-10 h-8 text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                    mm
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Thickening Width</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={thickeningWidth || ""}
                    onChange={(e) =>
                      onThickeningWidthChange?.(e.target.value === "" ? 300 : Number(e.target.value))
                    }
                    min={100}
                    step={50}
                    className="pr-10 h-8 text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                    mm
                  </span>
                </div>
              </div>
              <p className="col-span-2 text-[10px] text-muted-foreground">
                Extra volume calculated based on perimeter × depth × width
              </p>
            </div>
          )}
        </div>
      )}

      <MarkupPromptDialog
        open={showMarkupPrompt}
        onOpenChange={setShowMarkupPrompt}
        itemType="area"
        onMarkOnPlans={handleMarkOnPlans}
        onEnterManually={handleEnterManually}
        dontAskAgain={dontAskAgain}
        onDontAskAgainChange={setDontAskAgain}
      />
    </div>
  );
}
