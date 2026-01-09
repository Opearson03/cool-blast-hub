import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Square, ShieldCheck, Users, DollarSign, Layers } from "lucide-react";
import {
  MPA_STRENGTHS,
  MESH_TYPES,
  POD_SIZES,
  formatCurrency,
  InternalCostNotice,
  CostSummaryCard,
} from "./shared";


export interface WafflePodData {
  slabArea: string;
  slabPerimeter: string;
  topSlabThickness: string;
  concreteStrength: string;
  concretePricePerM3: string;
  wastagePercent: string;
  meshType: string;
  meshPricePerSheet: string;
  meshOverlapPercent: string;
  podSize: string;
  podPriceEach: string;
  edgeBeamWidth: string;
  edgeBeamDepth: string;
  edgeBeamMesh: string;
  internalBeamWidth: string;
  internalBeamDepth: string;
  internalBeamSpacing: string;
  internalBeamMesh: string;
  polyMembrane: boolean;
  polyPricePerM2: string;
  labourHourlyRate: string;
  labourHoursPerM2: string;
  materialsMarkupPercent: string;
  labourMarkupPercent: string;
}

export const initialWafflePodData: WafflePodData = {
  slabArea: "",
  slabPerimeter: "",
  topSlabThickness: "85",
  concreteStrength: "25",
  concretePricePerM3: "280",
  wastagePercent: "5",
  meshType: "SL72",
  meshPricePerSheet: "55",
  meshOverlapPercent: "10",
  podSize: "1090x1090x110",
  podPriceEach: "8.50",
  edgeBeamWidth: "350",
  edgeBeamDepth: "300",
  edgeBeamMesh: "F72",
  internalBeamWidth: "110",
  internalBeamDepth: "300",
  internalBeamSpacing: "1090",
  internalBeamMesh: "F62",
  polyMembrane: true,
  polyPricePerM2: "2.50",
  labourHourlyRate: "85",
  labourHoursPerM2: "0.35",
  materialsMarkupPercent: "20",
  labourMarkupPercent: "30",
};

interface WafflePodCalculatorProps {
  data: WafflePodData;
  onChange: (data: WafflePodData) => void;
}

