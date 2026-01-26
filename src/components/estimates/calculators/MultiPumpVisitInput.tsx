import { PumpVisit, PriceMap } from "@/lib/estimate-components/types";
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
import { ChevronDown, ChevronRight, Truck, Plus, Trash2, Settings2, ChevronsUpDown } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format-currency";

const PUMP_TYPE_OPTIONS = [
  { value: 'LINE PUMP', label: 'Line Pump' },
  { value: '20M BOOM', label: '20M Boom Pump' },
  { value: '32M BOOM', label: '32M Boom Pump' },
  { value: '36M BOOM', label: '36M Boom Pump' },
  { value: '38M BOOM', label: '38M Boom Pump' },
  { value: '42M BOOM', label: '42M Boom Pump' },
  { value: '48M BOOM', label: '48M Boom Pump' },
  { value: '56M BOOM', label: '56M Boom Pump' },
];

function getPumpRate(pumpType: string, priceMap?: PriceMap): number {
  if (!priceMap) return 180;
  return priceMap['pumping']?.[pumpType] ?? 180;
}

function getPrimerCost(priceMap?: PriceMap): number {
  return priceMap?.['pumping']?.['PRIMER'] ?? 20;
}

function getWashoutCost(priceMap?: PriceMap): number {
  return priceMap?.['pumping']?.['PUMP WASH'] ?? 250;
}

function getPumpyRate(priceMap?: PriceMap): number {
  return priceMap?.['pumping']?.['PUMP LAB'] ?? 95;
}

interface MultiPumpVisitInputProps {
  visits: PumpVisit[];
  onChange: (visits: PumpVisit[]) => void;
  priceMap?: PriceMap;
}

