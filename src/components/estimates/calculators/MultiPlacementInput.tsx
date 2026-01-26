import { LabourPlacement, PriceMap } from "@/lib/estimate-components/types";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, HardHat, Plus, Trash2, Settings2, ChevronsUpDown } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format-currency";

function getDefaultHourlyRate(priceMap?: PriceMap): number {
  return priceMap?.['labour']?.['LABOUR PLACE HR'] ?? 75;
}

interface MultiPlacementInputProps {
  placements: LabourPlacement[];
  onChange: (placements: LabourPlacement[]) => void;
  priceMap?: PriceMap;
}

export function MultiPlacementInput({
  placements,
  onChange,
  priceMap,
}: MultiPlacementInputProps) {
  const [openPlacements, setOpenPlacements] = useState<Set<string>>(
    new Set(placements.length > 0 ? [placements[0].id] : [])
  );

  const togglePlacement = (placementId: string) => {
    setOpenPlacements(prev => {
      const next = new Set(prev);
      if (next.has(placementId)) {
        next.delete(placementId);
      } else {
        next.add(placementId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    const allOpen = placements.every(p => openPlacements.has(p.id));
    if (allOpen) {
      setOpenPlacements(new Set());
    } else {
      setOpenPlacements(new Set(placements.map(p => p.id)));
    }
  };

  const addPlacement = () => {
    const pourNumber = placements.length + 1;
    const newPlacement: LabourPlacement = {
      id: `placement_${Date.now()}`,
      name: `Pour ${pourNumber}`,
      hourly_rate: getDefaultHourlyRate(priceMap),
      crew_size: 0,
      hours: 8,
    };
    const newPlacements = [...placements, newPlacement];
    onChange(newPlacements);
    setOpenPlacements(prev => new Set([...prev, newPlacement.id]));
  };

  const updatePlacement = (index: number, updates: Partial<LabourPlacement>) => {
    const newPlacements = [...placements];
    newPlacements[index] = { ...newPlacements[index], ...updates };
    onChange(newPlacements);
  };

  const removePlacement = (index: number) => {
    const newPlacements = placements.filter((_, i) => i !== index);
    onChange(newPlacements);
  };

  // Calculate placement cost
  const calculatePlacementCost = (placement: LabourPlacement) => {
    const totalHours = placement.crew_size * placement.hours;
    return totalHours * placement.hourly_rate;
  };

  const summary = useMemo(() => {
    let totalCost = 0;
    let totalWorkerHours = 0;
    placements.forEach(placement => {
      totalCost += calculatePlacementCost(placement);
      totalWorkerHours += placement.crew_size * placement.hours;
    });
    return { totalPours: placements.length, totalCost, totalWorkerHours };
  }, [placements]);

  if (placements.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-sm text-muted-foreground italic py-4 px-3 border border-dashed rounded-lg">
          <HardHat className="h-5 w-5 opacity-50" />
          <span>No placement pours configured. Add a pour to get started.</span>
        </div>
        <Button
          variant="outline"
          onClick={addPlacement}
          className="w-full h-11"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Pour
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary Header */}
      <div className="flex items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1.5">
            <HardHat className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{summary.totalPours}</span>
            <span>pour{summary.totalPours !== 1 ? 's' : ''}</span>
          </div>
          <span className="text-border">•</span>
          <span>{summary.totalWorkerHours} worker-hours</span>
          <span className="text-border">•</span>
          <span className="text-primary font-medium">{formatCurrency(summary.totalCost)}</span>
        </div>
        {placements.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAll}
            className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
          >
            <ChevronsUpDown className="h-3.5 w-3.5" />
            {placements.every(p => openPlacements.has(p.id)) ? 'Collapse' : 'Expand'}
          </Button>
        )}
      </div>

      {/* Placement Cards */}
      <div className="space-y-2">
        {placements.map((placement, index) => {
          const isOpen = openPlacements.has(placement.id);
          const placementCost = calculatePlacementCost(placement);
          const totalHours = placement.crew_size * placement.hours;

          return (
            <Collapsible key={placement.id} open={isOpen} onOpenChange={() => togglePlacement(placement.id)}>
              <div className="border rounded-lg overflow-hidden bg-card">
                {/* Header */}
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className="font-medium text-sm">{placement.name || `Pour ${index + 1}`}</span>
                      {placement.crew_size > 0 && (
                        <Badge variant="outline" className="text-xs font-normal h-5">
                          {placement.crew_size} workers × {placement.hours} hrs
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-primary">{formatCurrency(placementCost)}</span>
                      <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                </CollapsibleTrigger>

                {/* Content */}
                <CollapsibleContent>
                  <div className="px-3 pb-3 pt-2 border-t bg-muted/30 space-y-4">
                    {/* Pour Name (optional) */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Pour Name (optional)</Label>
                      <Input
                        type="text"
                        value={placement.name || ''}
                        onChange={(e) => updatePlacement(index, { name: e.target.value })}
                        placeholder={`Pour ${index + 1}`}
                        className="h-9 text-sm"
                      />
                    </div>

                    {/* Hourly Rate */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Hourly Rate</Label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={placement.hourly_rate}
                          onChange={(e) => updatePlacement(index, { hourly_rate: Number(e.target.value) })}
                          className="h-9 text-sm pl-6 pr-8"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">/hr</span>
                      </div>
                    </div>

                    {/* Crew Size & Hours */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Number of Workers</Label>
                        <Input
                          type="number"
                          min="1"
                          max="50"
                          value={placement.crew_size || ''}
                          onChange={(e) => updatePlacement(index, { crew_size: Number(e.target.value) || 0 })}
                          placeholder="Enter crew size"
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Hours</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.5"
                            min="0.5"
                            max="24"
                            value={placement.hours}
                            onChange={(e) => updatePlacement(index, { hours: Number(e.target.value) })}
                            className="h-9 text-sm pr-8"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">hrs</span>
                        </div>
                      </div>
                    </div>

                    {/* Summary for this placement */}
                    {placement.crew_size > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          Total: {totalHours} worker-hours × {formatCurrency(placement.hourly_rate)}/hr = <span className="text-foreground font-medium">{formatCurrency(placementCost)}</span>
                        </p>
                      </div>
                    )}

                    {/* Remove Button */}
                    {placements.length > 1 && (
                      <div className="pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removePlacement(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Pour
                        </Button>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>

      {/* Add Another Button */}
      <Button
        variant="outline"
        onClick={addPlacement}
        className="w-full h-11"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Another Pour
      </Button>
    </div>
  );
}
