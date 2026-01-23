import { BeamConfig } from "@/lib/estimate-components/types";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Settings2, Ruler, ChevronsUpDown } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

const TM_OPTIONS = [
  { value: 'L8TM3', label: 'L8TM3', width: '300mm' },
  { value: 'L8TM4', label: 'L8TM4', width: '400mm' },
  { value: 'L11TM3', label: 'L11TM3', width: '300mm' },
  { value: 'L11TM4', label: 'L11TM4', width: '400mm' },
  { value: 'L12TM3', label: 'L12TM3', width: '300mm' },
  { value: 'L12TM4', label: 'L12TM4', width: '400mm' },
  { value: 'L12TM5', label: 'L12TM5', width: '500mm' },
  { value: 'L16TM3', label: 'L16TM3', width: '300mm' },
];

const LIG_SIZE_OPTIONS = [
  { value: 'R10', label: 'R10' },
  { value: 'R12', label: 'R12' },
];

interface BeamReinforcementInputProps {
  beams: BeamConfig[];
  onChange: (beams: BeamConfig[]) => void;
  defaultTmType: string;
  defaultAddLigs: boolean;
  defaultLigSize: string;
  defaultLigCentres: number;
  label: string;
}

export function BeamReinforcementInput({
  beams,
  onChange,
  defaultTmType,
  defaultAddLigs,
  defaultLigSize,
  defaultLigCentres,
  label,
}: BeamReinforcementInputProps) {
  const [openBeams, setOpenBeams] = useState<Set<string>>(new Set());

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

  const updateBeam = (index: number, updates: Partial<BeamConfig>) => {
    const newBeams = [...beams];
    newBeams[index] = { ...newBeams[index], ...updates };
    onChange(newBeams);
  };

  // Summary calculations
  const summary = useMemo(() => {
    let totalLength = 0;
    let withLigsCount = 0;
    let customCount = 0;

    beams.forEach(beam => {
      totalLength += beam.length || 0;
      const addLigs = beam.add_ligs ?? defaultAddLigs;
      if (addLigs) withLigsCount++;
      if (beam.tm_type || beam.add_ligs !== undefined || beam.lig_size || beam.lig_centres) customCount++;
    });

    return { totalLength, withLigsCount, customCount, total: beams.length };
  }, [beams, defaultAddLigs]);

  if (beams.length === 0) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground italic py-4 px-3 border border-dashed rounded-lg">
        <Ruler className="h-5 w-5 opacity-50" />
        <span>No {label.toLowerCase()} defined. Add beams in the scope configuration above.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary Header */}
      <div className="flex items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1.5">
            <Ruler className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{summary.total}</span>
            <span>beam{summary.total !== 1 ? 's' : ''}</span>
            <span className="text-muted-foreground/60">({summary.totalLength.toFixed(1)}m)</span>
          </div>
          {summary.withLigsCount > 0 && (
            <>
              <span className="text-border">•</span>
              <span>{summary.withLigsCount} with ligs</span>
            </>
          )}
          {summary.customCount > 0 && (
            <>
              <span className="text-border">•</span>
              <span className="text-primary">{summary.customCount} customized</span>
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
          {beams.every(b => openBeams.has(b.id)) ? 'Collapse' : 'Expand'}
        </Button>
      </div>

      {/* Beam Cards */}
      <div className="space-y-2">
        {beams.map((beam, index) => {
          const isOpen = openBeams.has(beam.id);
          const tmType = beam.tm_type || defaultTmType;
          const addLigs = beam.add_ligs ?? defaultAddLigs;
          const ligSize = beam.lig_size || defaultLigSize;
          const ligCentres = beam.lig_centres ?? defaultLigCentres;
          const hasCustomSettings = beam.tm_type || beam.add_ligs !== undefined || beam.lig_size || beam.lig_centres;

          const tmOption = TM_OPTIONS.find(o => o.value === tmType);

          return (
            <Collapsible key={beam.id} open={isOpen} onOpenChange={() => toggleBeam(beam.id)}>
              <div className={cn(
                "border rounded-lg overflow-hidden transition-colors",
                hasCustomSettings ? "border-primary/30 bg-primary/[0.02]" : "bg-card"
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
                        <span className="font-medium text-sm">{beam.name}</span>
                        <Badge variant="outline" className="text-xs font-normal h-5">
                          {beam.length.toFixed(1)}m
                        </Badge>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {beam.width}w × {beam.depth}d
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary">
                        {tmOption?.label || tmType}
                      </span>
                      {addLigs && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-accent text-accent-foreground">
                          +Ligs
                        </span>
                      )}
                      {hasCustomSettings && (
                        <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-medium">
                          Custom
                        </span>
                      )}
                      <Settings2 className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                {/* Content */}
                <CollapsibleContent>
                  <div className="px-3 pb-3 pt-2 border-t bg-muted/30 space-y-4">
                    {/* Trench Mesh */}
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Trench Mesh</Label>
                        <Select
                          value={tmType}
                          onValueChange={(val) => updateBeam(index, { tm_type: val })}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[150]">
                            {TM_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <span className="flex items-center gap-2">
                                  {opt.label}
                                  <span className="text-muted-foreground text-xs">({opt.width})</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Ligatures */}
                    <div className="space-y-3 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Ligatures</Label>
                        <div className="flex items-center gap-3 px-3 py-1.5 rounded-md border bg-background">
                          <Switch
                            checked={addLigs}
                            onCheckedChange={(val) => updateBeam(index, { add_ligs: val })}
                          />
                          <span className={cn(
                            "text-sm min-w-[3ch]",
                            addLigs ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {addLigs ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>

                      {addLigs && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Lig Size</Label>
                            <Select
                              value={ligSize}
                              onValueChange={(val) => updateBeam(index, { lig_size: val })}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="z-[150]">
                                {LIG_SIZE_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Lig Centres</Label>
                            <div className="relative">
                              <Input
                                type="number"
                                value={ligCentres}
                                onChange={(e) => updateBeam(index, { lig_centres: Number(e.target.value) })}
                                className="h-8 text-sm pr-8"
                                min={100}
                                max={600}
                                step={50}
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                                mm
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Summary Footer */}
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        {tmOption?.label || tmType}{addLigs ? ` + ${ligSize} ligs @ ${ligCentres}mm` : ''} • {beam.length.toFixed(1)}m
                      </p>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
