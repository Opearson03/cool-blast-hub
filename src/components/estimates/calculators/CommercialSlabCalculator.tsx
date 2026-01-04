import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Trash2, EyeOff, Layers, Circle, Square, Grip, Truck, Users, HelpCircle } from "lucide-react";

// Slab section type
interface SlabSection {
  id: string;
  name: string;
  length: string;
  width: string;
  thickness: string;
}

// Strip footing type
interface StripFooting {
  id: string;
  name: string;
  length: string;
  width: string;
  depth: string;
}

// Pier hole type
interface PierHole {
  id: string;
  name: string;
  quantity: string;
  diameter: string;
  depth: string;
}

// Ground beam / thickening type
interface GroundBeam {
  id: string;
  name: string;
  length: string;
  width: string;
  depth: string;
}

// Rebar item type
interface RebarItem {
  id: string;
  barSize: string;
  length: string;
  quantity: string;
  pricePerMeter: string;
}

// Standard rebar sizes in Australia
const REBAR_SIZES = [
  { id: "N10", label: "N10 (10mm)", kgPerM: 0.617, defaultPrice: 1.85 },
  { id: "N12", label: "N12 (12mm)", kgPerM: 0.888, defaultPrice: 2.20 },
  { id: "N16", label: "N16 (16mm)", kgPerM: 1.58, defaultPrice: 3.50 },
  { id: "N20", label: "N20 (20mm)", kgPerM: 2.47, defaultPrice: 5.20 },
  { id: "N24", label: "N24 (24mm)", kgPerM: 3.55, defaultPrice: 7.50 },
  { id: "N28", label: "N28 (28mm)", kgPerM: 4.83, defaultPrice: 10.20 },
  { id: "N32", label: "N32 (32mm)", kgPerM: 6.31, defaultPrice: 13.30 },
  { id: "N36", label: "N36 (36mm)", kgPerM: 7.99, defaultPrice: 16.85 },
];

// Mesh types for slab
const REO_MESH_TYPES = [
  { id: "SL72", label: "SL72 (7.0mm wire)", area: 14.4, defaultPrice: 55 },
  { id: "SL82", label: "SL82 (8.0mm wire)", area: 14.4, defaultPrice: 70 },
  { id: "SL92", label: "SL92 (9.0mm wire)", area: 14.4, defaultPrice: 90 },
  { id: "SL102", label: "SL102 (10.0mm wire)", area: 14.4, defaultPrice: 110 },
];

// Ligature types
const LIGATURE_TYPES = [
  { id: "R6", label: "R6 (6mm round)", kgPerM: 0.222, defaultPrice: 0.75 },
  { id: "R10", label: "R10 (10mm round)", kgPerM: 0.617, defaultPrice: 1.50 },
];

// Labour questionnaire type
interface LabourQuestionnaire {
  useGuided: boolean;
  // Setout
  setoutMen: string;
  setoutHours: string;
  // Excavation
  excavationMen: string;
  excavationHours: string;
  spotterRequired: boolean;
  spotterHours: string;
  removeSpoil: boolean; // if false, add to exclusions
  // Formwork for piers
  pierFormwork: boolean;
  pierFormworkCost: string;
  pierFormworkMen: string;
  pierFormworkHours: string;
  // Reinforcement cages
  reoCageMen: string;
  reoCageHours: string;
  // Concrete placement
  concretePlacementMen: string;
  concretePlacementHours: string;
  // Pump time
  pumpHours: string;
  // Waiting time
  waitingMinutes: string;
  // Manual override
  manualHours: string;
  manualMen: string;
  hourlyRate: string;
}

export interface CommercialSlabData {
  sections: SlabSection[];
  stripFootings: StripFooting[];
  pierHoles: PierHole[];
  groundBeams: GroundBeam[];
  concrete: {
    pricePerM3: string;
    mpaStrength: string;
    slump: string;
    wastagePercent: string;
  };
  footingsPiersConcrete: {
    useSeparateStrength: boolean;
    mpaStrength: string;
    pricePerM3: string;
  };
  footingsPiersReinforcement: {
    includeReinforcement: boolean;
  };
  mesh: {
    include: boolean;
    meshType: string;
    pricePerSheet: string;
    overlapPercent: string;
  };
  rebar: {
    items: RebarItem[];
    ligatureType: string;
    ligatureMeters: string;
    ligaturePricePerM: string;
  };
  labour: LabourQuestionnaire;
  extras: {
    formworkMeters: string;
    formworkPricePerM: string;
    includePump: boolean;
    pumpCost: string;
    vapourBarrier: boolean;
    vapourBarrierPricePerM2: string;
  };
}

interface CommercialSlabCalculatorProps {
  data: CommercialSlabData;
  onChange: (data: CommercialSlabData) => void;
}

export const initialCommercialSlabData: CommercialSlabData = {
  sections: [
    { id: "1", name: "Main Slab", length: "", width: "", thickness: "150" },
  ],
  stripFootings: [],
  pierHoles: [],
  groundBeams: [],
  concrete: {
    pricePerM3: "300",
    mpaStrength: "32",
    slump: "100",
    wastagePercent: "5",
  },
  footingsPiersConcrete: {
    useSeparateStrength: false,
    mpaStrength: "40",
    pricePerM3: "320",
  },
  footingsPiersReinforcement: {
    includeReinforcement: true,
  },
  mesh: {
    include: true,
    meshType: "SL82",
    pricePerSheet: "70",
    overlapPercent: "10",
  },
  rebar: {
    items: [],
    ligatureType: "R10",
    ligatureMeters: "",
    ligaturePricePerM: "1.50",
  },
  labour: {
    useGuided: true,
    setoutMen: "2",
    setoutHours: "",
    excavationMen: "1",
    excavationHours: "",
    spotterRequired: false,
    spotterHours: "",
    removeSpoil: true,
    pierFormwork: false,
    pierFormworkCost: "",
    pierFormworkMen: "2",
    pierFormworkHours: "",
    reoCageMen: "2",
    reoCageHours: "",
    concretePlacementMen: "4",
    concretePlacementHours: "",
    pumpHours: "",
    waitingMinutes: "",
    manualHours: "",
    manualMen: "4",
    hourlyRate: "85",
  },
  extras: {
    formworkMeters: "",
    formworkPricePerM: "35",
    includePump: true,
    pumpCost: "1200",
    vapourBarrier: true,
    vapourBarrierPricePerM2: "2.50",
  },
};

