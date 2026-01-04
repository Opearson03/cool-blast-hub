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

const MPA_STRENGTHS = ["25", "32", "40"];
const MESH_TYPES = ["SL72", "SL82", "SL92", "SL102"];

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
    const meshSheetArea = 14.4;
    const meshSheets = Math.ceil(totalArea * 1.1 / meshSheetArea); // 10% overlap
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

      {/* Crossovers */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Crossovers</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addCrossover}>
              <Plus className="w-4 h-4 mr-1" /> Add Crossover
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Accordion type="multiple" defaultValue={["crossover-0"]}>
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
            <div className="flex gap-3">
              <Badge variant="secondary">Total Area: {calculations.totalArea.toFixed(1)}m²</Badge>
              <Badge variant="secondary">Volume: {calculations.volumeWithWastage.toFixed(2)}m³</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Council Requirements */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Council Requirements</CardTitle>
        </CardHeader>
        <CardContent>
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
          {data.requiresCouncilInspection && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Council Inspection</span>
              <span>{formatCurrency(calculations.councilFee)}</span>
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

  const meshSheetArea = 14.4;
  const meshSheets = Math.ceil(totalArea * 1.1 / meshSheetArea);
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