export function MultiPumpVisitInput({
  visits,
  onChange,
  priceMap,
}: MultiPumpVisitInputProps) {
  const [openVisits, setOpenVisits] = useState<Set<string>>(new Set(visits.length > 0 ? [visits[0].id] : []));

  const toggleVisit = (visitId: string) => {
    setOpenVisits(prev => {
      const next = new Set(prev);
      if (next.has(visitId)) {
        next.delete(visitId);
      } else {
        next.add(visitId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    const allOpen = visits.every(v => openVisits.has(v.id));
    if (allOpen) {
      setOpenVisits(new Set());
    } else {
      setOpenVisits(new Set(visits.map(v => v.id)));
    }
  };

  const addVisit = () => {
    const defaultPumpType = 'LINE PUMP';
    const newVisit: PumpVisit = {
      id: `visit_${Date.now()}`,
      pump_type: defaultPumpType,
      pump_rate: getPumpRate(defaultPumpType, priceMap),
      travel_hours: 1,
      pump_hours_on_site: 4,
      primer_count: 1,
      primer_cost: getPrimerCost(priceMap),
      offsite_washout: false,
      washout_cost: getWashoutCost(priceMap),
      additional_pumpy: true,
      pumpy_rate: getPumpyRate(priceMap),
    };
    const newVisits = [...visits, newVisit];
    onChange(newVisits);
    setOpenVisits(prev => new Set([...prev, newVisit.id]));
  };

  const updateVisit = (index: number, updates: Partial<PumpVisit>) => {
    const newVisits = [...visits];
    newVisits[index] = { ...newVisits[index], ...updates };
    onChange(newVisits);
  };

  const removeVisit = (index: number) => {
    const newVisits = visits.filter((_, i) => i !== index);
    onChange(newVisits);
  };

  // Calculate visit cost
  const calculateVisitCost = (visit: PumpVisit) => {
    let total = 0;
    total += visit.travel_hours * visit.pump_rate;
    total += visit.pump_hours_on_site * visit.pump_rate;
    total += visit.primer_count * visit.primer_cost;
    if (visit.offsite_washout) total += visit.washout_cost;
    if (visit.additional_pumpy) total += visit.pump_hours_on_site * visit.pumpy_rate;
    return total;
  };

  const summary = useMemo(() => {
    let totalCost = 0;
    visits.forEach(visit => {
      totalCost += calculateVisitCost(visit);
    });
    return { totalVisits: visits.length, totalCost };
  }, [visits]);

  if (visits.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-sm text-muted-foreground italic py-4 px-3 border border-dashed rounded-lg">
          <Truck className="h-5 w-5 opacity-50" />
          <span>No pump visits configured. Add a pump visit to get started.</span>
        </div>
        <Button
          variant="outline"
          onClick={addVisit}
          className="w-full h-11"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Pump Visit
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
            <Truck className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{summary.totalVisits}</span>
            <span>pump visit{summary.totalVisits !== 1 ? 's' : ''}</span>
          </div>
          <span className="text-border">•</span>
          <span className="text-primary font-medium">{formatCurrency(summary.totalCost)} (excl. m³ charge)</span>
        </div>
        {visits.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAll}
            className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
          >
            <ChevronsUpDown className="h-3.5 w-3.5" />
            {visits.every(v => openVisits.has(v.id)) ? 'Collapse' : 'Expand'}
          </Button>
        )}
      </div>

      {/* Visit Cards */}
      <div className="space-y-2">
        {visits.map((visit, index) => {
          const isOpen = openVisits.has(visit.id);
          const visitCost = calculateVisitCost(visit);
          const pumpLabel = PUMP_TYPE_OPTIONS.find(o => o.value === visit.pump_type)?.label || visit.pump_type;

          return (
            <Collapsible key={visit.id} open={isOpen} onOpenChange={() => toggleVisit(visit.id)}>
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
                      <span className="font-medium text-sm">Pump Visit {index + 1}</span>
                      <Badge variant="outline" className="text-xs font-normal h-5">
                        {pumpLabel}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-primary">{formatCurrency(visitCost)}</span>
                      <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                </CollapsibleTrigger>

                {/* Content */}
                <CollapsibleContent>
                  <div className="px-3 pb-3 pt-2 border-t bg-muted/30 space-y-4">
                    {/* Pump Type & Rate */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Pump Type</Label>
                        <Select
                          value={visit.pump_type}
                          onValueChange={(val) => {
                            updateVisit(index, { 
                              pump_type: val,
                              pump_rate: getPumpRate(val, priceMap)
                            });
                          }}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[150]">
                            {PUMP_TYPE_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Hourly Rate</Label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={visit.pump_rate}
                            onChange={(e) => updateVisit(index, { pump_rate: Number(e.target.value) })}
                            className="h-9 text-sm pl-6"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Travel & On-Site Hours */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Travel Hours</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.5"
                            min="0.5"
                            value={visit.travel_hours}
                            onChange={(e) => updateVisit(index, { travel_hours: Number(e.target.value) })}
                            className="h-9 text-sm pr-8"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">hrs</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Hours On Site</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.5"
                            min="1"
                            value={visit.pump_hours_on_site}
                            onChange={(e) => updateVisit(index, { pump_hours_on_site: Number(e.target.value) })}
                            className="h-9 text-sm pr-8"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">hrs</span>
                        </div>
                      </div>
                    </div>

                    {/* Primer */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Primer Count</Label>
                        <Input
                          type="number"
                          min="0"
                          max="5"
                          value={visit.primer_count}
                          onChange={(e) => updateVisit(index, { primer_count: Number(e.target.value) })}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Primer Cost Each</Label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={visit.primer_cost}
                            onChange={(e) => updateVisit(index, { primer_cost: Number(e.target.value) })}
                            className="h-9 text-sm pl-6"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Washout */}
                    <div className="space-y-3 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Offsite Washout</Label>
                        <div className="flex items-center gap-3 px-3 py-1.5 rounded-md border bg-background">
                          <Switch
                            checked={visit.offsite_washout}
                            onCheckedChange={(val) => updateVisit(index, { offsite_washout: val })}
                          />
                          <span className={cn(
                            "text-sm min-w-[3ch]",
                            visit.offsite_washout ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {visit.offsite_washout ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                      {visit.offsite_washout && (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Washout Cost</Label>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={visit.washout_cost}
                              onChange={(e) => updateVisit(index, { washout_cost: Number(e.target.value) })}
                              className="h-9 text-sm pl-6"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Pumpy Labour */}
                    <div className="space-y-3 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Additional Man (Pumpy)</Label>
                        <div className="flex items-center gap-3 px-3 py-1.5 rounded-md border bg-background">
                          <Switch
                            checked={visit.additional_pumpy}
                            onCheckedChange={(val) => updateVisit(index, { additional_pumpy: val })}
                          />
                          <span className={cn(
                            "text-sm min-w-[3ch]",
                            visit.additional_pumpy ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {visit.additional_pumpy ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                      {visit.additional_pumpy && (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Pumpy Rate per Hour</Label>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={visit.pumpy_rate}
                              onChange={(e) => updateVisit(index, { pumpy_rate: Number(e.target.value) })}
                              className="h-9 text-sm pl-6"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Remove Button */}
                    {visits.length > 1 && (
                      <div className="pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeVisit(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Visit
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
        onClick={addVisit}
        className="w-full h-11"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Another Pump Visit
      </Button>
    </div>
  );
}
