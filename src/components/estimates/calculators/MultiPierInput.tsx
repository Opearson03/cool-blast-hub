import { useState } from "react";
import { Plus, Trash2, Copy, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PierConfig } from "@/lib/estimate-components/types";

interface MultiPierInputProps {
  label: string;
  piers: PierConfig[];
  onChange: (piers: PierConfig[]) => void;
}

export function MultiPierInput({
  label,
  piers,
  onChange,
}: MultiPierInputProps) {
  const [newPierName, setNewPierName] = useState("");

  // Check if any pier is from takeoff
  const hasAnyTakeoffPiers = piers.some((p) => p._fromTakeoff);

  // Calculate totals
  const totalPiers = piers.reduce((sum, pier) => sum + (Number(pier.quantity) || 0), 0);

  const totalVolume = piers.reduce((sum, pier) => {
    const qty = Number(pier.quantity) || 0;
    const diamM = (Number(pier.diameter) || 0) / 1000;
    const depthM = (Number(pier.depth) || 0) / 1000;
    const radius = diamM / 2;
    return sum + qty * Math.PI * radius * radius * depthM;
  }, 0);

  const addPier = () => {
    const pierNumber = piers.length + 1;
    const name = newPierName.trim() || `Pier Type ${pierNumber}`;
    onChange([
      ...piers,
      {
        id: `pier-${Date.now()}`,
        name,
        quantity: 1,
        diameter: 450,
        depth: 600,
      },
    ]);
    setNewPierName("");
  };

  const removePier = (id: string) => {
    if (piers.length > 1) {
      onChange(piers.filter((p) => p.id !== id));
    }
  };

  const duplicatePier = (pier: PierConfig) => {
    onChange([
      ...piers,
      {
        ...pier,
        id: `pier-${Date.now()}`,
        name: `${pier.name} (copy)`,
        _fromTakeoff: false, // Duplicate is not from takeoff
      },
    ]);
  };

  const updatePier = (id: string, field: keyof PierConfig, value: any) => {
    onChange(
      piers.map((pier) => {
        if (pier.id !== id) return pier;
        
        // If editing any field, clear takeoff flag since user is overriding
        if (pier._fromTakeoff) {
          return {
            ...pier,
            [field]: value,
            _fromTakeoff: false,
          };
        }
        
        return { ...pier, [field]: value };
      })
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{label}</CardTitle>
          {hasAnyTakeoffPiers && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 gap-1">
              <Ruler className="h-3 w-3" />
              From plan takeoff
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pier list */}
        <div className="space-y-3">
          {piers.map((pier, index) => {
            const qty = Number(pier.quantity) || 0;
            const diamM = (Number(pier.diameter) || 0) / 1000;
            const depthM = (Number(pier.depth) || 0) / 1000;
            const radius = diamM / 2;
            const pierVolume = qty * Math.PI * radius * radius * depthM;

            return (
              <div
                key={pier.id}
                className={`border rounded-lg p-3 space-y-3 ${
                  pier._fromTakeoff
                    ? "bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
                    : "bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    {pier._fromTakeoff && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="shrink-0 w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                              <Ruler className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Counted from plan takeoff</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <Input
                      value={pier.name}
                      onChange={(e) => updatePier(pier.id, "name", e.target.value)}
                      placeholder={`Pier Type ${index + 1}`}
                      className="font-medium flex-1"
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 sm:h-8 sm:w-8"
                      onClick={() => duplicatePier(pier)}
                      title="Duplicate pier type"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 sm:h-8 sm:w-8 text-destructive hover:text-destructive"
                      onClick={() => removePier(pier.id)}
                      disabled={piers.length <= 1}
                      title="Remove pier type"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Quantity
                    </Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={pier.quantity || ""}
                      onChange={(e) =>
                        updatePier(
                          pier.id,
                          "quantity",
                          e.target.value === "" ? 0 : Number(e.target.value)
                        )
                      }
                      min={1}
                      step={1}
                      className="h-11 sm:h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Diameter
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={pier.diameter || ""}
                        onChange={(e) =>
                          updatePier(
                            pier.id,
                            "diameter",
                            e.target.value === "" ? 0 : Number(e.target.value)
                          )
                        }
                        min={100}
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
                      Depth
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={pier.depth || ""}
                        onChange={(e) =>
                          updatePier(
                            pier.id,
                            "depth",
                            e.target.value === "" ? 0 : Number(e.target.value)
                          )
                        }
                        min={100}
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
                      {pierVolume > 0 ? `${pierVolume.toFixed(3)} m³` : "—"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add pier button */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="New pier type name (optional)"
            value={newPierName}
            onChange={(e) => setNewPierName(e.target.value)}
            className="flex-1 h-11 sm:h-9"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addPier();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={addPier}
            className="shrink-0 h-11 sm:h-9"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Pier Type
          </Button>
        </div>

        {/* Combined totals */}
        <div className="flex flex-wrap gap-4 pt-3 border-t text-sm">
          <div>
            <span className="text-muted-foreground">Total Piers: </span>
            <span className="font-medium">{totalPiers}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Volume: </span>
            <span className="font-medium">{totalVolume.toFixed(3)} m³</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
