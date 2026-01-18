import { useState } from "react";
import { Plus, Trash2, Copy, Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export interface DemolitionArea {
  id: string;
  name: string;
  length: number;    // metres
  width: number;     // metres
  thickness: number; // mm (each area can have different thickness)
}

interface MultiDemolitionInputProps {
  label: string;
  areas: DemolitionArea[];
  onChange: (areas: DemolitionArea[]) => void;
  breakingRate: number;
  onBreakingRateChange: (rate: number) => void;
  tipRate: number;
  onTipRateChange: (rate: number) => void;
  rockBreakerRequired: boolean;
  onRockBreakerRequiredChange: (required: boolean) => void;
  rockBreakerCost: number;
  onRockBreakerCostChange: (cost: number) => void;
}

const CONCRETE_DENSITY = 2.4; // tonnes per m³

export function MultiDemolitionInput({
  label,
  areas,
  onChange,
  breakingRate,
  onBreakingRateChange,
  tipRate,
  onTipRateChange,
  rockBreakerRequired,
  onRockBreakerRequiredChange,
  rockBreakerCost,
  onRockBreakerCostChange,
}: MultiDemolitionInputProps) {
  const [newAreaName, setNewAreaName] = useState("");

  // Calculate totals
  const totalVolume = areas.reduce((sum, area) => {
    const l = Number(area.length) || 0;
    const w = Number(area.width) || 0;
    const thicknessM = (Number(area.thickness) || 100) / 1000;
    return sum + l * w * thicknessM;
  }, 0);

  const totalWeight = totalVolume * CONCRETE_DENSITY;

  const addArea = () => {
    const areaNumber = areas.length + 1;
    const name = newAreaName.trim() || `Demo Area ${areaNumber}`;
    onChange([
      ...areas,
      {
        id: `demo-area-${Date.now()}`,
        name,
        length: 0,
        width: 0,
        thickness: 100, // Default 100mm
      },
    ]);
    setNewAreaName("");
  };

  const removeArea = (id: string) => {
    if (areas.length > 1) {
      onChange(areas.filter((a) => a.id !== id));
    }
  };

  const duplicateArea = (area: DemolitionArea) => {
    onChange([
      ...areas,
      {
        ...area,
        id: `demo-area-${Date.now()}`,
        name: `${area.name} (copy)`,
      },
    ]);
  };

  const updateArea = (id: string, field: keyof DemolitionArea, value: any) => {
    onChange(
      areas.map((area) => {
        if (area.id !== id) return area;
        return { ...area, [field]: value };
      })
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Hammer className="h-4 w-4" />
            {label}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Area list */}
        <div className="space-y-3">
          {areas.map((area, index) => {
            const l = Number(area.length) || 0;
            const w = Number(area.width) || 0;
            const thicknessM = (Number(area.thickness) || 100) / 1000;
            const areaM2 = l * w;
            const volumeM3 = areaM2 * thicknessM;
            const weightT = volumeM3 * CONCRETE_DENSITY;

            return (
              <div
                key={area.id}
                className="border rounded-lg p-3 space-y-3 bg-muted/30"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={area.name}
                      onChange={(e) => updateArea(area.id, "name", e.target.value)}
                      placeholder={`Demo Area ${index + 1}`}
                      className="font-medium flex-1"
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 sm:h-8 sm:w-8"
                      onClick={() => duplicateArea(area)}
                      title="Duplicate area"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 sm:h-8 sm:w-8 text-destructive hover:text-destructive"
                      onClick={() => removeArea(area.id)}
                      disabled={areas.length <= 1}
                      title="Remove area"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Length</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        inputMode="decimal"
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
                        className="pr-8 h-11 sm:h-9"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        m
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Width</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        inputMode="decimal"
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
                        className="pr-8 h-11 sm:h-9"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        m
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Thickness</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={area.thickness || ""}
                        onChange={(e) =>
                          updateArea(
                            area.id,
                            "thickness",
                            e.target.value === "" ? 100 : Number(e.target.value)
                          )
                        }
                        min={50}
                        step={10}
                        className="pr-10 h-11 sm:h-9"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        mm
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Volume / Weight
                    </Label>
                    <div className="h-11 sm:h-9 flex items-center px-3 rounded-md text-sm bg-muted">
                      {volumeM3 > 0 
                        ? `${volumeM3.toFixed(2)}m³ / ${weightT.toFixed(1)}t` 
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add area button */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="New area name (optional)"
            value={newAreaName}
            onChange={(e) => setNewAreaName(e.target.value)}
            className="flex-1 h-11 sm:h-9"
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
            className="shrink-0 h-11 sm:h-9"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Area
          </Button>
        </div>

        {/* Combined totals */}
        <div className="flex flex-wrap gap-4 pt-3 border-t text-sm">
          <div>
            <span className="text-muted-foreground">Total Volume: </span>
            <span className="font-medium">{totalVolume.toFixed(2)} m³</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Weight: </span>
            <span className="font-medium">{totalWeight.toFixed(1)} t</span>
          </div>
        </div>

        {/* Pricing section */}
        <div className="pt-3 border-t space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Breaking Rate</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={breakingRate || ""}
                  onChange={(e) =>
                    onBreakingRateChange(
                      e.target.value === "" ? 150 : Number(e.target.value)
                    )
                  }
                  min={0}
                  step={10}
                  className="pl-7 pr-12 h-11 sm:h-9"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  /m³
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Tip Rate</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={tipRate || ""}
                  onChange={(e) =>
                    onTipRateChange(
                      e.target.value === "" ? 400 : Number(e.target.value)
                    )
                  }
                  min={0}
                  step={10}
                  className="pl-7 pr-12 h-11 sm:h-9"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  /t
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Rock breaker option */}
        <div className="pt-3 border-t space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Is a rock breaker required?
            </Label>
            <Switch
              checked={rockBreakerRequired}
              onCheckedChange={onRockBreakerRequiredChange}
            />
          </div>

          {rockBreakerRequired && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="space-y-1.5 max-w-[200px]">
                <Label className="text-xs text-muted-foreground">
                  Rock Breaker Hire
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={rockBreakerCost || ""}
                    onChange={(e) =>
                      onRockBreakerCostChange(
                        e.target.value === "" ? 200 : Number(e.target.value)
                      )
                    }
                    min={0}
                    step={10}
                    className="pl-7 pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    /day
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
