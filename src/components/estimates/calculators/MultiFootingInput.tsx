import { useState } from "react";
import { Plus, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FootingConfig } from "@/lib/estimate-components/types";

interface MultiFootingInputProps {
  label: string;
  footings: FootingConfig[];
  onChange: (footings: FootingConfig[]) => void;
  widthLabel?: string;
  depthLabel?: string;
}

export function MultiFootingInput({
  label,
  footings,
  onChange,
  widthLabel = "Width",
  depthLabel = "Depth",
}: MultiFootingInputProps) {
  const [newFootingName, setNewFootingName] = useState("");

  // Calculate totals
  const totalLength = footings.reduce((sum, footing) => sum + (Number(footing.length) || 0), 0);

  const totalVolume = footings.reduce((sum, footing) => {
    const length = Number(footing.length) || 0;
    const widthM = (Number(footing.width) || 0) / 1000;
    const depthM = (Number(footing.depth) || 0) / 1000;
    return sum + length * widthM * depthM;
  }, 0);

  const addFooting = () => {
    const footingNumber = footings.length + 1;
    const name = newFootingName.trim() || `Footing ${footingNumber}`;
    onChange([
      ...footings,
      {
        id: `footing-${Date.now()}`,
        name,
        length: 0,
        width: 450,
        depth: 300,
      },
    ]);
    setNewFootingName("");
  };

  const removeFooting = (id: string) => {
    if (footings.length > 1) {
      onChange(footings.filter((f) => f.id !== id));
    }
  };

  const duplicateFooting = (footing: FootingConfig) => {
    onChange([
      ...footings,
      {
        ...footing,
        id: `footing-${Date.now()}`,
        name: `${footing.name} (copy)`,
      },
    ]);
  };

  const updateFooting = (id: string, field: keyof FootingConfig, value: any) => {
    onChange(
      footings.map((footing) =>
        footing.id === id ? { ...footing, [field]: value } : footing
      )
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Footing list */}
        <div className="space-y-3">
          {footings.map((footing, index) => {
            const length = Number(footing.length) || 0;
            const widthM = (Number(footing.width) || 0) / 1000;
            const depthM = (Number(footing.depth) || 0) / 1000;
            const footingVolume = length * widthM * depthM;

            return (
              <div
                key={footing.id}
                className="border rounded-lg p-3 bg-muted/30 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <Input
                    value={footing.name}
                    onChange={(e) => updateFooting(footing.id, "name", e.target.value)}
                    placeholder={`Footing ${index + 1}`}
                    className="font-medium flex-1"
                  />
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => duplicateFooting(footing)}
                      title="Duplicate footing"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeFooting(footing.id)}
                      disabled={footings.length <= 1}
                      title="Remove footing"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Length
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={footing.length || ""}
                        onChange={(e) =>
                          updateFooting(
                            footing.id,
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
                      {widthLabel}
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={footing.width || ""}
                        onChange={(e) =>
                          updateFooting(
                            footing.id,
                            "width",
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
                      {depthLabel}
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={footing.depth || ""}
                        onChange={(e) =>
                          updateFooting(
                            footing.id,
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
                      {footingVolume > 0 ? `${footingVolume.toFixed(3)} m³` : "—"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add footing button */}
        <div className="flex gap-2">
          <Input
            placeholder="New footing name (optional)"
            value={newFootingName}
            onChange={(e) => setNewFootingName(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFooting();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={addFooting}
            className="shrink-0"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Footing
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
        </div>
      </CardContent>
    </Card>
  );
}
