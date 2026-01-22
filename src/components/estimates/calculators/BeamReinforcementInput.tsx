import { BeamConfig } from "@/lib/estimate-components/types";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
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
import { ChevronDown, Settings2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const TM_OPTIONS = [
  { value: 'L8TM3', label: 'L8TM3 (300mm)' },
  { value: 'L8TM4', label: 'L8TM4 (400mm)' },
  { value: 'L11TM3', label: 'L11TM3 (300mm)' },
  { value: 'L11TM4', label: 'L11TM4 (400mm)' },
  { value: 'L12TM3', label: 'L12TM3 (300mm)' },
  { value: 'L12TM4', label: 'L12TM4 (400mm)' },
  { value: 'L12TM5', label: 'L12TM5 (500mm)' },
  { value: 'L16TM3', label: 'L16TM3 (300mm)' },
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
  const [openBeams, setOpenBeams] = useState<Record<string, boolean>>({});

  const updateBeam = (index: number, updates: Partial<BeamConfig>) => {
    const newBeams = [...beams];
    newBeams[index] = { ...newBeams[index], ...updates };
    onChange(newBeams);
  };

  const toggleBeam = (beamId: string) => {
    setOpenBeams(prev => ({ ...prev, [beamId]: !prev[beamId] }));
  };

  if (beams.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic py-2">
        No {label.toLowerCase()} defined. Add beams in the scope configuration above.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {beams.map((beam, index) => {
        const isOpen = openBeams[beam.id] || false;
        const tmType = beam.tm_type || defaultTmType;
        const addLigs = beam.add_ligs ?? defaultAddLigs;
        const ligSize = beam.lig_size || defaultLigSize;
        const ligCentres = beam.lig_centres ?? defaultLigCentres;
        const hasCustomSettings = beam.tm_type || beam.add_ligs !== undefined || beam.lig_size || beam.lig_centres;

        return (
          <Collapsible key={beam.id} open={isOpen} onOpenChange={() => toggleBeam(beam.id)}>
            <div className="border rounded-lg overflow-hidden bg-card">
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{beam.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {beam.length.toFixed(1)}m × {beam.width}w × {beam.depth}d
                    </span>
                    {hasCustomSettings && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        Custom
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <ChevronDown className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      isOpen && "rotate-180"
                    )} />
                  </div>
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="px-3 pb-3 pt-1 border-t bg-muted/30">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Trench Mesh Type */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">Trench Mesh</Label>
                      <Select
                        value={tmType}
                        onValueChange={(val) => updateBeam(index, { tm_type: val })}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TM_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Add Ligatures Toggle */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">Ligatures</Label>
                      <div className="flex items-center gap-2 h-9">
                        <Switch
                          checked={addLigs}
                          onCheckedChange={(val) => updateBeam(index, { add_ligs: val })}
                        />
                        <span className="text-sm text-muted-foreground">
                          {addLigs ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>

                    {/* Ligature options - only show if enabled */}
                    {addLigs && (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Lig Size</Label>
                          <Select
                            value={ligSize}
                            onValueChange={(val) => updateBeam(index, { lig_size: val })}
                          >
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {LIG_SIZE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Lig Centres</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              value={ligCentres}
                              onChange={(e) => updateBeam(index, { lig_centres: Number(e.target.value) })}
                              className="h-9 text-sm pr-10"
                              min={100}
                              max={600}
                              step={50}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              mm
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}
