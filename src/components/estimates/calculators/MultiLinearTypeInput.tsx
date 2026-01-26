import { useState, useMemo } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { LinearSection } from "@/lib/estimate-components/types";
import { MarkupPromptDialog } from "./MarkupPromptDialog";

// Scope-specific type prefixes
export const LINEAR_TYPE_PREFIXES: Record<string, string> = {
  strip_footings: 'SF',
  retaining_wall_footings: 'RF',
  kerbs_channels: 'K',
  retaining_walls: 'RW',
};

// Scope-specific dimension labels
const LINEAR_SCOPE_CONFIG: Record<string, {
  dimension1Label: string;
  dimension2Label: string;
  dimension1Default: number;
  dimension2Default: number;
}> = {
  strip_footings: { dimension1Label: 'Width', dimension2Label: 'Depth', dimension1Default: 450, dimension2Default: 300 },
  retaining_wall_footings: { dimension1Label: 'Width', dimension2Label: 'Depth', dimension1Default: 600, dimension2Default: 400 },
  kerbs_channels: { dimension1Label: 'Width', dimension2Label: 'Height', dimension1Default: 300, dimension2Default: 450 },
  retaining_walls: { dimension1Label: 'Thickness', dimension2Label: 'Height', dimension1Default: 200, dimension2Default: 1200 },
};

interface LinearTypeGroup {
  typeName: string;
  dimension1: number;
  dimension2: number;
  has_toe?: boolean;
  toe_width?: number;
  toe_depth?: number;
  segments: LinearSection[];
  totalLength: number;
  totalVolume: number;
}

interface MultiLinearTypeInputProps {
  scopeId: string;
  label?: string;
  sections: LinearSection[];
  onChange: (sections: LinearSection[]) => void;
  // Markup prompt support
  onRequestMarkup?: () => void;
  hasPlans?: boolean;
  skipMarkupPrompt?: boolean;
  onSkipMarkupPromptChange?: (skip: boolean) => void;
}

function parseLinearTypeName(name: string): string {
  // Extract base type name: "SF1-2" -> "SF1", "Section 1" -> "Section 1"
  const match = name.match(/^([A-Z]+\d+)/i);
  if (match) return match[1].toUpperCase();
  
  // For legacy names like "Section 1", use the full name as type
  return name.split('-')[0].trim();
}

function groupLinearByType(sections: LinearSection[], includeToe: boolean = false): LinearTypeGroup[] {
  const groupMap = new Map<string, LinearTypeGroup>();
  
  sections.forEach(section => {
    const typeName = parseLinearTypeName(section.name);
    // Group by typeName + dimensions (and toe settings for retaining wall footings)
    const toeKey = includeToe 
      ? `-${section.has_toe ? 1 : 0}-${section.toe_width || 0}-${section.toe_depth || 0}` 
      : '';
    const key = `${typeName}-${section.dimension1}-${section.dimension2}${toeKey}`;
    
    const length = section._actualLength && section._actualLength > 0 
      ? section._actualLength 
      : (section.length || 0);
    const volume = length * (section.dimension1 / 1000) * (section.dimension2 / 1000);
    
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        typeName,
        dimension1: section.dimension1 || 0,
        dimension2: section.dimension2 || 0,
        has_toe: section.has_toe,
        toe_width: section.toe_width,
        toe_depth: section.toe_depth,
        segments: [section],
        totalLength: length,
        totalVolume: volume,
      });
    } else {
      const group = groupMap.get(key)!;
      group.segments.push(section);
      group.totalLength += length;
      group.totalVolume += volume;
    }
  });
  
  // Sort groups by type name
  return Array.from(groupMap.values()).sort((a, b) => 
    a.typeName.localeCompare(b.typeName, undefined, { numeric: true })
  );
}

