import { ExpansionJointConfig, PriceMap } from "@/lib/estimate-components/types";
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
import { ChevronDown, ChevronRight, Ruler, Plus, Trash2, Settings2, ChevronsUpDown } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format-currency";

const JOINT_DEPTH_OPTIONS = [
  { value: '100', label: '100mm' },
  { value: '125', label: '125mm' },
  { value: '150', label: '150mm' },
  { value: '200', label: '200mm' },
];

const JOINT_LENGTH_OPTIONS = [
  { value: '3000', label: '3m' },
  { value: '6000', label: '6m' },
];

const CAPPING_TYPE_OPTIONS = [
  { value: 'EXJ CAP B', label: 'Black Capping Mould' },
  { value: 'EXJ CAP G', label: 'Grey Capping Mould' },
  { value: 'EXJ CAP RBM', label: 'Removable Capping Mould' },
];

function getJointPrice(depth: string, length: string, priceMap?: PriceMap): number {
  if (!priceMap) return 35;
  const priceKey = `EXJ${depth}${length === '3000' ? '30' : '60'}`;
  return priceMap['joints_expansion']?.[priceKey] ?? 35;
}

function getCappingPrice(cappingType: string, priceMap?: PriceMap): number {
  if (!priceMap) return 4.50;
  const piecePrice = priceMap['joints_expansion']?.[cappingType] ?? 13.50;
  // Capping pieces are 3m long, so price per metre = piece price / 3
  return piecePrice / 3;
}

interface MultiExpansionJointInputProps {
  joints: ExpansionJointConfig[];
  onChange: (joints: ExpansionJointConfig[]) => void;
  priceMap?: PriceMap;
}

