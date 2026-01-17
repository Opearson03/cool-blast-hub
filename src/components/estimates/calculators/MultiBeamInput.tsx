import { useState } from "react";
import { Plus, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface BeamConfig {
  id: string;
  name: string;
  length: number;    // metres
  width: number;     // mm
  depth: number;     // mm
}

interface MultiBeamInputProps {
  label: string;
  beams: BeamConfig[];
  onChange: (beams: BeamConfig[]) => void;
  widthLabel?: string;
  depthLabel?: string;
}

export function MultiBeamInput({
  label,
  beams,
  onChange,
  widthLabel = "Width",
  depthLabel = "Depth",
}: MultiBeamInputProps) {
  const [newBeamName, setNewBeamName] = useState("");

  // Calculate totals
  const totalLength = beams.reduce((sum, beam) => sum + (Number(beam.length) || 0), 0);
  
  // Calculate weighted average width and depth
  const totalLengthNonZero = totalLength > 0 ? totalLength : 1;
  const avgWidth = beams.reduce((sum, beam) => {
    const length = Number(beam.length) || 0;
    return sum + length * (Number(beam.width) || 0);
  }, 0) / totalLengthNonZero;
  
  const avgDepth = beams.reduce((sum, beam) => {
    const length = Number(beam.length) || 0;
    return sum + length * (Number(beam.depth) || 0);
  }, 0) / totalLengthNonZero;

  const addBeam = () => {
    const beamNumber = beams.length + 1;
    const name = newBeamName.trim() || `Internal Beam ${beamNumber}`;
    onChange([
      ...beams,
      {
        id: `beam-${Date.now()}`,
        name,
        length: 0,
        width: 300,
        depth: 400,
      },
    ]);
    setNewBeamName("");
  };

  const removeBeam = (id: string) => {
    if (beams.length > 1) {
      onChange(beams.filter((b) => b.id !== id));
    }
  };

  const duplicateBeam = (beam: BeamConfig) => {
    onChange([
      ...beams,
      {
        ...beam,
        id: `beam-${Date.now()}`,
        name: `${beam.name} (copy)`,
      },
    ]);
  };

  const updateBeam = (id: string, field: keyof BeamConfig, value: any) => {
    onChange(
      beams.map((beam) =>
        beam.id === id ? { ...beam, [field]: value } : beam
      )
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Beam list */}
        <div className="space-y-3">
          {beams.map((beam, index) => {
            const lengthM = Number(beam.length) || 0;
            const widthM = (Number(beam.width) || 0) / 1000;
            const depthM = (Number(beam.depth) || 0) / 1000;
            const volume = lengthM * widthM * depthM;
            
            return (
              <div
                key={beam.id}
                className="border rounded-lg p-3 bg-muted/30 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <Input
                    value={beam.name}
                    onChange={(e) => updateBeam(beam.id, "name", e.target.value)}
                    placeholder={`Beam ${index + 1}`}
                    className="font-medium flex-1"
                  />
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 sm:h-8 sm:w-8"
                      onClick={() => duplicateBeam(beam)}
                      title="Duplicate beam"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 sm:h-8 sm:w-8 text-destructive hover:text-destructive"
                      onClick={() => removeBeam(beam.id)}
                      disabled={beams.length <= 1}
                      title="Remove beam"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Length
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={beam.length || ""}
                        onChange={(e) =>
                          updateBeam(
                            beam.id,
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
                      {widthLabel}
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={beam.width || ""}
                        onChange={(e) =>
                          updateBeam(
                            beam.id,
                            "width",
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
                      {depthLabel}
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={beam.depth || ""}
                        onChange={(e) =>
                          updateBeam(
                            beam.id,
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
                      {volume > 0 ? `${volume.toFixed(2)} m³` : "—"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add beam button */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="New beam name (optional)"
            value={newBeamName}
            onChange={(e) => setNewBeamName(e.target.value)}
            className="flex-1 h-11 sm:h-9"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addBeam();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={addBeam}
            className="shrink-0 h-11 sm:h-9"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Beam
          </Button>
        </div>

        {/* Combined totals */}
        <div className="flex flex-wrap gap-4 pt-3 border-t text-sm">
          <div>
            <span className="text-muted-foreground">Total Length: </span>
            <span className="font-medium">{totalLength.toFixed(1)} m</span>
          </div>
          {totalLength > 0 && (
            <>
              <div>
                <span className="text-muted-foreground">Avg Width: </span>
                <span className="font-medium">{Math.round(avgWidth)} mm</span>
              </div>
              <div>
                <span className="text-muted-foreground">Avg Depth: </span>
                <span className="font-medium">{Math.round(avgDepth)} mm</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
