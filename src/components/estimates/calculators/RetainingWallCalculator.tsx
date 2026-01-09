import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Trash2, Square, ShieldCheck, Users } from "lucide-react";
import {
  MPA_STRENGTHS,
  TRENCH_MESH_TYPES,
  REBAR_SIZES,
  REBAR_WEIGHT,
  formatCurrency,
  InternalCostNotice,
  CostSummaryCard,
} from "./shared";

const MESH_TYPES_FOR_WALLS = ["F62", "F72", "F82", "SL62", "SL72", "SL82"];
const REBAR_SIZES_FOR_WALLS = ["N12", "N16", "N20", "N24"];

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
      totalMeshLength += length;

      // Top rebar
      const topRebarWeight = REBAR_WEIGHT[footing.topReo] || 0;
      totalRebarWeight += length * topRebarWeight * 2;

      // Starter bars
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

  return (
    <div className="space-y-4">
      <InternalCostNotice />

      <Accordion type="multiple" defaultValue={["footings"]} className="space-y-2">
        {/* Footing Types */}
        <AccordionItem value="footings" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Square className="w-4 h-4 text-primary" />
              <span className="font-medium">Retaining Wall Footings</span>
              <Badge variant="secondary" className="ml-2">{data.footings.length}</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="flex justify-end mb-3">
              <Button type="button" variant="outline" size="sm" onClick={addFooting}>
                <Plus className="w-4 h-4 mr-1" /> Add Footing
              </Button>
            </div>
            <Accordion type="multiple">
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
                            {MESH_TYPES_FOR_WALLS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Top Reo</Label>
                        <Select value={footing.topReo} onValueChange={(v) => updateFooting(footing.id, "topReo", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {REBAR_SIZES_FOR_WALLS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
                                {REBAR_SIZES_FOR_WALLS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
          </AccordionContent>
        </AccordionItem>

        {/* Materials Pricing */}
        <AccordionItem value="materials" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="font-medium">Materials Pricing</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Concrete Strength</Label>
                <Select value={data.concreteStrength} onValueChange={(v) => updateField("concreteStrength", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MPA_STRENGTHS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
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
          </AccordionContent>
        </AccordionItem>

        {/* Labour & Markup */}
        <AccordionItem value="labour" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="font-medium">Labour & Markup</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Cost Summary */}
      <CostSummaryCard
        materialItems={[
          { label: "Total Length", value: 0, detail: `${calculations.totalLength.toFixed(1)}m` },
          { label: "Concrete", value: calculations.concreteCost, detail: `${calculations.volumeWithWastage.toFixed(2)}m³` },
          { label: "Mesh", value: calculations.meshCost, detail: `${calculations.meshSheetsNeeded} sheets` },
          { label: "Reinforcement", value: calculations.rebarCost, detail: `${calculations.totalRebarWeight.toFixed(1)}kg` },
        ].filter(item => item.value > 0 || item.label === "Total Length")}
        materialsMarkupPercent={data.materialsMarkupPercent}
        materialsTotal={calculations.materialsTotal}
        labourItems={[
          { label: "Labour", value: calculations.labourCost, detail: `${calculations.labourHours.toFixed(1)}hrs` },
        ]}
        labourMarkupPercent={data.labourMarkupPercent}
        labourTotal={calculations.labourTotal}
        grandTotal={calculations.grandTotal}
      />
    </div>
  );
}

export function calculateRetainingWallTotals(data: RetainingWallData) {
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
