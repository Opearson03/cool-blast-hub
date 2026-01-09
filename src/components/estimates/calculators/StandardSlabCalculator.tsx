import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Square, ShieldCheck, Truck, Users, DollarSign, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import { InternalCostNotice } from "./shared";

// ============= CONSTANTS =============

export const MPA_STRENGTHS = [
  { value: "20", label: "20 MPa" },
  { value: "25", label: "25 MPa" },
  { value: "32", label: "32 MPa" },
  { value: "40", label: "40 MPa" },
  { value: "50", label: "50 MPa" },
];

export const MESH_TYPES = [
  { id: "SL62", label: "SL62 (6.0mm)", area: 14.4, defaultPrice: 45 },
  { id: "SL72", label: "SL72 (7.0mm)", area: 14.4, defaultPrice: 55 },
  { id: "SL82", label: "SL82 (8.0mm)", area: 14.4, defaultPrice: 70 },
  { id: "SL92", label: "SL92 (9.0mm)", area: 14.4, defaultPrice: 90 },
  { id: "SL102", label: "SL102 (10.0mm)", area: 14.4, defaultPrice: 110 },
];

// ============= INTERFACES =============

export interface AdditionalCostItem {
  id: string;
  description: string;
  cost: string;
}

export interface StandardSlabData {
  // Slab dimensions
  slabArea: string;
  slabThickness: string;
  concreteStrength: string;
  
  // Reinforcement
  meshType: string;
  meshPrice: string;
  
  // Poly membrane
  polyMembrane: boolean;
  polyLayers: string;
  polyPrice: string;
  
  // Concrete pricing
  concretePrice: string;
  wastagePercent: string;
  
  // Delivery costs
  concreteDeliveryCost: string;
  meshDeliveryCost: string;
  
  // Additional material costs
  additionalMaterialCosts: AdditionalCostItem[];
  
  // Labour
  crewSize: string;
  prepDays: string;
  prepHoursPerDay: string;
  pourCrewSize: string;
  pourHoursPerMan: string;
  hourlyRate: string;
  
  // Additional labour costs
  additionalCosts: AdditionalCostItem[];
  
  // Markup
  materialsMarkupPercent: string;
  labourMarkupPercent: string;
}

export const initialStandardSlabData: StandardSlabData = {
  slabArea: "",
  slabThickness: "100",
  concreteStrength: "32",
  
  meshType: "SL82",
  meshPrice: "70",
  
  polyMembrane: true,
  polyLayers: "1",
  polyPrice: "2.50",
  
  concretePrice: "280",
  wastagePercent: "5",
  
  concreteDeliveryCost: "",
  meshDeliveryCost: "",
  
  additionalMaterialCosts: [],
  
  crewSize: "4",
  prepDays: "",
  prepHoursPerDay: "8",
  pourCrewSize: "4",
  pourHoursPerMan: "",
  hourlyRate: "85",
  
  additionalCosts: [],
  
  materialsMarkupPercent: "15",
  labourMarkupPercent: "15",
};

interface StandardSlabCalculatorProps {
  data: StandardSlabData;
  onChange: (data: StandardSlabData) => void;
}