export function WafflePodCalculator({ data, onChange }: WafflePodCalculatorProps) {
  const updateField = (field: keyof WafflePodData, value: string | boolean) => {
    onChange({ ...data, [field]: value });
  };

  const calculations = useMemo(() => {
    const slabArea = parseFloat(data.slabArea) || 0;
    const perimeter = parseFloat(data.slabPerimeter) || 0;
    
    // Estimate dimensions for internal beam calculations (assuming roughly square)
    const estimatedSide = Math.sqrt(slabArea) || 1;

    // Parse pod size for calculations
    const podParts = data.podSize.split("x");
    const podWidth = parseInt(podParts[0]) || 1090;
    const podHeight = parseInt(podParts[2]) || 110;
    const podWidthM = podWidth / 1000;

    // Top slab volume
    const topThicknessM = (parseFloat(data.topSlabThickness) || 85) / 1000;
    const topSlabVolume = slabArea * topThicknessM;

    // Edge beam volume
    const edgeBeamWidthM = (parseFloat(data.edgeBeamWidth) || 350) / 1000;
    const edgeBeamDepthM = (parseFloat(data.edgeBeamDepth) || 300) / 1000;
    const edgeBeamVolume = perimeter * edgeBeamWidthM * edgeBeamDepthM;

    // Internal beams
    const internalBeamWidthM = (parseFloat(data.internalBeamWidth) || 110) / 1000;
    const internalBeamDepthM = (parseFloat(data.internalBeamDepth) || 300) / 1000;
    
    // Calculate number of internal beams (using estimated side for grid)
    const effectiveSide = estimatedSide - 2 * edgeBeamWidthM;
    const beamsPerDirection = Math.floor(effectiveSide / (podWidthM + internalBeamWidthM));
    
    // Approximate internal beam volume based on grid
    const internalBeamVolume = beamsPerDirection * 2 * estimatedSide * internalBeamWidthM * internalBeamDepthM;

    // Total concrete
    const totalConcreteVolume = topSlabVolume + edgeBeamVolume + internalBeamVolume;
    const wastage = (parseFloat(data.wastagePercent) || 0) / 100;
    const volumeWithWastage = totalConcreteVolume * (1 + wastage);
    const concretePricePerM3 = parseFloat(data.concretePricePerM3) || 0;
    const concreteCost = volumeWithWastage * concretePricePerM3;

    // Pods calculation (using estimated side for grid)
    const podsPerDirection = Math.floor(effectiveSide / podWidthM);
    const totalPods = podsPerDirection * podsPerDirection;
    const podPrice = parseFloat(data.podPriceEach) || 0;
    const podsCost = totalPods * podPrice;

    // Mesh calculation
    const meshOverlap = 1 + (parseFloat(data.meshOverlapPercent) || 0) / 100;
    const meshArea = slabArea * meshOverlap;
    const meshSheetArea = 14.4;
    const meshSheets = Math.ceil(meshArea / meshSheetArea);
    const meshPrice = parseFloat(data.meshPricePerSheet) || 0;
    const meshCost = meshSheets * meshPrice;

    // Poly membrane
    const polyCost = data.polyMembrane ? slabArea * (parseFloat(data.polyPricePerM2) || 0) : 0;

    // Materials total
    const materialsCost = concreteCost + podsCost + meshCost + polyCost;
    const materialsMarkup = (parseFloat(data.materialsMarkupPercent) || 0) / 100;
    const materialsTotal = materialsCost * (1 + materialsMarkup);

    // Labour
    const labourHourlyRate = parseFloat(data.labourHourlyRate) || 0;
    const labourHoursPerM2 = parseFloat(data.labourHoursPerM2) || 0;
    const labourHours = slabArea * labourHoursPerM2;
    const labourCost = labourHours * labourHourlyRate;
    const labourMarkup = (parseFloat(data.labourMarkupPercent) || 0) / 100;
    const labourTotal = labourCost * (1 + labourMarkup);

    const grandTotal = materialsTotal + labourTotal;

    return {
      slabArea,
      perimeter,
      totalConcreteVolume,
      volumeWithWastage,
      concreteCost,
      totalPods,
      podsCost,
      meshSheets,
      meshCost,
      polyCost,
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Slab Area (m²)</Label>
                <Input type="number" step="0.01" value={data.slabArea} onChange={(e) => updateField("slabArea", e.target.value)} placeholder="e.g. 180" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Perimeter (m)</Label>
                <Input type="number" step="0.1" value={data.slabPerimeter} onChange={(e) => updateField("slabPerimeter", e.target.value)} placeholder="e.g., 54" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Top Slab Thickness (mm)</Label>
                <Input type="number" value={data.topSlabThickness} onChange={(e) => updateField("topSlabThickness", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Concrete Strength</Label>
                <Select value={data.concreteStrength} onValueChange={(v) => updateField("concreteStrength", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MPA_STRENGTHS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {calculations.slabArea > 0 && (
              <div className="flex gap-3 mt-3">
                <Badge variant="secondary">Area: {calculations.slabArea.toFixed(1)}m²</Badge>
                <Badge variant="secondary">Perimeter: {calculations.perimeter.toFixed(1)}m</Badge>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Waffle Pods */}
        <AccordionItem value="pods" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span className="font-medium">Waffle Pods & Beams</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Pod Size</Label>
                <Select value={data.podSize} onValueChange={(v) => updateField("podSize", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {POD_SIZES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Price per Pod ($)</Label>
                <Input type="number" step="0.01" value={data.podPriceEach} onChange={(e) => updateField("podPriceEach", e.target.value)} />
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2">Edge Beams</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Width (mm)</Label>
                  <Input type="number" value={data.edgeBeamWidth} onChange={(e) => updateField("edgeBeamWidth", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Depth (mm)</Label>
                  <Input type="number" value={data.edgeBeamDepth} onChange={(e) => updateField("edgeBeamDepth", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Trench Mesh</Label>
                  <Input value={data.edgeBeamMesh} onChange={(e) => updateField("edgeBeamMesh", e.target.value)} placeholder="F72" />
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2">Internal Beams</p>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Width (mm)</Label>
                  <Input type="number" value={data.internalBeamWidth} onChange={(e) => updateField("internalBeamWidth", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Depth (mm)</Label>
                  <Input type="number" value={data.internalBeamDepth} onChange={(e) => updateField("internalBeamDepth", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Spacing (mm)</Label>
                  <Input type="number" value={data.internalBeamSpacing} onChange={(e) => updateField("internalBeamSpacing", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Trench Mesh</Label>
                  <Input value={data.internalBeamMesh} onChange={(e) => updateField("internalBeamMesh", e.target.value)} placeholder="F62" />
                </div>
              </div>
            </div>
            
            {calculations.totalPods > 0 && (
              <div className="flex gap-3 mt-3">
                <Badge variant="secondary">{calculations.totalPods} pods needed</Badge>
                <Badge variant="default">{formatCurrency(calculations.podsCost)}</Badge>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Materials */}
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
                <Label className="text-xs">Concrete ($/m³)</Label>
                <Input type="number" value={data.concretePricePerM3} onChange={(e) => updateField("concretePricePerM3", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Wastage (%)</Label>
                <Input type="number" value={data.wastagePercent} onChange={(e) => updateField("wastagePercent", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Top Mesh Type</Label>
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
            </div>
            <div className="flex items-center gap-4 mt-4">
              <Switch checked={data.polyMembrane} onCheckedChange={(v) => updateField("polyMembrane", v)} />
              <Label>Include poly membrane</Label>
              {data.polyMembrane && (
                <Input type="number" step="0.01" value={data.polyPricePerM2} onChange={(e) => updateField("polyPricePerM2", e.target.value)} className="w-24" placeholder="$/m²" />
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
                <Input type="number" step="0.01" value={data.labourHoursPerM2} onChange={(e) => updateField("labourHoursPerM2", e.target.value)} />
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
          { label: "Waffle Pods", value: calculations.podsCost, detail: `${calculations.totalPods}` },
          { label: "Mesh", value: calculations.meshCost, detail: `${calculations.meshSheets} sheets` },
          ...(data.polyMembrane ? [{ label: "Poly Membrane", value: calculations.polyCost }] : []),
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

export function calculateWafflePodTotals(data: WafflePodData) {
  const slabArea = parseFloat(data.slabArea) || 0;
  const perimeter = parseFloat(data.slabPerimeter) || 0;
  
  // Estimate dimensions for internal beam calculations (assuming roughly square)
  const estimatedSide = Math.sqrt(slabArea) || 1;

  const podParts = data.podSize.split("x");
  const podWidth = parseInt(podParts[0]) || 1090;
  const podWidthM = podWidth / 1000;

  const topThicknessM = (parseFloat(data.topSlabThickness) || 85) / 1000;
  const topSlabVolume = slabArea * topThicknessM;

  const edgeBeamWidthM = (parseFloat(data.edgeBeamWidth) || 350) / 1000;
  const edgeBeamDepthM = (parseFloat(data.edgeBeamDepth) || 300) / 1000;
  const edgeBeamVolume = perimeter * edgeBeamWidthM * edgeBeamDepthM;

  const internalBeamWidthM = (parseFloat(data.internalBeamWidth) || 110) / 1000;
  const internalBeamDepthM = (parseFloat(data.internalBeamDepth) || 300) / 1000;
  
  // Calculate number of internal beams (using estimated side for grid)
  const effectiveSide = estimatedSide - 2 * edgeBeamWidthM;
  const beamsPerDirection = Math.floor(effectiveSide / (podWidthM + internalBeamWidthM));
  
  // Approximate internal beam volume based on grid
  const internalBeamVolume = beamsPerDirection * 2 * estimatedSide * internalBeamWidthM * internalBeamDepthM;

  const totalConcreteVolume = topSlabVolume + edgeBeamVolume + internalBeamVolume;
  const wastage = (parseFloat(data.wastagePercent) || 0) / 100;
  const volumeWithWastage = totalConcreteVolume * (1 + wastage);
  const concretePricePerM3 = parseFloat(data.concretePricePerM3) || 0;
  const concreteCost = volumeWithWastage * concretePricePerM3;

  // Pods calculation (using estimated side for grid)
  const podsPerDirection = Math.floor(effectiveSide / podWidthM);
  const totalPods = podsPerDirection * podsPerDirection;
  const podPrice = parseFloat(data.podPriceEach) || 0;
  const podsCost = totalPods * podPrice;

  const meshOverlap = 1 + (parseFloat(data.meshOverlapPercent) || 0) / 100;
  const meshArea = slabArea * meshOverlap;
  const meshSheetArea = 14.4;
  const meshSheets = Math.ceil(meshArea / meshSheetArea);
  const meshPrice = parseFloat(data.meshPricePerSheet) || 0;
  const meshCost = meshSheets * meshPrice;

  const polyCost = data.polyMembrane ? slabArea * (parseFloat(data.polyPricePerM2) || 0) : 0;

  const materialsCost = concreteCost + podsCost + meshCost + polyCost;
  const materialsMarkup = (parseFloat(data.materialsMarkupPercent) || 0) / 100;
  const materialsTotal = materialsCost * (1 + materialsMarkup);

  const labourHourlyRate = parseFloat(data.labourHourlyRate) || 0;
  const labourHoursPerM2 = parseFloat(data.labourHoursPerM2) || 0;
  const labourHours = slabArea * labourHoursPerM2;
  const labourCost = labourHours * labourHourlyRate;
  const labourMarkup = (parseFloat(data.labourMarkupPercent) || 0) / 100;
  const labourTotal = labourCost * (1 + labourMarkup);

  const grandTotal = materialsTotal + labourTotal;

  return {
    slabArea,
    perimeter,
    totalConcreteVolume,
    volumeWithWastage,
    concreteCost,
    totalPods,
    podsCost,
    meshSheets,
    meshCost,
    polyCost,
    materialsCost,
    materialsTotal,
    labourHours,
    labourCost,
    labourTotal,
    grandTotal,
  };
}
