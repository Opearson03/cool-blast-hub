import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash2, EyeOff } from "lucide-react";

const MPA_STRENGTHS = ["20", "25", "32", "40", "50"];
const REBAR_SIZES = ["N10", "N12", "N16", "N20", "N24", "N28", "N32", "N36"];
const LIGATURE_SIZES = ["R6", "R10", "N10", "N12"];

export interface PierType {
  id: string;
  quantity: string;
  diameter: string;
  depth: string;
  mainBars: string;
  mainBarSize: string;
  ligatureSize: string;
  ligatureSpacing: string;
}

export interface PiersData {
  piers: PierType[];
  concreteStrength: string;
  concretePricePerM3: string;
  wastagePercent: string;
  rebarPricePerKg: string;
  labourHourlyRate: string;
  labourHoursPerPier: string;
  materialsMarkupPercent: string;
  labourMarkupPercent: string;
}

export const initialPiersData: PiersData = {
  piers: [{ id: "1", quantity: "1", diameter: "450", depth: "600", mainBars: "4", mainBarSize: "N16", ligatureSize: "R10", ligatureSpacing: "200" }],
  concreteStrength: "32",
  concretePricePerM3: "280",
  wastagePercent: "10",
  rebarPricePerKg: "2.50",
  labourHourlyRate: "85",
  labourHoursPerPier: "1.5",
  materialsMarkupPercent: "20",
  labourMarkupPercent: "30",
};

const createEmptyPier = (): PierType => ({
  id: Date.now().toString(),
  quantity: "1",
  diameter: "450",
  depth: "600",
  mainBars: "4",
  mainBarSize: "N16",
  ligatureSize: "R10",
  ligatureSpacing: "200",
});

// Rebar weight per meter (kg/m)
const REBAR_WEIGHT: Record<string, number> = {
  "R6": 0.222, "R10": 0.617,
  "N10": 0.617, "N12": 0.888, "N16": 1.58, "N20": 2.47, "N24": 3.55, "N28": 4.83, "N32": 6.31, "N36": 7.99,
};

interface PiersCalculatorProps {
  data: PiersData;
  onChange: (data: PiersData) => void;
}