export function StandardSlabCalculator({ data, onChange }: StandardSlabCalculatorProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const addAdditionalMaterialCost = () => {
    onChange({
      ...data,
      additionalMaterialCosts: [
        ...data.additionalMaterialCosts,
        { id: Date.now().toString(), description: "", cost: "" },
      ],
    });
  };

  const removeAdditionalMaterialCost = (id: string) => {
    onChange({
      ...data,
      additionalMaterialCosts: data.additionalMaterialCosts.filter((c) => c.id !== id),
    });
  };

  const addAdditionalCost = () => {
    onChange({
      ...data,
      additionalCosts: [
        ...data.additionalCosts,
        { id: Date.now().toString(), description: "", cost: "" },
      ],
    });
  };

  const removeAdditionalCost = (id: string) => {
    onChange({
      ...data,
      additionalCosts: data.additionalCosts.filter((c) => c.id !== id),
    });
  };

  // ============= CALCULATIONS =============
  
  const calculations = useMemo(() => {
    const slabArea = parseFloat(data.slabArea) || 0;
    const slabThickness = (parseFloat(data.slabThickness) || 0) / 1000;
    const slabVolume = slabArea * slabThickness;
    
    // Concrete
    const wastage = (parseFloat(data.wastagePercent) || 5) / 100;
    const volumeWithWastage = slabVolume * (1 + wastage);
    const concreteCost = volumeWithWastage * (parseFloat(data.concretePrice) || 280);
    
    // Mesh
    const selectedMesh = MESH_TYPES.find((m) => m.id === data.meshType) || MESH_TYPES[2];
    const meshSheets = Math.ceil((slabArea * 1.1) / selectedMesh.area);
    const meshCost = meshSheets * (parseFloat(data.meshPrice) || selectedMesh.defaultPrice);
    
    // Poly membrane
    const polyCost = data.polyMembrane 
      ? slabArea * (parseInt(data.polyLayers) || 1) * (parseFloat(data.polyPrice) || 2.5)
      : 0;
    
    // Delivery
    const deliveryCosts = (parseFloat(data.concreteDeliveryCost) || 0) +
      (parseFloat(data.meshDeliveryCost) || 0);
    
    // Additional materials
    const additionalMaterialsCost = data.additionalMaterialCosts.reduce(
      (sum, c) => sum + (parseFloat(c.cost) || 0), 0
    );
    
    // Materials totals
    const materialsSubtotal = concreteCost + meshCost + polyCost + deliveryCosts + additionalMaterialsCost;
    const materialsMarkup = materialsSubtotal * ((parseFloat(data.materialsMarkupPercent) || 0) / 100);
    const materialsTotal = materialsSubtotal + materialsMarkup;
    
    // Labour
    const hourlyRate = parseFloat(data.hourlyRate) || 85;
    const prepManHours = (parseFloat(data.crewSize) || 0) *
      (parseFloat(data.prepDays) || 0) *
      (parseFloat(data.prepHoursPerDay) || 8);
    const prepCost = prepManHours * hourlyRate;
    
    const pourManHours = (parseFloat(data.pourCrewSize) || 0) * (parseFloat(data.pourHoursPerMan) || 0);
    const pourCost = pourManHours * hourlyRate;
    
    // Additional labour
    const additionalCostsTotal = data.additionalCosts.reduce(
      (sum, c) => sum + (parseFloat(c.cost) || 0), 0
    );
    
    // Labour totals
    const labourSubtotal = prepCost + pourCost + additionalCostsTotal;
    const labourMarkup = labourSubtotal * ((parseFloat(data.labourMarkupPercent) || 0) / 100);
    const labourTotal = labourSubtotal + labourMarkup;
    
    const grandTotal = materialsTotal + labourTotal;
    
    return {
      slabArea,
      volumeWithWastage,
      concreteCost,
      meshSheets,
      meshCost,
      polyCost,
      deliveryCosts,
      additionalMaterialsCost,
      materialsSubtotal,
      materialsMarkup,
      materialsTotal,
      prepManHours,
      prepCost,
      pourManHours,
      pourCost,
      additionalCostsTotal,
      labourSubtotal,
      labourMarkup,
      labourTotal,
      grandTotal,
    };
  }, [data]);

  return (
    <div className="space-y-4">
      <InternalCostNotice />
      
      <Accordion type="multiple" className="space-y-2">
        
        {/* Slab Dimensions */}
        <AccordionItem value="slab" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Square className="w-4 h-4 text-primary" />
              <span className="font-medium">Slab Dimensions</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Slab Area (m²)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={data.slabArea}
                  onChange={(e) => onChange({ ...data, slabArea: e.target.value })}
                  placeholder="e.g. 120"
                />
              </div>
              <div>
                <Label>Thickness (mm)</Label>
                <Select
                  value={data.slabThickness}
                  onValueChange={(v) => onChange({ ...data, slabThickness: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="85">85mm</SelectItem>
                    <SelectItem value="100">100mm</SelectItem>
                    <SelectItem value="125">125mm</SelectItem>
                    <SelectItem value="150">150mm</SelectItem>
                    <SelectItem value="200">200mm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Concrete Strength</Label>
                <Select
                  value={data.concreteStrength}
                  onValueChange={(v) => onChange({ ...data, concreteStrength: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MPA_STRENGTHS.map((mpa) => (
                      <SelectItem key={mpa.value} value={mpa.value}>
                        {mpa.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Volume: {calculations.volumeWithWastage.toFixed(2)}m³ (inc. {data.wastagePercent}% wastage)
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Materials & Reinforcement */}
        <AccordionItem value="materials" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="font-medium">Materials & Reinforcement</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Mesh Type</Label>
                <Select
                  value={data.meshType}
                  onValueChange={(v) => onChange({ ...data, meshType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MESH_TYPES.map((mesh) => (
                      <SelectItem key={mesh.id} value={mesh.id}>
                        {mesh.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mesh Price per Sheet ($)</Label>
                <Input
                  type="number"
                  value={data.meshPrice}
                  onChange={(e) => onChange({ ...data, meshPrice: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3 mt-4">
              <Switch
                checked={data.polyMembrane}
                onCheckedChange={(checked) => onChange({ ...data, polyMembrane: checked })}
              />
              <Label>Poly Membrane</Label>
            </div>
            
            {data.polyMembrane && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <Label>Poly Layers</Label>
                  <Select
                    value={data.polyLayers}
                    onValueChange={(v) => onChange({ ...data, polyLayers: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Layer</SelectItem>
                      <SelectItem value="2">2 Layers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Poly Price ($/m²)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={data.polyPrice}
                    onChange={(e) => onChange({ ...data, polyPrice: e.target.value })}
                  />
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label>Concrete Price ($/m³)</Label>
                <Input
                  type="number"
                  value={data.concretePrice}
                  onChange={(e) => onChange({ ...data, concretePrice: e.target.value })}
                />
              </div>
              <div>
                <Label>Wastage %</Label>
                <Input
                  type="number"
                  value={data.wastagePercent}
                  onChange={(e) => onChange({ ...data, wastagePercent: e.target.value })}
                />
              </div>
            </div>
            
            {/* Additional Material Costs */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <Label>Additional Material Costs</Label>
                <Button variant="ghost" size="sm" onClick={addAdditionalMaterialCost}>
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
              {data.additionalMaterialCosts.map((cost) => (
                <div key={cost.id} className="flex gap-2 mb-2">
                  <Input
                    placeholder="Description"
                    value={cost.description}
                    onChange={(e) => {
                      onChange({
                        ...data,
                        additionalMaterialCosts: data.additionalMaterialCosts.map((c) =>
                          c.id === cost.id ? { ...c, description: e.target.value } : c
                        ),
                      });
                    }}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Cost"
                    value={cost.cost}
                    onChange={(e) => {
                      onChange({
                        ...data,
                        additionalMaterialCosts: data.additionalMaterialCosts.map((c) =>
                          c.id === cost.id ? { ...c, cost: e.target.value } : c
                        ),
                      });
                    }}
                    className="w-32"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAdditionalMaterialCost(cost.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Delivery */}
        <AccordionItem value="delivery" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" />
              <span className="font-medium">Delivery Costs</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Concrete Delivery ($)</Label>
                <Input
                  type="number"
                  value={data.concreteDeliveryCost}
                  onChange={(e) => onChange({ ...data, concreteDeliveryCost: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Mesh Delivery ($)</Label>
                <Input
                  type="number"
                  value={data.meshDeliveryCost}
                  onChange={(e) => onChange({ ...data, meshDeliveryCost: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Labour */}
        <AccordionItem value="labour" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="font-medium">Labour</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Slab Preparation</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Crew Size</Label>
                    <Input
                      type="number"
                      value={data.crewSize}
                      onChange={(e) => onChange({ ...data, crewSize: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Days</Label>
                    <Input
                      type="number"
                      value={data.prepDays}
                      onChange={(e) => onChange({ ...data, prepDays: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Hours/Day</Label>
                    <Input
                      type="number"
                      value={data.prepHoursPerDay}
                      onChange={(e) => onChange({ ...data, prepHoursPerDay: e.target.value })}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  = {calculations.prepManHours.toFixed(1)} man-hours ({formatCurrency(calculations.prepCost)})
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Pour Day</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Crew Size</Label>
                    <Input
                      type="number"
                      value={data.pourCrewSize}
                      onChange={(e) => onChange({ ...data, pourCrewSize: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Hours per Man</Label>
                    <Input
                      type="number"
                      value={data.pourHoursPerMan}
                      onChange={(e) => onChange({ ...data, pourHoursPerMan: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  = {calculations.pourManHours.toFixed(1)} man-hours ({formatCurrency(calculations.pourCost)})
                </p>
              </div>
              
              <div>
                <Label>Hourly Rate ($)</Label>
                <Input
                  type="number"
                  value={data.hourlyRate}
                  onChange={(e) => onChange({ ...data, hourlyRate: e.target.value })}
                  className="w-32"
                />
              </div>
              
              {/* Additional Labour Costs */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Additional Labour Costs</Label>
                  <Button variant="ghost" size="sm" onClick={addAdditionalCost}>
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
                {data.additionalCosts.map((cost) => (
                  <div key={cost.id} className="flex gap-2 mb-2">
                    <Input
                      placeholder="Description"
                      value={cost.description}
                      onChange={(e) => {
                        onChange({
                          ...data,
                          additionalCosts: data.additionalCosts.map((c) =>
                            c.id === cost.id ? { ...c, description: e.target.value } : c
                          ),
                        });
                      }}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Cost"
                      value={cost.cost}
                      onChange={(e) => {
                        onChange({
                          ...data,
                          additionalCosts: data.additionalCosts.map((c) =>
                            c.id === cost.id ? { ...c, cost: e.target.value } : c
                          ),
                        });
                      }}
                      className="w-32"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAdditionalCost(cost.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Markup */}
        <AccordionItem value="markup" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="font-medium">Markup</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Materials Markup (%)</Label>
                <Input
                  type="number"
                  value={data.materialsMarkupPercent}
                  onChange={(e) => onChange({ ...data, materialsMarkupPercent: e.target.value })}
                />
              </div>
              <div>
                <Label>Labour Markup (%)</Label>
                <Input
                  type="number"
                  value={data.labourMarkupPercent}
                  onChange={(e) => onChange({ ...data, labourMarkupPercent: e.target.value })}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Summary Card */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Cost Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="space-y-1">
            <div className="font-medium">Materials</div>
            <div className="flex justify-between pl-3">
              <span>Concrete ({calculations.volumeWithWastage.toFixed(2)}m³)</span>
              <span>{formatCurrency(calculations.concreteCost)}</span>
            </div>
            <div className="flex justify-between pl-3">
              <span>Mesh ({calculations.meshSheets} sheets)</span>
              <span>{formatCurrency(calculations.meshCost)}</span>
            </div>
            {calculations.polyCost > 0 && (
              <div className="flex justify-between pl-3">
                <span>Poly Membrane</span>
                <span>{formatCurrency(calculations.polyCost)}</span>
              </div>
            )}
            {calculations.deliveryCosts > 0 && (
              <div className="flex justify-between pl-3">
                <span>Delivery</span>
                <span>{formatCurrency(calculations.deliveryCosts)}</span>
              </div>
            )}
            {calculations.additionalMaterialsCost > 0 && (
              <div className="flex justify-between pl-3">
                <span>Additional Materials</span>
                <span>{formatCurrency(calculations.additionalMaterialsCost)}</span>
              </div>
            )}
            <div className="flex justify-between pl-3 text-muted-foreground">
              <span>Materials Subtotal</span>
              <span>{formatCurrency(calculations.materialsSubtotal)}</span>
            </div>
            {calculations.materialsMarkup > 0 && (
              <div className="flex justify-between pl-3 text-muted-foreground">
                <span>Markup ({data.materialsMarkupPercent}%)</span>
                <span>+{formatCurrency(calculations.materialsMarkup)}</span>
              </div>
            )}
            <div className="flex justify-between pl-3 font-medium">
              <span>Materials Total</span>
              <span>{formatCurrency(calculations.materialsTotal)}</span>
            </div>
          </div>
          
          <div className="border-t pt-2 space-y-1">
            <div className="font-medium">Labour</div>
            {calculations.prepCost > 0 && (
              <div className="flex justify-between pl-3">
                <span>Slab Prep ({calculations.prepManHours.toFixed(1)} hrs)</span>
                <span>{formatCurrency(calculations.prepCost)}</span>
              </div>
            )}
            {calculations.pourCost > 0 && (
              <div className="flex justify-between pl-3">
                <span>Pour Day ({calculations.pourManHours.toFixed(1)} hrs)</span>
                <span>{formatCurrency(calculations.pourCost)}</span>
              </div>
            )}
            {calculations.additionalCostsTotal > 0 && (
              <div className="flex justify-between pl-3">
                <span>Additional Costs</span>
                <span>{formatCurrency(calculations.additionalCostsTotal)}</span>
              </div>
            )}
            <div className="flex justify-between pl-3 text-muted-foreground">
              <span>Labour Subtotal</span>
              <span>{formatCurrency(calculations.labourSubtotal)}</span>
            </div>
            {calculations.labourMarkup > 0 && (
              <div className="flex justify-between pl-3 text-muted-foreground">
                <span>Markup ({data.labourMarkupPercent}%)</span>
                <span>+{formatCurrency(calculations.labourMarkup)}</span>
              </div>
            )}
            <div className="flex justify-between pl-3 font-medium">
              <span>Labour Total</span>
              <span>{formatCurrency(calculations.labourTotal)}</span>
            </div>
          </div>
          
          <div className="flex justify-between font-semibold pt-3 border-t text-base">
            <span>Grand Total (ex GST)</span>
            <span>{formatCurrency(calculations.grandTotal)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Export calculation helper for totals
export function calculateStandardSlabTotals(data: StandardSlabData) {
  const slabArea = parseFloat(data.slabArea) || 0;
  const slabThickness = (parseFloat(data.slabThickness) || 0) / 1000;
  const slabVolume = slabArea * slabThickness;
  
  // Concrete
  const wastage = (parseFloat(data.wastagePercent) || 5) / 100;
  const volumeWithWastage = slabVolume * (1 + wastage);
  const concreteCost = volumeWithWastage * (parseFloat(data.concretePrice) || 280);
  
  // Mesh
  const selectedMesh = MESH_TYPES.find((m) => m.id === data.meshType) || MESH_TYPES[2];
  const meshSheets = Math.ceil((slabArea * 1.1) / selectedMesh.area);
  const meshCost = meshSheets * (parseFloat(data.meshPrice) || selectedMesh.defaultPrice);
  
  // Poly membrane
  const polyCost = data.polyMembrane 
    ? slabArea * (parseInt(data.polyLayers) || 1) * (parseFloat(data.polyPrice) || 2.5)
    : 0;
  
  // Delivery
  const deliveryCosts = (parseFloat(data.concreteDeliveryCost) || 0) +
    (parseFloat(data.meshDeliveryCost) || 0);
  
  // Additional materials
  const additionalMaterialsCost = data.additionalMaterialCosts.reduce(
    (sum, c) => sum + (parseFloat(c.cost) || 0), 0
  );
  
  // Materials totals
  const materialsSubtotal = concreteCost + meshCost + polyCost + deliveryCosts + additionalMaterialsCost;
  const materialsMarkup = materialsSubtotal * ((parseFloat(data.materialsMarkupPercent) || 0) / 100);
  const materialsTotal = materialsSubtotal + materialsMarkup;
  
  // Labour
  const hourlyRate = parseFloat(data.hourlyRate) || 85;
  const prepManHours = (parseFloat(data.crewSize) || 0) *
    (parseFloat(data.prepDays) || 0) *
    (parseFloat(data.prepHoursPerDay) || 8);
  const prepCost = prepManHours * hourlyRate;
  
  const pourManHours = (parseFloat(data.pourCrewSize) || 0) * (parseFloat(data.pourHoursPerMan) || 0);
  const pourCost = pourManHours * hourlyRate;
  
  // Additional labour
  const additionalCostsTotal = data.additionalCosts.reduce(
    (sum, c) => sum + (parseFloat(c.cost) || 0), 0
  );
  
  // Labour totals
  const labourSubtotal = prepCost + pourCost + additionalCostsTotal;
  const labourMarkup = labourSubtotal * ((parseFloat(data.labourMarkupPercent) || 0) / 100);
  const labourTotal = labourSubtotal + labourMarkup;
  
  const grandTotal = materialsTotal + labourTotal;
  
  return {
    slabArea,
    volumeWithWastage,
    concreteCost,
    meshSheets,
    meshCost,
    polyCost,
    materialsSubtotal,
    materialsMarkup,
    materialsTotal,
    labourTotal,
    grandTotal,
    concreteStrength: data.concreteStrength,
    meshType: data.meshType,
  };
}
