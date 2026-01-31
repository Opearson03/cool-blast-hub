import { LinearSection, PriceMap } from "@/lib/estimate-components/types";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { ChevronDown, ChevronRight, Layers, ChevronsUpDown } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";

const TM_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'L8TM3', label: 'L8TM3' },
  { value: 'L11TM4', label: 'L11TM4' },
  { value: 'L12TM5', label: 'L12TM5' },
  { value: 'L8TM4', label: 'L8TM4' },
  { value: 'L11TM5', label: 'L11TM5' },
];

const BAR_SIZE_OPTIONS = [
  { value: 'N12', label: 'N12' },
  { value: 'N16', label: 'N16' },
  { value: 'N20', label: 'N20' },
  { value: 'N24', label: 'N24' },
];

const BAR_SPACING_OPTIONS = [
  { value: '100', label: '100mm' },
  { value: '150', label: '150mm' },
  { value: '200', label: '200mm' },
  { value: '250', label: '250mm' },
];

const BAR_CONFIG_OPTIONS = [
  { value: 'bottom', label: 'Bottom only' },
  { value: 'top_bottom', label: 'Top & Bottom' },
];

const TM_LAYERS_OPTIONS = [
  { value: 1, label: '1 Layer' },
  { value: 2, label: '2 Layers' },
];

const LIG_SIZE_OPTIONS = [
  { value: 'R10', label: 'R10' },
  { value: 'R12', label: 'R12' },
];

const LIG_CENTRES_OPTIONS = [
  { value: 100, label: '100mm' },
  { value: 150, label: '150mm' },
  { value: 200, label: '200mm' },
  { value: 250, label: '250mm' },
  { value: 300, label: '300mm' },
  { value: 400, label: '400mm' },
  { value: 600, label: '600mm' },
];

const VERTICAL_CENTRES_OPTIONS = [
  { value: 200, label: '200mm' },
  { value: 300, label: '300mm' },
  { value: 400, label: '400mm' },
  { value: 600, label: '600mm' },
];

// Get TM price from price map
function getTmPrice(tmType: string, priceMap?: PriceMap): number | undefined {
  if (!priceMap || tmType === 'none') return undefined;
  return priceMap['trench_mesh']?.[tmType];
}

// Get chair price from price map
function getChairPrice(chairType: string, priceMap?: PriceMap): number | undefined {
  if (!priceMap) return undefined;
  return priceMap['consumables']?.[chairType];
}

interface LinearSectionReinforcementInputProps {
  sections: LinearSection[];
  onChange: (sections: LinearSection[]) => void;
  defaultReoType: 'none' | 'trench_mesh' | 'bar' | 'both';
  defaultTmType: string;
  defaultBarSize: string;
  defaultBarSpacing: string;
  defaultBarConfig: 'bottom' | 'top_bottom';
  defaultAddLigs: boolean;
  defaultLigSize: string;
  defaultLigCentres: number;
  defaultAddVerticalBars: boolean;
  defaultVerticalBarSize: string;
  defaultVerticalBarCentres: number;
  label: string;
  priceMap?: PriceMap;
}

