import { useState } from "react";
import { Plus, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MeasurementArea } from "@/lib/estimate-components/types";

interface MultiAreaInputProps {
  label: string;
  areas: MeasurementArea[];
  onChange: (areas: MeasurementArea[]) => void;
  thickness: number;
  onThicknessChange: (thickness: number) => void;
  thicknessDefault?: number;
  thicknessMin?: number;
}

export function MultiAreaInput({
  label,
  areas,
  onChange,
  thickness,
  onThicknessChange,
  thicknessDefault = 100,
  thicknessMin = 75,
}: MultiAreaInputProps) {
  const [newAreaName, setNewAreaName] = useState("");

  // Calculate totals
  const totalArea = areas.reduce((sum, area) => {
    const l = Number(area.length) || 0;
    const w = Number(area.width) || 0;
    return sum + l * w;
  }, 0);

  // Approximate perimeter (sum of individual perimeters)
  const totalPerimeter = areas.reduce((sum, area) => {
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
      },
    ]);
  };

  const updateArea = (id: string, field: keyof MeasurementArea, value: any) => {
    onChange(
      areas.map((area) =>
        area.id === id ? { ...area, [field]: value } : area
      )
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Area list */}
        <div className="space-y-3">
          {areas.map((area, index) => {
            const areaValue =
              (Number(area.length) || 0) * (Number(area.width) || 0);
            return (
              <div
                key={area.id}
                className="border rounded-lg p-3 bg-muted/30 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <Input
                    value={area.name}
                    onChange={(e) => updateArea(area.id, "name", e.target.value)}
                    placeholder={`Area ${index + 1}`}
                    className="font-medium flex-1"
                  />
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
                    </Label>
                    <div className="h-9 flex items-center px-3 bg-muted rounded-md text-sm">
                      {areaValue > 0 ? `${areaValue.toFixed(1)} m²` : "—"}
                    </div>
                  </div>
                </div>
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
      </CardContent>
    </Card>
  );
}