export function MultiLinearTypeInput({
  scopeId,
  label,
  sections,
  onChange,
  onRequestMarkup,
  hasPlans = false,
  skipMarkupPrompt = false,
  onSkipMarkupPromptChange,
}: MultiLinearTypeInputProps) {
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [newTypeName, setNewTypeName] = useState("");
  const [showMarkupPrompt, setShowMarkupPrompt] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(skipMarkupPrompt);

  const prefix = LINEAR_TYPE_PREFIXES[scopeId] || 'L';
  const config = LINEAR_SCOPE_CONFIG[scopeId] || {
    dimension1Label: 'Width',
    dimension2Label: 'Depth',
    dimension1Default: 300,
    dimension2Default: 300,
  };
  
  const showToe = scopeId === 'retaining_wall_footings';
  
  const groups = useMemo(() => groupLinearByType(sections, showToe), [sections, showToe]);

  // Calculate grand totals
  const grandTotalLength = groups.reduce((sum, g) => sum + g.totalLength, 0);
  const grandTotalVolume = groups.reduce((sum, g) => sum + g.totalVolume, 0);

  const toggleExpand = (typeName: string) => {
    setExpandedTypes(prev => {
      const next = new Set(prev);
      if (next.has(typeName)) {
        next.delete(typeName);
      } else {
        next.add(typeName);
      }
      return next;
    });
  };

  const matchesGroup = (section: LinearSection, group: LinearTypeGroup): boolean => {
    const sectionType = parseLinearTypeName(section.name);
    if (sectionType !== group.typeName) return false;
    if (section.dimension1 !== group.dimension1) return false;
    if (section.dimension2 !== group.dimension2) return false;
    if (showToe) {
      const sectionHasToe = section.has_toe ?? false;
      const groupHasToe = group.has_toe ?? false;
      if (sectionHasToe !== groupHasToe) return false;
      if (sectionHasToe && groupHasToe) {
        if (section.toe_width !== group.toe_width) return false;
        if (section.toe_depth !== group.toe_depth) return false;
      }
    }
    return true;
  };

  const updateGroupDimensions = (group: LinearTypeGroup, field: 'dimension1' | 'dimension2', value: number) => {
    const updatedSections = sections.map(section => {
      if (matchesGroup(section, group)) {
        return { ...section, [field]: value };
      }
      return section;
    });
    onChange(updatedSections);
  };

  const updateGroupToe = (group: LinearTypeGroup, field: 'has_toe' | 'toe_width' | 'toe_depth', value: boolean | number) => {
    const updatedSections = sections.map(section => {
      if (matchesGroup(section, group)) {
        return { ...section, [field]: value };
      }
      return section;
    });
    onChange(updatedSections);
  };

  const updateGroupTotalLength = (group: LinearTypeGroup, newTotalLength: number) => {
    if (group.totalLength === 0 || newTotalLength <= 0) return;
    
    const ratio = newTotalLength / group.totalLength;
    
    const updatedSections = sections.map(section => {
      if (matchesGroup(section, group)) {
        const currentLength = section._actualLength && section._actualLength > 0 
          ? section._actualLength 
          : (section.length || 0);
        const newLength = Math.round(currentLength * ratio * 100) / 100;
        return { 
          ...section, 
          length: newLength,
          _actualLength: section._fromTakeoff ? newLength : undefined,
        };
      }
      return section;
    });
    onChange(updatedSections);
  };

  const deleteGroup = (group: LinearTypeGroup) => {
    const updatedSections = sections.filter(section => !matchesGroup(section, group));
    onChange(updatedSections);
  };

  const addNewType = () => {
    // Find the next available type number
    const existingNumbers = groups
      .map(g => {
        const match = g.typeName.match(/\d+$/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter(n => !isNaN(n));
    
    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    const typeName = newTypeName.trim() || `${prefix}${nextNumber}`;
    
    const newSection: LinearSection = {
      id: `section-${Date.now()}`,
      name: `${typeName}-1`,
      length: 0,
      dimension1: config.dimension1Default,
      dimension2: config.dimension2Default,
      ...(showToe ? { has_toe: false, toe_width: 300, toe_depth: 300 } : {}),
    };
    
    onChange([...sections, newSection]);
    setNewTypeName("");
  };

  const handleAddClick = () => {
    if (hasPlans && onRequestMarkup && !skipMarkupPrompt) {
      setShowMarkupPrompt(true);
    } else {
      addNewType();
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
    addNewType();
  };

  const addSegmentToGroup = (group: LinearTypeGroup) => {
    // Find the next segment number for this group
    const nextSegmentNum = group.segments.length + 1;
    const newSegmentName = `${group.typeName}-${nextSegmentNum}`;
    
    const newSection: LinearSection = {
      id: `section-${Date.now()}`,
      name: newSegmentName,
      length: 0,
      dimension1: group.dimension1,
      dimension2: group.dimension2,
      ...(showToe ? { 
        has_toe: group.has_toe ?? false, 
        toe_width: group.toe_width ?? 300, 
        toe_depth: group.toe_depth ?? 300 
      } : {}),
    };
    
    onChange([...sections, newSection]);
  };

  const updateSegmentLength = (segmentId: string, newLength: number) => {
    const updatedSections = sections.map(section => 
      section.id === segmentId 
        ? { 
            ...section, 
            length: newLength,
            _actualLength: section._fromTakeoff ? newLength : undefined,
          } 
        : section
    );
    onChange(updatedSections);
  };

  if (groups.length === 0) {
    return (
      <Card>
        {label && (
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{label}</CardTitle>
          </CardHeader>
        )}
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">No sections defined yet.</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder={`New type name (e.g., ${prefix}1)`}
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              className="flex-1 h-11 sm:h-9"
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
              onClick={handleAddClick}
              className="shrink-0 h-11 sm:h-9"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Type
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const isExpanded = expandedTypes.has(`${group.typeName}-${group.dimension1}-${group.dimension2}`);
        const groupKey = `${group.typeName}-${group.dimension1}-${group.dimension2}`;
        
        return (
          <Collapsible
            key={groupKey}
            open={isExpanded}
            onOpenChange={() => toggleExpand(groupKey)}
          >
            <div className="border rounded-lg bg-muted/30">
              {/* Type Header Row */}
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <span className="font-medium text-sm bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {group.typeName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({group.segments.length} segment{group.segments.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary hover:text-primary"
                    onClick={() => addSegmentToGroup(group)}
                    title="Add segment to this type"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => deleteGroup(group)}
                    title="Remove all segments of this type"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Dimensions & Totals Grid */}
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{config.dimension1Label}</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={group.dimension1 || ""}
                        onChange={(e) =>
                          updateGroupDimensions(group, 'dimension1', 
                            e.target.value === "" ? 0 : Number(e.target.value)
                          )
                        }
                        min={50}
                        step={50}
                        className="pr-12 h-11 sm:h-9"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        mm
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{config.dimension2Label}</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={group.dimension2 || ""}
                        onChange={(e) =>
                          updateGroupDimensions(group, 'dimension2',
                            e.target.value === "" ? 0 : Number(e.target.value)
                          )
                        }
                        min={50}
                        step={50}
                        className="pr-12 h-11 sm:h-9"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        mm
                      </span>
                    </div>
                  </div>


                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Total Length</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={group.totalLength > 0 ? group.totalLength.toFixed(2) : ""}
                        onChange={(e) =>
                          updateGroupTotalLength(group,
                            e.target.value === "" ? 0 : Number(e.target.value)
                          )
                        }
                        min={0}
                        step={0.1}
                        className="pr-8 h-11 sm:h-9"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        m
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Volume</Label>
                    <div className="h-11 sm:h-9 flex items-center px-3 bg-muted rounded-md text-sm">
                      {group.totalVolume > 0 ? `${group.totalVolume.toFixed(2)} m³` : "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Segments */}
              <CollapsibleContent>
                {/* Toe Section - only for retaining wall footings */}
                {showToe && (
                  <div className="border-t px-3 py-3 bg-muted/20">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">Include Toe?</Label>
                      <Switch
                        checked={group.has_toe ?? false}
                        onCheckedChange={(checked) => updateGroupToe(group, 'has_toe', checked)}
                      />
                    </div>
                    {group.has_toe && (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Toe Width</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              inputMode="numeric"
                              value={group.toe_width ?? 300}
                              onChange={(e) =>
                                updateGroupToe(group, 'toe_width',
                                  e.target.value === "" ? 0 : Number(e.target.value)
                                )
                              }
                              min={0}
                              step={50}
                              className="pr-12 h-11 sm:h-9"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              mm
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Toe Depth</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              inputMode="numeric"
                              value={group.toe_depth ?? 300}
                              onChange={(e) =>
                                updateGroupToe(group, 'toe_depth',
                                  e.target.value === "" ? 0 : Number(e.target.value)
                                )
                              }
                              min={0}
                              step={50}
                              className="pr-12 h-11 sm:h-9"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              mm
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Segments list */}
                <div className="border-t px-3 py-2 bg-background/50">
                  <div className="space-y-2">
                    {group.segments.map((segment, idx) => {
                      const segmentLength = segment._actualLength && segment._actualLength > 0 
                        ? segment._actualLength 
                        : (segment.length || 0);
                      const segmentVolume = segmentLength * (segment.dimension1 / 1000) * (segment.dimension2 / 1000);
                      return (
                        <div 
                          key={segment.id}
                          className={cn(
                            "flex items-center gap-3 text-sm py-1",
                            idx !== group.segments.length - 1 && "border-b border-dashed"
                          )}
                        >
                          <span className="text-muted-foreground w-16 shrink-0 truncate" title={segment.name}>
                            {segment.name}
                          </span>
                          <div className="flex-1 flex items-center gap-2">
                            <div className="relative flex-1 max-w-[120px]">
                              <Input
                                type="number"
                                inputMode="decimal"
                                value={segmentLength || ""}
                                onChange={(e) =>
                                  updateSegmentLength(segment.id,
                                    e.target.value === "" ? 0 : Number(e.target.value)
                                  )
                                }
                                min={0}
                                step={0.01}
                                className="pr-8 h-8 text-sm"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                m
                              </span>
                            </div>
                            <span className="text-muted-foreground text-xs">
                              = {segmentVolume.toFixed(2)} m³
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}

      {/* Grand Totals */}
      <div className="flex flex-wrap gap-4 pt-3 border-t text-sm">
        <div>
          <span className="text-muted-foreground">Total Length: </span>
          <span className="font-medium">{grandTotalLength.toFixed(1)} m</span>
        </div>
        <div>
          <span className="text-muted-foreground">Total Volume: </span>
          <span className="font-medium">{grandTotalVolume.toFixed(2)} m³</span>
        </div>
      </div>

      {/* Add new type button */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <Input
          placeholder={`New type name (e.g., ${prefix}${groups.length + 1})`}
          value={newTypeName}
          onChange={(e) => setNewTypeName(e.target.value)}
          className="flex-1 h-11 sm:h-9"
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
          onClick={handleAddClick}
          className="shrink-0 h-11 sm:h-9"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Type
        </Button>
      </div>

      <MarkupPromptDialog
        open={showMarkupPrompt}
        onOpenChange={setShowMarkupPrompt}
        itemType="footing type"
        onMarkOnPlans={handleMarkOnPlans}
        onEnterManually={handleEnterManually}
        dontAskAgain={dontAskAgain}
        onDontAskAgainChange={setDontAskAgain}
      />
    </div>
  );
}
