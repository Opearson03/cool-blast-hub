import { useState, useMemo } from "react";
import { Plus, Trash2, Copy, Circle, ChevronDown, ChevronRight, Settings2, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { PierConfig } from "@/lib/estimate-components/types";
import { MarkupPromptDialog } from "./MarkupPromptDialog";
import { cn } from "@/lib/utils";

interface MultiPierInputProps {
  label: string;
  piers: PierConfig[];
  onChange: (piers: PierConfig[]) => void;
  // Markup prompt support
  onRequestMarkup?: () => void;
  hasPlans?: boolean;
  skipMarkupPrompt?: boolean;
  onSkipMarkupPromptChange?: (skip: boolean) => void;
}

export function MultiPierInput({
  label,
  piers,
  onChange,
  onRequestMarkup,
  hasPlans = false,
  skipMarkupPrompt = false,
  onSkipMarkupPromptChange,
}: MultiPierInputProps) {
  const [newPierName, setNewPierName] = useState("");
  const [showMarkupPrompt, setShowMarkupPrompt] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(skipMarkupPrompt);
  const [openPiers, setOpenPiers] = useState<Set<string>>(new Set(piers.map(p => p.id)));

  const togglePier = (pierId: string) => {
    setOpenPiers(prev => {
      const next = new Set(prev);
      if (next.has(pierId)) {
        next.delete(pierId);
      } else {
        next.add(pierId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    const allOpen = piers.every(p => openPiers.has(p.id));
    if (allOpen) {
      setOpenPiers(new Set());
    } else {
      setOpenPiers(new Set(piers.map(p => p.id)));
    }
  };

  // Summary calculations
  const summary = useMemo(() => {
    let totalPiers = 0;
    let totalVolume = 0;
    let fromTakeoffCount = 0;

    piers.forEach(pier => {
      const qty = Number(pier.quantity) || 0;
      const diamM = (Number(pier.diameter) || 0) / 1000;
      const depthM = (Number(pier.depth) || 0) / 1000;
      const radius = diamM / 2;
      
      totalPiers += qty;
      totalVolume += qty * Math.PI * radius * radius * depthM;
      if (pier._fromTakeoff) fromTakeoffCount++;
    });

    return { totalPiers, totalVolume, fromTakeoffCount, totalTypes: piers.length };
  }, [piers]);

  const addPier = () => {
    const pierNumber = piers.length + 1;
    const name = newPierName.trim() || `Pier Type ${pierNumber}`;
    const newPier: PierConfig = {
      id: `pier-${Date.now()}`,
      name,
      quantity: 1,
      diameter: 450,
      depth: 600,
    };
    onChange([...piers, newPier]);
    setNewPierName("");
    setOpenPiers(prev => new Set([...prev, newPier.id]));
  };

  const handleAddClick = () => {
    if (hasPlans && onRequestMarkup && !skipMarkupPrompt) {
      setShowMarkupPrompt(true);
    } else {
      addPier();
    }
  };

  const handleMarkOnPlans = () => {
    if (dontAskAgain) {
      onSkipMarkupPromptChange?.(true);
    }
    setShowMarkupPrompt(false);
    onRequestMarkup?.();
  };

  const handleEnterManually = () => {
    if (dontAskAgain) {
      onSkipMarkupPromptChange?.(true);
    }
    setShowMarkupPrompt(false);
    addPier();
  };

  const removePier = (id: string) => {
    if (piers.length > 1) {
      onChange(piers.filter((p) => p.id !== id));
    }
  };

  const duplicatePier = (pier: PierConfig) => {
    const newPier: PierConfig = {
      ...pier,
      id: `pier-${Date.now()}`,
      name: `${pier.name} (copy)`,
      _fromTakeoff: false,
    };
    onChange([...piers, newPier]);
    setOpenPiers(prev => new Set([...prev, newPier.id]));
  };

  const updatePier = (id: string, field: keyof PierConfig, value: any) => {
    onChange(
      piers.map((pier) => {
        if (pier.id !== id) return pier;
        
        if (pier._fromTakeoff) {
          return {
            ...pier,
            [field]: value,
            _fromTakeoff: false,
          };
        }
        
        return { ...pier, [field]: value };
      })
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="flex items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1.5">
            <Circle className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{summary.totalPiers}</span>
            <span>pier{summary.totalPiers !== 1 ? 's' : ''}</span>
            <span className="text-muted-foreground/60">({summary.totalTypes} type{summary.totalTypes !== 1 ? 's' : ''})</span>
          </div>
          <span className="text-border">•</span>
          <span>{summary.totalVolume.toFixed(3)} m³ total</span>
          {summary.fromTakeoffCount > 0 && (
            <>
              <span className="text-border">•</span>
              <span className="text-blue-600 dark:text-blue-400">{summary.fromTakeoffCount} from takeoff</span>
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
          {piers.every(p => openPiers.has(p.id)) ? 'Collapse' : 'Expand'}
        </Button>
      </div>

      {/* Pier Cards */}
      <div className="space-y-2">
        {piers.map((pier) => {
          const isOpen = openPiers.has(pier.id);
          const qty = Number(pier.quantity) || 0;
          const diamM = (Number(pier.diameter) || 0) / 1000;
          const depthM = (Number(pier.depth) || 0) / 1000;
          const radius = diamM / 2;
          const volume = qty * Math.PI * radius * radius * depthM;

          return (
            <Collapsible key={pier.id} open={isOpen} onOpenChange={() => togglePier(pier.id)}>
              <div className={cn(
                "border rounded-lg overflow-hidden transition-colors",
                pier._fromTakeoff ? "border-blue-500/30 bg-blue-500/[0.02]" : "bg-card"
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
                        <span className="font-medium text-sm">{pier.name}</span>
                        <Badge variant="outline" className="text-xs font-normal h-5">
                          {qty} pier{qty !== 1 ? 's' : ''}
                        </Badge>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          ⌀{pier.diameter}mm × {pier.depth}mm
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {pier._fromTakeoff && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400">
                                Takeoff
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Counted from plan takeoff</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {volume > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {volume.toFixed(3)} m³
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
                        value={pier.name}
                        onChange={(e) => updatePier(pier.id, "name", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>

                    {/* Dimensions */}
                    <div className="grid grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Quantity</Label>
                        <Input
                          type="number"
                          inputMode="numeric"
                          value={pier.quantity ?? ""}
                          onChange={(e) =>
                            updatePier(pier.id, "quantity", e.target.value === "" ? 0 : Number(e.target.value))
                          }
                          min={1}
                          step={1}
                          className="h-8 text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Diameter</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            inputMode="numeric"
                            value={pier.diameter ?? ""}
                            onChange={(e) =>
                              updatePier(pier.id, "diameter", e.target.value === "" ? 0 : Number(e.target.value))
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
                        <Label className="text-[10px] text-muted-foreground">Depth</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            inputMode="numeric"
                            value={pier.depth ?? ""}
                            onChange={(e) =>
                              updatePier(pier.id, "depth", e.target.value === "" ? 0 : Number(e.target.value))
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
                          {volume > 0 ? `${volume.toFixed(3)} m³` : "—"}
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
                        onClick={() => duplicatePier(pier)}
                      >
                        <Copy className="h-3 w-3" />
                        Duplicate
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                        onClick={() => removePier(pier.id)}
                        disabled={piers.length <= 1}
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

      {/* Add pier input */}
      <div className="flex items-center gap-2 pt-2 border-t">
        <Input
          placeholder="New pier type name (optional)"
          value={newPierName}
          onChange={(e) => setNewPierName(e.target.value)}
          className="flex-1 h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddClick();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddClick}
          className="gap-1 h-8"
        >
          <Plus className="h-4 w-4" />
          Add Pier Type
        </Button>
      </div>

      <MarkupPromptDialog
        open={showMarkupPrompt}
        onOpenChange={setShowMarkupPrompt}
        itemType="pier"
        onMarkOnPlans={handleMarkOnPlans}
        onEnterManually={handleEnterManually}
        dontAskAgain={dontAskAgain}
        onDontAskAgainChange={setDontAskAgain}
      />
    </div>
  );
}
