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
import { ShieldCheck, Truck, Users, DollarSign, Plus, Trash2, Layers, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaCalculator } from "./AreaCalculator";
import { InternalCostNotice } from "./shared";

// ============= CONSTANTS =============

export const MPA_STRENGTHS = [
  { value: "25", label: "25 MPa" },
  { value: "32", label: "32 MPa" },
  { value: "40", label: "40 MPa" },
  { value: "50", label: "50 MPa" },
  { value: "65", label: "65 MPa" },
];

export const REBAR_SIZES = [
  { id: "N12", label: "N12 (12mm)", kgPerM: 0.888, defaultPrice: 3.50 },
  { id: "N16", label: "N16 (16mm)", kgPerM: 1.58, defaultPrice: 4.50 },
  { id: "N20", label: "N20 (20mm)", kgPerM: 2.47, defaultPrice: 5.50 },
  { id: "N24", label: "N24 (24mm)", kgPerM: 3.55, defaultPrice: 6.50 },
  { id: "N28", label: "N28 (28mm)", kgPerM: 4.83, defaultPrice: 7.50 },
  { id: "N32", label: "N32 (32mm)", kgPerM: 6.31, defaultPrice: 8.50 },
];

// ============= INTERFACES =============

export interface AdditionalCostItem {
  id: string;
  description: string;
  cost: string;
}

export interface SuspendedSlabData {
  // Slab dimensions
  slabArea: string;
  slabThickness: string;
  concreteStrength: string;
  clearHeight: string; // Height from ground to underside of slab
  
  // Reinforcement - Top & Bottom layers
  topRebarSize: string;
  topRebarSpacing: string;
  topRebarPrice: string;
  bottomRebarSize: string;
  bottomRebarSpacing: string;
  bottomRebarPrice: string;
  
  // Formwork/Falsework
  formworkIncluded: boolean;
  formworkPricePerM2: string;
  propsIncluded: boolean;
  propsPricePerM2: string;
  
  // Concrete pricing
  concretePrice: string;
  wastagePercent: string;
  pumpHire: string;
  
  // Delivery costs
  concreteDeliveryCost: string;
  rebarDeliveryCost: string;
  
  // Additional material costs
  additionalMaterialCosts: AdditionalCostItem[];
  
  // Labour
  crewSize: string;
  formworkDays: string;
  formworkHoursPerDay: string;
  reboDays: string;
  reboHoursPerDay: string;
  pourCrewSize: string;
  pourHoursPerMan: string;
  hourlyRate: string;
  
  // Additional labour costs
  additionalCosts: AdditionalCostItem[];
  
  // Markup
  materialsMarkupPercent: string;
  labourMarkupPercent: string;
}

export const initialSuspendedSlabData: SuspendedSlabData = {
  slabArea: "",
  slabThickness: "200",
  concreteStrength: "32",
  clearHeight: "3000",
  
  topRebarSize: "N16",
  topRebarSpacing: "200",
  topRebarPrice: "4.50",
  bottomRebarSize: "N16",
  bottomRebarSpacing: "200",
  bottomRebarPrice: "4.50",
  
  formworkIncluded: true,
  formworkPricePerM2: "85",
  propsIncluded: true,
  propsPricePerM2: "35",
  
  concretePrice: "320",
  wastagePercent: "5",
  pumpHire: "1500",
  
  concreteDeliveryCost: "",
  rebarDeliveryCost: "",
  
  additionalMaterialCosts: [],
  
  crewSize: "4",
  formworkDays: "",
  formworkHoursPerDay: "8",
  reboDays: "",
  reboHoursPerDay: "8",
  pourCrewSize: "6",
  pourHoursPerMan: "",
  hourlyRate: "85",
  
  additionalCosts: [],
  
  materialsMarkupPercent: "15",
  labourMarkupPercent: "15",
};

interface SuspendedSlabCalculatorProps {
  data: SuspendedSlabData;
  onChange: (data: SuspendedSlabData) => void;
}

