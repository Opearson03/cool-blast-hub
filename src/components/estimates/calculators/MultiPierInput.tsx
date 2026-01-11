import { useState } from "react";
import { Plus, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      },
    ]);
  };

  const updatePier = (id: string, field: keyof PierConfig, value: any) => {
    onChange(
      piers.map((pier) =>
        pier.id === id ? { ...pier, [field]: value } : pier
      )
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{label}</CardTitle>
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
                className="border rounded-lg p-3 bg-muted/30 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <Input
                    value={pier.name}
                    onChange={(e) => updatePier(pier.id, "name", e.target.value)}
                    placeholder={`Pier Type ${index + 1}`}
                    className="font-medium flex-1"
                  />
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => duplicatePier(pier)}
                      title="Duplicate pier type"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removePier(pier.id)}
                      disabled={piers.length <= 1}
                      title="Remove pier type"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Quantity
                    </Label>
                    <Input
                      type="number"
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
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Diameter
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
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
                        className="pr-12"
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
                        className="pr-12"
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
                    <div className="h-9 flex items-center px-3 bg-muted rounded-md text-sm">
                      {pierVolume > 0 ? `${pierVolume.toFixed(3)} m³` : "—"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add pier button */}
        <div className="flex gap-2">
          <Input
            placeholder="New pier type name (optional)"
            value={newPierName}
            onChange={(e) => setNewPierName(e.target.value)}
            className="flex-1"
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
            className="shrink-0"
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
