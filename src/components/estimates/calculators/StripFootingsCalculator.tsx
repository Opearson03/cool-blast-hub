import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash2, Users, DollarSign, Truck, ShieldCheck, Square } from "lucide-react";
import { InternalCostNotice } from "./shared";

const MPA_STRENGTHS = ["20", "25", "32", "40"];
const TRENCH_MESH_TYPES = [
  { id: "L8TM300", label: "L8TM300 (8mm)", kgPerM: 3.2, defaultPrice: 12 },
  { id: "L11TM300", label: "L11TM300 (11mm)", kgPerM: 5.9, defaultPrice: 18 },
  { id: "L12TM400", label: "L12TM400 (12mm)", kgPerM: 7.1, defaultPrice: 22 },
];
const REBAR_SIZES = [
  { id: "N12", label: "N12 (12mm)", kgPerM: 0.888, defaultPrice: 2.50 },
  { id: "N16", label: "N16 (16mm)", kgPerM: 1.58, defaultPrice: 3.50 },
  { id: "N20", label: "N20 (20mm)", kgPerM: 2.47, defaultPrice: 4.50 },
];

export interface StripFootingType {
  id: string;
  name: string;
  length: string;
  width: string;
  depth: string;
  reinforcementType: "trench_mesh" | "rebar";
  trenchMeshType: string;
  rebarSize: string;
  rebarCount: string; // Number of bars in footing
  ligatures: boolean;
  ligatureSize: string;
  ligatureSpacing: string;
}

export interface AdditionalCostItem {
  id: string;
  description: string;
  cost: string;
}

export interface StripFootingsData {
  footings: StripFootingType[];
  concreteStrength: string;
  concretePricePerM3: string;
  wastagePercent: string;
  trenchMeshPrice: string;
  rebarPricePerKg: string;
  
  // Delivery
  concreteDeliveryCost: string;
  rebarDeliveryCost: string;
  
  // Additional materials
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
  
  // Additional labour
  additionalCosts: AdditionalCostItem[];
  
  // Markup
  materialsMarkupPercent: string;
  labourMarkupPercent: string;
}

export const initialStripFootingsData: StripFootingsData = {
  footings: [createEmptyFooting()],
  concreteStrength: "25",
  concretePricePerM3: "280",
  wastagePercent: "5",
  trenchMeshPrice: "18",
  rebarPricePerKg: "2.50",
  
  concreteDeliveryCost: "",
  rebarDeliveryCost: "",
  
  additionalMaterialCosts: [],
  
  crewSize: "4",
  formworkDays: "",
  formworkHoursPerDay: "8",
  reboDays: "",
  reboHoursPerDay: "8",
  pourCrewSize: "4",
  pourHoursPerMan: "",
  hourlyRate: "85",
  
  additionalCosts: [],
  
  materialsMarkupPercent: "15",
  labourMarkupPercent: "15",
};

function createEmptyFooting(): StripFootingType {
  return {
    id: Date.now().toString(),
    name: "",
    length: "",
    width: "450",
    depth: "300",
    reinforcementType: "trench_mesh",
    trenchMeshType: "L11TM300",
    rebarSize: "N12",
    rebarCount: "4",
    ligatures: false,
    ligatureSize: "N10",
    ligatureSpacing: "300",
  };
}

interface StripFootingsCalculatorProps {
  data: StripFootingsData;
  onChange: (data: StripFootingsData) => void;
}

