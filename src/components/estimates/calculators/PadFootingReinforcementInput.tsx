import { FootingConfig } from "@/lib/estimate-components/types";
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
import { ChevronDown, ChevronRight, Settings2, Square, ChevronsUpDown } from "lucide-react";
import { useState, useMemo } from "react";
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
  const [openPads, setOpenPads] = useState<Set<string>>(new Set());

  const togglePad = (padId: string) => {
    setOpenPads(prev => {
      const next = new Set(prev);
      if (next.has(padId)) {
        next.delete(padId);
      } else {
        next.add(padId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    const allOpen = pads.every(p => openPads.has(p.id));
    if (allOpen) {
      setOpenPads(new Set());
    } else {
      setOpenPads(new Set(pads.map(p => p.id)));
    }
  };

  const updatePad = (index: number, updates: Partial<PadFootingWithReo>) => {
    const newPads = [...pads];
    newPads[index] = { ...newPads[index], ...updates };
    onChange(newPads);
  };

  // Summary calculations
  const summary = useMemo(() => {
    let withBottomReoCount = 0;
    let withTopReoCount = 0;
    let customCount = 0;

    pads.forEach(pad => {
      const hasBottomReo = pad.has_bottom_reo ?? defaultHasBottomReo;
      const hasTopReo = pad.has_top_reo ?? defaultHasTopReo;
      
      if (hasBottomReo) withBottomReoCount++;
      if (hasTopReo) withTopReoCount++;
      
      if (pad.has_bottom_reo !== undefined || pad.bottom_a_size !== undefined ||
          pad.has_top_reo !== undefined || pad.top_a_size !== undefined) {
        customCount++;
      }
    });

    return { withBottomReoCount, withTopReoCount, customCount, total: pads.length };
  }, [pads, defaultHasBottomReo, defaultHasTopReo]);

  if (pads.length === 0) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground italic py-4 px-3 border border-dashed rounded-lg">
        <Square className="h-5 w-5 opacity-50" />
        <span>No {label.toLowerCase()} defined.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary Header */}
      <div className="flex items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1.5">
            <Square className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{summary.total}</span>
            <span>pad{summary.total !== 1 ? 's' : ''}</span>
          </div>
          {summary.withBottomReoCount > 0 && (
            <>
              <span className="text-border">•</span>
              <span>{summary.withBottomReoCount} with bottom</span>
            </>
          )}
          {summary.withTopReoCount > 0 && (
            <>
              <span className="text-border">•</span>
              <span>{summary.withTopReoCount} with top</span>
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
          {pads.every(p => openPads.has(p.id)) ? 'Collapse' : 'Expand'}
        </Button>
      </div>

      {/* Pad Cards */}
      <div className="space-y-2">
        {pads.map((pad, index) => {
          const isOpen = openPads.has(pad.id);
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
                        <span className="font-medium text-sm">{pad.name}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {pad.length}m × {pad.width}mm × {pad.depth}mm
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasBottomReo && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary">
                          Bottom
                        </span>
                      )}
                      {hasTopReo && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-accent text-accent-foreground">
                          Top
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
                    {/* Bottom Reinforcement */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Bottom Reinforcement</Label>
                        <div className="flex items-center gap-3 px-3 py-1.5 rounded-md border bg-background">
                          <Switch
                            checked={hasBottomReo}
                            onCheckedChange={(val) => updatePad(index, { has_bottom_reo: val })}
                          />
                          <span className={cn(
                            "text-sm min-w-[3ch]",
                            hasBottomReo ? "text-foreground" : "text-muted-foreground"
                          )}>
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
                              <SelectContent className="z-[150]">
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
                              <SelectContent className="z-[150]">
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
                    <div className="space-y-3 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Top Reinforcement</Label>
                        <div className="flex items-center gap-3 px-3 py-1.5 rounded-md border bg-background">
                          <Switch
                            checked={hasTopReo}
                            onCheckedChange={(val) => updatePad(index, { has_top_reo: val })}
                          />
                          <span className={cn(
                            "text-sm min-w-[3ch]",
                            hasTopReo ? "text-foreground" : "text-muted-foreground"
                          )}>
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
                              <SelectContent className="z-[150]">
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
                              <SelectContent className="z-[150]">
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

                    {/* Summary Footer */}
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        {hasBottomReo ? `Bottom: ${bottomASize}/${bottomBSize} @ ${bottomACentres}/${bottomBCentres}` : 'No bottom reo'}
                        {hasTopReo ? ` • Top: ${topASize}/${topBSize} @ ${topACentres}/${topBCentres}` : ''}
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
