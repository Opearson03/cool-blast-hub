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
import { Plus, Trash2, Square, ShieldCheck, Users } from "lucide-react";
import {
  MPA_STRENGTHS,
  MESH_TYPES,
  MESH_SHEET_AREA,
  formatCurrency,
  InternalCostNotice,
  CostSummaryCard,
} from "./shared";

export interface PathSection {
  id: string;
  name: string;
  length: string;
  width: string;
  thickness: string;
}

export interface PathsSurroundsData {
  sections: PathSection[];
  concreteStrength: string;
  concretePricePerM3: string;
  wastagePercent: string;
  meshType: string;
  meshPricePerSheet: string;
  formworkPricePerM: string;
  includeSealing: boolean;
  sealingPricePerM2: string;
  labourHourlyRate: string;
  labourHoursPerM2: string;
  materialsMarkupPercent: string;
  labourMarkupPercent: string;
}

export const initialPathsSurroundsData: PathsSurroundsData = {
  sections: [{ id: "1", name: "Path 1", length: "", width: "1.2", thickness: "100" }],
  concreteStrength: "25",
  concretePricePerM3: "280",
  wastagePercent: "5",
  meshType: "SL72",
  meshPricePerSheet: "55",
  formworkPricePerM: "12",
  includeSealing: false,
  sealingPricePerM2: "8",
  labourHourlyRate: "85",
  labourHoursPerM2: "0.4",
  materialsMarkupPercent: "20",
  labourMarkupPercent: "30",
};

const createEmptySection = (): PathSection => ({
  id: Date.now().toString(),
  name: `Path ${Date.now()}`,
  length: "",
  width: "1.2",
  thickness: "100",
});

interface PathsSurroundsCalculatorProps {
  data: PathsSurroundsData;
  onChange: (data: PathsSurroundsData) => void;
}

export function PathsSurroundsCalculator({ data, onChange }: PathsSurroundsCalculatorProps) {
  const updateField = (field: keyof PathsSurroundsData, value: string | boolean) => {
    onChange({ ...data, [field]: value });
  };

  const updateSection = (id: string, field: keyof PathSection, value: string) => {
    onChange({
      ...data,
      sections: data.sections.map(s => s.id === id ? { ...s, [field]: value } : s),
    });
  };

  const addSection = () => {
    onChange({ ...data, sections: [...data.sections, createEmptySection()] });
  };

  const removeSection = (id: string) => {
    if (data.sections.length > 1) {
      onChange({ ...data, sections: data.sections.filter(s => s.id !== id) });
    }
  };

  const calculations = useMemo(() => {
    let totalArea = 0;
    let totalVolume = 0;
    let totalPerimeter = 0;

    data.sections.forEach(section => {
      const length = parseFloat(section.length) || 0;
      const width = parseFloat(section.width) || 0;
      const thicknessM = (parseFloat(section.thickness) || 0) / 1000;
      
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

    // Sealing
    const sealingCost = data.includeSealing ? totalArea * (parseFloat(data.sealingPricePerM2) || 0) : 0;

    const materialsCost = concreteCost + meshCost + formworkCost + sealingCost;
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
      sealingCost,
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

      <Accordion type="multiple" defaultValue={["sections"]} className="space-y-2">
        {/* Path Sections */}
        <AccordionItem value="sections" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Square className="w-4 h-4 text-primary" />
              <span className="font-medium">Path & Surround Sections</span>
              <Badge variant="secondary" className="ml-2">{data.sections.length}</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="flex justify-end mb-3">
              <Button type="button" variant="outline" size="sm" onClick={addSection}>
                <Plus className="w-4 h-4 mr-1" /> Add Section
              </Button>
            </div>
            <Accordion type="multiple">
              {data.sections.map((section, index) => (
                <AccordionItem key={section.id} value={`section-${index}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span>Section {index + 1}</span>
                      {section.length && (
                        <Badge variant="secondary">{section.length}m × {section.width}m × {section.thickness}mm</Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Name</Label>
                        <Input value={section.name} onChange={(e) => updateSection(section.id, "name", e.target.value)} placeholder="e.g., Front path" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Length (m)</Label>
                        <Input type="number" step="0.1" value={section.length} onChange={(e) => updateSection(section.id, "length", e.target.value)} placeholder="e.g., 10" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Width (m)</Label>
                        <Input type="number" step="0.1" value={section.width} onChange={(e) => updateSection(section.id, "width", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Thickness (mm)</Label>
                        <Input type="number" value={section.thickness} onChange={(e) => updateSection(section.id, "thickness", e.target.value)} />
                      </div>
                      <div className="flex items-end">
                        {data.sections.length > 1 && (
                          <Button type="button" variant="destructive" size="sm" onClick={() => removeSection(section.id)}>
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

        {/* Materials Pricing */}
        <AccordionItem value="materials" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="font-medium">Materials Pricing</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
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
            <div className="flex items-center gap-4 pt-2">
              <Switch checked={data.includeSealing} onCheckedChange={(v) => updateField("includeSealing", v)} />
              <Label>Include sealing</Label>
              {data.includeSealing && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs">$/m²</Label>
                  <Input type="number" step="0.01" value={data.sealingPricePerM2} onChange={(e) => updateField("sealingPricePerM2", e.target.value)} className="w-20" />
                </div>
              )}
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
          ...(data.includeSealing ? [{ label: "Sealing", value: calculations.sealingCost, detail: `${calculations.totalArea.toFixed(1)}m²` }] : []),
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

export function calculatePathsSurroundsTotals(data: PathsSurroundsData) {
  let totalArea = 0;
  let totalVolume = 0;
  let totalPerimeter = 0;

  data.sections.forEach(section => {
    const length = parseFloat(section.length) || 0;
    const width = parseFloat(section.width) || 0;
    const thicknessM = (parseFloat(section.thickness) || 0) / 1000;
    
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

  const sealingCost = data.includeSealing ? totalArea * (parseFloat(data.sealingPricePerM2) || 0) : 0;

  const materialsCost = concreteCost + meshCost + formworkCost + sealingCost;
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
    sealingCost,
    materialsCost,
    materialsTotal,
    labourHours,
    labourCost,
    labourTotal,
    grandTotal,
  };
}