export function MultiExpansionJointInput({
  joints,
  onChange,
  priceMap,
}: MultiExpansionJointInputProps) {
  const [openJoints, setOpenJoints] = useState<Set<string>>(new Set(joints.length > 0 ? [joints[0].id] : []));

  const toggleJoint = useCallback((jointId: string) => {
    setOpenJoints(prev => {
      const next = new Set(prev);
      if (next.has(jointId)) {
        next.delete(jointId);
      } else {
        next.add(jointId);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    const allOpen = joints.every(j => openJoints.has(j.id));
    if (allOpen) {
      setOpenJoints(new Set());
    } else {
      setOpenJoints(new Set(joints.map(j => j.id)));
    }
  }, [joints, openJoints]);

  const addJoint = useCallback(() => {
    const defaultDepth = '100';
    const defaultLength = '3000';
    const newJoint: ExpansionJointConfig = {
      id: `joint_${Date.now()}`,
      name: '',
      depth: defaultDepth,
      length: defaultLength,
      quantity: 5,
      price_each: getJointPrice(defaultDepth, defaultLength, priceMap),
      capping_required: false,
      capping_type: 'EXJ CAP B',
      capping_price_per_m: getCappingPrice('EXJ CAP B', priceMap),
    };
    const newJoints = [...joints, newJoint];
    onChange(newJoints);
    setOpenJoints(prev => new Set([...prev, newJoint.id]));
  }, [joints, onChange, priceMap]);

  const updateJoint = useCallback((index: number, updates: Partial<ExpansionJointConfig>) => {
    const newJoints = [...joints];
    newJoints[index] = { ...newJoints[index], ...updates };
    onChange(newJoints);
  }, [joints, onChange]);

  const removeJoint = useCallback((index: number) => {
    const newJoints = joints.filter((_, i) => i !== index);
    onChange(newJoints);
  }, [joints, onChange]);

  // Calculate joint cost
  const calculateJointCost = useCallback((joint: ExpansionJointConfig) => {
    let total = 0;
    total += joint.quantity * joint.price_each;
    
    if (joint.capping_required && joint.capping_price_per_m) {
      const cappingLength = joint.quantity * (Number(joint.length) / 1000);
      total += cappingLength * joint.capping_price_per_m;
    }
    
    return total;
  }, []);

  const summary = useMemo(() => {
    let totalCost = 0;
    let totalPieces = 0;
    joints.forEach(joint => {
      totalCost += calculateJointCost(joint);
      totalPieces += joint.quantity;
    });
    return { totalConfigs: joints.length, totalPieces, totalCost };
  }, [joints, calculateJointCost]);

  if (joints.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-sm text-muted-foreground italic py-4 px-3 border border-dashed rounded-lg">
          <Ruler className="h-5 w-5 opacity-50" />
          <span>No expansion joints configured. Add joints to get started.</span>
        </div>
        <Button
          variant="outline"
          onClick={addJoint}
          className="w-full h-11"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Expansion Joint
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
            <Ruler className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{summary.totalPieces}</span>
            <span>joint piece{summary.totalPieces !== 1 ? 's' : ''}</span>
          </div>
          <span className="text-border">•</span>
          <span className="text-primary font-medium">{formatCurrency(summary.totalCost)}</span>
        </div>
        {joints.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAll}
            className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
          >
            <ChevronsUpDown className="h-3.5 w-3.5" />
            {joints.every(j => openJoints.has(j.id)) ? 'Collapse' : 'Expand'}
          </Button>
        )}
      </div>

      {/* Joint Cards */}
      <div className="space-y-2">
        {joints.map((joint, index) => {
          const isOpen = openJoints.has(joint.id);
          const jointCost = calculateJointCost(joint);
          const depthLabel = JOINT_DEPTH_OPTIONS.find(o => o.value === joint.depth)?.label || joint.depth;
          const lengthLabel = JOINT_LENGTH_OPTIONS.find(o => o.value === joint.length)?.label || joint.length;

          return (
            <Collapsible key={joint.id} open={isOpen} onOpenChange={() => toggleJoint(joint.id)}>
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
                      <span className="font-medium text-sm">
                        {joint.name || `${depthLabel} Joints`}
                      </span>
                      <Badge variant="outline" className="text-xs font-normal h-5">
                        {joint.quantity} × {depthLabel} × {lengthLabel}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-primary">{formatCurrency(jointCost)}</span>
                      <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                </CollapsibleTrigger>

                {/* Content */}
                <CollapsibleContent>
                  <div className="px-3 pb-3 pt-2 border-t bg-muted/30 space-y-4">
                    {/* Optional Name */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Label (optional)</Label>
                      <Input
                        placeholder={`e.g., ${depthLabel} Slab Joints`}
                        value={joint.name || ''}
                        onChange={(e) => updateJoint(index, { name: e.target.value })}
                        className="h-9 text-sm"
                      />
                    </div>

                    {/* Depth & Length */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Joint Depth (Slab Thickness)</Label>
                        <Select
                          value={joint.depth}
                          onValueChange={(val) => {
                            updateJoint(index, { 
                              depth: val,
                              price_each: getJointPrice(val, joint.length, priceMap)
                            });
                          }}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[150]">
                            {JOINT_DEPTH_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Joint Length</Label>
                        <Select
                          value={joint.length}
                          onValueChange={(val) => {
                            updateJoint(index, { 
                              length: val,
                              price_each: getJointPrice(joint.depth, val, priceMap)
                            });
                          }}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[150]">
                            {JOINT_LENGTH_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Quantity & Price */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={joint.quantity}
                          onChange={(e) => updateJoint(index, { quantity: Number(e.target.value) || 1 })}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Price Each</Label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={joint.price_each}
                            onChange={(e) => updateJoint(index, { price_each: Number(e.target.value) })}
                            className="h-9 text-sm pl-6"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Capping */}
                    <div className="space-y-3 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Joint Capping Mould</Label>
                        <div className="flex items-center gap-3 px-3 py-1.5 rounded-md border bg-background">
                          <Switch
                            checked={joint.capping_required}
                            onCheckedChange={(val) => updateJoint(index, { capping_required: val })}
                          />
                          <span className={cn(
                            "text-sm min-w-[3ch]",
                            joint.capping_required ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {joint.capping_required ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                      {joint.capping_required && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Capping Type</Label>
                            <Select
                              value={joint.capping_type || 'EXJ CAP B'}
                              onValueChange={(val) => {
                                updateJoint(index, { 
                                  capping_type: val,
                                  capping_price_per_m: getCappingPrice(val, priceMap)
                                });
                              }}
                            >
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="z-[150]">
                                {CAPPING_TYPE_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Capping Price per m</Label>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={joint.capping_price_per_m || 0}
                                onChange={(e) => updateJoint(index, { capping_price_per_m: Number(e.target.value) })}
                                className="h-9 text-sm pl-6"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Remove Button */}
                    {joints.length > 1 && (
                      <div className="pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeJoint(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
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
        onClick={addJoint}
        className="w-full h-11"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Another Joint Depth
      </Button>
    </div>
  );
}