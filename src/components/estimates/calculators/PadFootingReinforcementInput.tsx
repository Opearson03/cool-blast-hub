import { FootingConfig } from "@/lib/estimate-components/types";
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

const BAR_SIZE_OPTIONS = [
  { value: 'N12', label: 'N12' },
  { value: 'N16', label: 'N16' },
  { value: 'N20', label: 'N20' },
  { value: 'N24', label: 'N24' },
  { value: 'N28', label: 'N28' },
  { value: 'N32', label: 'N32' },
];

// Extended interface for pad footings with grid-based reo
export interface PadFootingWithReo extends FootingConfig {
  has_bottom_reo?: boolean;
  bottom_a_size?: string;
  bottom_a_centres?: number;
  bottom_b_size?: string;
  bottom_b_centres?: number;
  has_top_reo?: boolean;
  top_a_size?: string;
  top_a_centres?: number;
  top_b_size?: string;
  top_b_centres?: number;
}

interface PadFootingReinforcementInputProps {
  pads: PadFootingWithReo[];
  onChange: (pads: PadFootingWithReo[]) => void;
  defaultHasBottomReo: boolean;
  defaultBottomASize: string;
  defaultBottomACentres: number;
  defaultBottomBSize: string;
  defaultBottomBCentres: number;
  defaultHasTopReo: boolean;
  defaultTopASize: string;
  defaultTopACentres: number;
  defaultTopBSize: string;
  defaultTopBCentres: number;
  label: string;
}

export function PadFootingReinforcementInput({
  pads,
  onChange,
  defaultHasBottomReo,
  defaultBottomASize,
  defaultBottomACentres,
  defaultBottomBSize,
  defaultBottomBCentres,
  defaultHasTopReo,
  defaultTopASize,
  defaultTopACentres,
  defaultTopBSize,
  defaultTopBCentres,
  label,
}: PadFootingReinforcementInputProps) {
  const [openPads, setOpenPads] = useState<Record<string, boolean>>({});

  const updatePad = (index: number, updates: Partial<PadFootingWithReo>) => {
    const newPads = [...pads];
    newPads[index] = { ...newPads[index], ...updates };
    onChange(newPads);
  };

  const togglePad = (padId: string) => {
    setOpenPads(prev => ({ ...prev, [padId]: !prev[padId] }));
  };

  if (pads.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic py-2">
        No {label.toLowerCase()} defined.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pads.map((pad, index) => {
        const isOpen = openPads[pad.id] || false;
        const hasBottomReo = pad.has_bottom_reo ?? defaultHasBottomReo;
        const bottomASize = pad.bottom_a_size || defaultBottomASize;
        const bottomACentres = pad.bottom_a_centres ?? defaultBottomACentres;
        const bottomBSize = pad.bottom_b_size || defaultBottomBSize;
        const bottomBCentres = pad.bottom_b_centres ?? defaultBottomBCentres;
        const hasTopReo = pad.has_top_reo ?? defaultHasTopReo;
        const topASize = pad.top_a_size || defaultTopASize;
        const topACentres = pad.top_a_centres ?? defaultTopACentres;
        const topBSize = pad.top_b_size || defaultTopBSize;
        const topBCentres = pad.top_b_centres ?? defaultTopBCentres;
        
        const hasCustomSettings = 
          pad.has_bottom_reo !== undefined || 
          pad.bottom_a_size !== undefined ||
          pad.has_top_reo !== undefined ||
          pad.top_a_size !== undefined;

        return (
          <Collapsible key={pad.id} open={isOpen} onOpenChange={() => togglePad(pad.id)}>
            <div className="border rounded-lg overflow-hidden bg-card">
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{pad.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {pad.length}m × {pad.width}mm × {pad.depth}mm
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
                <div className="px-3 pb-3 pt-1 border-t bg-muted/30 space-y-4">
                  {/* Bottom Reinforcement */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Bottom Reinforcement</Label>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={hasBottomReo}
                          onCheckedChange={(val) => updatePad(index, { has_bottom_reo: val })}
                        />
                        <span className="text-xs text-muted-foreground w-6">
                          {hasBottomReo ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                    
                    {hasBottomReo && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Bar A Size</Label>
                          <Select
                            value={bottomASize}
                            onValueChange={(val) => updatePad(index, { bottom_a_size: val })}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {BAR_SIZE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Bar A Centres</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              value={bottomACentres}
                              onChange={(e) => updatePad(index, { bottom_a_centres: Number(e.target.value) })}
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
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Bar B Size</Label>
                          <Select
                            value={bottomBSize}
                            onValueChange={(val) => updatePad(index, { bottom_b_size: val })}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {BAR_SIZE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Bar B Centres</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              value={bottomBCentres}
                              onChange={(e) => updatePad(index, { bottom_b_centres: Number(e.target.value) })}
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

                  {/* Top Reinforcement */}
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Top Reinforcement</Label>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={hasTopReo}
                          onCheckedChange={(val) => updatePad(index, { has_top_reo: val })}
                        />
                        <span className="text-xs text-muted-foreground w-6">
                          {hasTopReo ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                    
                    {hasTopReo && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Bar A Size</Label>
                          <Select
                            value={topASize}
                            onValueChange={(val) => updatePad(index, { top_a_size: val })}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {BAR_SIZE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Bar A Centres</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              value={topACentres}
                              onChange={(e) => updatePad(index, { top_a_centres: Number(e.target.value) })}
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
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Bar B Size</Label>
                          <Select
                            value={topBSize}
                            onValueChange={(val) => updatePad(index, { top_b_size: val })}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {BAR_SIZE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Bar B Centres</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              value={topBCentres}
                              onChange={(e) => updatePad(index, { top_b_centres: Number(e.target.value) })}
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
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}
