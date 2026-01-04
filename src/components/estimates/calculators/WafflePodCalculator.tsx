import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { EyeOff } from "lucide-react";

const MPA_STRENGTHS = ["20", "25", "32", "40"];
const MESH_TYPES = ["SL62", "SL72", "SL82", "SL92", "SL102"];
const POD_SIZES = ["1090x1090x110", "1090x1090x150", "1090x1090x225", "1090x1090x300"];

export interface WafflePodData {
  slabLength: string;
  slabWidth: string;
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
  slabLength: "",
  slabWidth: "",
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
    const length = parseFloat(data.slabLength) || 0;
    const width = parseFloat(data.slabWidth) || 0;
    const slabArea = length * width;
    const perimeter = 2 * (length + width);

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
    const internalBeamSpacingM = (parseFloat(data.internalBeamSpacing) || 1090) / 1000;
    
    // Calculate number of internal beams
    const effectiveWidth = width - 2 * edgeBeamWidthM;
    const effectiveLength = length - 2 * edgeBeamWidthM;
    const beamsAlongLength = Math.floor(effectiveLength / (podWidthM + internalBeamWidthM));
    const beamsAlongWidth = Math.floor(effectiveWidth / (podWidthM + internalBeamWidthM));
    
    const lengthwiseBeamsVolume = beamsAlongLength * width * internalBeamWidthM * internalBeamDepthM;
    const widthwiseBeamsVolume = beamsAlongWidth * length * internalBeamWidthM * internalBeamDepthM;
    const internalBeamVolume = lengthwiseBeamsVolume + widthwiseBeamsVolume;

    // Total concrete
    const totalConcreteVolume = topSlabVolume + edgeBeamVolume + internalBeamVolume;
    const wastage = (parseFloat(data.wastagePercent) || 0) / 100;
    const volumeWithWastage = totalConcreteVolume * (1 + wastage);
    const concretePricePerM3 = parseFloat(data.concretePricePerM3) || 0;
    const concreteCost = volumeWithWastage * concretePricePerM3;

    // Pods calculation
    const podsAlongLength = Math.floor(effectiveLength / podWidthM);
    const podsAlongWidth = Math.floor(effectiveWidth / podWidthM);
    const totalPods = podsAlongLength * podsAlongWidth;
    const podPrice = parseFloat(data.podPriceEach) || 0;
    const podsCost = totalPods * podPrice;

    // Mesh calculation
    const meshOverlap = 1 + (parseFloat(data.meshOverlapPercent) || 0) / 100;
    const meshArea = slabArea * meshOverlap;
    const meshSheetArea = 14.4; // Standard 6m x 2.4m
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

      {/* Slab Dimensions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Slab Dimensions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Length (m)</Label>
              <Input type="number" step="0.1" value={data.slabLength} onChange={(e) => updateField("slabLength", e.target.value)} placeholder="e.g., 15" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Width (m)</Label>
              <Input type="number" step="0.1" value={data.slabWidth} onChange={(e) => updateField("slabWidth", e.target.value)} placeholder="e.g., 12" />
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
                  {MPA_STRENGTHS.map(s => <SelectItem key={s} value={s}>{s} MPa</SelectItem>)}
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
        </CardContent>
      </Card>

      {/* Waffle Pods */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Waffle Pods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Pod Size</Label>
              <Select value={data.podSize} onValueChange={(v) => updateField("podSize", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {POD_SIZES.map(s => <SelectItem key={s} value={s}>{s}mm</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Price per Pod ($)</Label>
              <Input type="number" step="0.01" value={data.podPriceEach} onChange={(e) => updateField("podPriceEach", e.target.value)} />
            </div>
          </div>
          {calculations.totalPods > 0 && (
            <div className="flex gap-3 mt-3">
              <Badge variant="secondary">{calculations.totalPods} pods needed</Badge>
              <Badge variant="default">{formatCurrency(calculations.podsCost)}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Beams */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Edge & Internal Beams</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                  {MESH_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
            <span className="text-muted-foreground">Waffle Pods ({calculations.totalPods})</span>
            <span>{formatCurrency(calculations.podsCost)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Mesh ({calculations.meshSheets} sheets)</span>
            <span>{formatCurrency(calculations.meshCost)}</span>
          </div>
          {data.polyMembrane && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Poly Membrane</span>
              <span>{formatCurrency(calculations.polyCost)}</span>
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

export function calculateWafflePodTotals(data: WafflePodData) {
  const length = parseFloat(data.slabLength) || 0;
  const width = parseFloat(data.slabWidth) || 0;
  const slabArea = length * width;
  const perimeter = 2 * (length + width);

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
  
  const effectiveWidth = width - 2 * edgeBeamWidthM;
  const effectiveLength = length - 2 * edgeBeamWidthM;
  const beamsAlongLength = Math.floor(effectiveLength / (podWidthM + internalBeamWidthM));
  const beamsAlongWidth = Math.floor(effectiveWidth / (podWidthM + internalBeamWidthM));
  
  const lengthwiseBeamsVolume = beamsAlongLength * width * internalBeamWidthM * internalBeamDepthM;
  const widthwiseBeamsVolume = beamsAlongWidth * length * internalBeamWidthM * internalBeamDepthM;
  const internalBeamVolume = lengthwiseBeamsVolume + widthwiseBeamsVolume;

  const totalConcreteVolume = topSlabVolume + edgeBeamVolume + internalBeamVolume;
  const wastage = (parseFloat(data.wastagePercent) || 0) / 100;
  const volumeWithWastage = totalConcreteVolume * (1 + wastage);
  const concretePricePerM3 = parseFloat(data.concretePricePerM3) || 0;
  const concreteCost = volumeWithWastage * concretePricePerM3;

  const podsAlongLength = Math.floor(effectiveLength / podWidthM);
  const podsAlongWidth = Math.floor(effectiveWidth / podWidthM);
  const totalPods = podsAlongLength * podsAlongWidth;
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
