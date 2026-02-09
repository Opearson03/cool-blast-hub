import { ExpansionJointConfig, PriceMap } from "@/lib/estimate-components/types";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ChevronDown, ChevronRight, Ruler, Plus, Trash2, Settings2, ChevronsUpDown, MapPin, Check } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format-currency";
import { getPrice } from "@/lib/estimate-components/types";

const JOINT_DEPTH_OPTIONS = [
  { value: '100', label: '100mm' },
  { value: '125', label: '125mm' },
  { value: '150', label: '150mm' },
  { value: '200', label: '200mm' },
];

// Expansion joints come in 3m pieces (sticks)
const PIECE_LENGTH_M = 3;

const CAPPING_TYPE_OPTIONS = [
  { value: 'EXJ CAP B', label: 'Black Capping Mould' },
  { value: 'EXJ CAP G', label: 'Grey Capping Mould' },
  { value: 'EXJ CAP RBM', label: 'Removable Capping Mould' },
];

const DOWEL_SIZE_OPTIONS = [
  { value: 'R12-300 GAL', label: 'R12 × 300mm Galvanised' },
  { value: 'R12-450 GAL', label: 'R12 × 450mm Galvanised' },
  { value: 'R16-300 GAL', label: 'R16 × 300mm Galvanised' },
  { value: 'R16-450 GAL', label: 'R16 × 450mm Galvanised' },
  { value: 'R20-450 GAL', label: 'R20 × 450mm Galvanised' },
  { value: 'R20-600 GAL', label: 'R20 × 600mm Galvanised' },
  { value: 'R24-450 GAL', label: 'R24 × 450mm Galvanised' },
];

const DOWEL_SPACING_OPTIONS = [
  { value: '200', label: '200mm centres' },
  { value: '250', label: '250mm centres' },
  { value: '300', label: '300mm centres' },
  { value: '400', label: '400mm centres' },
  { value: '450', label: '450mm centres' },
  { value: '600', label: '600mm centres' },
];

const FOAM_TYPE_OPTIONS = [
  { value: 'sticky_back', label: 'Sticky Back (Self-Adhesive)' },
  { value: 'standard', label: 'Standard (Non-Adhesive)' },
];

const FOAM_HEIGHT_OPTIONS = [
  { value: '50', label: '50mm' },
  { value: '75', label: '75mm' },
  { value: '100', label: '100mm' },
  { value: '125', label: '125mm' },
  { value: '150', label: '150mm' },
  { value: '200', label: '200mm' },
  { value: '250', label: '250mm' },
  { value: '300', label: '300mm' },
];

function getJointPrice(depth: string, length: string, priceMap?: PriceMap): number {
  if (!priceMap) return 95;
  const priceKey = `EXJ${depth}${length === '3000' ? '30' : '60'}`;
  return priceMap['joints_expansion']?.[priceKey] ?? 95;
}

function getCappingPrice(cappingType: string, priceMap?: PriceMap): number {
  if (!priceMap) return 4.50;
  const piecePrice = priceMap['joints_expansion']?.[cappingType] ?? 13.50;
  return piecePrice / 3;
}

function getDowelPrice(dowelSize: string, priceMap?: PriceMap): number {
  if (!priceMap) return 3.50;
  return priceMap['dowel']?.[dowelSize] ?? 3.50;
}

function getFoamPrice(foamHeight: string, foamType: string, priceMap?: PriceMap): number {
  if (!priceMap) return 30.50;
  let priceListKey = '';
  if (foamType === 'sticky_back') {
    priceListKey = `EJA10${foamHeight}SB`;
  } else {
    priceListKey = `EJ10${foamHeight}`;
  }
  return priceMap['joint_foam']?.[priceListKey] ?? 30.50;
}

interface MultiExpansionJointInputProps {
  joints: ExpansionJointConfig[];
  onChange: (joints: ExpansionJointConfig[]) => void;
  priceMap?: PriceMap;
  onRequestMarkup?: (jointId: string) => void;
  hasPlans?: boolean;
}

