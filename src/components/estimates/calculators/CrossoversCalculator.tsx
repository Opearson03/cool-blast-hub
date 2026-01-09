import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Trash2, Square, ShieldCheck, Users, Building } from "lucide-react";
import {
  MPA_STRENGTHS,
  MESH_TYPES,
  MESH_SHEET_AREA,
  formatCurrency,
  InternalCostNotice,
  CostSummaryCard,
} from "./shared";

export interface CrossoverType {
  id: string;
  length: string;
  width: string;
  thickness: string;
}

export interface CrossoversData {
  crossovers: CrossoverType[];
  concreteStrength: string;
  concretePricePerM3: string;
  wastagePercent: string;
  meshType: string;
  meshPricePerSheet: string;
  formworkPricePerM: string;
  councilInspectionFee: string;
  requiresCouncilInspection: boolean;
  labourHourlyRate: string;
  labourHoursPerM2: string;
  materialsMarkupPercent: string;
  labourMarkupPercent: string;
}

export const initialCrossoversData: CrossoversData = {
  crossovers: [{ id: "1", length: "", width: "3", thickness: "150" }],
  concreteStrength: "32",
  concretePricePerM3: "300",
  wastagePercent: "5",
  meshType: "SL82",
  meshPricePerSheet: "70",
  formworkPricePerM: "15",
  councilInspectionFee: "250",
  requiresCouncilInspection: true,
  labourHourlyRate: "85",
  labourHoursPerM2: "0.5",
  materialsMarkupPercent: "20",
  labourMarkupPercent: "30",
};

const createEmptyCrossover = (): CrossoverType => ({
  id: Date.now().toString(),
  length: "",
  width: "3",
  thickness: "150",
});

interface CrossoversCalculatorProps {
  data: CrossoversData;
  onChange: (data: CrossoversData) => void;
}

