import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash2, EyeOff } from "lucide-react";

const MPA_STRENGTHS = ["20", "25", "32", "40"];
const MESH_TYPES = ["F62", "F72", "F82", "SL62", "SL72", "SL82"];
const REBAR_SIZES = ["N12", "N16", "N20", "N24"];

export interface RetainingFootingType {
  id: string;
  length: string;
  width: string;
  depth: string;
  bottomMesh: string;
  topReo: string;
  starterBars: string;
  starterBarSize: string;
  starterBarSpacing: string;
}

export interface RetainingWallData {
  footings: RetainingFootingType[];
  concreteStrength: string;
  concretePricePerM3: string;
  wastagePercent: string;
  meshPricePerSheet: string;
  rebarPricePerKg: string;
  labourHourlyRate: string;
  labourHoursPerM: string;
  materialsMarkupPercent: string;
  labourMarkupPercent: string;
}

export const initialRetainingWallData: RetainingWallData = {
  footings: [{ id: "1", length: "", width: "450", depth: "300", bottomMesh: "F72", topReo: "N12", starterBars: "true", starterBarSize: "N12", starterBarSpacing: "300" }],
  concreteStrength: "25",
  concretePricePerM3: "280",
  wastagePercent: "5",
  meshPricePerSheet: "18",
  rebarPricePerKg: "2.50",
  labourHourlyRate: "85",
  labourHoursPerM: "0.5",
  materialsMarkupPercent: "20",
  labourMarkupPercent: "30",
};

const createEmptyFooting = (): RetainingFootingType => ({
  id: Date.now().toString(),
  length: "",
  width: "450",
  depth: "300",
  bottomMesh: "F72",
  topReo: "N12",
  starterBars: "true",
  starterBarSize: "N12",
  starterBarSpacing: "300",
});

const REBAR_WEIGHT: Record<string, number> = {
  "N10": 0.617, "N12": 0.888, "N16": 1.58, "N20": 2.47, "N24": 3.55,
};

interface RetainingWallCalculatorProps {
  data: RetainingWallData;
  onChange: (data: RetainingWallData) => void;
}

