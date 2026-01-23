import { useState, useMemo } from "react";
import { Plus, Trash2, Copy, ChevronDown, ChevronRight, Settings2, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

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
  const [openBeams, setOpenBeams] = useState<Set<string>>(new Set(beams.map(b => b.id)));

  const toggleBeam = (beamId: string) => {
    setOpenBeams(prev => {
      const next = new Set(prev);
      if (next.has(beamId)) {
        next.delete(beamId);
      } else {
        next.add(beamId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    const allOpen = beams.every(b => openBeams.has(b.id));
    if (allOpen) {
      setOpenBeams(new Set());
    } else {
      setOpenBeams(new Set(beams.map(b => b.id)));
    }
  };

  // Summary calculations
  const summary = useMemo(() => {
    let totalLength = 0;
    let totalVolume = 0;

    beams.forEach(beam => {
      const lengthM = Number(beam.length) || 0;
      const widthM = (Number(beam.width) || 0) / 1000;
      const depthM = (Number(beam.depth) || 0) / 1000;
      totalLength += lengthM;
      totalVolume += lengthM * widthM * depthM;
    });

    return { totalLength, totalVolume, total: beams.length };
  }, [beams]);

  const addBeam = () => {
    const beamNumber = beams.length + 1;
    const name = newBeamName.trim() || `Internal Beam ${beamNumber}`;
    const newBeam: BeamConfig = {
      id: `beam-${Date.now()}`,
      name,
      length: 0,
      width: 300,
      depth: 400,
    };
    onChange([...beams, newBeam]);
    setNewBeamName("");
    setOpenBeams(prev => new Set([...prev, newBeam.id]));
  };

  const removeBeam = (id: string) => {
    if (beams.length > 1) {
      onChange(beams.filter((b) => b.id !== id));
    }
  };

  const duplicateBeam = (beam: BeamConfig) => {
    const newBeam: BeamConfig = {
      ...beam,
      id: `beam-${Date.now()}`,
      name: `${beam.name} (copy)`,
    };
    onChange([...beams, newBeam]);
    setOpenBeams(prev => new Set([...prev, newBeam.id]));
  };

  const updateBeam = (id: string, field: keyof BeamConfig, value: any) => {
    onChange(
      beams.map((beam) =>
        beam.id === id ? { ...beam, [field]: value } : beam
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="flex items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground">{summary.total}</span>
            <span>beam{summary.total !== 1 ? 's' : ''}</span>
            <span className="text-muted-foreground/60">({summary.totalLength.toFixed(1)}m)</span>
          </div>
          <span className="text-border">•</span>
          <span>{summary.totalVolume.toFixed(2)} m³ total</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleAll}
          className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
        >
          <ChevronsUpDown className="h-3.5 w-3.5" />
          {beams.every(b => openBeams.has(b.id)) ? 'Collapse' : 'Expand'}
        </Button>
      </div>

      {/* Beam Cards */}
      <div className="space-y-2">
        {beams.map((beam) => {
          const isOpen = openBeams.has(beam.id);
          const lengthM = Number(beam.length) || 0;
          const widthM = (Number(beam.width) || 0) / 1000;
          const depthM = (Number(beam.depth) || 0) / 1000;
          const volume = lengthM * widthM * depthM;
          
          return (
            <Collapsible key={beam.id} open={isOpen} onOpenChange={() => toggleBeam(beam.id)}>
              <div className="border rounded-lg overflow-hidden bg-card transition-colors">
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
                        <span className="font-medium text-sm">{beam.name}</span>
                        <Badge variant="outline" className="text-xs font-normal h-5">
                          {lengthM.toFixed(1)}m
                        </Badge>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {beam.width}w × {beam.depth}d
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {volume > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {volume.toFixed(2)} m³
                        </span>
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
                        value={beam.name}
                        onChange={(e) => updateBeam(beam.id, "name", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>

                    {/* Dimensions */}
                    <div className="grid grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Length</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            inputMode="decimal"
                            value={beam.length || ""}
                            onChange={(e) =>
                              updateBeam(beam.id, "length", e.target.value === "" ? 0 : Number(e.target.value))
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
                        <Label className="text-[10px] text-muted-foreground">{widthLabel}</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            inputMode="numeric"
                            value={beam.width || ""}
                            onChange={(e) =>
                              updateBeam(beam.id, "width", e.target.value === "" ? 0 : Number(e.target.value))
                            }
                            min={100}
                            step={50}
                            className="pr-10 h-8 text-sm"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                            mm
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">{depthLabel}</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            inputMode="numeric"
                            value={beam.depth || ""}
                            onChange={(e) =>
                              updateBeam(beam.id, "depth", e.target.value === "" ? 0 : Number(e.target.value))
                            }
                            min={100}
                            step={50}
                            className="pr-10 h-8 text-sm"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                            mm
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Volume</Label>
                        <div className="h-8 flex items-center px-3 bg-muted rounded-md text-sm">
                          {volume > 0 ? `${volume.toFixed(2)} m³` : "—"}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end pt-2 border-t gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => duplicateBeam(beam)}
                      >
                        <Copy className="h-3 w-3" />
                        Duplicate
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                        onClick={() => removeBeam(beam.id)}
                        disabled={beams.length <= 1}
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>

      {/* Add beam input */}
      <div className="flex items-center gap-2 pt-2 border-t">
        <Input
          placeholder="New beam name (optional)"
          value={newBeamName}
          onChange={(e) => setNewBeamName(e.target.value)}
          className="flex-1 h-8 text-sm"
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
          size="sm"
          onClick={addBeam}
          className="gap-1 h-8"
        >
          <Plus className="h-4 w-4" />
          Add Beam
        </Button>
      </div>
    </div>
  );
}
