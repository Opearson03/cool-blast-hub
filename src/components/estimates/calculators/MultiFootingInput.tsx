import { useState, useMemo } from "react";
import { Plus, Trash2, Copy, Ruler, ChevronDown, ChevronRight, Settings2, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { FootingConfig } from "@/lib/estimate-components/types";
import { cn } from "@/lib/utils";
import { MarkupPromptDialog } from "./MarkupPromptDialog";

interface MultiFootingInputProps {
  label: string;
  footings: FootingConfig[];
  onChange: (footings: FootingConfig[]) => void;
  widthLabel?: string;
  depthLabel?: string;
  // Markup prompt support
  onRequestMarkup?: () => void;
  hasPlans?: boolean;
  skipMarkupPrompt?: boolean;
  onSkipMarkupPromptChange?: (skip: boolean) => void;
}

export function MultiFootingInput({
  label,
  footings,
  onChange,
  widthLabel = "Width",
  depthLabel = "Depth",
  onRequestMarkup,
  hasPlans = false,
  skipMarkupPrompt = false,
  onSkipMarkupPromptChange,
}: MultiFootingInputProps) {
  const [newFootingName, setNewFootingName] = useState("");
  const [showMarkupPrompt, setShowMarkupPrompt] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(skipMarkupPrompt);
  const [openFootings, setOpenFootings] = useState<Set<string>>(new Set(footings.map(f => f.id)));

  const toggleFooting = (footingId: string) => {
    setOpenFootings(prev => {
      const next = new Set(prev);
      if (next.has(footingId)) {
        next.delete(footingId);
      } else {
        next.add(footingId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    const allOpen = footings.every(f => openFootings.has(f.id));
    if (allOpen) {
      setOpenFootings(new Set());
    } else {
      setOpenFootings(new Set(footings.map(f => f.id)));
    }
  };

  // Summary calculations
  const summary = useMemo(() => {
    let totalLength = 0;
    let totalVolume = 0;
    let fromTakeoffCount = 0;

    footings.forEach(footing => {
      const length = Number(footing.length) || 0;
      const widthM = (Number(footing.width) || 0) / 1000;
      const depthM = (Number(footing.depth) || 0) / 1000;
      totalLength += length;
      totalVolume += length * widthM * depthM;
      if (footing._fromTakeoff) fromTakeoffCount++;
    });

    return { totalLength, totalVolume, fromTakeoffCount, total: footings.length };
  }, [footings]);

  const addFooting = () => {
    const footingNumber = footings.length + 1;
    const name = newFootingName.trim() || `Footing ${footingNumber}`;
    const newFooting: FootingConfig = {
      id: `footing-${Date.now()}`,
      name,
      length: 0,
      width: 450,
      depth: 300,
    };
    onChange([...footings, newFooting]);
    setNewFootingName("");
    setOpenFootings(prev => new Set([...prev, newFooting.id]));
  };

  const handleAddClick = () => {
    if (hasPlans && onRequestMarkup && !skipMarkupPrompt) {
      setShowMarkupPrompt(true);
    } else {
      addFooting();
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
    addFooting();
  };

  const removeFooting = (id: string) => {
    if (footings.length > 1) {
      onChange(footings.filter((f) => f.id !== id));
    }
  };

  const duplicateFooting = (footing: FootingConfig) => {
    const newFooting: FootingConfig = {
      ...footing,
      id: `footing-${Date.now()}`,
      name: `${footing.name} (copy)`,
      _fromTakeoff: false,
    };
    onChange([...footings, newFooting]);
    setOpenFootings(prev => new Set([...prev, newFooting.id]));
  };

  const updateFooting = (id: string, field: keyof FootingConfig, value: any) => {
    onChange(
      footings.map((footing) =>
        footing.id === id 
          ? { 
              ...footing, 
              [field]: value,
              ...(field !== 'name' && footing._fromTakeoff ? { _fromTakeoff: false } : {})
            } 
          : footing
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="flex items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1.5">
            <Ruler className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{summary.total}</span>
            <span>footing{summary.total !== 1 ? 's' : ''}</span>
            <span className="text-muted-foreground/60">({summary.totalLength.toFixed(1)}m)</span>
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
          {footings.every(f => openFootings.has(f.id)) ? 'Collapse' : 'Expand'}
        </Button>
      </div>

      {/* Footing Cards */}
      <div className="space-y-2">
        {footings.map((footing) => {
          const isOpen = openFootings.has(footing.id);
          const length = Number(footing.length) || 0;
          const widthM = (Number(footing.width) || 0) / 1000;
          const depthM = (Number(footing.depth) || 0) / 1000;
          const volume = length * widthM * depthM;

          return (
            <Collapsible key={footing.id} open={isOpen} onOpenChange={() => toggleFooting(footing.id)}>
              <div className={cn(
                "border rounded-lg overflow-hidden transition-colors",
                footing._fromTakeoff ? "border-blue-500/30 bg-blue-500/[0.02]" : "bg-card"
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
                        <span className="font-medium text-sm">{footing.name}</span>
                        <Badge variant="outline" className="text-xs font-normal h-5">
                          {length.toFixed(1)}m
                        </Badge>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {footing.width}w × {footing.depth}d
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {footing._fromTakeoff && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400">
                                Takeoff
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Measured from plan takeoff</p>
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
                        value={footing.name}
                        onChange={(e) => updateFooting(footing.id, "name", e.target.value)}
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
                            value={footing.length ?? ""}
                            onChange={(e) =>
                              updateFooting(footing.id, "length", e.target.value === "" ? 0 : Number(e.target.value))
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
                            value={footing.width ?? ""}
                            onChange={(e) =>
                              updateFooting(footing.id, "width", e.target.value === "" ? 0 : Number(e.target.value))
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
                            value={footing.depth ?? ""}
                            onChange={(e) =>
                              updateFooting(footing.id, "depth", e.target.value === "" ? 0 : Number(e.target.value))
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
                        onClick={() => duplicateFooting(footing)}
                      >
                        <Copy className="h-3 w-3" />
                        Duplicate
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                        onClick={() => removeFooting(footing.id)}
                        disabled={footings.length <= 1}
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

      {/* Add footing input */}
      <div className="flex items-center gap-2 pt-2 border-t">
        <Input
          placeholder="New footing name (optional)"
          value={newFootingName}
          onChange={(e) => setNewFootingName(e.target.value)}
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
          Add Footing
        </Button>
      </div>

      <MarkupPromptDialog
        open={showMarkupPrompt}
        onOpenChange={setShowMarkupPrompt}
        itemType="footing"
        onMarkOnPlans={handleMarkOnPlans}
        onEnterManually={handleEnterManually}
        dontAskAgain={dontAskAgain}
        onDontAskAgainChange={setDontAskAgain}
      />
    </div>
  );
}
