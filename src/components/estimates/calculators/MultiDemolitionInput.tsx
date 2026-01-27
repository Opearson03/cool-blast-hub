import { useState } from "react";
import { Plus, Trash2, Copy, Hammer, Scissors, Users, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MarkupPromptDialog } from "./MarkupPromptDialog";
import { Checkbox } from "@/components/ui/checkbox";

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
  tipRate: number;
  onTipRateChange: (rate: number) => void;
  rockBreakerRequired: boolean;
  onRockBreakerRequiredChange: (required: boolean) => void;
  rockBreakerCost: number;
  onRockBreakerCostChange: (cost: number) => void;
  // Excavator hire props
  excavatorRequired?: boolean;
  onExcavatorRequiredChange?: (required: boolean) => void;
  excavatorType?: string;
  onExcavatorTypeChange?: (type: string) => void;
  excavatorRate?: number;
  onExcavatorRateChange?: (rate: number) => void;
  excavatorHours?: number;
  onExcavatorHoursChange?: (hours: number) => void;
  excavatorFloat?: number;
  onExcavatorFloatChange?: (float: number) => void;
  // Saw cutting props
  sawCuttingRequired?: boolean;
  onSawCuttingRequiredChange?: (required: boolean) => void;
  sawCuttingMethod?: string;
  onSawCuttingMethodChange?: (method: string) => void;
  sawCuttingLength?: number;
  onSawCuttingLengthChange?: (length: number) => void;
  sawCuttingRate?: number;
  onSawCuttingRateChange?: (rate: number) => void;
  sawCuttingHours?: number;
  onSawCuttingHoursChange?: (hours: number) => void;
  sawCuttingHourlyRate?: number;
  onSawCuttingHourlyRateChange?: (rate: number) => void;
  sawCuttingEstablishment?: number;
  onSawCuttingEstablishmentChange?: (rate: number) => void;
  // Labour hours props
  demoLabourRequired?: boolean;
  onDemoLabourRequiredChange?: (required: boolean) => void;
  demoCrewSize?: number;
  onDemoCrewSizeChange?: (size: number) => void;
  demoHours?: number;
  onDemoHoursChange?: (hours: number) => void;
  demoLabourRate?: number;
  onDemoLabourRateChange?: (rate: number) => void;
  // Markup prompt support
  onRequestMarkup?: () => void;
  hasPlans?: boolean;
  skipMarkupPrompt?: boolean;
  onSkipMarkupPromptChange?: (skip: boolean) => void;
}

const CONCRETE_DENSITY = 2.4; // tonnes per m³

const EXCAVATOR_OPTIONS = [
  { value: 'EXC 1.4T', label: '1.4T Excavator' },
  { value: 'EXC 3.2T', label: '3.2T Excavator' },
  { value: 'EXC 4T', label: '4T Excavator' },
  { value: 'EXC 6T', label: '6T Excavator' },
  { value: 'EXC 9T', label: '9T Excavator' },
  { value: 'POSI TRACK', label: 'Posi Track' },
];

