import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash2, EyeOff } from "lucide-react";

const MPA_STRENGTHS = ["20", "25", "32"];
const MESH_TYPES = ["SL62", "SL72", "SL82"];

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
    const meshSheetArea = 14.4;
    const meshSheets = Math.ceil(totalArea * 1.1 / meshSheetArea);
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

      {/* Path Sections */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Path & Surround Sections</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addSection}>
              <Plus className="w-4 h-4 mr-1" /> Add Section
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Accordion type="multiple" defaultValue={["section-0"]}>
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
            <div className="flex gap-3">
              <Badge variant="secondary">Total Area: {calculations.totalArea.toFixed(1)}m²</Badge>
              <Badge variant="secondary">Volume: {calculations.volumeWithWastage.toFixed(2)}m³</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Materials Pricing */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Materials Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <Label className="text-xs">Mesh Type</Label>
              <Select value={data.meshType} onValueChange={(v) => updateField("meshType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MESH_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
        </CardContent>
      </Card>

      {/* Cost Summary */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cost Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Concrete ({calculations.volumeWithWastage.toFixed(2)}m³)</span>
            <span>{formatCurrency(calculations.concreteCost)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Mesh ({calculations.meshSheets} sheets)</span>
            <span>{formatCurrency(calculations.meshCost)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Formwork ({calculations.totalPerimeter.toFixed(1)}m)</span>
            <span>{formatCurrency(calculations.formworkCost)}</span>
          </div>
          {data.includeSealing && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sealing ({calculations.totalArea.toFixed(1)}m²)</span>
              <span>{formatCurrency(calculations.sealingCost)}</span>
            </div>
          )}
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

  const meshSheetArea = 14.4;
  const meshSheets = Math.ceil(totalArea * 1.1 / meshSheetArea);
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
