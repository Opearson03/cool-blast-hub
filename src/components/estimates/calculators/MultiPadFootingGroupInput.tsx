import { useState } from "react";
import { Plus, Trash2, Copy, ChevronDown, ChevronRight, Ruler, Square } from "lucide-react";
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
import { PadFootingGroup } from "@/lib/estimate-components/types";
import { MarkupPromptDialog } from "./MarkupPromptDialog";

interface MultiPadFootingGroupInputProps {
  label: string;
  padGroups: PadFootingGroup[];
  onChange: (padGroups: PadFootingGroup[]) => void;
  onRequestMarkup?: () => void;
  hasPlans?: boolean;
  skipMarkupPrompt?: boolean;
  onSkipMarkupPromptChange?: (skip: boolean) => void;
}

export function MultiPadFootingGroupInput({
  label,
  padGroups,
  onChange,
  onRequestMarkup,
  hasPlans = false,
  skipMarkupPrompt = false,
  onSkipMarkupPromptChange,
}: MultiPadFootingGroupInputProps) {
  const [newGroupName, setNewGroupName] = useState("");
  const [showMarkupPrompt, setShowMarkupPrompt] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(skipMarkupPrompt);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(padGroups.map((g) => g.id))
  );

  // Check if any group is from takeoff
  const hasAnyTakeoffPads = padGroups.some((g) => g._fromTakeoff);

  // Calculate totals
  const totalPads = padGroups.reduce(
    (sum, group) => sum + (group.quantity || 1),
    0
  );

  const totalVolume = padGroups.reduce((sum, group) => {
    const lengthM = (Number(group.length) || 0) / 1000;
    const widthM = (Number(group.width) || 0) / 1000;
    const depthM = (Number(group.depth) || 0) / 1000;
    const singleVolume = lengthM * widthM * depthM;
    return sum + singleVolume * (group.quantity || 1);
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
    const groupNumber = padGroups.length + 1;
    const name = newGroupName.trim() || `Pad Footing Group ${groupNumber}`;
    const newGroup: PadFootingGroup = {
      id: `pad-group-${Date.now()}`,
      name,
      quantity: 1,
      length: 450,
      width: 450,
      depth: 300,
    };
    onChange([...padGroups, newGroup]);
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
    if (padGroups.length > 1) {
      onChange(padGroups.filter((g) => g.id !== groupId));
    }
  };

  const duplicateGroup = (group: PadFootingGroup) => {
    const newGroup: PadFootingGroup = {
      ...group,
      id: `pad-group-${Date.now()}`,
      name: `${group.name} (copy)`,
      _fromTakeoff: false,
    };
    onChange([...padGroups, newGroup]);
    setExpandedGroups((prev) => new Set([...prev, newGroup.id]));
  };

  const updateGroup = (
    groupId: string,
    field: keyof PadFootingGroup,
    value: any
  ) => {
    onChange(
      padGroups.map((group) => {
        if (group.id !== groupId) return group;
        return {
          ...group,
          [field]: value,
          _fromTakeoff: false,
        };
      })
    );
  };

  const calculateGroupVolume = (group: PadFootingGroup) => {
    const lengthM = (Number(group.length) || 0) / 1000;
    const widthM = (Number(group.width) || 0) / 1000;
    const depthM = (Number(group.depth) || 0) / 1000;
    const singleVolume = lengthM * widthM * depthM;
    return singleVolume * (group.quantity || 1);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Square className="h-4 w-4" />
            {label}
          </CardTitle>
          {hasAnyTakeoffPads && (
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
        {/* Pad footing groups list */}
        <div className="space-y-3">
          {padGroups.map((group) => {
            const isExpanded = expandedGroups.has(group.id);
            const volume = calculateGroupVolume(group);

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
                      onChange={(e) => updateGroup(group.id, "name", e.target.value)}
                      placeholder="Group name"
                      className="font-medium flex-1"
                      onClick={(e) => e.stopPropagation()}
                    />

                    <Badge variant="outline" className="shrink-0">
                      {group.quantity || 1} pad{(group.quantity || 1) !== 1 ? "s" : ""}
                    </Badge>

                    <span className="text-sm text-muted-foreground shrink-0 hidden sm:inline">
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
                        disabled={padGroups.length <= 1}
                        title="Remove group"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Group content - shared dimensions */}
                  <CollapsibleContent>
                    <div className="border-t p-4 space-y-4 bg-background">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">
                            Quantity
                          </Label>
                          <Input
                            type="number"
                            inputMode="numeric"
                            value={group.quantity ?? ""}
                            onChange={(e) =>
                              updateGroup(
                                group.id,
                                "quantity",
                                e.target.value === "" ? 1 : Number(e.target.value)
                              )
                            }
                            min={1}
                            step={1}
                            className="h-10"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">
                            Length
                          </Label>
                          <div className="relative">
                            <Input
                              type="number"
                              inputMode="numeric"
                              value={group.length ?? ""}
                              onChange={(e) =>
                                updateGroup(
                                  group.id,
                                  "length",
                                  e.target.value === "" ? 0 : Number(e.target.value)
                                )
                              }
                              min={100}
                              step={50}
                              className="pr-12 h-10"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              mm
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">
                            Width
                          </Label>
                          <div className="relative">
                            <Input
                              type="number"
                              inputMode="numeric"
                              value={group.width ?? ""}
                              onChange={(e) =>
                                updateGroup(
                                  group.id,
                                  "width",
                                  e.target.value === "" ? 0 : Number(e.target.value)
                                )
                              }
                              min={100}
                              step={50}
                              className="pr-12 h-10"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              mm
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">
                            Depth
                          </Label>
                          <div className="relative">
                            <Input
                              type="number"
                              inputMode="numeric"
                              value={group.depth ?? ""}
                              onChange={(e) =>
                                updateGroup(
                                  group.id,
                                  "depth",
                                  e.target.value === "" ? 0 : Number(e.target.value)
                                )
                              }
                              min={100}
                              step={50}
                              className="pr-12 h-10"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              mm
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          All {group.quantity || 1} pads in this group: 
                          <span className="font-medium text-foreground ml-1">
                            {group.length}mm × {group.width}mm × {group.depth}mm
                          </span>
                        </p>
                        <span className="text-sm font-medium sm:hidden">
                          {volume.toFixed(3)} m³
                        </span>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>

        {/* Add group section */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="New group name (optional)"
            className="flex-1"
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
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Group
          </Button>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between pt-3 border-t text-sm">
          <span className="text-muted-foreground">
            {padGroups.length} group{padGroups.length !== 1 ? "s" : ""}, {totalPads} total pad{totalPads !== 1 ? "s" : ""}
          </span>
          <span className="font-medium">
            Total: {totalVolume.toFixed(2)} m³
          </span>
        </div>

        {/* Markup prompt dialog */}
        <MarkupPromptDialog
          open={showMarkupPrompt}
          onOpenChange={setShowMarkupPrompt}
          itemType="pad footing group"
          onMarkOnPlans={handleMarkOnPlans}
          onEnterManually={handleEnterManually}
          dontAskAgain={dontAskAgain}
          onDontAskAgainChange={setDontAskAgain}
        />
      </CardContent>
    </Card>
  );
}