export function MultiDemolitionInput({
  label,
  areas,
  onChange,
  tipRate,
  onTipRateChange,
  rockBreakerRequired,
  onRockBreakerRequiredChange,
  rockBreakerCost,
  onRockBreakerCostChange,
  // Excavator hire
  excavatorRequired = false,
  onExcavatorRequiredChange,
  excavatorType = 'EXC 3.2T',
  onExcavatorTypeChange,
  excavatorRate = 150,
  onExcavatorRateChange,
  excavatorHours = 4,
  onExcavatorHoursChange,
  excavatorFloat = 150,
  onExcavatorFloatChange,
  // Saw cutting
  sawCuttingRequired = false,
  onSawCuttingRequiredChange,
  sawCuttingMethod = 'linear',
  onSawCuttingMethodChange,
  sawCuttingLength = 0,
  onSawCuttingLengthChange,
  sawCuttingRate = 25,
  onSawCuttingRateChange,
  sawCuttingHours = 2,
  onSawCuttingHoursChange,
  sawCuttingHourlyRate = 180,
  onSawCuttingHourlyRateChange,
  sawCuttingEstablishment = 150,
  onSawCuttingEstablishmentChange,
  // Labour hours
  demoLabourRequired = false,
  onDemoLabourRequiredChange,
  demoCrewSize = 2,
  onDemoCrewSizeChange,
  demoHours = 4,
  onDemoHoursChange,
  demoLabourRate = 75,
  onDemoLabourRateChange,
  // Markup prompt support
  onRequestMarkup,
  skipMarkupPrompt = false,
  onSkipMarkupPromptChange,
}: MultiDemolitionInputProps) {
  const [newAreaName, setNewAreaName] = useState("");
  const [showMarkupPrompt, setShowMarkupPrompt] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(skipMarkupPrompt);
  const [pendingAreaName, setPendingAreaName] = useState("");

  // Calculate totals
  const totalVolume = areas.reduce((sum, area) => {
    const l = Number(area.length) || 0;
    const w = Number(area.width) || 0;
    const thicknessM = (Number(area.thickness) || 100) / 1000;
    return sum + l * w * thicknessM;
  }, 0);

  const totalWeight = totalVolume * CONCRETE_DENSITY;

  const addArea = (nameOverride?: string) => {
    const areaNumber = areas.length + 1;
    const name = nameOverride || newAreaName.trim() || `Demo Area ${areaNumber}`;
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
    setPendingAreaName("");
  };

  const handleAddClick = () => {
    // Show the markup prompt whenever the takeoff/markup flow is available.
    // (Even if no files are uploaded yet, the user can choose "Mark on plans"
    // and then upload/select plans in the takeoff step.)
    if (onRequestMarkup && !skipMarkupPrompt) {
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

        {/* Tip Rate section */}
        <div className="pt-3 border-t space-y-4">
          <div className="max-w-[200px]">
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

        {/* Excavator Hire option */}
        {onExcavatorRequiredChange && (
          <div className="pt-3 border-t space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Is an excavator required?
              </Label>
              <Switch
                checked={excavatorRequired}
                onCheckedChange={onExcavatorRequiredChange}
              />
            </div>

            {excavatorRequired && (
              <div className="p-3 bg-muted/50 rounded-lg space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Excavator Type
                    </Label>
                    <Select
                      value={excavatorType}
                      onValueChange={(value) => onExcavatorTypeChange?.(value)}
                    >
                      <SelectTrigger className="h-11 sm:h-9">
                        <SelectValue placeholder="Select excavator" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXCAVATOR_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Hourly Rate
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={excavatorRate || ""}
                        onChange={(e) =>
                          onExcavatorRateChange?.(
                            e.target.value === "" ? 150 : Number(e.target.value)
                          )
                        }
                        min={0}
                        step={10}
                        className="pl-7 pr-10 h-11 sm:h-9"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        /hr
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Hours
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={excavatorHours || ""}
                        onChange={(e) =>
                          onExcavatorHoursChange?.(
                            e.target.value === "" ? 4 : Number(e.target.value)
                          )
                        }
                        min={0.5}
                        step={0.5}
                        className="pr-10 h-11 sm:h-9"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        hrs
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Float Charge
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={excavatorFloat || ""}
                        onChange={(e) =>
                          onExcavatorFloatChange?.(
                            e.target.value === "" ? 150 : Number(e.target.value)
                          )
                        }
                        min={0}
                        step={10}
                        className="pl-7 h-11 sm:h-9"
                      />
                    </div>
                  </div>
                </div>
                {excavatorHours > 0 && excavatorRate > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Total: ${((excavatorHours * excavatorRate) + (excavatorFloat || 0)).toFixed(2)} (${(excavatorHours * excavatorRate).toFixed(2)} hire + ${excavatorFloat || 0} float)
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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

        {/* Saw Cutting option */}
        {onSawCuttingRequiredChange && (
          <div className="pt-3 border-t space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Scissors className="h-4 w-4" />
                Is saw cutting required?
              </Label>
              <Switch
                checked={sawCuttingRequired}
                onCheckedChange={onSawCuttingRequiredChange}
              />
            </div>

            {sawCuttingRequired && (
              <div className="p-3 bg-muted/50 rounded-lg space-y-4">
                {/* Method selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Pricing Method
                  </Label>
                  <Select
                    value={sawCuttingMethod}
                    onValueChange={(value) => onSawCuttingMethodChange?.(value)}
                  >
                    <SelectTrigger className="h-11 sm:h-9">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linear">Linear metre rate ($/m)</SelectItem>
                      <SelectItem value="hourly">Hourly rate ($/hr)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {sawCuttingMethod === 'linear' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Cutting Length
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          inputMode="decimal"
                          value={sawCuttingLength || ""}
                          onChange={(e) =>
                            onSawCuttingLengthChange?.(
                              e.target.value === "" ? 0 : Number(e.target.value)
                            )
                          }
                          min={0}
                          step={0.5}
                          className="pr-8 h-11 sm:h-9"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          m
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Saw Cutting Rate
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="number"
                          inputMode="decimal"
                          value={sawCuttingRate || ""}
                          onChange={(e) =>
                            onSawCuttingRateChange?.(
                              e.target.value === "" ? 25 : Number(e.target.value)
                            )
                          }
                          min={0}
                          step={0.5}
                          className="pl-7 pr-10 h-11 sm:h-9"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          /m
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Cutting Hours
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          inputMode="decimal"
                          value={sawCuttingHours || ""}
                          onChange={(e) =>
                            onSawCuttingHoursChange?.(
                              e.target.value === "" ? 2 : Number(e.target.value)
                            )
                          }
                          min={0.5}
                          step={0.5}
                          className="pr-10 h-11 sm:h-9"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          hrs
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Hourly Rate
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="number"
                          inputMode="decimal"
                          value={sawCuttingHourlyRate || ""}
                          onChange={(e) =>
                            onSawCuttingHourlyRateChange?.(
                              e.target.value === "" ? 180 : Number(e.target.value)
                            )
                          }
                          min={0}
                          step={10}
                          className="pl-7 pr-10 h-11 sm:h-9"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          /hr
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Site Establishment */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Site Establishment
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={sawCuttingEstablishment || ""}
                      onChange={(e) =>
                        onSawCuttingEstablishmentChange?.(
                          e.target.value === "" ? 150 : Number(e.target.value)
                        )
                      }
                      min={0}
                      step={10}
                      className="pl-7 h-11 sm:h-9"
                    />
                  </div>
                </div>

                {/* Total display */}
                {sawCuttingMethod === 'linear' && sawCuttingLength > 0 && sawCuttingRate > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Total: ${((sawCuttingLength * sawCuttingRate) + sawCuttingEstablishment).toFixed(2)}
                  </div>
                )}
                {sawCuttingMethod === 'hourly' && sawCuttingHours > 0 && sawCuttingHourlyRate > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Total: ${((sawCuttingHours * sawCuttingHourlyRate) + sawCuttingEstablishment).toFixed(2)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Demolition Labour Hours option */}
        {onDemoLabourRequiredChange && (
          <div className="pt-3 border-t space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Include demolition labour hours?
              </Label>
              <Switch
                checked={demoLabourRequired}
                onCheckedChange={onDemoLabourRequiredChange}
              />
            </div>

            {demoLabourRequired && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Crew Size
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={demoCrewSize || ""}
                        onChange={(e) =>
                          onDemoCrewSizeChange?.(
                            e.target.value === "" ? 2 : Number(e.target.value)
                          )
                        }
                        min={1}
                        step={1}
                        className="pr-12 h-11 sm:h-9"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        men
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Hours
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={demoHours || ""}
                        onChange={(e) =>
                          onDemoHoursChange?.(
                            e.target.value === "" ? 4 : Number(e.target.value)
                          )
                        }
                        min={0.5}
                        step={0.5}
                        className="pr-10 h-11 sm:h-9"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        hrs
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Labour Rate
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={demoLabourRate || ""}
                        onChange={(e) =>
                          onDemoLabourRateChange?.(
                            e.target.value === "" ? 75 : Number(e.target.value)
                          )
                        }
                        min={0}
                        step={5}
                        className="pl-7 pr-10 h-11 sm:h-9"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        /hr
                      </span>
                    </div>
                  </div>
                </div>
                {demoCrewSize > 0 && demoHours > 0 && demoLabourRate > 0 && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Total: ${(demoCrewSize * demoHours * demoLabourRate).toFixed(2)} ({demoCrewSize} × {demoHours} hrs × ${demoLabourRate}/hr)
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <MarkupPromptDialog
        open={showMarkupPrompt}
        onOpenChange={setShowMarkupPrompt}
        itemType="demolition area"
        onMarkOnPlans={handleMarkOnPlans}
        onEnterManually={handleEnterManually}
        dontAskAgain={dontAskAgain}
        onDontAskAgainChange={setDontAskAgain}
      />
    </Card>
  );
}