export function SuspendedSlabCalculator({ data, onChange }: SuspendedSlabCalculatorProps) {
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
    const concreteCost = volumeWithWastage * (parseFloat(data.concretePrice) || 320);
    
    // Rebar calculation (both directions for each layer)
    const topSpacing = (parseFloat(data.topRebarSpacing) || 200) / 1000;
    const bottomSpacing = (parseFloat(data.bottomRebarSpacing) || 200) / 1000;
    
    // Approximate side length for rebar calculation
    const sideLength = Math.sqrt(slabArea);
    
    // Top layer (both directions)
    const topBarsPerDirection = Math.ceil(sideLength / topSpacing) + 1;
    const topTotalLength = topBarsPerDirection * sideLength * 2 * 1.1; // 10% for laps
    const topRebar = REBAR_SIZES.find(r => r.id === data.topRebarSize) || REBAR_SIZES[1];
    const topRebarKg = topTotalLength * topRebar.kgPerM;
    const topRebarCost = topRebarKg * (parseFloat(data.topRebarPrice) || topRebar.defaultPrice);
    
    // Bottom layer (both directions)
    const bottomBarsPerDirection = Math.ceil(sideLength / bottomSpacing) + 1;
    const bottomTotalLength = bottomBarsPerDirection * sideLength * 2 * 1.1;
    const bottomRebar = REBAR_SIZES.find(r => r.id === data.bottomRebarSize) || REBAR_SIZES[1];
    const bottomRebarKg = bottomTotalLength * bottomRebar.kgPerM;
    const bottomRebarCost = bottomRebarKg * (parseFloat(data.bottomRebarPrice) || bottomRebar.defaultPrice);
    
    const totalRebarCost = topRebarCost + bottomRebarCost;
    const totalRebarKg = topRebarKg + bottomRebarKg;
    
    // Formwork & Props
    const formworkCost = data.formworkIncluded 
      ? slabArea * (parseFloat(data.formworkPricePerM2) || 85)
      : 0;
    const propsCost = data.propsIncluded 
      ? slabArea * (parseFloat(data.propsPricePerM2) || 35)
      : 0;
    
    // Pump hire
    const pumpCost = parseFloat(data.pumpHire) || 0;
    
    // Delivery
    const deliveryCosts = (parseFloat(data.concreteDeliveryCost) || 0) +
      (parseFloat(data.rebarDeliveryCost) || 0);
    
    // Additional materials
    const additionalMaterialsCost = data.additionalMaterialCosts.reduce(
      (sum, c) => sum + (parseFloat(c.cost) || 0), 0
    );
    
    // Materials totals
    const materialsSubtotal = concreteCost + totalRebarCost + formworkCost + propsCost + pumpCost + deliveryCosts + additionalMaterialsCost;
    const materialsMarkup = materialsSubtotal * ((parseFloat(data.materialsMarkupPercent) || 0) / 100);
    const materialsTotal = materialsSubtotal + materialsMarkup;
    
    // Labour
    const hourlyRate = parseFloat(data.hourlyRate) || 85;
    
    const formworkManHours = (parseFloat(data.crewSize) || 0) *
      (parseFloat(data.formworkDays) || 0) *
      (parseFloat(data.formworkHoursPerDay) || 8);
    const formworkLabourCost = formworkManHours * hourlyRate;
    
    const reboManHours = (parseFloat(data.crewSize) || 0) *
      (parseFloat(data.reboDays) || 0) *
      (parseFloat(data.reboHoursPerDay) || 8);
    const reboLabourCost = reboManHours * hourlyRate;
    
    const pourManHours = (parseFloat(data.pourCrewSize) || 0) * (parseFloat(data.pourHoursPerMan) || 0);
    const pourCost = pourManHours * hourlyRate;
    
    // Additional labour
    const additionalCostsTotal = data.additionalCosts.reduce(
      (sum, c) => sum + (parseFloat(c.cost) || 0), 0
    );
    
    // Labour totals
    const labourSubtotal = formworkLabourCost + reboLabourCost + pourCost + additionalCostsTotal;
    const labourMarkup = labourSubtotal * ((parseFloat(data.labourMarkupPercent) || 0) / 100);
    const labourTotal = labourSubtotal + labourMarkup;
    
    const grandTotal = materialsTotal + labourTotal;
    
    return {
      slabArea,
      volumeWithWastage,
      concreteCost,
      totalRebarKg,
      totalRebarCost,
      formworkCost,
      propsCost,
      pumpCost,
      deliveryCosts,
      additionalMaterialsCost,
      materialsSubtotal,
      materialsMarkup,
      materialsTotal,
      formworkManHours,
      formworkLabourCost,
      reboManHours,
      reboLabourCost,
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
              <Layers className="w-4 h-4 text-primary" />
              <span className="font-medium">Suspended Slab Dimensions</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <AreaCalculator
                  value={data.slabArea}
                  onChange={(v) => onChange({ ...data, slabArea: v })}
                  label="Slab Area (m²)"
                  placeholder="e.g. 200"
                />
              </div>
              <div>
                <Label>Slab Thickness (mm)</Label>
                <Select
                  value={data.slabThickness}
                  onValueChange={(v) => onChange({ ...data, slabThickness: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="150">150mm</SelectItem>
                    <SelectItem value="175">175mm</SelectItem>
                    <SelectItem value="200">200mm</SelectItem>
                    <SelectItem value="225">225mm</SelectItem>
                    <SelectItem value="250">250mm</SelectItem>
                    <SelectItem value="300">300mm</SelectItem>
                    <SelectItem value="350">350mm</SelectItem>
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
              <div>
                <Label>Clear Height (mm)</Label>
                <Input
                  type="number"
                  value={data.clearHeight}
                  onChange={(e) => onChange({ ...data, clearHeight: e.target.value })}
                  placeholder="e.g. 3000"
                />
                <p className="text-xs text-muted-foreground mt-1">Ground to underside of slab</p>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Volume: {calculations.volumeWithWastage.toFixed(2)}m³ (inc. {data.wastagePercent}% wastage)
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Reinforcement */}
        <AccordionItem value="reinforcement" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="font-medium">Reinforcement (Rebar)</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              {/* Top Layer */}
              <div>
                <h4 className="font-medium text-sm mb-2">Top Layer</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Bar Size</Label>
                    <Select
                      value={data.topRebarSize}
                      onValueChange={(v) => onChange({ ...data, topRebarSize: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REBAR_SIZES.map((bar) => (
                          <SelectItem key={bar.id} value={bar.id}>
                            {bar.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Spacing (mm)</Label>
                    <Select
                      value={data.topRebarSpacing}
                      onValueChange={(v) => onChange({ ...data, topRebarSpacing: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100">100mm</SelectItem>
                        <SelectItem value="150">150mm</SelectItem>
                        <SelectItem value="200">200mm</SelectItem>
                        <SelectItem value="250">250mm</SelectItem>
                        <SelectItem value="300">300mm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Price ($/kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={data.topRebarPrice}
                      onChange={(e) => onChange({ ...data, topRebarPrice: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              
              {/* Bottom Layer */}
              <div>
                <h4 className="font-medium text-sm mb-2">Bottom Layer</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Bar Size</Label>
                    <Select
                      value={data.bottomRebarSize}
                      onValueChange={(v) => onChange({ ...data, bottomRebarSize: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REBAR_SIZES.map((bar) => (
                          <SelectItem key={bar.id} value={bar.id}>
                            {bar.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Spacing (mm)</Label>
                    <Select
                      value={data.bottomRebarSpacing}
                      onValueChange={(v) => onChange({ ...data, bottomRebarSpacing: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100">100mm</SelectItem>
                        <SelectItem value="150">150mm</SelectItem>
                        <SelectItem value="200">200mm</SelectItem>
                        <SelectItem value="250">250mm</SelectItem>
                        <SelectItem value="300">300mm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Price ($/kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={data.bottomRebarPrice}
                      onChange={(e) => onChange({ ...data, bottomRebarPrice: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Total Rebar: {calculations.totalRebarKg.toFixed(0)}kg ({formatCurrency(calculations.totalRebarCost)})
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Formwork & Props */}
        <AccordionItem value="formwork" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Square className="w-4 h-4 text-primary" />
              <span className="font-medium">Formwork & Propping</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={data.formworkIncluded}
                  onCheckedChange={(checked) => onChange({ ...data, formworkIncluded: checked })}
                />
                <Label>Include Formwork</Label>
              </div>
              
              {data.formworkIncluded && (
                <div>
                  <Label>Formwork Price ($/m²)</Label>
                  <Input
                    type="number"
                    value={data.formworkPricePerM2}
                    onChange={(e) => onChange({ ...data, formworkPricePerM2: e.target.value })}
                  />
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <Switch
                  checked={data.propsIncluded}
                  onCheckedChange={(checked) => onChange({ ...data, propsIncluded: checked })}
                />
                <Label>Include Props/Falsework</Label>
              </div>
              
              {data.propsIncluded && (
                <div>
                  <Label>Props Price ($/m²)</Label>
                  <Input
                    type="number"
                    value={data.propsPricePerM2}
                    onChange={(e) => onChange({ ...data, propsPricePerM2: e.target.value })}
                  />
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
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
                <div>
                  <Label>Pump Hire ($)</Label>
                  <Input
                    type="number"
                    value={data.pumpHire}
                    onChange={(e) => onChange({ ...data, pumpHire: e.target.value })}
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
                <Label>Rebar Delivery ($)</Label>
                <Input
                  type="number"
                  value={data.rebarDeliveryCost}
                  onChange={(e) => onChange({ ...data, rebarDeliveryCost: e.target.value })}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Crew Size</Label>
                  <Input
                    type="number"
                    value={data.crewSize}
                    onChange={(e) => onChange({ ...data, crewSize: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Hourly Rate ($)</Label>
                  <Input
                    type="number"
                    value={data.hourlyRate}
                    onChange={(e) => onChange({ ...data, hourlyRate: e.target.value })}
                  />
                </div>
              </div>
              
              {/* Formwork Labour */}
              <div>
                <h4 className="font-medium text-sm mb-2">Formwork Labour</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Days</Label>
                    <Input
                      type="number"
                      value={data.formworkDays}
                      onChange={(e) => onChange({ ...data, formworkDays: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Hours per Day</Label>
                    <Input
                      type="number"
                      value={data.formworkHoursPerDay}
                      onChange={(e) => onChange({ ...data, formworkHoursPerDay: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              
              {/* Reo Labour */}
              <div>
                <h4 className="font-medium text-sm mb-2">Reo Fixing Labour</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Days</Label>
                    <Input
                      type="number"
                      value={data.reboDays}
                      onChange={(e) => onChange({ ...data, reboDays: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Hours per Day</Label>
                    <Input
                      type="number"
                      value={data.reboHoursPerDay}
                      onChange={(e) => onChange({ ...data, reboHoursPerDay: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              
              {/* Pour Labour */}
              <div>
                <h4 className="font-medium text-sm mb-2">Pour Labour</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Pour Crew Size</Label>
                    <Input
                      type="number"
                      value={data.pourCrewSize}
                      onChange={(e) => onChange({ ...data, pourCrewSize: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Hours per Person</Label>
                    <Input
                      type="number"
                      value={data.pourHoursPerMan}
                      onChange={(e) => onChange({ ...data, pourHoursPerMan: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
              
              {/* Additional Costs */}
              <div className="mt-4">
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
              <span className="font-medium">Markup & Totals</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Materials Markup %</Label>
                <Input
                  type="number"
                  value={data.materialsMarkupPercent}
                  onChange={(e) => onChange({ ...data, materialsMarkupPercent: e.target.value })}
                />
              </div>
              <div>
                <Label>Labour Markup %</Label>
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
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Cost Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Materials Subtotal:</span>
              <span>{formatCurrency(calculations.materialsSubtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Materials Markup ({data.materialsMarkupPercent}%):</span>
              <span>{formatCurrency(calculations.materialsMarkup)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Materials Total:</span>
              <span>{formatCurrency(calculations.materialsTotal)}</span>
            </div>
            
            <div className="border-t my-2" />
            
            <div className="flex justify-between">
              <span>Labour Subtotal:</span>
              <span>{formatCurrency(calculations.labourSubtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Labour Markup ({data.labourMarkupPercent}%):</span>
              <span>{formatCurrency(calculations.labourMarkup)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Labour Total:</span>
              <span>{formatCurrency(calculations.labourTotal)}</span>
            </div>
            
            <div className="border-t my-2" />
            
            <div className="flex justify-between text-lg font-bold text-primary">
              <span>Grand Total:</span>
              <span>{formatCurrency(calculations.grandTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Export calculation function for use in parent
export function calculateSuspendedSlabTotals(data: SuspendedSlabData) {
  const slabArea = parseFloat(data.slabArea) || 0;
  const slabThickness = (parseFloat(data.slabThickness) || 0) / 1000;
  const slabVolume = slabArea * slabThickness;
  
  const wastage = (parseFloat(data.wastagePercent) || 5) / 100;
  const volumeWithWastage = slabVolume * (1 + wastage);
  const concreteCost = volumeWithWastage * (parseFloat(data.concretePrice) || 320);
  
  // Simplified rebar calculation
  const sideLength = Math.sqrt(slabArea);
  const topSpacing = (parseFloat(data.topRebarSpacing) || 200) / 1000;
  const bottomSpacing = (parseFloat(data.bottomRebarSpacing) || 200) / 1000;
  
  const topBarsPerDirection = Math.ceil(sideLength / topSpacing) + 1;
  const topTotalLength = topBarsPerDirection * sideLength * 2 * 1.1;
  const topRebar = REBAR_SIZES.find(r => r.id === data.topRebarSize) || REBAR_SIZES[1];
  const topRebarKg = topTotalLength * topRebar.kgPerM;
  const topRebarCost = topRebarKg * (parseFloat(data.topRebarPrice) || topRebar.defaultPrice);
  
  const bottomBarsPerDirection = Math.ceil(sideLength / bottomSpacing) + 1;
  const bottomTotalLength = bottomBarsPerDirection * sideLength * 2 * 1.1;
  const bottomRebar = REBAR_SIZES.find(r => r.id === data.bottomRebarSize) || REBAR_SIZES[1];
  const bottomRebarKg = bottomTotalLength * bottomRebar.kgPerM;
  const bottomRebarCost = bottomRebarKg * (parseFloat(data.bottomRebarPrice) || bottomRebar.defaultPrice);
  
  const totalRebarCost = topRebarCost + bottomRebarCost;
  
  const formworkCost = data.formworkIncluded ? slabArea * (parseFloat(data.formworkPricePerM2) || 85) : 0;
  const propsCost = data.propsIncluded ? slabArea * (parseFloat(data.propsPricePerM2) || 35) : 0;
  const pumpCost = parseFloat(data.pumpHire) || 0;
  
  const deliveryCosts = (parseFloat(data.concreteDeliveryCost) || 0) + (parseFloat(data.rebarDeliveryCost) || 0);
  const additionalMaterialsCost = data.additionalMaterialCosts.reduce((sum, c) => sum + (parseFloat(c.cost) || 0), 0);
  
  const materialsSubtotal = concreteCost + totalRebarCost + formworkCost + propsCost + pumpCost + deliveryCosts + additionalMaterialsCost;
  const materialsMarkup = materialsSubtotal * ((parseFloat(data.materialsMarkupPercent) || 0) / 100);
  const materialsTotal = materialsSubtotal + materialsMarkup;
  
  const hourlyRate = parseFloat(data.hourlyRate) || 85;
  const formworkLabourCost = (parseFloat(data.crewSize) || 0) * (parseFloat(data.formworkDays) || 0) * (parseFloat(data.formworkHoursPerDay) || 8) * hourlyRate;
  const reboLabourCost = (parseFloat(data.crewSize) || 0) * (parseFloat(data.reboDays) || 0) * (parseFloat(data.reboHoursPerDay) || 8) * hourlyRate;
  const pourCost = (parseFloat(data.pourCrewSize) || 0) * (parseFloat(data.pourHoursPerMan) || 0) * hourlyRate;
  const additionalCostsTotal = data.additionalCosts.reduce((sum, c) => sum + (parseFloat(c.cost) || 0), 0);
  
  const labourSubtotal = formworkLabourCost + reboLabourCost + pourCost + additionalCostsTotal;
  const labourMarkup = labourSubtotal * ((parseFloat(data.labourMarkupPercent) || 0) / 100);
  const labourTotal = labourSubtotal + labourMarkup;
  
  const grandTotal = materialsTotal + labourTotal;
  
  return {
    slabArea,
    volumeWithWastage,
    grandTotal,
  };
}
