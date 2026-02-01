import { ControlJointConfig, PriceMap } from "@/lib/estimate-components/types";
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
import { ChevronDown, ChevronRight, Scissors, Plus, Trash2, Settings2, ChevronsUpDown, MapPin, Check } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format-currency";
import { getPrice } from "@/lib/estimate-components/types";

const PRICING_METHOD_OPTIONS = [
  { value: 'per_metre', label: 'Price per Metre' },
  { value: 'hourly', label: 'Hourly Rate' },
];

function getDefaultSawCuttingPrice(priceMap?: PriceMap): number {
  if (!priceMap) return 4.50;
  return priceMap['joint_saw_cutting']?.['JOINTCUT'] ?? 4.50;
}

function getDefaultHourlyRate(priceMap?: PriceMap): number {
  if (!priceMap) return 75;
  return priceMap['joint_saw_cutting']?.['JOINTCUT HR'] ?? 75;
}

function getDefaultCaulkingPrice(priceMap?: PriceMap): number {
  if (!priceMap) return 8;
  return priceMap['joint_saw_cutting']?.['CAULKING'] ?? 8;
}

interface MultiControlJointInputProps {
  joints: ControlJointConfig[];
  onChange: (joints: ControlJointConfig[]) => void;
  priceMap?: PriceMap;
  onRequestMarkup?: (jointId: string) => void;
  hasPlans?: boolean;
}