export function LinearSectionReinforcementInput({
  sections,
  onChange,
  defaultReoType,
  defaultTmType,
  defaultBarSize,
  defaultBarSpacing,
  defaultBarConfig,
  defaultAddLigs,
  defaultLigSize,
  defaultLigCentres,
  defaultAddVerticalBars,
  defaultVerticalBarSize,
  defaultVerticalBarCentres,
  label,
  priceMap,
}: LinearSectionReinforcementInputProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const updateSection = (index: number, updates: Partial<LinearSection>) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], ...updates };
    onChange(newSections);
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    const allOpen = sections.every(s => openSections.has(s.id));
    if (allOpen) {
      setOpenSections(new Set());
    } else {
      setOpenSections(new Set(sections.map(s => s.id)));
    }
  };

  // Summary calculations
  const summary = useMemo(() => {
    let totalLength = 0;
    let tmCount = 0;
    let barCount = 0;
    let ligsCount = 0;
    let noneCount = 0;
    let customCount = 0;

    sections.forEach(section => {
      const length = section._actualLength || section.length;
      totalLength += length;
      
      const reoType = section.reo_type || defaultReoType;
      if (reoType === 'trench_mesh') tmCount++;
      else if (reoType === 'bar') barCount++;
      else if (reoType === 'both') { tmCount++; barCount++; }
      else if (reoType === 'none') noneCount++;
      
      if (section.add_ligs ?? defaultAddLigs) ligsCount++;
      if (section.reo_type || section.tm_type || section.bar_size) customCount++;
    });

    return { totalLength, tmCount, barCount, ligsCount, noneCount, customCount, total: sections.length };
  }, [sections, defaultReoType, defaultAddLigs]);

  // Initialize TM prices from priceMap when it becomes available
  useEffect(() => {
    if (!priceMap || sections.length === 0) return;
    
    let hasChanges = false;
    const updatedSections = sections.map(section => {
      const reoType = section.reo_type || defaultReoType;
      const tmType = section.tm_type || defaultTmType;
      const tmLayers = section.tm_layers || 1;
      let updates: Partial<LinearSection> = {};
      
      // Initialize bottom/single layer price if TM and price undefined
      if ((reoType === 'trench_mesh' || reoType === 'both') && tmType !== 'none' && section.tm_price === undefined) {
        const catalogPrice = getTmPrice(tmType, priceMap);
        if (catalogPrice !== undefined) {
          updates.tm_price = catalogPrice;
          hasChanges = true;
        }
      }
      
      // Initialize top layer price if 2 layers and price undefined
      if ((reoType === 'trench_mesh' || reoType === 'both') && tmLayers > 1 && section.tm_price_top === undefined) {
        const topType = section.tm_type_top || tmType;
        const catalogPriceTop = getTmPrice(topType, priceMap);
        if (catalogPriceTop !== undefined) {
          updates.tm_price_top = catalogPriceTop;
          hasChanges = true;
        }
      }
      
      return Object.keys(updates).length > 0 ? { ...section, ...updates } : section;
    });
    
    if (hasChanges) {
      onChange(updatedSections);
    }
  }, [priceMap, sections.length]);

  if (sections.length === 0) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground italic py-4 px-3 border border-dashed rounded-lg">
        <Layers className="h-5 w-5 opacity-50" />
        <span>No {label.toLowerCase()} defined. Add sections in the scope configuration above.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary Header */}
      <div className="flex items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{summary.total}</span>
            <span>section{summary.total !== 1 ? 's' : ''}</span>
            <span className="text-muted-foreground/60">({summary.totalLength.toFixed(1)} m)</span>
          </div>
          {summary.tmCount > 0 && (
            <>
              <span className="text-border">•</span>
              <span>{summary.tmCount} with TM</span>
            </>
          )}
          {summary.barCount > 0 && (
            <>
              <span className="text-border">•</span>
              <span>{summary.barCount} with bar</span>
            </>
          )}
          {summary.ligsCount > 0 && (
            <>
              <span className="text-border">•</span>
              <span>{summary.ligsCount} with ligs</span>
            </>
          )}
          {summary.customCount > 0 && (
            <>
              <span className="text-border">•</span>
              <span className="text-primary">{summary.customCount} custom</span>
            </>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleAll}
          className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ChevronsUpDown className="h-3.5 w-3.5" />
          {sections.every(s => openSections.has(s.id)) ? 'Collapse' : 'Expand'}
        </Button>
      </div>

      {/* Section Cards */}
      <div className="space-y-2">
        {sections.map((section, index) => {
          const isOpen = openSections.has(section.id);
          const reoType = section.reo_type || defaultReoType;
          const tmType = section.tm_type || defaultTmType;
          const tmLayers = section.tm_layers || 1;
          const barSize = section.bar_size || defaultBarSize;
          const barSpacing = section.bar_spacing || defaultBarSpacing;
          const barConfig = section.bar_config || defaultBarConfig;
          const addLigs = section.add_ligs ?? defaultAddLigs;
          const ligSize = section.lig_size || defaultLigSize;
          const ligCentres = section.lig_centres ?? defaultLigCentres;
          const addVerticalBars = section.add_vertical_bars ?? defaultAddVerticalBars;
          const verticalBarSize = section.vertical_bar_size || defaultVerticalBarSize;
          const verticalBarCentres = section.vertical_bar_centres ?? defaultVerticalBarCentres;
          const length = section._actualLength || section.length;
          const hasCustomSettings = section.reo_type || section.tm_type || section.bar_size || (section.tm_layers && section.tm_layers > 1);
          const hasReinforcement = reoType !== 'none';
          const showTm = reoType === 'trench_mesh' || reoType === 'both';
          const showBar = reoType === 'bar' || reoType === 'both';

          return (
            <Collapsible key={section.id} open={isOpen} onOpenChange={() => toggleSection(section.id)}>
              <div className={cn(
                "border rounded-lg overflow-hidden transition-colors",
                hasCustomSettings ? "border-primary/30 bg-primary/[0.02]" : "bg-card"
              )}>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className="font-medium text-sm">{section.name}</span>
                      <Badge variant="outline" className="text-xs font-normal h-5">
                        {length.toFixed(1)} m
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-[11px] h-5",
                          showTm && "bg-primary/10 text-primary border-primary/20",
                          showBar && !showTm && "bg-accent text-accent-foreground",
                          reoType === 'both' && "bg-primary/10 text-primary border-primary/20",
                          reoType === 'none' && "bg-muted text-muted-foreground"
                        )}
                      >
                        {reoType === 'trench_mesh' ? 'TM' : reoType === 'bar' ? 'Bar' : reoType === 'both' ? 'TM+Bar' : 'None'}
                      </Badge>
                      {addLigs && (
                        <Badge variant="outline" className="text-[10px] h-5">
                          Ligs
                        </Badge>
                      )}
                      {hasCustomSettings && (
                        <Badge variant="outline" className="text-[10px] h-5 border-primary/30 text-primary">
                          Custom
                        </Badge>
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="px-3 pb-3 pt-2 border-t bg-muted/30 space-y-3">
                    {/* Main Reinforcement Toggle */}
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        Reinforcement
                      </Label>
                      <div className="flex items-center gap-3 px-3 py-1.5 rounded-md border bg-background">
                        <Switch
                          checked={hasReinforcement}
                          onCheckedChange={(checked) => {
                            updateSection(index, { 
                              reo_type: checked ? 'trench_mesh' : 'none' 
                            });
                          }}
                        />
                        <span className={cn(
                          "text-sm min-w-[3ch]",
                          hasReinforcement ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {hasReinforcement ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>

                    {/* Reinforcement Settings - only show if reinforcement enabled */}
                    {hasReinforcement && (
                      <>
                        <div className="pt-3 border-t space-y-3">
                          {/* Type Selection */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground">Type</Label>
                              <Select
                                value={reoType}
                                onValueChange={(val) => updateSection(index, { reo_type: val as any })}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-[150]">
                                  <SelectItem value="trench_mesh">Trench Mesh</SelectItem>
                                  <SelectItem value="bar">Bar Reo</SelectItem>
                                  <SelectItem value="both">TM + Bar</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* TM Type (when TM or Both) */}
                            {showTm && (
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">
                                  {tmLayers > 1 ? 'Bottom TM' : 'TM Type'}
                                </Label>
                                <Select
                                  value={tmType}
                                  onValueChange={(val) => {
                                    const catalogPrice = getTmPrice(val, priceMap);
                                    updateSection(index, { 
                                      tm_type: val,
                                      tm_price: catalogPrice
                                    });
                                  }}
                                >
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="z-[150]">
                                    {TM_OPTIONS.map((opt) => (
                                      <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>

                          {/* TM Price & Layers */}
                          {showTm && tmType !== 'none' && (
                            <div className={cn("grid gap-3", tmLayers > 1 ? "grid-cols-3" : "grid-cols-2")}>
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">
                                  {tmLayers > 1 ? 'Bottom $/sheet' : '$/sheet'}
                                </Label>
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={section.tm_price !== undefined ? section.tm_price : (getTmPrice(tmType, priceMap) ?? '')}
                                    onChange={(e) => updateSection(index, { tm_price: e.target.value ? Number(e.target.value) : undefined })}
                                    className="h-8 text-sm pl-6"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">Layers</Label>
                                <Select
                                  value={String(tmLayers)}
                                  onValueChange={(val) => updateSection(index, { tm_layers: Number(val) })}
                                >
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="z-[150]">
                                    {TM_LAYERS_OPTIONS.map((opt) => (
                                      <SelectItem key={opt.value} value={String(opt.value)}>
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              {/* Top layer price - only when 2 layers */}
                              {tmLayers > 1 && (
                                <div className="space-y-1">
                                  <Label className="text-[10px] text-muted-foreground">Top $/sheet</Label>
                                  <div className="relative">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={section.tm_price_top !== undefined ? section.tm_price_top : (getTmPrice(section.tm_type_top || tmType, priceMap) ?? '')}
                                      onChange={(e) => updateSection(index, { tm_price_top: e.target.value ? Number(e.target.value) : undefined })}
                                      className="h-8 text-sm pl-6"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Top Layer Type - only when 2 layers */}
                          {showTm && tmType !== 'none' && tmLayers > 1 && (
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground">Top Layer Type</Label>
                              <Select
                                value={section.tm_type_top || tmType}
                                onValueChange={(val) => {
                                  const catalogPrice = getTmPrice(val, priceMap);
                                  updateSection(index, { 
                                    tm_type_top: val,
                                    tm_price_top: catalogPrice
                                  });
                                }}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-[150]">
                                  {TM_OPTIONS.filter(o => o.value !== 'none').map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* Bar options (when Bar or Both) */}
                          {showBar && (
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">Bar Size</Label>
                                <Select
                                  value={barSize}
                                  onValueChange={(val) => updateSection(index, { bar_size: val })}
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
                                <Label className="text-[10px] text-muted-foreground">Spacing</Label>
                                <Select
                                  value={barSpacing}
                                  onValueChange={(val) => updateSection(index, { bar_spacing: val })}
                                >
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="z-[150]">
                                    {BAR_SPACING_OPTIONS.map((opt) => (
                                      <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">Config</Label>
                                <Select
                                  value={barConfig}
                                  onValueChange={(val) => updateSection(index, { bar_config: val as 'bottom' | 'top_bottom' })}
                                >
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="z-[150]">
                                    {BAR_CONFIG_OPTIONS.map((opt) => (
                                      <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Ligatures Section */}
                        <div className="pt-3 border-t space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
                              Ligatures
                            </Label>
                            <div className="flex items-center gap-3 px-3 py-1.5 rounded-md border bg-background">
                              <Switch
                                checked={addLigs}
                                onCheckedChange={(checked) => updateSection(index, { add_ligs: checked })}
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
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">Lig Size</Label>
                                <Select
                                  value={ligSize}
                                  onValueChange={(val) => updateSection(index, { lig_size: val })}
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
                                <Label className="text-[10px] text-muted-foreground">Centres</Label>
                                <Select
                                  value={String(ligCentres)}
                                  onValueChange={(val) => updateSection(index, { lig_centres: Number(val) })}
                                >
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="z-[150]">
                                    {LIG_CENTRES_OPTIONS.map((opt) => (
                                      <SelectItem key={opt.value} value={String(opt.value)}>
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Vertical Starters Section */}
                        <div className="pt-3 border-t space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
                              Vertical Starters
                            </Label>
                            <div className="flex items-center gap-3 px-3 py-1.5 rounded-md border bg-background">
                              <Switch
                                checked={addVerticalBars}
                                onCheckedChange={(checked) => updateSection(index, { add_vertical_bars: checked })}
                              />
                              <span className={cn(
                                "text-sm min-w-[3ch]",
                                addVerticalBars ? "text-foreground" : "text-muted-foreground"
                              )}>
                                {addVerticalBars ? 'Yes' : 'No'}
                              </span>
                            </div>
                          </div>
                          
                          {addVerticalBars && (
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">Bar Size</Label>
                                <Select
                                  value={verticalBarSize}
                                  onValueChange={(val) => updateSection(index, { vertical_bar_size: val })}
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
                                <Label className="text-[10px] text-muted-foreground">Centres</Label>
                                <Select
                                  value={String(verticalBarCentres)}
                                  onValueChange={(val) => updateSection(index, { vertical_bar_centres: Number(val) })}
                                >
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="z-[150]">
                                    {VERTICAL_CENTRES_OPTIONS.map((opt) => (
                                      <SelectItem key={opt.value} value={String(opt.value)}>
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Bar Chairs Section */}
                        <div className="pt-3 border-t space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
                              TM Chairs
                            </Label>
                            <div className="flex items-center gap-3 px-3 py-1.5 rounded-md border bg-background">
                              <Switch
                                checked={section.chairs_enabled ?? false}
                                onCheckedChange={(checked) => updateSection(index, { chairs_enabled: checked })}
                              />
                              <span className={cn(
                                "text-sm min-w-[3ch]",
                                section.chairs_enabled ? "text-foreground" : "text-muted-foreground"
                              )}>
                                {section.chairs_enabled ? 'Yes' : 'No'}
                              </span>
                            </div>
                          </div>
                          
                          {section.chairs_enabled && (
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">Chairs/m</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0.5"
                                  max="5"
                                  value={section.chairs_per_m ?? 1.4}
                                  onChange={(e) => updateSection(index, { chairs_per_m: Number(e.target.value) })}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">$/25</Label>
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={section.chair_price_per_bag ?? 12.50}
                                    onChange={(e) => updateSection(index, { chair_price_per_bag: Number(e.target.value) })}
                                    className="h-8 text-sm pl-6"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Layer Chairs - only when 2 TM layers */}
                          {showTm && tmLayers > 1 && (
                            <>
                              <div className="flex items-center justify-between pt-2">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Top Chairs
                  </Label>
                                <div className="flex items-center gap-3 px-3 py-1.5 rounded-md border bg-background">
                                  <Switch
                                    checked={section.layer_chairs_enabled ?? false}
                                    onCheckedChange={(checked) => updateSection(index, { layer_chairs_enabled: checked })}
                                  />
                                  <span className={cn(
                                    "text-sm min-w-[3ch]",
                                    section.layer_chairs_enabled ? "text-foreground" : "text-muted-foreground"
                                  )}>
                                    {section.layer_chairs_enabled ? 'Yes' : 'No'}
                                  </span>
                                </div>
                              </div>
                              
                              {section.layer_chairs_enabled && (
                                <div className="grid grid-cols-3 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-[10px] text-muted-foreground">Chair Size</Label>
                                    <Select
                                      value={section.layer_chair_type || '2540C'}
                                      onValueChange={(val) => {
                                        const catalogPrice = getChairPrice(val, priceMap);
                                        updateSection(index, { 
                                          layer_chair_type: val,
                                          layer_chair_price: catalogPrice ?? 12.50
                                        });
                                      }}
                                    >
                                      <SelectTrigger className="h-8 text-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="z-[150]">
                                        <SelectItem value="2540C">25-40mm</SelectItem>
                                        <SelectItem value="5065C">50-65mm</SelectItem>
                                        <SelectItem value="7590C">75-90mm</SelectItem>
                                        <SelectItem value="100120C">100-120mm</SelectItem>
                                        <SelectItem value="125150C">125-150mm</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[10px] text-muted-foreground">Chairs/m</Label>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      min="0.5"
                                      max="5"
                                      value={section.layer_chairs_per_m ?? 1}
                                      onChange={(e) => updateSection(index, { layer_chairs_per_m: Number(e.target.value) })}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[10px] text-muted-foreground">$/25</Label>
                                    <div className="relative">
                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={section.layer_chair_price ?? 12.50}
                                        onChange={(e) => updateSection(index, { layer_chair_price: Number(e.target.value) })}
                                        className="h-8 text-sm pl-6"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Summary Footer */}
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground">
                            {showTm && tmType !== 'none' && (
                              tmLayers > 1 
                                ? `${tmType} (bottom) + ${section.tm_type_top || tmType} (top)`
                                : `${tmType}`
                            )}
                            {showTm && showBar && ' + '}
                            {showBar && `${barSize} @ ${barSpacing}mm ${barConfig === 'top_bottom' ? '(T&B)' : '(bottom)'}`}
                            {addLigs && ` • Ligs ${ligSize} @ ${ligCentres}mm`}
                            {addVerticalBars && ` • Starters ${verticalBarSize} @ ${verticalBarCentres}mm`}
                            <span className="ml-2">• {length.toFixed(1)} m</span>
                          </p>
                        </div>
                      </>
                    )}
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