export function CommercialSlabCalculator({ data, onChange }: CommercialSlabCalculatorProps) {
  // Section helpers
  const updateSection = (id: string, field: keyof SlabSection, value: string) => {
    onChange({
      ...data,
      sections: data.sections.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    });
  };

  const addSection = () => {
    onChange({
      ...data,
      sections: [
        ...data.sections,
        { id: Date.now().toString(), name: `Section ${data.sections.length + 1}`, length: "", width: "", thickness: "150" },
      ],
    });
  };

  const removeSection = (id: string) => {
    if (data.sections.length <= 1) return;
    onChange({ ...data, sections: data.sections.filter((s) => s.id !== id) });
  };

  // Strip footing helpers
  const updateStripFooting = (id: string, field: keyof StripFooting, value: string) => {
    onChange({
      ...data,
      stripFootings: data.stripFootings.map((f) => (f.id === id ? { ...f, [field]: value } : f)),
    });
  };

  const addStripFooting = () => {
    onChange({
      ...data,
      stripFootings: [
        ...data.stripFootings,
        { id: Date.now().toString(), name: `Footing ${data.stripFootings.length + 1}`, length: "", width: "450", depth: "300" },
      ],
    });
  };

  const removeStripFooting = (id: string) => {
    onChange({ ...data, stripFootings: data.stripFootings.filter((f) => f.id !== id) });
  };

  // Pier hole helpers
  const updatePierHole = (id: string, field: keyof PierHole, value: string) => {
    onChange({
      ...data,
      pierHoles: data.pierHoles.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    });
  };

  const addPierHole = () => {
    onChange({
      ...data,
      pierHoles: [
        ...data.pierHoles,
        { id: Date.now().toString(), name: `Pier ${data.pierHoles.length + 1}`, quantity: "1", diameter: "450", depth: "600" },
      ],
    });
  };

  const removePierHole = (id: string) => {
    onChange({ ...data, pierHoles: data.pierHoles.filter((p) => p.id !== id) });
  };

  // Ground beam helpers
  const updateGroundBeam = (id: string, field: keyof GroundBeam, value: string) => {
    onChange({
      ...data,
      groundBeams: data.groundBeams.map((b) => (b.id === id ? { ...b, [field]: value } : b)),
    });
  };

  const addGroundBeam = () => {
    onChange({
      ...data,
      groundBeams: [
        ...data.groundBeams,
        { id: Date.now().toString(), name: `Beam ${data.groundBeams.length + 1}`, length: "", width: "300", depth: "600" },
      ],
    });
  };

  const removeGroundBeam = (id: string) => {
    onChange({ ...data, groundBeams: data.groundBeams.filter((b) => b.id !== id) });
  };

  // Rebar helpers
  const updateRebarItem = (id: string, field: keyof RebarItem, value: string) => {
    onChange({
      ...data,
      rebar: {
        ...data.rebar,
        items: data.rebar.items.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
      },
    });
  };

  const addRebarItem = () => {
    const defaultBar = REBAR_SIZES[1]; // N12
    onChange({
      ...data,
      rebar: {
        ...data.rebar,
        items: [
          ...data.rebar.items,
          { id: Date.now().toString(), barSize: "N12", length: "", quantity: "", pricePerMeter: defaultBar.defaultPrice.toString() },
        ],
      },
    });
  };

  const removeRebarItem = (id: string) => {
    onChange({
      ...data,
      rebar: { ...data.rebar, items: data.rebar.items.filter((r) => r.id !== id) },
    });
  };

  // Calculations
  const calculations = useMemo(() => {
    // Slab sections
    const sectionCalcs = data.sections.map((s) => {
      const l = parseFloat(s.length) || 0;
      const w = parseFloat(s.width) || 0;
      const t = (parseFloat(s.thickness) || 0) / 1000;
      return { area: l * w, volume: l * w * t };
    });
    const totalSlabArea = sectionCalcs.reduce((sum, s) => sum + s.area, 0);
    const totalSlabVolume = sectionCalcs.reduce((sum, s) => sum + s.volume, 0);

    // Strip footings
    const stripFootingCalcs = data.stripFootings.map((f) => {
      const l = parseFloat(f.length) || 0;
      const w = (parseFloat(f.width) || 0) / 1000;
      const d = (parseFloat(f.depth) || 0) / 1000;
      return { volume: l * w * d };
    });
    const totalStripFootingVolume = stripFootingCalcs.reduce((sum, f) => sum + f.volume, 0);

    // Pier holes (cylindrical)
    const pierHoleCalcs = data.pierHoles.map((p) => {
      const qty = parseFloat(p.quantity) || 0;
      const r = ((parseFloat(p.diameter) || 0) / 1000) / 2;
      const d = (parseFloat(p.depth) || 0) / 1000;
      const volumeEach = Math.PI * r * r * d;
      return { quantity: qty, volumeEach, totalVolume: qty * volumeEach };
    });
    const totalPierVolume = pierHoleCalcs.reduce((sum, p) => sum + p.totalVolume, 0);

    // Ground beams
    const groundBeamCalcs = data.groundBeams.map((b) => {
      const l = parseFloat(b.length) || 0;
      const w = (parseFloat(b.width) || 0) / 1000;
      const d = (parseFloat(b.depth) || 0) / 1000;
      return { volume: l * w * d };
    });
    const totalGroundBeamVolume = groundBeamCalcs.reduce((sum, b) => sum + b.volume, 0);

    // Total concrete - separate calc for footings/piers if using different strength
    const footingsPiersVolume = totalStripFootingVolume + totalPierVolume;
    const slabBeamsVolume = totalSlabVolume + totalGroundBeamVolume;
    const totalConcreteVolume = slabBeamsVolume + footingsPiersVolume;
    const wastage = (parseFloat(data.concrete.wastagePercent) || 0) / 100;
    
    // Calculate costs based on whether separate concrete is used
    const slabBeamsVolumeWithWastage = slabBeamsVolume * (1 + wastage);
    const footingsPiersVolumeWithWastage = footingsPiersVolume * (1 + wastage);
    const volumeWithWastage = totalConcreteVolume * (1 + wastage);
    
    const slabConcreteCost = slabBeamsVolumeWithWastage * (parseFloat(data.concrete.pricePerM3) || 0);
    const footingsPiersConcreteCost = data.footingsPiersConcrete.useSeparateStrength
      ? footingsPiersVolumeWithWastage * (parseFloat(data.footingsPiersConcrete.pricePerM3) || 0)
      : footingsPiersVolumeWithWastage * (parseFloat(data.concrete.pricePerM3) || 0);
    const concreteCost = slabConcreteCost + footingsPiersConcreteCost;

    // Mesh
    const selectedMesh = REO_MESH_TYPES.find((m) => m.id === data.mesh.meshType) || REO_MESH_TYPES[1];
    const meshOverlap = 1 + (parseFloat(data.mesh.overlapPercent) || 0) / 100;
    const meshArea = data.mesh.include ? totalSlabArea * meshOverlap : 0;
    const meshSheets = Math.ceil(meshArea / selectedMesh.area);
    const meshCost = meshSheets * (parseFloat(data.mesh.pricePerSheet) || 0);

    // Rebar
    const rebarCalcs = data.rebar.items.map((r) => {
      const barInfo = REBAR_SIZES.find((b) => b.id === r.barSize);
      const length = parseFloat(r.length) || 0;
      const qty = parseFloat(r.quantity) || 0;
      const totalMeters = length * qty;
      const pricePerM = parseFloat(r.pricePerMeter) || 0;
      const cost = totalMeters * pricePerM;
      const weight = totalMeters * (barInfo?.kgPerM || 0);
      return { ...r, totalMeters, cost, weight };
    });
    const totalRebarCost = rebarCalcs.reduce((sum, r) => sum + r.cost, 0);
    const totalRebarWeight = rebarCalcs.reduce((sum, r) => sum + r.weight, 0);

    // Ligatures
    const ligatureInfo = LIGATURE_TYPES.find((l) => l.id === data.rebar.ligatureType);
    const ligatureMeters = parseFloat(data.rebar.ligatureMeters) || 0;
    const ligatureCost = ligatureMeters * (parseFloat(data.rebar.ligaturePricePerM) || 0);
    const ligatureWeight = ligatureMeters * (ligatureInfo?.kgPerM || 0);

    const totalReinforcementCost = (data.mesh.include ? meshCost : 0) + totalRebarCost + ligatureCost;

    // Extras
    const formworkMeters = parseFloat(data.extras.formworkMeters) || 0;
    const formworkCost = formworkMeters * (parseFloat(data.extras.formworkPricePerM) || 0);
    const pumpCost = data.extras.includePump ? parseFloat(data.extras.pumpCost) || 0 : 0;
    const vbArea = data.extras.vapourBarrier ? totalSlabArea * 1.15 : 0;
    const vbCost = vbArea * (parseFloat(data.extras.vapourBarrierPricePerM2) || 0);

    // Labour calculations
    const hourlyRate = parseFloat(data.labour.hourlyRate) || 0;
    const totalPierCount = data.pierHoles.reduce((sum, p) => sum + (parseFloat(p.quantity) || 0), 0);
    
    let labourTotalHours = 0;
    let labourTotalManHours = 0;
    
    if (data.labour.useGuided) {
      // Setout
      const setoutMen = parseFloat(data.labour.setoutMen) || 0;
      const setoutHours = parseFloat(data.labour.setoutHours) || 0;
      labourTotalManHours += setoutMen * setoutHours;
      
      // Excavation
      const excavationMen = parseFloat(data.labour.excavationMen) || 0;
      const excavationHours = parseFloat(data.labour.excavationHours) || 0;
      labourTotalManHours += excavationMen * excavationHours;
      
      // Spotter
      if (data.labour.spotterRequired) {
        const spotterHours = parseFloat(data.labour.spotterHours) || 0;
        labourTotalManHours += spotterHours; // 1 spotter
      }
      
      // Pier formwork
      if (data.labour.pierFormwork) {
        const pierFormworkMen = parseFloat(data.labour.pierFormworkMen) || 0;
        const pierFormworkHours = parseFloat(data.labour.pierFormworkHours) || 0;
        labourTotalManHours += pierFormworkMen * pierFormworkHours;
      }
      
      // Reo cages
      const reoCageMen = parseFloat(data.labour.reoCageMen) || 0;
      const reoCageHours = parseFloat(data.labour.reoCageHours) || 0;
      labourTotalManHours += reoCageMen * reoCageHours;
      
      // Concrete placement
      const concretePlacementMen = parseFloat(data.labour.concretePlacementMen) || 0;
      const concretePlacementHours = parseFloat(data.labour.concretePlacementHours) || 0;
      labourTotalManHours += concretePlacementMen * concretePlacementHours;
      
      // Pump hours (crew waiting)
      const pumpHours = parseFloat(data.labour.pumpHours) || 0;
      labourTotalManHours += concretePlacementMen * pumpHours;
      
      // Waiting time on concrete
      const waitingMinutes = parseFloat(data.labour.waitingMinutes) || 0;
      labourTotalManHours += concretePlacementMen * (waitingMinutes / 60);
      
      labourTotalHours = labourTotalManHours;
    } else {
      // Manual entry
      const manualMen = parseFloat(data.labour.manualMen) || 0;
      const manualHours = parseFloat(data.labour.manualHours) || 0;
      labourTotalManHours = manualMen * manualHours;
      labourTotalHours = labourTotalManHours;
    }
    
    const labourCost = labourTotalManHours * hourlyRate;
    const pierFormworkMaterialCost = data.labour.pierFormwork ? (parseFloat(data.labour.pierFormworkCost) || 0) : 0;

    const subtotal = concreteCost + totalReinforcementCost + formworkCost + pumpCost + vbCost + labourCost + pierFormworkMaterialCost;

    return {
      sectionCalcs,
      totalSlabArea,
      totalSlabVolume,
      stripFootingCalcs,
      totalStripFootingVolume,
      pierHoleCalcs,
      totalPierVolume,
      groundBeamCalcs,
      totalGroundBeamVolume,
      totalConcreteVolume,
      slabBeamsVolume,
      footingsPiersVolume,
      volumeWithWastage,
      concreteCost,
      slabConcreteCost,
      footingsPiersConcreteCost,
      selectedMesh,
      meshSheets,
      meshCost,
      rebarCalcs,
      totalRebarCost,
      totalRebarWeight,
      ligatureMeters,
      ligatureCost,
      ligatureWeight,
      totalReinforcementCost,
      formworkMeters,
      formworkCost,
      pumpCost,
      vbArea,
      vbCost,
      totalPierCount,
      labourTotalManHours,
      labourCost,
      pierFormworkMaterialCost,
      subtotal,
    };
  }, [data]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(amount);

  return (
    <div className="space-y-6">
      {/* Internal cost notice */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
        <EyeOff className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-700 dark:text-amber-400">
          <strong>Internal costs only</strong> — These prices are for your calculation. The client will only see the final quoted amount.
        </p>
      </div>

      <Accordion type="multiple" defaultValue={["sections", "concrete", "rebar"]} className="space-y-4">
        {/* Slab Sections */}
        <AccordionItem value="sections" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>Slab Sections</span>
              {calculations.totalSlabArea > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {calculations.totalSlabArea.toFixed(1)}m² / {calculations.totalSlabVolume.toFixed(2)}m³
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            {data.sections.map((section, idx) => (
              <Card key={section.id} className="bg-muted/30">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Input
                      value={section.name}
                      onChange={(e) => updateSection(section.id, "name", e.target.value)}
                      className="font-medium max-w-[200px]"
                    />
                    {data.sections.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeSection(section.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Length (m)</Label>
                      <Input type="number" step="0.01" value={section.length} onChange={(e) => updateSection(section.id, "length", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Width (m)</Label>
                      <Input type="number" step="0.01" value={section.width} onChange={(e) => updateSection(section.id, "width", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Thickness (mm)</Label>
                      <Input type="number" step="1" value={section.thickness} onChange={(e) => updateSection(section.id, "thickness", e.target.value)} />
                    </div>
                  </div>
                  {calculations.sectionCalcs[idx]?.area > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Area: {calculations.sectionCalcs[idx].area.toFixed(2)}m² | Volume: {calculations.sectionCalcs[idx].volume.toFixed(2)}m³
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addSection} className="gap-1">
              <Plus className="w-4 h-4" /> Add Section
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Strip Footings */}
        <AccordionItem value="footings" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Square className="w-4 h-4" />
              <span>Strip Footings</span>
              {calculations.totalStripFootingVolume > 0 && (
                <Badge variant="secondary" className="ml-2">+{calculations.totalStripFootingVolume.toFixed(2)}m³</Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            {data.stripFootings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No strip footings added.</p>
            ) : (
              data.stripFootings.map((footing, idx) => (
                <Card key={footing.id} className="bg-muted/30">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Input value={footing.name} onChange={(e) => updateStripFooting(footing.id, "name", e.target.value)} className="font-medium max-w-[200px]" />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeStripFooting(footing.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Length (m)</Label>
                        <Input type="number" step="0.01" value={footing.length} onChange={(e) => updateStripFooting(footing.id, "length", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Width (mm)</Label>
                        <Input type="number" step="1" value={footing.width} onChange={(e) => updateStripFooting(footing.id, "width", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Depth (mm)</Label>
                        <Input type="number" step="1" value={footing.depth} onChange={(e) => updateStripFooting(footing.id, "depth", e.target.value)} />
                      </div>
                    </div>
                    {calculations.stripFootingCalcs[idx]?.volume > 0 && (
                      <p className="text-xs text-muted-foreground">Volume: {calculations.stripFootingCalcs[idx].volume.toFixed(3)}m³</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
            <Button type="button" variant="outline" size="sm" onClick={addStripFooting} className="gap-1">
              <Plus className="w-4 h-4" /> Add Strip Footing
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Pier Holes */}
        <AccordionItem value="piers" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Circle className="w-4 h-4" />
              <span>Pier Holes</span>
              {calculations.totalPierVolume > 0 && (
                <Badge variant="secondary" className="ml-2">+{calculations.totalPierVolume.toFixed(2)}m³</Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            {data.pierHoles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pier holes added.</p>
            ) : (
              data.pierHoles.map((pier, idx) => (
                <Card key={pier.id} className="bg-muted/30">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Input value={pier.name} onChange={(e) => updatePierHole(pier.id, "name", e.target.value)} className="font-medium max-w-[200px]" />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removePierHole(pier.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Quantity</Label>
                        <Input type="number" step="1" value={pier.quantity} onChange={(e) => updatePierHole(pier.id, "quantity", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Diameter (mm)</Label>
                        <Input type="number" step="1" value={pier.diameter} onChange={(e) => updatePierHole(pier.id, "diameter", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Depth (mm)</Label>
                        <Input type="number" step="1" value={pier.depth} onChange={(e) => updatePierHole(pier.id, "depth", e.target.value)} />
                      </div>
                    </div>
                    {calculations.pierHoleCalcs[idx]?.totalVolume > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {calculations.pierHoleCalcs[idx].quantity} × {calculations.pierHoleCalcs[idx].volumeEach.toFixed(3)}m³ = {calculations.pierHoleCalcs[idx].totalVolume.toFixed(3)}m³
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
            <Button type="button" variant="outline" size="sm" onClick={addPierHole} className="gap-1">
              <Plus className="w-4 h-4" /> Add Pier Holes
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Ground Beams */}
        <AccordionItem value="beams" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Grip className="w-4 h-4" />
              <span>Ground Beams / Thickenings</span>
              {calculations.totalGroundBeamVolume > 0 && (
                <Badge variant="secondary" className="ml-2">+{calculations.totalGroundBeamVolume.toFixed(2)}m³</Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            {data.groundBeams.length === 0 ? (
              <p className="text-sm text-muted-foreground">No ground beams added.</p>
            ) : (
              data.groundBeams.map((beam, idx) => (
                <Card key={beam.id} className="bg-muted/30">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Input value={beam.name} onChange={(e) => updateGroundBeam(beam.id, "name", e.target.value)} className="font-medium max-w-[200px]" />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeGroundBeam(beam.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Length (m)</Label>
                        <Input type="number" step="0.01" value={beam.length} onChange={(e) => updateGroundBeam(beam.id, "length", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Width (mm)</Label>
                        <Input type="number" step="1" value={beam.width} onChange={(e) => updateGroundBeam(beam.id, "width", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Depth (mm)</Label>
                        <Input type="number" step="1" value={beam.depth} onChange={(e) => updateGroundBeam(beam.id, "depth", e.target.value)} />
                      </div>
                    </div>
                    {calculations.groundBeamCalcs[idx]?.volume > 0 && (
                      <p className="text-xs text-muted-foreground">Volume: {calculations.groundBeamCalcs[idx].volume.toFixed(3)}m³</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
            <Button type="button" variant="outline" size="sm" onClick={addGroundBeam} className="gap-1">
              <Plus className="w-4 h-4" /> Add Ground Beam
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Concrete Pricing */}
        <AccordionItem value="concrete" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <span>Concrete</span>
              {calculations.volumeWithWastage > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {calculations.volumeWithWastage.toFixed(2)}m³ = {formatCurrency(calculations.concreteCost)}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            {/* Main Slab Concrete */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Slab & Ground Beams</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price per m³</Label>
                  <Input type="number" value={data.concrete.pricePerM3} onChange={(e) => onChange({ ...data, concrete: { ...data.concrete, pricePerM3: e.target.value } })} />
                </div>
                <div className="space-y-2">
                  <Label>MPa Strength</Label>
                  <Select value={data.concrete.mpaStrength} onValueChange={(v) => onChange({ ...data, concrete: { ...data.concrete, mpaStrength: v } })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">N25</SelectItem>
                      <SelectItem value="32">N32</SelectItem>
                      <SelectItem value="40">N40</SelectItem>
                      <SelectItem value="50">N50</SelectItem>
                      <SelectItem value="65">N65</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Slump (mm)</Label>
                  <Input type="number" value={data.concrete.slump} onChange={(e) => onChange({ ...data, concrete: { ...data.concrete, slump: e.target.value } })} />
                </div>
                <div className="space-y-2">
                  <Label>Wastage %</Label>
                  <Input type="number" value={data.concrete.wastagePercent} onChange={(e) => onChange({ ...data, concrete: { ...data.concrete, wastagePercent: e.target.value } })} />
                </div>
              </div>
            </div>

            {/* Footings & Piers Separate Concrete Option */}
            {(data.stripFootings.length > 0 || data.pierHoles.length > 0) && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-3">
                  <Label htmlFor="separateFootingsConcrete" className="font-medium text-sm">Different concrete for Footings & Piers?</Label>
                  <Select 
                    value={data.footingsPiersConcrete.useSeparateStrength ? "yes" : "no"} 
                    onValueChange={(v) => onChange({ 
                      ...data, 
                      footingsPiersConcrete: { ...data.footingsPiersConcrete, useSeparateStrength: v === "yes" } 
                    })}
                  >
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {data.footingsPiersConcrete.useSeparateStrength && (
                  <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-muted">
                    <div className="space-y-2">
                      <Label>Footings/Piers Price per m³</Label>
                      <Input type="number" value={data.footingsPiersConcrete.pricePerM3} onChange={(e) => onChange({ ...data, footingsPiersConcrete: { ...data.footingsPiersConcrete, pricePerM3: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Footings/Piers MPa Strength</Label>
                      <Select value={data.footingsPiersConcrete.mpaStrength} onValueChange={(v) => onChange({ ...data, footingsPiersConcrete: { ...data.footingsPiersConcrete, mpaStrength: v } })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">N25</SelectItem>
                          <SelectItem value="32">N32</SelectItem>
                          <SelectItem value="40">N40</SelectItem>
                          <SelectItem value="50">N50</SelectItem>
                          <SelectItem value="65">N65</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footings/Piers Reinforcement Option */}
            {(data.stripFootings.length > 0 || data.pierHoles.length > 0) && (
              <div className="flex items-center gap-3 pt-4 border-t">
                <Label htmlFor="footingsReinforcement" className="font-medium text-sm">Reinforcement in Footings & Piers?</Label>
                <Select 
                  value={data.footingsPiersReinforcement.includeReinforcement ? "yes" : "no"} 
                  onValueChange={(v) => onChange({ 
                    ...data, 
                    footingsPiersReinforcement: { ...data.footingsPiersReinforcement, includeReinforcement: v === "yes" } 
                  })}
                >
                  <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
                {data.footingsPiersReinforcement.includeReinforcement && (
                  <span className="text-xs text-muted-foreground">(Add rebar in Reinforcement Schedule)</span>
                )}
              </div>
            )}

            {calculations.totalConcreteVolume > 0 && (
              <div className="text-sm space-y-1 pt-4 border-t">
                <p>Slab: {calculations.totalSlabVolume.toFixed(2)}m³</p>
                {calculations.totalGroundBeamVolume > 0 && <p>+ Ground Beams: {calculations.totalGroundBeamVolume.toFixed(2)}m³</p>}
                {calculations.totalStripFootingVolume > 0 && (
                  <p className={data.footingsPiersConcrete.useSeparateStrength ? "text-blue-600 dark:text-blue-400" : ""}>
                    + Strip Footings: {calculations.totalStripFootingVolume.toFixed(2)}m³
                    {data.footingsPiersConcrete.useSeparateStrength && ` (N${data.footingsPiersConcrete.mpaStrength})`}
                  </p>
                )}
                {calculations.totalPierVolume > 0 && (
                  <p className={data.footingsPiersConcrete.useSeparateStrength ? "text-blue-600 dark:text-blue-400" : ""}>
                    + Pier Holes: {calculations.totalPierVolume.toFixed(2)}m³
                    {data.footingsPiersConcrete.useSeparateStrength && ` (N${data.footingsPiersConcrete.mpaStrength})`}
                  </p>
                )}
                <p className="font-medium pt-1">Total: {calculations.totalConcreteVolume.toFixed(2)}m³ (+{data.concrete.wastagePercent}% waste = {calculations.volumeWithWastage.toFixed(2)}m³)</p>
                {data.footingsPiersConcrete.useSeparateStrength && calculations.footingsPiersVolume > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Slab/Beams: {formatCurrency(calculations.slabConcreteCost)} | Footings/Piers: {formatCurrency(calculations.footingsPiersConcreteCost)}
                  </p>
                )}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Reinforcement */}
        <AccordionItem value="rebar" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <span>Reinforcement Schedule</span>
              {calculations.totalReinforcementCost > 0 && (
                <Badge variant="secondary" className="ml-2">{formatCurrency(calculations.totalReinforcementCost)}</Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            {/* Mesh */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Switch id="includeMesh" checked={data.mesh.include} onCheckedChange={(c) => onChange({ ...data, mesh: { ...data.mesh, include: c } })} />
                <Label htmlFor="includeMesh">Include slab mesh</Label>
              </div>
              {data.mesh.include && (
                <div className="grid grid-cols-3 gap-3 pl-8">
                  <div className="space-y-1">
                    <Label className="text-xs">Mesh Type</Label>
                    <Select value={data.mesh.meshType} onValueChange={(v) => {
                      const mesh = REO_MESH_TYPES.find((m) => m.id === v);
                      onChange({ ...data, mesh: { ...data.mesh, meshType: v, pricePerSheet: mesh?.defaultPrice.toString() || data.mesh.pricePerSheet } });
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {REO_MESH_TYPES.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">$/Sheet</Label>
                    <Input type="number" value={data.mesh.pricePerSheet} onChange={(e) => onChange({ ...data, mesh: { ...data.mesh, pricePerSheet: e.target.value } })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Overlap %</Label>
                    <Input type="number" value={data.mesh.overlapPercent} onChange={(e) => onChange({ ...data, mesh: { ...data.mesh, overlapPercent: e.target.value } })} />
                  </div>
                </div>
              )}
              {data.mesh.include && calculations.meshSheets > 0 && (
                <p className="text-xs text-muted-foreground pl-8">{calculations.meshSheets} sheets = {formatCurrency(calculations.meshCost)}</p>
              )}
            </div>

            {/* Rebar Items */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Rebar Schedule</Label>
                <Button type="button" variant="outline" size="sm" onClick={addRebarItem} className="gap-1">
                  <Plus className="w-4 h-4" /> Add Bar
                </Button>
              </div>
              {data.rebar.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No rebar items added.</p>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
                    <div className="col-span-3">Bar Size</div>
                    <div className="col-span-2">Length (m)</div>
                    <div className="col-span-2">Qty</div>
                    <div className="col-span-2">$/m</div>
                    <div className="col-span-2">Cost</div>
                    <div className="col-span-1"></div>
                  </div>
                  {data.rebar.items.map((item, idx) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-3">
                        <Select value={item.barSize} onValueChange={(v) => {
                          const bar = REBAR_SIZES.find((b) => b.id === v);
                          updateRebarItem(item.id, "barSize", v);
                          if (bar) updateRebarItem(item.id, "pricePerMeter", bar.defaultPrice.toString());
                        }}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {REBAR_SIZES.map((b) => <SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Input type="number" className="h-8" value={item.length} onChange={(e) => updateRebarItem(item.id, "length", e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <Input type="number" className="h-8" value={item.quantity} onChange={(e) => updateRebarItem(item.id, "quantity", e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <Input type="number" className="h-8" value={item.pricePerMeter} onChange={(e) => updateRebarItem(item.id, "pricePerMeter", e.target.value)} />
                      </div>
                      <div className="col-span-2 text-sm font-medium">
                        {formatCurrency(calculations.rebarCalcs[idx]?.cost || 0)}
                      </div>
                      <div className="col-span-1">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeRebarItem(item.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {calculations.totalRebarCost > 0 && (
                <p className="text-xs text-muted-foreground">
                  Rebar total: {calculations.totalRebarWeight.toFixed(1)}kg = {formatCurrency(calculations.totalRebarCost)}
                </p>
              )}
            </div>

            {/* Ligatures */}
            <div className="border-t pt-4 space-y-3">
              <Label className="font-medium">Ligatures</Label>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select value={data.rebar.ligatureType} onValueChange={(v) => {
                    const lig = LIGATURE_TYPES.find((l) => l.id === v);
                    onChange({ ...data, rebar: { ...data.rebar, ligatureType: v, ligaturePricePerM: lig?.defaultPrice.toString() || data.rebar.ligaturePricePerM } });
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LIGATURE_TYPES.map((l) => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Total Length (m)</Label>
                  <Input type="number" value={data.rebar.ligatureMeters} onChange={(e) => onChange({ ...data, rebar: { ...data.rebar, ligatureMeters: e.target.value } })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">$/m</Label>
                  <Input type="number" value={data.rebar.ligaturePricePerM} onChange={(e) => onChange({ ...data, rebar: { ...data.rebar, ligaturePricePerM: e.target.value } })} />
                </div>
              </div>
              {calculations.ligatureCost > 0 && (
                <p className="text-xs text-muted-foreground">
                  Ligatures: {calculations.ligatureWeight.toFixed(1)}kg = {formatCurrency(calculations.ligatureCost)}
                </p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Extras */}
        <AccordionItem value="extras" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              <span>Formwork & Extras</span>
              {(calculations.formworkCost + calculations.pumpCost + calculations.vbCost) > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {formatCurrency(calculations.formworkCost + calculations.pumpCost + calculations.vbCost)}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Formwork (linear m)</Label>
                <Input type="number" value={data.extras.formworkMeters} onChange={(e) => onChange({ ...data, extras: { ...data.extras, formworkMeters: e.target.value } })} />
              </div>
              <div className="space-y-2">
                <Label>Price per m</Label>
                <Input type="number" value={data.extras.formworkPricePerM} onChange={(e) => onChange({ ...data, extras: { ...data.extras, formworkPricePerM: e.target.value } })} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch id="includePump" checked={data.extras.includePump} onCheckedChange={(c) => onChange({ ...data, extras: { ...data.extras, includePump: c } })} />
                <Label htmlFor="includePump">Concrete pump</Label>
              </div>
              {data.extras.includePump && (
                <Input type="number" className="w-24" value={data.extras.pumpCost} onChange={(e) => onChange({ ...data, extras: { ...data.extras, pumpCost: e.target.value } })} />
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch id="includeVB" checked={data.extras.vapourBarrier} onCheckedChange={(c) => onChange({ ...data, extras: { ...data.extras, vapourBarrier: c } })} />
                <Label htmlFor="includeVB">Vapour barrier</Label>
              </div>
              {data.extras.vapourBarrier && (
                <div className="flex items-center gap-1">
                  <Input type="number" className="w-20" value={data.extras.vapourBarrierPricePerM2} onChange={(e) => onChange({ ...data, extras: { ...data.extras, vapourBarrierPricePerM2: e.target.value } })} />
                  <span className="text-sm text-muted-foreground">/m²</span>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Labour */}
        <AccordionItem value="labour" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Labour Estimation</span>
              {calculations.labourCost > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {calculations.labourTotalManHours.toFixed(1)} man-hrs = {formatCurrency(calculations.labourCost)}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            {/* Mode Toggle */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Use guided questionnaire?</span>
              </div>
              <Select 
                value={data.labour.useGuided ? "guided" : "manual"} 
                onValueChange={(v) => onChange({ 
                  ...data, 
                  labour: { ...data.labour, useGuided: v === "guided" } 
                })}
              >
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="guided">Guided</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Hourly Rate - always visible */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hourly Rate ($/hr per person)</Label>
                <Input 
                  type="number" 
                  value={data.labour.hourlyRate} 
                  onChange={(e) => onChange({ ...data, labour: { ...data.labour, hourlyRate: e.target.value } })} 
                />
              </div>
            </div>

            {data.labour.useGuided ? (
              <div className="space-y-6">
                {/* Setout */}
                <div className="space-y-3 p-4 border rounded-lg bg-background">
                  <Label className="font-medium">How many hours to set out the {calculations.totalPierCount || "X"} piers?</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">No. of men</Label>
                      <Input 
                        type="number" 
                        value={data.labour.setoutMen} 
                        onChange={(e) => onChange({ ...data, labour: { ...data.labour, setoutMen: e.target.value } })} 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Hours</Label>
                      <Input 
                        type="number" 
                        value={data.labour.setoutHours} 
                        onChange={(e) => onChange({ ...data, labour: { ...data.labour, setoutHours: e.target.value } })} 
                      />
                    </div>
                  </div>
                </div>

                {/* Excavation */}
                <div className="space-y-3 p-4 border rounded-lg bg-background">
                  <Label className="font-medium">How many hours to excavate the {calculations.totalPierCount || "X"} piers?</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">No. of men</Label>
                      <Input 
                        type="number" 
                        value={data.labour.excavationMen} 
                        onChange={(e) => onChange({ ...data, labour: { ...data.labour, excavationMen: e.target.value } })} 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Hours</Label>
                      <Input 
                        type="number" 
                        value={data.labour.excavationHours} 
                        onChange={(e) => onChange({ ...data, labour: { ...data.labour, excavationHours: e.target.value } })} 
                      />
                    </div>
                  </div>

                  {/* Spotter */}
                  <div className="flex items-center gap-3 pt-2">
                    <Label className="text-sm">Spotter required while excavating?</Label>
                    <Select 
                      value={data.labour.spotterRequired ? "yes" : "no"} 
                      onValueChange={(v) => onChange({ ...data, labour: { ...data.labour, spotterRequired: v === "yes" } })}
                    >
                      <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                    {data.labour.spotterRequired && (
                      <div className="flex items-center gap-1">
                        <Input 
                          type="number" 
                          className="w-20" 
                          placeholder="Hours"
                          value={data.labour.spotterHours} 
                          onChange={(e) => onChange({ ...data, labour: { ...data.labour, spotterHours: e.target.value } })} 
                        />
                        <span className="text-xs text-muted-foreground">hrs</span>
                      </div>
                    )}
                  </div>

                  {/* Spoil removal */}
                  <div className="flex items-center gap-3 pt-2">
                    <Label className="text-sm">Removing spoil from site?</Label>
                    <Select 
                      value={data.labour.removeSpoil ? "yes" : "no"} 
                      onValueChange={(v) => onChange({ ...data, labour: { ...data.labour, removeSpoil: v === "yes" } })}
                    >
                      <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                    {!data.labour.removeSpoil && (
                      <span className="text-xs text-amber-600 dark:text-amber-400">→ Will be added to exclusions</span>
                    )}
                  </div>
                </div>

                {/* Pier Formwork */}
                <div className="space-y-3 p-4 border rounded-lg bg-background">
                  <div className="flex items-center gap-3">
                    <Label className="font-medium">Formwork required for the {calculations.totalPierCount || "X"} piers?</Label>
                    <Select 
                      value={data.labour.pierFormwork ? "yes" : "no"} 
                      onValueChange={(v) => onChange({ ...data, labour: { ...data.labour, pierFormwork: v === "yes" } })}
                    >
                      <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {data.labour.pierFormwork && (
                    <div className="grid grid-cols-3 gap-3 pl-4 border-l-2 border-muted">
                      <div className="space-y-1">
                        <Label className="text-xs">Material Cost ($)</Label>
                        <Input 
                          type="number" 
                          value={data.labour.pierFormworkCost} 
                          onChange={(e) => onChange({ ...data, labour: { ...data.labour, pierFormworkCost: e.target.value } })} 
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">No. of men</Label>
                        <Input 
                          type="number" 
                          value={data.labour.pierFormworkMen} 
                          onChange={(e) => onChange({ ...data, labour: { ...data.labour, pierFormworkMen: e.target.value } })} 
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Hours to install</Label>
                        <Input 
                          type="number" 
                          value={data.labour.pierFormworkHours} 
                          onChange={(e) => onChange({ ...data, labour: { ...data.labour, pierFormworkHours: e.target.value } })} 
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Reinforcement Cages */}
                <div className="space-y-3 p-4 border rounded-lg bg-background">
                  <Label className="font-medium">How many men to tie reinforcement cages? How many hours?</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">No. of men</Label>
                      <Input 
                        type="number" 
                        value={data.labour.reoCageMen} 
                        onChange={(e) => onChange({ ...data, labour: { ...data.labour, reoCageMen: e.target.value } })} 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Hours</Label>
                      <Input 
                        type="number" 
                        value={data.labour.reoCageHours} 
                        onChange={(e) => onChange({ ...data, labour: { ...data.labour, reoCageHours: e.target.value } })} 
                      />
                    </div>
                  </div>
                </div>

                {/* Concrete Placement */}
                <div className="space-y-3 p-4 border rounded-lg bg-background">
                  <Label className="font-medium">How many men to place the concrete? How many hours?</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">No. of men</Label>
                      <Input 
                        type="number" 
                        value={data.labour.concretePlacementMen} 
                        onChange={(e) => onChange({ ...data, labour: { ...data.labour, concretePlacementMen: e.target.value } })} 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Hours</Label>
                      <Input 
                        type="number" 
                        value={data.labour.concretePlacementHours} 
                        onChange={(e) => onChange({ ...data, labour: { ...data.labour, concretePlacementHours: e.target.value } })} 
                      />
                    </div>
                  </div>

                  {/* Pump hours */}
                  <div className="space-y-1 pt-2">
                    <Label className="text-xs">How many hours do you expect the pump to be onsite?</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        className="w-24"
                        value={data.labour.pumpHours} 
                        onChange={(e) => onChange({ ...data, labour: { ...data.labour, pumpHours: e.target.value } })} 
                      />
                      <span className="text-xs text-muted-foreground">hours</span>
                    </div>
                  </div>

                  {/* Waiting time */}
                  <div className="space-y-1 pt-2">
                    <Label className="text-xs">Expected waiting time on concrete delivery?</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        className="w-24"
                        value={data.labour.waitingMinutes} 
                        onChange={(e) => onChange({ ...data, labour: { ...data.labour, waitingMinutes: e.target.value } })} 
                      />
                      <span className="text-xs text-muted-foreground">minutes</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Manual Entry */
              <div className="space-y-3 p-4 border rounded-lg bg-background">
                <Label className="font-medium">Enter total labour directly</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">No. of men</Label>
                    <Input 
                      type="number" 
                      value={data.labour.manualMen} 
                      onChange={(e) => onChange({ ...data, labour: { ...data.labour, manualMen: e.target.value } })} 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Total Hours</Label>
                    <Input 
                      type="number" 
                      value={data.labour.manualHours} 
                      onChange={(e) => onChange({ ...data, labour: { ...data.labour, manualHours: e.target.value } })} 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Labour Summary */}
            {calculations.labourTotalManHours > 0 && (
              <div className="text-sm space-y-1 pt-2 border-t">
                <p className="font-medium">
                  Total: {calculations.labourTotalManHours.toFixed(1)} man-hours × ${data.labour.hourlyRate}/hr = {formatCurrency(calculations.labourCost)}
                </p>
                {calculations.pierFormworkMaterialCost > 0 && (
                  <p className="text-muted-foreground">+ Pier formwork materials: {formatCurrency(calculations.pierFormworkMaterialCost)}</p>
                )}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Summary Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Cost Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Concrete ({calculations.volumeWithWastage.toFixed(2)}m³)</span>
            <span>{formatCurrency(calculations.concreteCost)}</span>
          </div>
          <div className="flex justify-between">
            <span>Reinforcement (mesh + rebar + ligatures)</span>
            <span>{formatCurrency(calculations.totalReinforcementCost)}</span>
          </div>
          {calculations.formworkCost > 0 && (
            <div className="flex justify-between">
              <span>Formwork ({calculations.formworkMeters}m)</span>
              <span>{formatCurrency(calculations.formworkCost)}</span>
            </div>
          )}
          {calculations.pumpCost > 0 && (
            <div className="flex justify-between">
              <span>Concrete Pump</span>
              <span>{formatCurrency(calculations.pumpCost)}</span>
            </div>
          )}
          {calculations.vbCost > 0 && (
            <div className="flex justify-between">
              <span>Vapour Barrier ({calculations.vbArea.toFixed(1)}m²)</span>
              <span>{formatCurrency(calculations.vbCost)}</span>
            </div>
          )}
          {(calculations.labourCost > 0 || calculations.pierFormworkMaterialCost > 0) && (
            <div className="flex justify-between">
              <span>Labour ({calculations.labourTotalManHours.toFixed(1)} man-hrs)</span>
              <span>{formatCurrency(calculations.labourCost + calculations.pierFormworkMaterialCost)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold pt-2 border-t">
            <span>Subtotal</span>
            <span>{formatCurrency(calculations.subtotal)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Export calculation helper
export function calculateCommercialSlabTotals(data: CommercialSlabData) {
  const sectionCalcs = data.sections.map((s) => {
    const l = parseFloat(s.length) || 0;
    const w = parseFloat(s.width) || 0;
    const t = (parseFloat(s.thickness) || 0) / 1000;
    return { area: l * w, volume: l * w * t };
  });
  const totalSlabArea = sectionCalcs.reduce((sum, s) => sum + s.area, 0);
  const totalSlabVolume = sectionCalcs.reduce((sum, s) => sum + s.volume, 0);

  const totalStripFootingVolume = data.stripFootings.reduce((sum, f) => {
    return sum + (parseFloat(f.length) || 0) * ((parseFloat(f.width) || 0) / 1000) * ((parseFloat(f.depth) || 0) / 1000);
  }, 0);

  const totalPierVolume = data.pierHoles.reduce((sum, p) => {
    const qty = parseFloat(p.quantity) || 0;
    const r = ((parseFloat(p.diameter) || 0) / 1000) / 2;
    const d = (parseFloat(p.depth) || 0) / 1000;
    return sum + qty * Math.PI * r * r * d;
  }, 0);

  const totalGroundBeamVolume = data.groundBeams.reduce((sum, b) => {
    return sum + (parseFloat(b.length) || 0) * ((parseFloat(b.width) || 0) / 1000) * ((parseFloat(b.depth) || 0) / 1000);
  }, 0);

  const totalConcreteVolume = totalSlabVolume + totalStripFootingVolume + totalPierVolume + totalGroundBeamVolume;
  const wastage = (parseFloat(data.concrete.wastagePercent) || 0) / 100;
  const volumeWithWastage = totalConcreteVolume * (1 + wastage);
  const concreteCost = volumeWithWastage * (parseFloat(data.concrete.pricePerM3) || 0);

  const selectedMesh = REO_MESH_TYPES.find((m) => m.id === data.mesh.meshType) || REO_MESH_TYPES[1];
  const meshOverlap = 1 + (parseFloat(data.mesh.overlapPercent) || 0) / 100;
  const meshSheets = data.mesh.include ? Math.ceil((totalSlabArea * meshOverlap) / selectedMesh.area) : 0;
  const meshCost = meshSheets * (parseFloat(data.mesh.pricePerSheet) || 0);

  const totalRebarCost = data.rebar.items.reduce((sum, r) => {
    const totalMeters = (parseFloat(r.length) || 0) * (parseFloat(r.quantity) || 0);
    return sum + totalMeters * (parseFloat(r.pricePerMeter) || 0);
  }, 0);

  const ligatureCost = (parseFloat(data.rebar.ligatureMeters) || 0) * (parseFloat(data.rebar.ligaturePricePerM) || 0);

  const formworkCost = (parseFloat(data.extras.formworkMeters) || 0) * (parseFloat(data.extras.formworkPricePerM) || 0);
  const pumpCost = data.extras.includePump ? parseFloat(data.extras.pumpCost) || 0 : 0;
  const vbArea = data.extras.vapourBarrier ? totalSlabArea * 1.15 : 0;
  const vbCost = vbArea * (parseFloat(data.extras.vapourBarrierPricePerM2) || 0);

  return {
    totalSlabArea,
    volumeWithWastage,
    concreteCost,
    meshSheets,
    meshCost,
    totalRebarCost,
    ligatureCost,
    totalReinforcementCost: meshCost + totalRebarCost + ligatureCost,
    formworkCost,
    pumpCost,
    vbCost,
    subtotal: concreteCost + meshCost + totalRebarCost + ligatureCost + formworkCost + pumpCost + vbCost,
    mpaStrength: data.concrete.mpaStrength,
    slump: data.concrete.slump,
    meshType: data.mesh.meshType,
    hasFootings: data.stripFootings.length > 0,
    hasPiers: data.pierHoles.length > 0,
    hasBeams: data.groundBeams.length > 0,
  };
}
