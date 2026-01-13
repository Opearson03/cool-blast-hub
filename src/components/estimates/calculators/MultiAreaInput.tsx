import { useState } from "react";
import { Plus, Trash2, Copy, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MeasurementArea } from "@/lib/estimate-components/types";

interface MultiAreaInputProps {
  label: string;
  areas: MeasurementArea[];
  onChange: (areas: MeasurementArea[]) => void;
  thickness: number;
  onThicknessChange: (thickness: number) => void;
  thicknessDefault?: number;
  thicknessMin?: number;
  // Thickening/edge beam support
  showThickeningOption?: boolean;
  hasThickening?: boolean;
  onThickeningChange?: (hasThickening: boolean) => void;
  thickeningDepth?: number;
  onThickeningDepthChange?: (depth: number) => void;
  thickeningWidth?: number;
  onThickeningWidthChange?: (width: number) => void;
}

export function MultiAreaInput({
  label,
  areas,
  onChange,
  thickness,
  onThicknessChange,
  thicknessDefault = 100,
  thicknessMin = 75,
  showThickeningOption = false,
  hasThickening = false,
  onThickeningChange,
  thickeningDepth = 300,
  onThickeningDepthChange,
  thickeningWidth = 300,
  onThickeningWidthChange,
}: MultiAreaInputProps) {
  const [newAreaName, setNewAreaName] = useState("");

  // Check if any areas are from takeoff
  const hasAnyTakeoffAreas = areas.some((area) => area._fromTakeoff);

  // Calculate totals - use _actualArea if available, otherwise calculate
  const totalArea = areas.reduce((sum, area) => {
    if (area._actualArea && area._actualArea > 0) {
      return sum + area._actualArea;
    }
    const l = Number(area.length) || 0;
    const w = Number(area.width) || 0;
    return sum + l * w;
  }, 0);

  // Approximate perimeter - use _actualPerimeter if available
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

  const addArea = () => {
    const areaNumber = areas.length + 1;
    const name = newAreaName.trim() || `Area ${areaNumber}`;
    onChange([
      ...areas,
      {
        id: `area-${Date.now()}`,
        name,
        length: 0,
        width: 0,
      },
    ]);
    setNewAreaName("");
  };

  const removeArea = (id: string) => {
    if (areas.length > 1) {
      onChange(areas.filter((a) => a.id !== id));
    }
  };

  const duplicateArea = (area: MeasurementArea) => {
    onChange([
      ...areas,
      {
        ...area,
        id: `area-${Date.now()}`,
        name: `${area.name} (copy)`,
        _fromTakeoff: false, // Duplicates are manual entries
        _actualArea: undefined,
        _actualPerimeter: undefined,
      },
    ]);
  };

  const updateArea = (id: string, field: keyof MeasurementArea, value: any) => {
    onChange(
      areas.map((area) => {
        if (area.id !== id) return area;
        
        // If editing length or width, clear takeoff flags since user is overriding
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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{label}</CardTitle>
          {hasAnyTakeoffAreas && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 gap-1">
              <Ruler className="h-3 w-3" />
              From plan takeoff
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Area list */}
        <div className="space-y-3">
          {areas.map((area, index) => {
            // Use actual area from takeoff if available
            const displayArea = area._actualArea && area._actualArea > 0
              ? area._actualArea
              : (Number(area.length) || 0) * (Number(area.width) || 0);
            
            return (
              <div
                key={area.id}
                className={`border rounded-lg p-3 space-y-3 ${
                  area._fromTakeoff 
                    ? "bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800" 
                    : "bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    {area._fromTakeoff && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="shrink-0 w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                              <Ruler className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Measured from plan takeoff</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <Input
                      value={area.name}
                      onChange={(e) => updateArea(area.id, "name", e.target.value)}
                      placeholder={`Area ${index + 1}`}
                      className="font-medium flex-1"
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => duplicateArea(area)}
                      title="Duplicate area"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeArea(area.id)}
                      disabled={areas.length <= 1}
                      title="Remove area"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Length
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={area.length || ""}
                        onChange={(e) =>
                          updateArea(
                            area.id,
                            "length",
                            e.target.value === "" ? 0 : Number(e.target.value)
                          )
                        }
                        min={0}
                        step={0.1}
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        m
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Width
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={area.width || ""}
                        onChange={(e) =>
                          updateArea(
                            area.id,
                            "width",
                            e.target.value === "" ? 0 : Number(e.target.value)
                          )
                        }
                        min={0}
                        step={0.1}
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        m
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Area
                      {area._fromTakeoff && area._actualArea && (
                        <span className="ml-1 text-blue-600 dark:text-blue-400">(measured)</span>
                      )}
                    </Label>
                    <div className={`h-9 flex items-center px-3 rounded-md text-sm ${
                      area._fromTakeoff && area._actualArea
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                        : "bg-muted"
                    }`}>
                      {displayArea > 0 ? `${displayArea.toFixed(1)} m²` : "—"}
                    </div>
                  </div>
                </div>

                {/* Show note for takeoff areas explaining dimensions are approximate */}
                {area._fromTakeoff && area._actualArea && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    📐 Area measured from plan. Length/width are approximations for reference.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Add area button */}
        <div className="flex gap-2">
          <Input
            placeholder="New area name (optional)"
            value={newAreaName}
            onChange={(e) => setNewAreaName(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addArea();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={addArea}
            className="shrink-0"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Area
          </Button>
        </div>

        {/* Combined totals */}
        <div className="flex flex-wrap gap-4 pt-3 border-t text-sm">
          <div>
            <span className="text-muted-foreground">Total Area: </span>
            <span className="font-medium">{totalArea.toFixed(1)} m²</span>
          </div>
          <div>
            <span className="text-muted-foreground">Est. Perimeter: </span>
            <span className="font-medium">{totalPerimeter.toFixed(1)} m</span>
          </div>
        </div>

        {/* Shared thickness setting */}
        <div className="pt-3 border-t">
          <Label className="text-sm font-medium">
            Thickness (mm)
            <span className="text-muted-foreground ml-1 font-normal">
              — shared across all areas
            </span>
          </Label>
          <div className="relative mt-1.5 max-w-[200px]">
            <Input
              type="number"
              value={thickness || ""}
              onChange={(e) =>
                onThicknessChange(
                  e.target.value === "" ? thicknessDefault : Number(e.target.value)
                )
              }
              min={thicknessMin}
              step={5}
              className="pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              mm
            </span>
          </div>
        </div>

        {/* Thickening / Edge Beams option */}
        {showThickeningOption && (
          <div className="pt-3 border-t space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Thickening / Edge Beams
              </Label>
              <Switch
                checked={hasThickening}
                onCheckedChange={(checked) => onThickeningChange?.(checked)}
              />
            </div>
            
            {hasThickening && (
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Thickening Depth (mm)
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={thickeningDepth || ""}
                      onChange={(e) =>
                        onThickeningDepthChange?.(
                          e.target.value === "" ? 300 : Number(e.target.value)
                        )
                      }
                      min={100}
                      step={50}
                      className="pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      mm
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Thickening Width (mm)
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={thickeningWidth || ""}
                      onChange={(e) =>
                        onThickeningWidthChange?.(
                          e.target.value === "" ? 300 : Number(e.target.value)
                        )
                      }
                      min={100}
                      step={50}
                      className="pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      mm
                    </span>
                  </div>
                </div>
                <p className="col-span-2 text-xs text-muted-foreground">
                  Extra volume will be calculated based on perimeter × depth × width
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