export function PiersCalculator({ data, onChange }: PiersCalculatorProps) {
  const updateField = (field: keyof PiersData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const updatePier = (id: string, field: keyof PierType, value: string) => {
    onChange({
      ...data,
      piers: data.piers.map(p => p.id === id ? { ...p, [field]: value } : p),
    });
  };

  const addPier = () => {
    onChange({ ...data, piers: [...data.piers, createEmptyPier()] });
  };

  const removePier = (id: string) => {
    if (data.piers.length > 1) {
      onChange({ ...data, piers: data.piers.filter(p => p.id !== id) });
    }
  };

  const calculations = useMemo(() => {
    let totalConcreteVolume = 0;
    let totalRebarWeight = 0;
    let totalPierCount = 0;

    data.piers.forEach(pier => {
      const qty = parseInt(pier.quantity) || 0;
      const diameterM = (parseFloat(pier.diameter) || 0) / 1000;
      const depthM = (parseFloat(pier.depth) || 0) / 1000;
      const radius = diameterM / 2;
      const volumePerPier = Math.PI * radius * radius * depthM;
      
      totalConcreteVolume += volumePerPier * qty;
      totalPierCount += qty;

      // Main bars
      const mainBarsCount = parseInt(pier.mainBars) || 0;
      const mainBarWeight = REBAR_WEIGHT[pier.mainBarSize] || 0;
      const mainBarLength = depthM + 0.3; // Add 300mm for starter bar projection
      totalRebarWeight += mainBarsCount * mainBarLength * mainBarWeight * qty;

      // Ligatures
      const ligatureWeight = REBAR_WEIGHT[pier.ligatureSize] || 0;
      const ligatureCount = Math.ceil(depthM / ((parseFloat(pier.ligatureSpacing) || 200) / 1000)) + 1;
      const ligaturePerimeter = Math.PI * diameterM * 0.9; // Approximate
      totalRebarWeight += ligatureCount * ligaturePerimeter * ligatureWeight * qty;
    });

    const wastage = (parseFloat(data.wastagePercent) || 0) / 100;
    const volumeWithWastage = totalConcreteVolume * (1 + wastage);
    const concretePricePerM3 = parseFloat(data.concretePricePerM3) || 0;
    const concreteCost = volumeWithWastage * concretePricePerM3;

    const rebarPricePerKg = parseFloat(data.rebarPricePerKg) || 0;
    const rebarCost = totalRebarWeight * rebarPricePerKg;

    const materialsCost = concreteCost + rebarCost;
    const materialsMarkup = (parseFloat(data.materialsMarkupPercent) || 0) / 100;
    const materialsTotal = materialsCost * (1 + materialsMarkup);

    const labourHourlyRate = parseFloat(data.labourHourlyRate) || 0;
    const labourHoursPerPier = parseFloat(data.labourHoursPerPier) || 0;
    const labourCost = totalPierCount * labourHoursPerPier * labourHourlyRate;
    const labourMarkup = (parseFloat(data.labourMarkupPercent) || 0) / 100;
    const labourTotal = labourCost * (1 + labourMarkup);

    const grandTotal = materialsTotal + labourTotal;

    return {
      totalConcreteVolume,
      volumeWithWastage,
      concreteCost,
      totalRebarWeight,
      rebarCost,
      materialsCost,
      materialsTotal,
      labourCost,
      labourTotal,
      grandTotal,
      totalPierCount,
    };
  }, [data]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Internal cost notice */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
        <EyeOff className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-700 dark:text-amber-400">
          <strong>Internal costs only</strong> — Client sees final quoted amount only.
        </p>
      </div>

      {/* Pier Types */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Pier Configurations</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addPier}>
              <Plus className="w-4 h-4 mr-1" /> Add Type
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Accordion type="multiple" defaultValue={["pier-0"]}>
            {data.piers.map((pier, index) => (
              <AccordionItem key={pier.id} value={`pier-${index}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span>Pier Type {index + 1}</span>
                    <Badge variant="secondary">{pier.quantity}x Ø{pier.diameter}mm × {pier.depth}mm</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Quantity</Label>
                      <Input type="number" min="1" value={pier.quantity} onChange={(e) => updatePier(pier.id, "quantity", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Diameter (mm)</Label>
                      <Input type="number" value={pier.diameter} onChange={(e) => updatePier(pier.id, "diameter", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Depth (mm)</Label>
                      <Input type="number" value={pier.depth} onChange={(e) => updatePier(pier.id, "depth", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Main Bars</Label>
                      <Input type="number" min="1" value={pier.mainBars} onChange={(e) => updatePier(pier.id, "mainBars", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Main Bar Size</Label>
                      <Select value={pier.mainBarSize} onValueChange={(v) => updatePier(pier.id, "mainBarSize", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {REBAR_SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Ligature Size</Label>
                      <Select value={pier.ligatureSize} onValueChange={(v) => updatePier(pier.id, "ligatureSize", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {LIGATURE_SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Ligature Spacing (mm)</Label>
                      <Input type="number" value={pier.ligatureSpacing} onChange={(e) => updatePier(pier.id, "ligatureSpacing", e.target.value)} />
                    </div>
                    <div className="flex items-end">
                      {data.piers.length > 1 && (
                        <Button type="button" variant="destructive" size="sm" onClick={() => removePier(pier.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Concrete & Reo Pricing */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Materials Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Concrete Strength (MPa)</Label>
              <Select value={data.concreteStrength} onValueChange={(v) => updateField("concreteStrength", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MPA_STRENGTHS.map(s => <SelectItem key={s} value={s}>{s} MPa</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Concrete ($/m³)</Label>
              <Input type="number" value={data.concretePricePerM3} onChange={(e) => updateField("concretePricePerM3", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Wastage (%)</Label>
              <Input type="number" value={data.wastagePercent} onChange={(e) => updateField("wastagePercent", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Rebar ($/kg)</Label>
              <Input type="number" step="0.01" value={data.rebarPricePerKg} onChange={(e) => updateField("rebarPricePerKg", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Labour & Markup */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Labour & Markup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Hourly Rate ($/hr)</Label>
              <Input type="number" value={data.labourHourlyRate} onChange={(e) => updateField("labourHourlyRate", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hours per Pier</Label>
              <Input type="number" step="0.5" value={data.labourHoursPerPier} onChange={(e) => updateField("labourHoursPerPier", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Materials Markup (%)</Label>
              <Input type="number" value={data.materialsMarkupPercent} onChange={(e) => updateField("materialsMarkupPercent", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Labour Markup (%)</Label>
              <Input type="number" value={data.labourMarkupPercent} onChange={(e) => updateField("labourMarkupPercent", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Summary */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cost Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Piers</span>
            <span>{calculations.totalPierCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Concrete ({calculations.volumeWithWastage.toFixed(2)}m³)</span>
            <span>{formatCurrency(calculations.concreteCost)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Reinforcement ({calculations.totalRebarWeight.toFixed(1)}kg)</span>
            <span>{formatCurrency(calculations.rebarCost)}</span>
          </div>
          <div className="flex justify-between text-sm font-medium border-t pt-2">
            <span>Materials (inc. {data.materialsMarkupPercent}% markup)</span>
            <span>{formatCurrency(calculations.materialsTotal)}</span>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span>Labour (inc. {data.labourMarkupPercent}% markup)</span>
            <span>{formatCurrency(calculations.labourTotal)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(calculations.grandTotal)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function calculatePiersTotals(data: PiersData) {
  let totalConcreteVolume = 0;
  let totalRebarWeight = 0;
  let totalPierCount = 0;

  const REBAR_WEIGHT: Record<string, number> = {
    "R6": 0.222, "R10": 0.617,
    "N10": 0.617, "N12": 0.888, "N16": 1.58, "N20": 2.47, "N24": 3.55, "N28": 4.83, "N32": 6.31, "N36": 7.99,
  };

  data.piers.forEach(pier => {
    const qty = parseInt(pier.quantity) || 0;
    const diameterM = (parseFloat(pier.diameter) || 0) / 1000;
    const depthM = (parseFloat(pier.depth) || 0) / 1000;
    const radius = diameterM / 2;
    const volumePerPier = Math.PI * radius * radius * depthM;
    
    totalConcreteVolume += volumePerPier * qty;
    totalPierCount += qty;

    const mainBarsCount = parseInt(pier.mainBars) || 0;
    const mainBarWeight = REBAR_WEIGHT[pier.mainBarSize] || 0;
    const mainBarLength = depthM + 0.3;
    totalRebarWeight += mainBarsCount * mainBarLength * mainBarWeight * qty;

    const ligatureWeight = REBAR_WEIGHT[pier.ligatureSize] || 0;
    const ligatureCount = Math.ceil(depthM / ((parseFloat(pier.ligatureSpacing) || 200) / 1000)) + 1;
    const ligaturePerimeter = Math.PI * diameterM * 0.9;
    totalRebarWeight += ligatureCount * ligaturePerimeter * ligatureWeight * qty;
  });

  const wastage = (parseFloat(data.wastagePercent) || 0) / 100;
  const volumeWithWastage = totalConcreteVolume * (1 + wastage);
  const concretePricePerM3 = parseFloat(data.concretePricePerM3) || 0;
  const concreteCost = volumeWithWastage * concretePricePerM3;

  const rebarPricePerKg = parseFloat(data.rebarPricePerKg) || 0;
  const rebarCost = totalRebarWeight * rebarPricePerKg;

  const materialsCost = concreteCost + rebarCost;
  const materialsMarkup = (parseFloat(data.materialsMarkupPercent) || 0) / 100;
  const materialsTotal = materialsCost * (1 + materialsMarkup);

  const labourHourlyRate = parseFloat(data.labourHourlyRate) || 0;
  const labourHoursPerPier = parseFloat(data.labourHoursPerPier) || 0;
  const labourCost = totalPierCount * labourHoursPerPier * labourHourlyRate;
  const labourMarkup = (parseFloat(data.labourMarkupPercent) || 0) / 100;
  const labourTotal = labourCost * (1 + labourMarkup);

  const grandTotal = materialsTotal + labourTotal;

  return {
    totalConcreteVolume,
    volumeWithWastage,
    concreteCost,
    totalRebarWeight,
    rebarCost,
    materialsCost,
    materialsTotal,
    labourCost,
    labourTotal,
    grandTotal,
    totalPierCount,
  };
}