export function MultiExpansionJointInput({
  joints,
  onChange,
  priceMap,
  onRequestMarkup,
  hasPlans = false,
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

  // Calculate quantity (pieces) from total length - 3m per joint piece
  const calculateQuantityFromLength = useCallback((totalLengthM: number): number => {
    if (!totalLengthM || totalLengthM <= 0) return 0;
    return Math.ceil(totalLengthM / PIECE_LENGTH_M);
  }, []);

  const addJoint = useCallback(() => {
    const defaultDepth = '100';
    const defaultDowelSize = 'R12-300 GAL';
    const defaultFoamHeight = '100';
    const defaultFoamType = 'sticky_back';
    
    const newJoint: ExpansionJointConfig = {
      id: `joint_${Date.now()}`,
      name: '',
      depth: defaultDepth,
      length: '3000', // 3m pieces
      quantity: 0, // Default to 0, will be calculated from total_length_m
      price_each: getJointPrice(defaultDepth, '3000', priceMap),
      capping_required: false,
      capping_type: 'EXJ CAP B',
      capping_price_per_m: getCappingPrice('EXJ CAP B', priceMap),
      // Takeoff measurement fields
      total_length_m: 0,
      measured_on_plans: false,
      // Dowels defaults
      dowels_required: false,
      dowel_size: defaultDowelSize,
      dowel_calculation_method: 'manual',
      dowel_count: 10,
      connection_length: 10,
      dowel_spacing: '300',
      dowel_price_each: getDowelPrice(defaultDowelSize, priceMap),
      chemical_anchor: false,
      chemical_cartridges: 2,
      chemical_price: 45,
      // Foam defaults
      foam_required: false,
      foam_type: defaultFoamType,
      foam_height: defaultFoamHeight,
      foam_rolls: 1,
      foam_roll_price: getFoamPrice(defaultFoamHeight, defaultFoamType, priceMap),
    };
    const newJoints = [...joints, newJoint];
    onChange(newJoints);
    setOpenJoints(prev => new Set([...prev, newJoint.id]));
  }, [joints, onChange, priceMap]);

  const updateJoint = useCallback((index: number, updates: Partial<ExpansionJointConfig>) => {
    const newJoints = [...joints];
    const currentJoint = newJoints[index];
    const updatedJoint = { ...currentJoint, ...updates };
    
    // Auto-calculate quantity (rolls) when total_length_m changes
    if (updates.total_length_m !== undefined) {
      const totalLength = updates.total_length_m ?? currentJoint.total_length_m ?? 0;
      if (totalLength > 0) {
        updatedJoint.quantity = calculateQuantityFromLength(totalLength);
      }
    }
    
    newJoints[index] = updatedJoint;
    onChange(newJoints);
  }, [joints, onChange, calculateQuantityFromLength]);

  const removeJoint = useCallback((index: number) => {
    const newJoints = joints.filter((_, i) => i !== index);
    onChange(newJoints);
  }, [joints, onChange]);

  // Calculate joint cost including dowels and foam
  const calculateJointCost = useCallback((joint: ExpansionJointConfig) => {
    let total = 0;
    
    // Base joint cost
    total += joint.quantity * joint.price_each;
    
    // Capping cost
    if (joint.capping_required && joint.capping_price_per_m) {
      const cappingLength = joint.quantity * (Number(joint.length) / 1000);
      total += cappingLength * joint.capping_price_per_m;
    }
    
    // Dowels cost
    if (joint.dowels_required) {
      let dowelCount = joint.dowel_count || 10;
      if (joint.dowel_calculation_method === 'spacing' && joint.connection_length) {
        const spacingMM = Number(joint.dowel_spacing) || 300;
        const spacingM = spacingMM / 1000;
        dowelCount = Math.ceil(joint.connection_length / spacingM) + 1;
      }
      total += dowelCount * (joint.dowel_price_each || 3.50);
      
      // Chemical anchor
      if (joint.chemical_anchor) {
        total += (joint.chemical_cartridges || 2) * (joint.chemical_price || 45);
      }
    }
    
    // Foam cost
    if (joint.foam_required) {
      total += (joint.foam_rolls || 1) * (joint.foam_roll_price || 30.50);
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

          // Calculate dowel count for display
          let displayDowelCount = joint.dowel_count || 10;
          if (joint.dowel_calculation_method === 'spacing' && joint.connection_length) {
            const spacingMM = Number(joint.dowel_spacing) || 300;
            const spacingM = spacingMM / 1000;
            displayDowelCount = Math.ceil(joint.connection_length / spacingM) + 1;
          }

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
                        {joint.quantity} pcs × {depthLabel}
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

                    {/* Depth */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Joint Depth (Slab Thickness)</Label>
                      <Select
                        value={joint.depth}
                        onValueChange={(val) => {
                          updateJoint(index, { 
                            depth: val,
                            price_each: getJointPrice(val, '3000', priceMap)
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

                    {/* Total Length - Takeoff Integration */}
                    <div className="space-y-2 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs font-medium">Total Joint Length</Label>
                        {joint.measured_on_plans && (
                          <Badge variant="secondary" className="text-[10px] h-4 gap-1">
                            <Check className="h-3 w-3" />
                            Measured
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            value={joint.total_length_m ?? ''}
                            onChange={(e) => updateJoint(index, { 
                              total_length_m: e.target.value === '' ? 0 : Number(e.target.value),
                              measured_on_plans: false // Clear measured flag when manually edited
                            })}
                            placeholder="0"
                            className="h-9 text-sm pr-8"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">m</span>
                        </div>
                        {hasPlans && onRequestMarkup && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onRequestMarkup(joint.id)}
                            className="h-9 gap-1.5 shrink-0"
                          >
                            <MapPin className="h-3.5 w-3.5" />
                            Mark on Plans
                          </Button>
                        )}
                      </div>
                      {(joint.total_length_m ?? 0) > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Auto-calculated: {Math.ceil((joint.total_length_m || 0) / PIECE_LENGTH_M)} joint{Math.ceil((joint.total_length_m || 0) / PIECE_LENGTH_M) !== 1 ? 's' : ''} needed ({joint.total_length_m}m ÷ {PIECE_LENGTH_M}m per joint)
                        </p>
                      )}
                    </div>

                    {/* Quantity & Price */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">
                          Qty (pcs)
                          {(joint.total_length_m ?? 0) > 0 && (
                            <span className="text-muted-foreground font-normal ml-1">(auto)</span>
                          )}
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          value={joint.quantity}
                          onChange={(e) => updateJoint(index, { quantity: Number(e.target.value) || 0 })}
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

                    {/* Dowels Section */}
                    <div className="space-y-3 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Dowels Required</Label>
                        <div className="flex items-center gap-3 px-3 py-1.5 rounded-md border bg-background">
                          <Switch
                            checked={joint.dowels_required || false}
                            onCheckedChange={(val) => updateJoint(index, { dowels_required: val })}
                          />
                          <span className={cn(
                            "text-sm min-w-[3ch]",
                            joint.dowels_required ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {joint.dowels_required ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                      {joint.dowels_required && (
                        <div className="space-y-3">
                          {/* Dowel Size */}
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Dowel Size</Label>
                            <Select
                              value={joint.dowel_size || 'R12-300 GAL'}
                              onValueChange={(val) => {
                                updateJoint(index, { 
                                  dowel_size: val,
                                  dowel_price_each: getDowelPrice(val, priceMap)
                                });
                              }}
                            >
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="z-[150]">
                                {DOWEL_SIZE_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Quantity Method */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">Quantity Method</Label>
                              <Select
                                value={joint.dowel_calculation_method || 'manual'}
                                onValueChange={(val: 'manual' | 'spacing') => {
                                  updateJoint(index, { dowel_calculation_method: val });
                                }}
                              >
                                <SelectTrigger className="h-9 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-[150]">
                                  <SelectItem value="manual">Enter count</SelectItem>
                                  <SelectItem value="spacing">Calculate from length</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {joint.dowel_calculation_method === 'spacing' ? (
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Spacing</Label>
                                <Select
                                  value={joint.dowel_spacing || '300'}
                                  onValueChange={(val) => updateJoint(index, { dowel_spacing: val })}
                                >
                                  <SelectTrigger className="h-9 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="z-[150]">
                                    {DOWEL_SPACING_OPTIONS.map((opt) => (
                                      <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Number of Dowels</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={joint.dowel_count || 10}
                                  onChange={(e) => updateJoint(index, { dowel_count: Number(e.target.value) || 1 })}
                                  className="h-9 text-sm"
                                />
                              </div>
                            )}
                          </div>

                          {/* Connection Length (when using spacing) */}
                          {joint.dowel_calculation_method === 'spacing' && (
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Connection Length (m)</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  step="0.5"
                                  value={joint.connection_length || 10}
                                  onChange={(e) => updateJoint(index, { connection_length: Number(e.target.value) || 1 })}
                                  className="h-9 text-sm"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Calculated Qty</Label>
                                <div className="h-9 flex items-center px-3 text-sm bg-muted rounded-md border">
                                  {displayDowelCount} dowels
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Dowel Price */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">Price per Dowel</Label>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={joint.dowel_price_each || 3.50}
                                  onChange={(e) => updateJoint(index, { dowel_price_each: Number(e.target.value) })}
                                  className="h-9 text-sm pl-6"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Chemical Anchor */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`chemical-${joint.id}`}
                                checked={joint.chemical_anchor || false}
                                onCheckedChange={(val) => updateJoint(index, { chemical_anchor: !!val })}
                              />
                              <Label htmlFor={`chemical-${joint.id}`} className="text-xs font-medium cursor-pointer">
                                Include chemical anchoring
                              </Label>
                            </div>
                            {joint.chemical_anchor && (
                              <div className="grid grid-cols-2 gap-3 pl-6">
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-medium">Cartridges</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={joint.chemical_cartridges || 2}
                                    onChange={(e) => updateJoint(index, { chemical_cartridges: Number(e.target.value) || 1 })}
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
                                      value={joint.chemical_price || 45}
                                      onChange={(e) => updateJoint(index, { chemical_price: Number(e.target.value) })}
                                      className="h-9 text-sm pl-6"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Expansion Foam Section */}
                    <div className="space-y-3 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Expansion Foam Required</Label>
                        <div className="flex items-center gap-3 px-3 py-1.5 rounded-md border bg-background">
                          <Switch
                            checked={joint.foam_required || false}
                            onCheckedChange={(val) => updateJoint(index, { foam_required: val })}
                          />
                          <span className={cn(
                            "text-sm min-w-[3ch]",
                            joint.foam_required ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {joint.foam_required ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                      {joint.foam_required && (
                        <div className="space-y-3">
                          {/* Foam Type & Height */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">Foam Type</Label>
                              <Select
                                value={joint.foam_type || 'sticky_back'}
                                onValueChange={(val) => {
                                  updateJoint(index, { 
                                    foam_type: val,
                                    foam_roll_price: getFoamPrice(joint.foam_height || '100', val, priceMap)
                                  });
                                }}
                              >
                                <SelectTrigger className="h-9 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-[150]">
                                  {FOAM_TYPE_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">Foam Height</Label>
                              <Select
                                value={joint.foam_height || '100'}
                                onValueChange={(val) => {
                                  updateJoint(index, { 
                                    foam_height: val,
                                    foam_roll_price: getFoamPrice(val, joint.foam_type || 'sticky_back', priceMap)
                                  });
                                }}
                              >
                                <SelectTrigger className="h-9 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-[150]">
                                  {FOAM_HEIGHT_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Rolls & Price */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">Number of Rolls (25m each)</Label>
                              <Input
                                type="number"
                                min="1"
                                value={joint.foam_rolls || 1}
                                onChange={(e) => updateJoint(index, { foam_rolls: Number(e.target.value) || 1 })}
                                className="h-9 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">Price per Roll</Label>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={joint.foam_roll_price || 30.50}
                                  onChange={(e) => updateJoint(index, { foam_roll_price: Number(e.target.value) })}
                                  className="h-9 text-sm pl-6"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Total coverage: {(joint.foam_rolls || 1) * 25}m
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