export function RetainingWallCalculator({ data, onChange }: RetainingWallCalculatorProps) {
  const updateField = (field: keyof RetainingWallData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const updateFooting = (id: string, field: keyof RetainingFootingType, value: string) => {
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

  const calculations = useMemo(() => {
    let totalConcreteVolume = 0;
    let totalMeshLength = 0;
    let totalRebarWeight = 0;
    let totalLength = 0;

    data.footings.forEach(footing => {
      const length = parseFloat(footing.length) || 0;
      const widthM = (parseFloat(footing.width) || 0) / 1000;
      const depthM = (parseFloat(footing.depth) || 0) / 1000;
      
      totalConcreteVolume += length * widthM * depthM;
      totalLength += length;
      totalMeshLength += length; // One mesh run per footing

      // Top rebar
      const topRebarWeight = REBAR_WEIGHT[footing.topReo] || 0;
      totalRebarWeight += length * topRebarWeight * 2; // 2 bars typically

      // Starter bars
      if (footing.starterBars === "true") {
        const starterSpacing = (parseFloat(footing.starterBarSpacing) || 300) / 1000;
        const starterCount = Math.ceil(length / starterSpacing) + 1;
        const starterWeight = REBAR_WEIGHT[footing.starterBarSize] || 0;
        const starterLength = 0.9; // 900mm typical starter
        totalRebarWeight += starterCount * starterLength * starterWeight;
      }
    });

    const wastage = (parseFloat(data.wastagePercent) || 0) / 100;
    const volumeWithWastage = totalConcreteVolume * (1 + wastage);
    const concretePricePerM3 = parseFloat(data.concretePricePerM3) || 0;
    const concreteCost = volumeWithWastage * concretePricePerM3;

    // Mesh cost (trench mesh is ~6m per sheet)
    const meshSheetsNeeded = Math.ceil(totalMeshLength / 6);
    const meshPrice = parseFloat(data.meshPricePerSheet) || 0;
    const meshCost = meshSheetsNeeded * meshPrice;

    const rebarPricePerKg = parseFloat(data.rebarPricePerKg) || 0;
    const rebarCost = totalRebarWeight * rebarPricePerKg;

    const materialsCost = concreteCost + meshCost + rebarCost;
    const materialsMarkup = (parseFloat(data.materialsMarkupPercent) || 0) / 100;
    const materialsTotal = materialsCost * (1 + materialsMarkup);

    const labourHourlyRate = parseFloat(data.labourHourlyRate) || 0;
    const labourHoursPerM = parseFloat(data.labourHoursPerM) || 0;
    const labourHours = totalLength * labourHoursPerM;
    const labourCost = labourHours * labourHourlyRate;
    const labourMarkup = (parseFloat(data.labourMarkupPercent) || 0) / 100;
    const labourTotal = labourCost * (1 + labourMarkup);

    const grandTotal = materialsTotal + labourTotal;

    return {
      totalConcreteVolume,
      volumeWithWastage,
      concreteCost,
      meshSheetsNeeded,
      meshCost,
      totalRebarWeight,
      rebarCost,
      materialsCost,
      materialsTotal,
      labourHours,
      labourCost,
      labourTotal,
      grandTotal,
      totalLength,
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

      {/* Footing Types */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Retaining Wall Footings</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addFooting}>
              <Plus className="w-4 h-4 mr-1" /> Add Footing
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Accordion type="multiple" defaultValue={["footing-0"]}>
            {data.footings.map((footing, index) => (
              <AccordionItem key={footing.id} value={`footing-${index}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span>Footing {index + 1}</span>
                    {footing.length && (
                      <Badge variant="secondary">{footing.length}m × {footing.width}mm × {footing.depth}mm</Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Length (m)</Label>
                      <Input type="number" step="0.1" value={footing.length} onChange={(e) => updateFooting(footing.id, "length", e.target.value)} placeholder="e.g., 8" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Width (mm)</Label>
                      <Input type="number" value={footing.width} onChange={(e) => updateFooting(footing.id, "width", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Depth (mm)</Label>
                      <Input type="number" value={footing.depth} onChange={(e) => updateFooting(footing.id, "depth", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Bottom Mesh</Label>
                      <Select value={footing.bottomMesh} onValueChange={(v) => updateFooting(footing.id, "bottomMesh", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {MESH_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Top Reo</Label>
                      <Select value={footing.topReo} onValueChange={(v) => updateFooting(footing.id, "topReo", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {REBAR_SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Starter Bars?</Label>
                      <Select value={footing.starterBars} onValueChange={(v) => updateFooting(footing.id, "starterBars", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {footing.starterBars === "true" && (
                      <>
                        <div className="space-y-1">
                          <Label className="text-xs">Starter Size</Label>
                          <Select value={footing.starterBarSize} onValueChange={(v) => updateFooting(footing.id, "starterBarSize", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {REBAR_SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Starter Spacing (mm)</Label>
                          <Input type="number" value={footing.starterBarSpacing} onChange={(e) => updateFooting(footing.id, "starterBarSpacing", e.target.value)} />
                        </div>
                      </>
                    )}
                    <div className="flex items-end">
                      {data.footings.length > 1 && (
                        <Button type="button" variant="destructive" size="sm" onClick={() => removeFooting(footing.id)}>
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

      {/* Materials Pricing */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Materials Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Concrete Strength</Label>
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
              <Label className="text-xs">Mesh ($/sheet)</Label>
              <Input type="number" value={data.meshPricePerSheet} onChange={(e) => updateField("meshPricePerSheet", e.target.value)} />
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
              <Label className="text-xs">Hours per Metre</Label>
              <Input type="number" step="0.1" value={data.labourHoursPerM} onChange={(e) => updateField("labourHoursPerM", e.target.value)} />
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
            <span className="text-muted-foreground">Total Length</span>
            <span>{calculations.totalLength.toFixed(1)}m</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Concrete ({calculations.volumeWithWastage.toFixed(2)}m³)</span>
            <span>{formatCurrency(calculations.concreteCost)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Mesh ({calculations.meshSheetsNeeded} sheets)</span>
            <span>{formatCurrency(calculations.meshCost)}</span>
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
            <span>Labour ({calculations.labourHours.toFixed(1)}hrs, inc. {data.labourMarkupPercent}% markup)</span>
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

export function calculateRetainingWallTotals(data: RetainingWallData) {
  let totalConcreteVolume = 0;
  let totalMeshLength = 0;
  let totalRebarWeight = 0;
  let totalLength = 0;

  const REBAR_WEIGHT: Record<string, number> = {
    "N10": 0.617, "N12": 0.888, "N16": 1.58, "N20": 2.47, "N24": 3.55,
  };

  data.footings.forEach(footing => {
    const length = parseFloat(footing.length) || 0;
    const widthM = (parseFloat(footing.width) || 0) / 1000;
    const depthM = (parseFloat(footing.depth) || 0) / 1000;
    
    totalConcreteVolume += length * widthM * depthM;
    totalLength += length;
    totalMeshLength += length;

    const topRebarWeight = REBAR_WEIGHT[footing.topReo] || 0;
    totalRebarWeight += length * topRebarWeight * 2;

    if (footing.starterBars === "true") {
      const starterSpacing = (parseFloat(footing.starterBarSpacing) || 300) / 1000;
      const starterCount = Math.ceil(length / starterSpacing) + 1;
      const starterWeight = REBAR_WEIGHT[footing.starterBarSize] || 0;
      const starterLength = 0.9;
      totalRebarWeight += starterCount * starterLength * starterWeight;
    }
  });

  const wastage = (parseFloat(data.wastagePercent) || 0) / 100;
  const volumeWithWastage = totalConcreteVolume * (1 + wastage);
  const concretePricePerM3 = parseFloat(data.concretePricePerM3) || 0;
  const concreteCost = volumeWithWastage * concretePricePerM3;

  const meshSheetsNeeded = Math.ceil(totalMeshLength / 6);
  const meshPrice = parseFloat(data.meshPricePerSheet) || 0;
  const meshCost = meshSheetsNeeded * meshPrice;

  const rebarPricePerKg = parseFloat(data.rebarPricePerKg) || 0;
  const rebarCost = totalRebarWeight * rebarPricePerKg;

  const materialsCost = concreteCost + meshCost + rebarCost;
  const materialsMarkup = (parseFloat(data.materialsMarkupPercent) || 0) / 100;
  const materialsTotal = materialsCost * (1 + materialsMarkup);

  const labourHourlyRate = parseFloat(data.labourHourlyRate) || 0;
  const labourHoursPerM = parseFloat(data.labourHoursPerM) || 0;
  const labourHours = totalLength * labourHoursPerM;
  const labourCost = labourHours * labourHourlyRate;
  const labourMarkup = (parseFloat(data.labourMarkupPercent) || 0) / 100;
  const labourTotal = labourCost * (1 + labourMarkup);

  const grandTotal = materialsTotal + labourTotal;

  return {
    totalConcreteVolume,
    volumeWithWastage,
    concreteCost,
    meshSheetsNeeded,
    meshCost,
    totalRebarWeight,
    rebarCost,
    materialsCost,
    materialsTotal,
    labourHours,
    labourCost,
    labourTotal,
    grandTotal,
    totalLength,
  };
}
