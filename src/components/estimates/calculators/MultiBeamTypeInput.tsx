import { useState, useMemo } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export interface BeamConfig {
  id: string;
  name: string;
  length: number;    // metres
  width: number;     // mm
  depth: number;     // mm
}

interface BeamTypeGroup {
  typeName: string;
  width: number;
  depth: number;
  segments: BeamConfig[];
  totalLength: number;
  totalVolume: number;
}

interface MultiBeamTypeInputProps {
  label: string;
  beams: BeamConfig[];
  onChange: (beams: BeamConfig[]) => void;
  typePrefix?: string; // "EB" for edge beams, "IB" for internal beams
}

function parseBeamTypeName(name: string): string {
  // Extract base type name: "EB1-2" -> "EB1", "Edge Beam 1" -> "Edge Beam 1"
  const match = name.match(/^([A-Z]+\d+)/i);
  if (match) return match[1].toUpperCase();
  
  // For legacy names like "Edge Beam 1", use the full name as type
  return name.split('-')[0].trim();
}

function groupBeamsByType(beams: BeamConfig[]): BeamTypeGroup[] {
  const groupMap = new Map<string, BeamTypeGroup>();
  
  beams.forEach(beam => {
    const typeName = parseBeamTypeName(beam.name);
    // Group by typeName + dimensions to handle same type with different dims
    const key = `${typeName}-${beam.width}-${beam.depth}`;
    
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        typeName,
        width: beam.width || 0,
        depth: beam.depth || 0,
        segments: [beam],
        totalLength: beam.length || 0,
        totalVolume: (beam.length || 0) * (beam.width / 1000) * (beam.depth / 1000),
      });
    } else {
      const group = groupMap.get(key)!;
      group.segments.push(beam);
      group.totalLength += beam.length || 0;
      group.totalVolume += (beam.length || 0) * (beam.width / 1000) * (beam.depth / 1000);
    }
  });
  
  // Sort groups by type name
  return Array.from(groupMap.values()).sort((a, b) => 
    a.typeName.localeCompare(b.typeName, undefined, { numeric: true })
  );
}

export function MultiBeamTypeInput({
  label,
  beams,
  onChange,
  typePrefix = "EB",
}: MultiBeamTypeInputProps) {
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [newTypeName, setNewTypeName] = useState("");

  const groups = useMemo(() => groupBeamsByType(beams), [beams]);

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

  const updateGroupDimensions = (group: BeamTypeGroup, field: 'width' | 'depth', value: number) => {
    const updatedBeams = beams.map(beam => {
      const beamType = parseBeamTypeName(beam.name);
      if (beamType === group.typeName && beam.width === group.width && beam.depth === group.depth) {
        return { ...beam, [field]: value };
      }
      return beam;
    });
    onChange(updatedBeams);
  };

  const updateGroupTotalLength = (group: BeamTypeGroup, newTotalLength: number) => {
    if (group.totalLength === 0 || newTotalLength <= 0) return;
    
    const ratio = newTotalLength / group.totalLength;
    
    const updatedBeams = beams.map(beam => {
      const beamType = parseBeamTypeName(beam.name);
      if (beamType === group.typeName && beam.width === group.width && beam.depth === group.depth) {
        return { ...beam, length: Math.round((beam.length || 0) * ratio * 100) / 100 };
      }
      return beam;
    });
    onChange(updatedBeams);
  };

  const deleteGroup = (group: BeamTypeGroup) => {
    const updatedBeams = beams.filter(beam => {
      const beamType = parseBeamTypeName(beam.name);
      return !(beamType === group.typeName && beam.width === group.width && beam.depth === group.depth);
    });
    onChange(updatedBeams);
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
    const typeName = newTypeName.trim() || `${typePrefix}${nextNumber}`;
    
    const newBeam: BeamConfig = {
      id: `beam-${Date.now()}`,
      name: `${typeName}-1`,
      length: 0,
      width: typePrefix === 'IB' ? 300 : 450,
      depth: typePrefix === 'IB' ? 400 : 450,
    };
    
    onChange([...beams, newBeam]);
    setNewTypeName("");
  };

  const updateSegmentLength = (segmentId: string, newLength: number) => {
    const updatedBeams = beams.map(beam => 
      beam.id === segmentId ? { ...beam, length: newLength } : beam
    );
    onChange(updatedBeams);
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
          <p className="text-sm text-muted-foreground">No beams defined yet.</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder={`New type name (e.g., ${typePrefix}1)`}
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              className="flex-1 h-11 sm:h-9"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addNewType();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addNewType}
              className="shrink-0 h-11 sm:h-9"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add {typePrefix === 'IB' ? 'Internal' : 'Edge'} Beam Type
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const isExpanded = expandedTypes.has(`${group.typeName}-${group.width}-${group.depth}`);
        const groupKey = `${group.typeName}-${group.width}-${group.depth}`;
        
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
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => deleteGroup(group)}
                    title="Remove all segments of this type"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Dimensions & Totals Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Width</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={group.width || ""}
                        onChange={(e) =>
                          updateGroupDimensions(group, 'width', 
                            e.target.value === "" ? 0 : Number(e.target.value)
                          )
                        }
                        min={100}
                        step={50}
                        className="pr-12 h-11 sm:h-9"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        mm
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Depth</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={group.depth || ""}
                        onChange={(e) =>
                          updateGroupDimensions(group, 'depth',
                            e.target.value === "" ? 0 : Number(e.target.value)
                          )
                        }
                        min={100}
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
                <div className="border-t px-3 py-2 bg-background/50">
                  <div className="space-y-2">
                    {group.segments.map((segment, idx) => {
                      const segmentVolume = (segment.length || 0) * (segment.width / 1000) * (segment.depth / 1000);
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
                                value={segment.length || ""}
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
          placeholder={`New type name (e.g., ${typePrefix}${groups.length + 1})`}
          value={newTypeName}
          onChange={(e) => setNewTypeName(e.target.value)}
          className="flex-1 h-11 sm:h-9"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addNewType();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={addNewType}
          className="shrink-0 h-11 sm:h-9"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Type
        </Button>
      </div>
    </div>
  );
}