export function MultiControlJointInput({
  joints,
  onChange,
  priceMap,
  onRequestMarkup,
  hasPlans = false,
}: MultiControlJointInputProps) {
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
    const newJoint: ControlJointConfig = {
      id: `control_joint_${Date.now()}`,
      name: '',
      total_length_m: 0,
      measured_on_plans: false,
      pricing_method: 'per_metre',
      price_per_m: getDefaultSawCuttingPrice(priceMap),
      hours: 4,
      hourly_rate: getDefaultHourlyRate(priceMap),
      caulking_required: false,
      caulking_price_per_m: getDefaultCaulkingPrice(priceMap),
    };
    const newJoints = [...joints, newJoint];
    onChange(newJoints);
    setOpenJoints(prev => new Set([...prev, newJoint.id]));
  }, [joints, onChange, priceMap]);

  const updateJoint = useCallback((index: number, updates: Partial<ControlJointConfig>) => {
    const newJoints = [...joints];
    newJoints[index] = { ...newJoints[index], ...updates };
    onChange(newJoints);
  }, [joints, onChange]);

  const removeJoint = useCallback((index: number) => {
    const newJoints = joints.filter((_, i) => i !== index);
    onChange(newJoints);
  }, [joints, onChange]);

  // Calculate joint cost including saw cutting and caulking
  const calculateJointCost = useCallback((joint: ControlJointConfig) => {
    let total = 0;
    const length = joint.total_length_m || 0;
    
    // Saw cutting cost
    if (joint.pricing_method === 'per_metre') {
      total += length * (joint.price_per_m || 4.50);
    } else {
      total += (joint.hours || 4) * (joint.hourly_rate || 75);
    }
    
    // Caulking cost
    if (joint.caulking_required) {
      total += length * (joint.caulking_price_per_m || 8);
    }
    
    return total;
  }, []);

  const summary = useMemo(() => {
    let totalCost = 0;
    let totalLength = 0;
    joints.forEach(joint => {
      totalCost += calculateJointCost(joint);
      totalLength += joint.total_length_m || 0;
    });
    return { totalConfigs: joints.length, totalLength, totalCost };
  }, [joints, calculateJointCost]);

  if (joints.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-sm text-muted-foreground italic py-4 px-3 border border-dashed rounded-lg">
          <Scissors className="h-5 w-5 opacity-50" />
          <span>No control joints configured. Add joints to get started.</span>
        </div>
        <Button
          variant="outline"
          onClick={addJoint}
          className="w-full h-11"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Control Joint
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
            <Scissors className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{summary.totalLength.toFixed(1)}m</span>
            <span>total</span>
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
          const pricingLabel = joint.pricing_method === 'per_metre' 
            ? `${joint.total_length_m || 0}m @ ${formatCurrency(joint.price_per_m || 4.50)}/m`
            : `${joint.hours || 4}hrs @ ${formatCurrency(joint.hourly_rate || 75)}/hr`;

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
                        {joint.name || `Control Joint ${index + 1}`}
                      </span>
                      <Badge variant="outline" className="text-xs font-normal h-5">
                        {pricingLabel}
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
                        placeholder={`e.g., Garage Floor Cuts`}
                        value={joint.name || ''}
                        onChange={(e) => updateJoint(index, { name: e.target.value })}
                        className="h-9 text-sm"
                      />
                    </div>

                    {/* Total Length - Takeoff Integration */}
                    <div className="space-y-2 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs font-medium">Total Saw Cut Length</Label>
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
                            value={joint.total_length_m || ''}
                            onChange={(e) => updateJoint(index, { 
                              total_length_m: e.target.value === '' ? 0 : Number(e.target.value),
                              measured_on_plans: false
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
                    </div>

                    {/* Pricing Method */}
                    <div className="space-y-3 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs font-medium">Pricing Method</Label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-muted-foreground">Method</Label>
                          <Select
                            value={joint.pricing_method}
                            onValueChange={(val) => updateJoint(index, { 
                              pricing_method: val as 'per_metre' | 'hourly'
                            })}
                          >
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[150]">
                              {PRICING_METHOD_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {joint.pricing_method === 'per_metre' ? (
                          <div className="space-y-1.5">
                            <Label className="text-[10px] text-muted-foreground">Price per Metre</Label>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                              <Input
                                type="number"
                                step="0.5"
                                min="0"
                                value={joint.price_per_m ?? ''}
                                onChange={(e) => updateJoint(index, { 
                                  price_per_m: e.target.value === '' ? undefined : Number(e.target.value)
                                })}
                                className="h-9 text-sm pl-6 pr-8"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">/m</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-1.5">
                              <Label className="text-[10px] text-muted-foreground">Hours</Label>
                              <Input
                                type="number"
                                step="0.5"
                                min="0"
                                value={joint.hours ?? ''}
                                onChange={(e) => updateJoint(index, { 
                                  hours: e.target.value === '' ? undefined : Number(e.target.value)
                                })}
                                className="h-9 text-sm"
                              />
                            </div>
                          </>
                        )}
                      </div>
                      
                      {joint.pricing_method === 'hourly' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] text-muted-foreground">Hourly Rate</Label>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                              <Input
                                type="number"
                                step="5"
                                min="0"
                                value={joint.hourly_rate ?? ''}
                                onChange={(e) => updateJoint(index, { 
                                  hourly_rate: e.target.value === '' ? undefined : Number(e.target.value)
                                })}
                                className="h-9 text-sm pl-6 pr-8"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">/hr</span>
                            </div>
                          </div>
                          <div></div>
                        </div>
                      )}
                    </div>

                    {/* Caulking Toggle */}
                    <div className="pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Caulking Required</Label>
                        <Switch
                          checked={joint.caulking_required}
                          onCheckedChange={(val) => updateJoint(index, { caulking_required: val })}
                        />
                      </div>
                      
                      {joint.caulking_required && (
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] text-muted-foreground">Caulking Price per Metre</Label>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                              <Input
                                type="number"
                                step="0.5"
                                min="0"
                                value={joint.caulking_price_per_m ?? ''}
                                onChange={(e) => updateJoint(index, { 
                                  caulking_price_per_m: e.target.value === '' ? undefined : Number(e.target.value)
                                })}
                                className="h-9 text-sm pl-6 pr-8"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">/m</span>
                            </div>
                          </div>
                          <div className="flex items-end pb-1">
                            <span className="text-sm text-muted-foreground">
                              = {formatCurrency((joint.total_length_m || 0) * (joint.caulking_price_per_m || 8))}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Remove Button */}
                    <div className="pt-3 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeJoint(index)}
                        className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
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

      {/* Add Joint Button */}
      <Button
        variant="outline"
        onClick={addJoint}
        className="w-full h-11"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Control Joint
      </Button>
    </div>
  );
}