export function StripFootingsCalculator({ data, onChange }: StripFootingsCalculatorProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const updateField = (field: keyof StripFootingsData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const updateFooting = (id: string, field: keyof StripFootingType, value: string | boolean) => {
    onChange({
      ...data,
      footings: data.footings.map(f => f.id === id ? { ...f, [field]: value } : f),
    });
  };

  const addFooting = () => {
    onChange({ ...data, footings: [...data.footings, createEmptyFooting()] });
  };

  const removeFooting = (id: string) => {
    if (data.footings.length > 1) {
      onChange({ ...data, footings: data.footings.filter(f => f.id !== id) });
    }
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

  const calculations = useMemo(() => {
    let totalConcreteVolume = 0;
    let totalReinforcementCost = 0;
    let totalLength = 0;

    data.footings.forEach(footing => {
      const length = parseFloat(footing.length) || 0;
      const width = (parseFloat(footing.width) || 0) / 1000; // mm to m
      const depth = (parseFloat(footing.depth) || 0) / 1000; // mm to m
      
      totalLength += length;
      totalConcreteVolume += length * width * depth;
      
      // Reinforcement calculation
      if (footing.reinforcementType === "trench_mesh") {
        const mesh = TRENCH_MESH_TYPES.find(m => m.id === footing.trenchMeshType) || TRENCH_MESH_TYPES[1];
        const meshLength = length * 1.1; // 10% for laps
        totalReinforcementCost += meshLength * (parseFloat(data.trenchMeshPrice) || mesh.defaultPrice);
      } else {
        const rebar = REBAR_SIZES.find(r => r.id === footing.rebarSize) || REBAR_SIZES[0];
        const barCount = parseInt(footing.rebarCount) || 4;
        const rebarLength = length * barCount * 1.1; // 10% for laps
        const rebarWeight = rebarLength * rebar.kgPerM;
        totalReinforcementCost += rebarWeight * (parseFloat(data.rebarPricePerKg) || rebar.defaultPrice);
        
        // Ligatures
        if (footing.ligatures) {
          const ligatureSpacing = (parseFloat(footing.ligatureSpacing) || 300) / 1000;
          const ligatureCount = Math.ceil(length / ligatureSpacing);
          const ligaturePerimeter = (width + depth) * 2 + 0.2; // 200mm for hooks
          const ligatureRebar = REBAR_SIZES.find(r => r.id === footing.ligatureSize) || REBAR_SIZES[0];
          const ligatureWeight = ligatureCount * ligaturePerimeter * ligatureRebar.kgPerM;
          totalReinforcementCost += ligatureWeight * (parseFloat(data.rebarPricePerKg) || ligatureRebar.defaultPrice);
        }
      }
    });

    // Concrete cost
    const wastage = (parseFloat(data.wastagePercent) || 5) / 100;
    const volumeWithWastage = totalConcreteVolume * (1 + wastage);
    const concreteCost = volumeWithWastage * (parseFloat(data.concretePricePerM3) || 280);

    // Delivery
    const deliveryCosts = (parseFloat(data.concreteDeliveryCost) || 0) + (parseFloat(data.rebarDeliveryCost) || 0);

    // Additional materials
    const additionalMaterialsCost = data.additionalMaterialCosts.reduce(
      (sum, c) => sum + (parseFloat(c.cost) || 0), 0
    );

    // Materials totals
    const materialsSubtotal = concreteCost + totalReinforcementCost + deliveryCosts + additionalMaterialsCost;
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
      totalLength,
      totalConcreteVolume,
      volumeWithWastage,
      concreteCost,
      totalReinforcementCost,
      deliveryCosts,
      additionalMaterialsCost,
      materialsSubtotal,
      materialsMarkup,
      materialsTotal,
      formworkLabourCost,
      reboLabourCost,
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
      
      <Accordion type="multiple" defaultValue={["footings"]} className="space-y-2">
        
        {/* Footings */}
        <AccordionItem value="footings" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Square className="w-4 h-4 text-primary" />
              <span className="font-medium">Strip Footings</span>
              <Badge variant="secondary" className="ml-2">{data.footings.length}</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              {data.footings.map((footing, index) => (
                <Card key={footing.id} className="border-dashed">
                  <CardHeader className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">Footing {index + 1}</span>
                        <Input
                          placeholder="Name (optional)"
                          value={footing.name}
                          onChange={(e) => updateFooting(footing.id, "name", e.target.value)}
                          className="w-32 h-7 text-xs"
                        />
                      </div>
                      {data.footings.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFooting(footing.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-3">
                    {/* Dimensions */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Length (m)</Label>
                        <Input
                          type="number"
                          value={footing.length}
                          onChange={(e) => updateFooting(footing.id, "length", e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Width (mm)</Label>
                        <Select
                          value={footing.width}
                          onValueChange={(v) => updateFooting(footing.id, "width", v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="300">300mm</SelectItem>
                            <SelectItem value="350">350mm</SelectItem>
                            <SelectItem value="400">400mm</SelectItem>
                            <SelectItem value="450">450mm</SelectItem>
                            <SelectItem value="500">500mm</SelectItem>
                            <SelectItem value="600">600mm</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Depth (mm)</Label>
                        <Select
                          value={footing.depth}
                          onValueChange={(v) => updateFooting(footing.id, "depth", v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="200">200mm</SelectItem>
                            <SelectItem value="250">250mm</SelectItem>
                            <SelectItem value="300">300mm</SelectItem>
                            <SelectItem value="350">350mm</SelectItem>
                            <SelectItem value="400">400mm</SelectItem>
                            <SelectItem value="450">450mm</SelectItem>
                            <SelectItem value="500">500mm</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Reinforcement Type */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Reinforcement Type</Label>
                        <Select
                          value={footing.reinforcementType}
                          onValueChange={(v) => updateFooting(footing.id, "reinforcementType", v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="trench_mesh">Trench Mesh</SelectItem>
                            <SelectItem value="rebar">Reo Bars</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {footing.reinforcementType === "trench_mesh" ? (
                        <div>
                          <Label className="text-xs">Trench Mesh Type</Label>
                          <Select
                            value={footing.trenchMeshType}
                            onValueChange={(v) => updateFooting(footing.id, "trenchMeshType", v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TRENCH_MESH_TYPES.map((mesh) => (
                                <SelectItem key={mesh.id} value={mesh.id}>
                                  {mesh.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <>
                          <div>
                            <Label className="text-xs">Bar Size</Label>
                            <Select
                              value={footing.rebarSize}
                              onValueChange={(v) => updateFooting(footing.id, "rebarSize", v)}
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
                        </>
                      )}
                    </div>

                    {footing.reinforcementType === "rebar" && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Number of Bars</Label>
                            <Select
                              value={footing.rebarCount}
                              onValueChange={(v) => updateFooting(footing.id, "rebarCount", v)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="2">2 bars</SelectItem>
                                <SelectItem value="3">3 bars</SelectItem>
                                <SelectItem value="4">4 bars</SelectItem>
                                <SelectItem value="5">5 bars</SelectItem>
                                <SelectItem value="6">6 bars</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-2 pt-5">
                            <Switch
                              checked={footing.ligatures}
                              onCheckedChange={(checked) => updateFooting(footing.id, "ligatures", checked)}
                            />
                            <Label className="text-xs">Ligatures</Label>
                          </div>
                        </div>

                        {footing.ligatures && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Ligature Size</Label>
                              <Select
                                value={footing.ligatureSize}
                                onValueChange={(v) => updateFooting(footing.id, "ligatureSize", v)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="N10">N10</SelectItem>
                                  <SelectItem value="N12">N12</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Ligature Spacing (mm)</Label>
                              <Select
                                value={footing.ligatureSpacing}
                                onValueChange={(v) => updateFooting(footing.id, "ligatureSpacing", v)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="200">200mm</SelectItem>
                                  <SelectItem value="250">250mm</SelectItem>
                                  <SelectItem value="300">300mm</SelectItem>
                                  <SelectItem value="400">400mm</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}

              <Button variant="outline" onClick={addFooting} className="w-full gap-2">
                <Plus className="w-4 h-4" /> Add Footing
              </Button>

              <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                Total Length: {calculations.totalLength.toFixed(1)}m | 
                Volume: {calculations.volumeWithWastage.toFixed(2)}m³ (inc. {data.wastagePercent}% wastage)
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Materials & Pricing */}
        <AccordionItem value="materials" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="font-medium">Materials & Pricing</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Concrete Strength</Label>
                <Select
                  value={data.concreteStrength}
                  onValueChange={(v) => updateField("concreteStrength", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MPA_STRENGTHS.map((mpa) => (
                      <SelectItem key={mpa} value={mpa}>
                        {mpa} MPa
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Concrete Price ($/m³)</Label>
                <Input
                  type="number"
                  value={data.concretePricePerM3}
                  onChange={(e) => updateField("concretePricePerM3", e.target.value)}
                />
              </div>
              <div>
                <Label>Wastage %</Label>
                <Input
                  type="number"
                  value={data.wastagePercent}
                  onChange={(e) => updateField("wastagePercent", e.target.value)}
                />
              </div>
              <div>
                <Label>Trench Mesh Price ($/m)</Label>
                <Input
                  type="number"
                  value={data.trenchMeshPrice}
                  onChange={(e) => updateField("trenchMeshPrice", e.target.value)}
                />
              </div>
              <div>
                <Label>Rebar Price ($/kg)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={data.rebarPricePerKg}
                  onChange={(e) => updateField("rebarPricePerKg", e.target.value)}
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
                  onChange={(e) => updateField("concreteDeliveryCost", e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Rebar/Mesh Delivery ($)</Label>
                <Input
                  type="number"
                  value={data.rebarDeliveryCost}
                  onChange={(e) => updateField("rebarDeliveryCost", e.target.value)}
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
                    onChange={(e) => updateField("crewSize", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Hourly Rate ($)</Label>
                  <Input
                    type="number"
                    value={data.hourlyRate}
                    onChange={(e) => updateField("hourlyRate", e.target.value)}
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
                      onChange={(e) => updateField("formworkDays", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Hours per Day</Label>
                    <Input
                      type="number"
                      value={data.formworkHoursPerDay}
                      onChange={(e) => updateField("formworkHoursPerDay", e.target.value)}
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
                      onChange={(e) => updateField("reboDays", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Hours per Day</Label>
                    <Input
                      type="number"
                      value={data.reboHoursPerDay}
                      onChange={(e) => updateField("reboHoursPerDay", e.target.value)}
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
                      onChange={(e) => updateField("pourCrewSize", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Hours per Person</Label>
                    <Input
                      type="number"
                      value={data.pourHoursPerMan}
                      onChange={(e) => updateField("pourHoursPerMan", e.target.value)}
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
                  onChange={(e) => updateField("materialsMarkupPercent", e.target.value)}
                />
              </div>
              <div>
                <Label>Labour Markup %</Label>
                <Input
                  type="number"
                  value={data.labourMarkupPercent}
                  onChange={(e) => updateField("labourMarkupPercent", e.target.value)}
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
export function calculateStripFootingsTotals(data: StripFootingsData) {
  let totalConcreteVolume = 0;
  let totalReinforcementCost = 0;
  let totalLength = 0;

  data.footings.forEach(footing => {
    const length = parseFloat(footing.length) || 0;
    const width = (parseFloat(footing.width) || 0) / 1000;
    const depth = (parseFloat(footing.depth) || 0) / 1000;
    
    totalLength += length;
    totalConcreteVolume += length * width * depth;
    
    if (footing.reinforcementType === "trench_mesh") {
      const mesh = TRENCH_MESH_TYPES.find(m => m.id === footing.trenchMeshType) || TRENCH_MESH_TYPES[1];
      const meshLength = length * 1.1;
      totalReinforcementCost += meshLength * (parseFloat(data.trenchMeshPrice) || mesh.defaultPrice);
    } else {
      const rebar = REBAR_SIZES.find(r => r.id === footing.rebarSize) || REBAR_SIZES[0];
      const barCount = parseInt(footing.rebarCount) || 4;
      const rebarLength = length * barCount * 1.1;
      const rebarWeight = rebarLength * rebar.kgPerM;
      totalReinforcementCost += rebarWeight * (parseFloat(data.rebarPricePerKg) || rebar.defaultPrice);
      
      if (footing.ligatures) {
        const ligatureSpacing = (parseFloat(footing.ligatureSpacing) || 300) / 1000;
        const ligatureCount = Math.ceil(length / ligatureSpacing);
        const ligaturePerimeter = ((parseFloat(footing.width) || 0) / 1000 + (parseFloat(footing.depth) || 0) / 1000) * 2 + 0.2;
        const ligatureRebar = REBAR_SIZES.find(r => r.id === footing.ligatureSize) || REBAR_SIZES[0];
        const ligatureWeight = ligatureCount * ligaturePerimeter * ligatureRebar.kgPerM;
        totalReinforcementCost += ligatureWeight * (parseFloat(data.rebarPricePerKg) || ligatureRebar.defaultPrice);
      }
    }
  });

  const wastage = (parseFloat(data.wastagePercent) || 5) / 100;
  const volumeWithWastage = totalConcreteVolume * (1 + wastage);
  const concreteCost = volumeWithWastage * (parseFloat(data.concretePricePerM3) || 280);

  const deliveryCosts = (parseFloat(data.concreteDeliveryCost) || 0) + (parseFloat(data.rebarDeliveryCost) || 0);
  const additionalMaterialsCost = data.additionalMaterialCosts.reduce((sum, c) => sum + (parseFloat(c.cost) || 0), 0);

  const materialsSubtotal = concreteCost + totalReinforcementCost + deliveryCosts + additionalMaterialsCost;
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
    totalLength,
    volumeWithWastage,
    grandTotal,
  };
}
