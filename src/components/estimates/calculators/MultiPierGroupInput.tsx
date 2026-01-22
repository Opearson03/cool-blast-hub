import { useState } from "react";
import { Plus, Trash2, Copy, ChevronDown, ChevronRight, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { PierGroup, PierItem } from "@/lib/estimate-components/types";
import { MarkupPromptDialog } from "./MarkupPromptDialog";

interface MultiPierGroupInputProps {
  label: string;
  pierGroups: PierGroup[];
  onChange: (pierGroups: PierGroup[]) => void;
  // Markup prompt support
  onRequestMarkup?: () => void;
  hasPlans?: boolean;
  skipMarkupPrompt?: boolean;
  onSkipMarkupPromptChange?: (skip: boolean) => void;
}

export function MultiPierGroupInput({
  label,
  pierGroups,
  onChange,
  onRequestMarkup,
  hasPlans = false,
  skipMarkupPrompt = false,
  onSkipMarkupPromptChange,
}: MultiPierGroupInputProps) {
  const [newGroupName, setNewGroupName] = useState("");
  const [showMarkupPrompt, setShowMarkupPrompt] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(skipMarkupPrompt);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(pierGroups.map((g) => g.id))
  );

  // Check if any pier is from takeoff
  const hasAnyTakeoffPiers = pierGroups.some(
    (g) => g._fromTakeoff || g.piers.some((p) => p._fromTakeoff)
  );

  // Calculate totals
  const totalPiers = pierGroups.reduce(
    (sum, group) => sum + group.piers.length,
    0
  );

  const totalVolume = pierGroups.reduce((sum, group) => {
    return (
      sum +
      group.piers.reduce((pierSum, pier) => {
        const diamM = (Number(pier.diameter) || 0) / 1000;
        const depthM = (Number(pier.depth) || 0) / 1000;
        const radius = diamM / 2;
        return pierSum + Math.PI * radius * radius * depthM;
      }, 0)
    );
  }, 0);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const addGroup = () => {
    const groupNumber = pierGroups.length + 1;
    const name = newGroupName.trim() || `Pier Group ${groupNumber}`;
    const newGroup: PierGroup = {
      id: `pier-group-${Date.now()}`,
      name,
      piers: [
        {
          id: `pier-${Date.now()}`,
          name: "P1",
          diameter: 450,
          depth: 600,
        },
      ],
    };
    onChange([...pierGroups, newGroup]);
    setNewGroupName("");
    setExpandedGroups((prev) => new Set([...prev, newGroup.id]));
  };

  const handleAddClick = () => {
    if (hasPlans && onRequestMarkup && !skipMarkupPrompt) {
      setShowMarkupPrompt(true);
    } else {
      addGroup();
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
    addGroup();
  };

  const removeGroup = (groupId: string) => {
    if (pierGroups.length > 1) {
      onChange(pierGroups.filter((g) => g.id !== groupId));
    }
  };

  const duplicateGroup = (group: PierGroup) => {
    const newGroup: PierGroup = {
      ...group,
      id: `pier-group-${Date.now()}`,
      name: `${group.name} (copy)`,
      piers: group.piers.map((p, i) => ({
        ...p,
        id: `pier-${Date.now()}-${i}`,
        _fromTakeoff: false,
      })),
      _fromTakeoff: false,
    };
    onChange([...pierGroups, newGroup]);
    setExpandedGroups((prev) => new Set([...prev, newGroup.id]));
  };

  const updateGroupName = (groupId: string, name: string) => {
    onChange(
      pierGroups.map((group) =>
        group.id === groupId
          ? { ...group, name, _fromTakeoff: false }
          : group
      )
    );
  };

  const addPierToGroup = (groupId: string) => {
    onChange(
      pierGroups.map((group) => {
        if (group.id !== groupId) return group;
        const pierNumber = group.piers.length + 1;
        return {
          ...group,
          piers: [
            ...group.piers,
            {
              id: `pier-${Date.now()}`,
              name: `P${pierNumber}`,
              diameter: 450,
              depth: 600,
            },
          ],
        };
      })
    );
  };

  const removePierFromGroup = (groupId: string, pierId: string) => {
    onChange(
      pierGroups.map((group) => {
        if (group.id !== groupId) return group;
        if (group.piers.length <= 1) return group;
        return {
          ...group,
          piers: group.piers.filter((p) => p.id !== pierId),
        };
      })
    );
  };

  const duplicatePier = (groupId: string, pier: PierItem) => {
    onChange(
      pierGroups.map((group) => {
        if (group.id !== groupId) return group;
        return {
          ...group,
          piers: [
            ...group.piers,
            {
              ...pier,
              id: `pier-${Date.now()}`,
              name: `${pier.name} (copy)`,
              _fromTakeoff: false,
            },
          ],
        };
      })
    );
  };

  const updatePier = (
    groupId: string,
    pierId: string,
    field: keyof PierItem,
    value: any
  ) => {
    onChange(
      pierGroups.map((group) => {
        if (group.id !== groupId) return group;
        return {
          ...group,
          piers: group.piers.map((pier) => {
            if (pier.id !== pierId) return pier;
            // Clear takeoff flag when editing
            return {
              ...pier,
              [field]: value,
              _fromTakeoff: false,
            };
          }),
        };
      })
    );
  };

  const calculateGroupTotals = (group: PierGroup) => {
    const count = group.piers.length;
    const volume = group.piers.reduce((sum, pier) => {
      const diamM = (Number(pier.diameter) || 0) / 1000;
      const depthM = (Number(pier.depth) || 0) / 1000;
      const radius = diamM / 2;
      return sum + Math.PI * radius * radius * depthM;
    }, 0);
    return { count, volume };
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{label}</CardTitle>
          {hasAnyTakeoffPiers && (
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 gap-1"
            >
              <Ruler className="h-3 w-3" />
              From plan takeoff
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pier groups list */}
        <div className="space-y-3">
          {pierGroups.map((group) => {
            const isExpanded = expandedGroups.has(group.id);
            const { count, volume } = calculateGroupTotals(group);

            return (
              <Collapsible
                key={group.id}
                open={isExpanded}
                onOpenChange={() => toggleGroup(group.id)}
              >
                <div
                  className={`border rounded-lg overflow-hidden ${
                    group._fromTakeoff
                      ? "bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
                      : "bg-muted/30"
                  }`}
                >
                  {/* Group header */}
                  <div className="p-3 flex items-center gap-2">
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>

                    {group._fromTakeoff && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="shrink-0 w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                              <Ruler className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>From plan takeoff</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    <Input
                      value={group.name}
                      onChange={(e) => updateGroupName(group.id, e.target.value)}
                      placeholder="Group name"
                      className="font-medium flex-1"
                      onClick={(e) => e.stopPropagation()}
                    />

                    <Badge variant="outline" className="shrink-0">
                      {count} pier{count !== 1 ? "s" : ""}
                    </Badge>

                    <span className="text-sm text-muted-foreground shrink-0">
                      {volume.toFixed(3)} m³
                    </span>

                    <div className="flex gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateGroup(group);
                        }}
                        title="Duplicate group"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeGroup(group.id);
                        }}
                        disabled={pierGroups.length <= 1}
                        title="Remove group"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Group content - individual piers */}
                  <CollapsibleContent>
                    <div className="border-t p-3 space-y-3">
                      {group.piers.map((pier) => {
                        const diamM = (Number(pier.diameter) || 0) / 1000;
                        const depthM = (Number(pier.depth) || 0) / 1000;
                        const radius = diamM / 2;
                        const pierVolume = Math.PI * radius * radius * depthM;

                        return (
                          <div
                            key={pier.id}
                            className={`border rounded-lg p-3 space-y-3 ${
                              pier._fromTakeoff
                                ? "bg-blue-50/30 border-blue-200 dark:bg-blue-950/10 dark:border-blue-800/50"
                                : "bg-background"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1">
                                {pier._fromTakeoff && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="shrink-0 w-5 h-5 rounded bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                          <Ruler className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>From plan takeoff</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                <Input
                                  value={pier.name}
                                  onChange={(e) =>
                                    updatePier(
                                      group.id,
                                      pier.id,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Pier name"
                                  className="font-medium w-24"
                                />
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => duplicatePier(group.id, pier)}
                                  title="Duplicate pier"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() =>
                                    removePierFromGroup(group.id, pier.id)
                                  }
                                  disabled={group.piers.length <= 1}
                                  title="Remove pier"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">
                                  Diameter
                                </Label>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    inputMode="numeric"
                                    value={pier.diameter || ""}
                                    onChange={(e) =>
                                      updatePier(
                                        group.id,
                                        pier.id,
                                        "diameter",
                                        e.target.value === ""
                                          ? 0
                                          : Number(e.target.value)
                                      )
                                    }
                                    min={100}
                                    step={50}
                                    className="pr-12 h-9"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                    mm
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">
                                  Depth
                                </Label>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    inputMode="numeric"
                                    value={pier.depth || ""}
                                    onChange={(e) =>
                                      updatePier(
                                        group.id,
                                        pier.id,
                                        "depth",
                                        e.target.value === ""
                                          ? 0
                                          : Number(e.target.value)
                                      )
                                    }
                                    min={100}
                                    step={50}
                                    className="pr-12 h-9"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                    mm
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">
                                  Volume
                                </Label>
                                <div className="h-9 flex items-center px-3 bg-muted rounded-md text-sm">
                                  {pierVolume > 0
                                    ? `${pierVolume.toFixed(3)} m³`
                                    : "—"}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Add pier to group button */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addPierToGroup(group.id)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Pier to {group.name}
                      </Button>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>

        {/* Add group button */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="New group name (optional)"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
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
            Add Pier Group
          </Button>
        </div>

        {/* Combined totals */}
        <div className="flex flex-wrap gap-4 pt-3 border-t text-sm">
          <div>
            <span className="text-muted-foreground">Total Groups: </span>
            <span className="font-medium">{pierGroups.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Piers: </span>
            <span className="font-medium">{totalPiers}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Volume: </span>
            <span className="font-medium">{totalVolume.toFixed(3)} m³</span>
          </div>
        </div>
      </CardContent>

      <MarkupPromptDialog
        open={showMarkupPrompt}
        onOpenChange={setShowMarkupPrompt}
        itemType="pier"
        onMarkOnPlans={handleMarkOnPlans}
        onEnterManually={handleEnterManually}
        dontAskAgain={dontAskAgain}
        onDontAskAgainChange={setDontAskAgain}
      />
    </Card>
  );
}