export function CrossoversCalculator({ data, onChange }: CrossoversCalculatorProps) {
  const updateField = (field: keyof CrossoversData, value: string | boolean) => {
    onChange({ ...data, [field]: value });
  };

  const updateCrossover = (id: string, field: keyof CrossoverType, value: string) => {
    onChange({
      ...data,
      crossovers: data.crossovers.map(c => c.id === id ? { ...c, [field]: value } : c),
    });
  };

  const addCrossover = () => {
    onChange({ ...data, crossovers: [...data.crossovers, createEmptyCrossover()] });
  };

  const removeCrossover = (id: string) => {
    if (data.crossovers.length > 1) {
      onChange({ ...data, crossovers: data.crossovers.filter(c => c.id !== id) });
    }
  };

  const calculations = useMemo(() => {
    let totalArea = 0;
    let totalVolume = 0;
    let totalPerimeter = 0;

    data.crossovers.forEach(crossover => {
      const length = parseFloat(crossover.length) || 0;
      const width = parseFloat(crossover.width) || 0;
      const thicknessM = (parseFloat(crossover.thickness) || 0) / 1000;
      
      const area = length * width;
      totalArea += area;
      totalVolume += area * thicknessM;
      totalPerimeter += 2 * (length + width);
    });

    const wastage = (parseFloat(data.wastagePercent) || 0) / 100;
    const volumeWithWastage = totalVolume * (1 + wastage);
    const concretePricePerM3 = parseFloat(data.concretePricePerM3) || 0;
    const concreteCost = volumeWithWastage * concretePricePerM3;

    // Mesh calculation
    const meshSheets = Math.ceil(totalArea * 1.1 / MESH_SHEET_AREA);
    const meshPrice = parseFloat(data.meshPricePerSheet) || 0;
    const meshCost = meshSheets * meshPrice;

    // Formwork
    const formworkPrice = parseFloat(data.formworkPricePerM) || 0;
    const formworkCost = totalPerimeter * formworkPrice;

    // Council fee
    const councilFee = data.requiresCouncilInspection ? (parseFloat(data.councilInspectionFee) || 0) : 0;

    const materialsCost = concreteCost + meshCost + formworkCost + councilFee;
    const materialsMarkup = (parseFloat(data.materialsMarkupPercent) || 0) / 100;
    const materialsTotal = materialsCost * (1 + materialsMarkup);

    const labourHourlyRate = parseFloat(data.labourHourlyRate) || 0;
    const labourHoursPerM2 = parseFloat(data.labourHoursPerM2) || 0;
    const labourHours = totalArea * labourHoursPerM2;
    const labourCost = labourHours * labourHourlyRate;
    const labourMarkup = (parseFloat(data.labourMarkupPercent) || 0) / 100;
    const labourTotal = labourCost * (1 + labourMarkup);

    const grandTotal = materialsTotal + labourTotal;

    return {
      totalArea,
      totalVolume,
      volumeWithWastage,
      concreteCost,
      totalPerimeter,
      meshSheets,
      meshCost,
      formworkCost,
      councilFee,
      materialsCost,
      materialsTotal,
      labourHours,
      labourCost,
      labourTotal,
      grandTotal,
    };
  }, [data]);

  return (
    <div className="space-y-4">
      <InternalCostNotice />

      <Accordion type="multiple" defaultValue={["crossovers"]} className="space-y-2">
        {/* Crossovers */}
        <AccordionItem value="crossovers" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Square className="w-4 h-4 text-primary" />
              <span className="font-medium">Crossovers</span>
              <Badge variant="secondary" className="ml-2">{data.crossovers.length}</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="flex justify-end mb-3">
              <Button type="button" variant="outline" size="sm" onClick={addCrossover}>
                <Plus className="w-4 h-4 mr-1" /> Add Crossover
              </Button>
            </div>
            <Accordion type="multiple">
              {data.crossovers.map((crossover, index) => (
                <AccordionItem key={crossover.id} value={`crossover-${index}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span>Crossover {index + 1}</span>
                      {crossover.length && (
                        <Badge variant="secondary">{crossover.length}m × {crossover.width}m × {crossover.thickness}mm</Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Length (m)</Label>
                        <Input type="number" step="0.1" value={crossover.length} onChange={(e) => updateCrossover(crossover.id, "length", e.target.value)} placeholder="e.g., 6" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Width (m)</Label>
                        <Input type="number" step="0.1" value={crossover.width} onChange={(e) => updateCrossover(crossover.id, "width", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Thickness (mm)</Label>
                        <Input type="number" value={crossover.thickness} onChange={(e) => updateCrossover(crossover.id, "thickness", e.target.value)} />
                      </div>
                      <div className="flex items-end">
                        {data.crossovers.length > 1 && (
                          <Button type="button" variant="destructive" size="sm" onClick={() => removeCrossover(crossover.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            {calculations.totalArea > 0 && (
              <div className="flex gap-3 mt-3">
                <Badge variant="secondary">Total Area: {calculations.totalArea.toFixed(1)}m²</Badge>
                <Badge variant="secondary">Volume: {calculations.volumeWithWastage.toFixed(2)}m³</Badge>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Council Requirements */}
        <AccordionItem value="council" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-primary" />
              <span className="font-medium">Council Requirements</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="flex items-center gap-4">
              <Switch checked={data.requiresCouncilInspection} onCheckedChange={(v) => updateField("requiresCouncilInspection", v)} />
              <Label>Council inspection required</Label>
              {data.requiresCouncilInspection && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Fee ($)</Label>
                  <Input type="number" value={data.councilInspectionFee} onChange={(e) => updateField("councilInspectionFee", e.target.value)} className="w-24" />
                </div>
              )}
            </div>
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                <Label className="text-xs">Mesh Type</Label>
                <Select value={data.meshType} onValueChange={(v) => updateField("meshType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MESH_TYPES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Mesh ($/sheet)</Label>
                <Input type="number" value={data.meshPricePerSheet} onChange={(e) => updateField("meshPricePerSheet", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Formwork ($/m)</Label>
                <Input type="number" value={data.formworkPricePerM} onChange={(e) => updateField("formworkPricePerM", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Wastage (%)</Label>
                <Input type="number" value={data.wastagePercent} onChange={(e) => updateField("wastagePercent", e.target.value)} />
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
                <Label className="text-xs">Hours per m²</Label>
                <Input type="number" step="0.1" value={data.labourHoursPerM2} onChange={(e) => updateField("labourHoursPerM2", e.target.value)} />
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
          { label: "Concrete", value: calculations.concreteCost, detail: `${calculations.volumeWithWastage.toFixed(2)}m³` },
          { label: "Mesh", value: calculations.meshCost, detail: `${calculations.meshSheets} sheets` },
          { label: "Formwork", value: calculations.formworkCost, detail: `${calculations.totalPerimeter.toFixed(1)}m` },
          ...(data.requiresCouncilInspection ? [{ label: "Council Inspection", value: calculations.councilFee }] : []),
        ]}
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

export function calculateCrossoversTotals(data: CrossoversData) {
  let totalArea = 0;
  let totalVolume = 0;
  let totalPerimeter = 0;

  data.crossovers.forEach(crossover => {
    const length = parseFloat(crossover.length) || 0;
    const width = parseFloat(crossover.width) || 0;
    const thicknessM = (parseFloat(crossover.thickness) || 0) / 1000;
    
    const area = length * width;
    totalArea += area;
    totalVolume += area * thicknessM;
    totalPerimeter += 2 * (length + width);
  });

  const wastage = (parseFloat(data.wastagePercent) || 0) / 100;
  const volumeWithWastage = totalVolume * (1 + wastage);
  const concretePricePerM3 = parseFloat(data.concretePricePerM3) || 0;
  const concreteCost = volumeWithWastage * concretePricePerM3;

  const meshSheets = Math.ceil(totalArea * 1.1 / MESH_SHEET_AREA);
  const meshPrice = parseFloat(data.meshPricePerSheet) || 0;
  const meshCost = meshSheets * meshPrice;

  const formworkPrice = parseFloat(data.formworkPricePerM) || 0;
  const formworkCost = totalPerimeter * formworkPrice;

  const councilFee = data.requiresCouncilInspection ? (parseFloat(data.councilInspectionFee) || 0) : 0;

  const materialsCost = concreteCost + meshCost + formworkCost + councilFee;
  const materialsMarkup = (parseFloat(data.materialsMarkupPercent) || 0) / 100;
  const materialsTotal = materialsCost * (1 + materialsMarkup);

  const labourHourlyRate = parseFloat(data.labourHourlyRate) || 0;
  const labourHoursPerM2 = parseFloat(data.labourHoursPerM2) || 0;
  const labourHours = totalArea * labourHoursPerM2;
  const labourCost = labourHours * labourHourlyRate;
  const labourMarkup = (parseFloat(data.labourMarkupPercent) || 0) / 100;
  const labourTotal = labourCost * (1 + labourMarkup);

  const grandTotal = materialsTotal + labourTotal;

  return {
    totalArea,
    totalVolume,
    volumeWithWastage,
    concreteCost,
    totalPerimeter,
    meshSheets,
    meshCost,
    formworkCost,
    councilFee,
    materialsCost,
    materialsTotal,
    labourHours,
    labourCost,
    labourTotal,
    grandTotal,
  };
}
