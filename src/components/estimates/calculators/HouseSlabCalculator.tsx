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
import { Plus, Trash2, EyeOff, Layers, Square, ArrowDownUp, ShieldCheck, Truck } from "lucide-react";

// Slab section type
interface SlabSection {
  id: string;
  name: string;
  length: string;
  width: string;
  thickness: string;
}

// Edge beam type
interface EdgeBeam {
  id: string;
  name: string;
  length: string;
  width: string;
  depth: string;
}

// Rebate/step-down type
interface Rebate {
  id: string;
  name: string;
  length: string;
  width: string;
  depth: string;
}

// Reo mesh types
const REO_MESH_TYPES = [
  { id: "SL62", label: "SL62 (6.0mm wire)", area: 14.4, defaultPrice: 45 },
  { id: "SL72", label: "SL72 (7.0mm wire)", area: 14.4, defaultPrice: 55 },
  { id: "SL82", label: "SL82 (8.0mm wire)", area: 14.4, defaultPrice: 70 },
  { id: "SL92", label: "SL92 (9.0mm wire)", area: 14.4, defaultPrice: 90 },
  { id: "SL102", label: "SL102 (10.0mm wire)", area: 14.4, defaultPrice: 110 },
];

// Labour questionnaire for house slabs
interface HouseSlabLabour {
  useGuided: boolean;
  hourlyRate: string;
  // Edge beam formwork
  edgeFormworkMen: string;
  edgeFormworkHours: string;
  // Slab prep (vapour barrier, mesh layout)
  slabPrepMen: string;
  slabPrepHours: string;
  // Mesh laying
  meshLayingMen: string;
  meshLayingHours: string;
  // Concrete placement
  concretePlacementMen: string;
  concretePlacementHours: string;
  // Pump hours
  pumpHours: string;
  // Concrete waiting
  concreteWaitingMinutes: string;
  // Manual entry fallback
  manualHours: string;
  manualMen: string;
}

export interface HouseSlabData {
  sections: SlabSection[];
  edgeBeams: EdgeBeam[];
  rebates: Rebate[];
  concrete: {
    pricePerM3: string;
    mpaStrength: string;
    slump: string;
    wastagePercent: string;
  };
  reo: {
    meshType: string;
    pricePerSheet: string;
    overlapPercent: string;
    includeBarChairs: boolean;
    barChairsPerM2: string;
    barChairPrice: string;
  };
  vapourBarrier: {
    include: boolean;
    pricePerM2: string;
    overlapPercent: string;
  };
  formwork: {
    linearMeters: string;
    pricePerM: string;
  };
  pump: {
    include: boolean;
    pumpCost: string;
  };
  labour: HouseSlabLabour;
}

interface HouseSlabCalculatorProps {
  data: HouseSlabData;
  onChange: (data: HouseSlabData) => void;
}

export const initialHouseSlabData: HouseSlabData = {
  sections: [
    { id: "1", name: "Main Slab", length: "", width: "", thickness: "100" },
  ],
  edgeBeams: [],
  rebates: [],
  concrete: {
    pricePerM3: "280",
    mpaStrength: "32",
    slump: "100",
    wastagePercent: "5",
  },
  reo: {
    meshType: "SL82",
    pricePerSheet: "70",
    overlapPercent: "10",
    includeBarChairs: true,
    barChairsPerM2: "4",
    barChairPrice: "0.50",
  },
  vapourBarrier: {
    include: true,
    pricePerM2: "2.50",
    overlapPercent: "15",
  },
  formwork: {
    linearMeters: "",
    pricePerM: "25",
  },
  pump: {
    include: false,
    pumpCost: "800",
  },
  labour: {
    useGuided: true,
    hourlyRate: "85",
    edgeFormworkMen: "",
    edgeFormworkHours: "",
    slabPrepMen: "",
    slabPrepHours: "",
    meshLayingMen: "",
    meshLayingHours: "",
    concretePlacementMen: "",
    concretePlacementHours: "",
    pumpHours: "",
    concreteWaitingMinutes: "",
    manualHours: "",
    manualMen: "",
  },
};

export function HouseSlabCalculator({ data, onChange }: HouseSlabCalculatorProps) {
  // Helper to update nested state
  const updateSection = (id: string, field: keyof SlabSection, value: string) => {
    onChange({
      ...data,
      sections: data.sections.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    });
  };

  const addSection = () => {
    onChange({
      ...data,
      sections: [
        ...data.sections,
        {
          id: Date.now().toString(),
          name: `Section ${data.sections.length + 1}`,
          length: "",
          width: "",
          thickness: "100",
        },
      ],
    });
  };

  const removeSection = (id: string) => {
    if (data.sections.length <= 1) return;
    onChange({
      ...data,
      sections: data.sections.filter((s) => s.id !== id),
    });
  };

  const updateEdgeBeam = (id: string, field: keyof EdgeBeam, value: string) => {
    onChange({
      ...data,
      edgeBeams: data.edgeBeams.map((e) =>
        e.id === id ? { ...e, [field]: value } : e
      ),
    });
  };

  const addEdgeBeam = () => {
    onChange({
      ...data,
      edgeBeams: [
        ...data.edgeBeams,
        {
          id: Date.now().toString(),
          name: `Edge Beam ${data.edgeBeams.length + 1}`,
          length: "",
          width: "300",
          depth: "450",
        },
      ],
    });
  };

  const removeEdgeBeam = (id: string) => {
    onChange({
      ...data,
      edgeBeams: data.edgeBeams.filter((e) => e.id !== id),
    });
  };

  const updateRebate = (id: string, field: keyof Rebate, value: string) => {
    onChange({
      ...data,
      rebates: data.rebates.map((r) =>
        r.id === id ? { ...r, [field]: value } : r
      ),
    });
  };

  const addRebate = () => {
    onChange({
      ...data,
      rebates: [
        ...data.rebates,
        {
          id: Date.now().toString(),
          name: `Rebate ${data.rebates.length + 1}`,
          length: "",
          width: "",
          depth: "50",
        },
      ],
    });
  };

  const removeRebate = (id: string) => {
    onChange({
      ...data,
      rebates: data.rebates.filter((r) => r.id !== id),
    });
  };

  // Calculations
  const calculations = useMemo(() => {
    // Slab sections
    const sectionCalcs = data.sections.map((s) => {
      const l = parseFloat(s.length) || 0;
      const w = parseFloat(s.width) || 0;
      const t = (parseFloat(s.thickness) || 0) / 1000;
      const area = l * w;
      const volume = area * t;
      return { ...s, area, volume };
    });
    const totalSlabArea = sectionCalcs.reduce((sum, s) => sum + s.area, 0);
    const totalSlabVolume = sectionCalcs.reduce((sum, s) => sum + s.volume, 0);

    // Edge beams (additional concrete volume)
    const edgeBeamCalcs = data.edgeBeams.map((e) => {
      const l = parseFloat(e.length) || 0;
      const w = (parseFloat(e.width) || 0) / 1000;
      const d = (parseFloat(e.depth) || 0) / 1000;
      const volume = l * w * d;
      return { ...e, volume };
    });
    const totalEdgeBeamVolume = edgeBeamCalcs.reduce((sum, e) => sum + e.volume, 0);

    // Rebates (reduce concrete volume)
    const rebateCalcs = data.rebates.map((r) => {
      const l = parseFloat(r.length) || 0;
      const w = parseFloat(r.width) || 0;
      const d = (parseFloat(r.depth) || 0) / 1000;
      const volume = l * w * d;
      const area = l * w;
      return { ...r, volume, area };
    });
    const totalRebateVolume = rebateCalcs.reduce((sum, r) => sum + r.volume, 0);

    // Net concrete volume
    const netConcreteVolume = totalSlabVolume + totalEdgeBeamVolume - totalRebateVolume;
    const wastage = (parseFloat(data.concrete.wastagePercent) || 0) / 100;
    const volumeWithWastage = netConcreteVolume * (1 + wastage);
    const concreteCost = volumeWithWastage * (parseFloat(data.concrete.pricePerM3) || 0);

    // Reo mesh
    const selectedMesh = REO_MESH_TYPES.find((m) => m.id === data.reo.meshType) || REO_MESH_TYPES[2];
    const reoOverlap = 1 + (parseFloat(data.reo.overlapPercent) || 0) / 100;
    const reoAreaNeeded = totalSlabArea * reoOverlap;
    const reoSheets = Math.ceil(reoAreaNeeded / selectedMesh.area);
    const reoCost = reoSheets * (parseFloat(data.reo.pricePerSheet) || 0);
    const barChairs = data.reo.includeBarChairs
      ? Math.ceil(totalSlabArea * (parseFloat(data.reo.barChairsPerM2) || 0))
      : 0;
    const barChairCost = barChairs * (parseFloat(data.reo.barChairPrice) || 0);
    const totalReoCost = reoCost + barChairCost;

    // Vapour barrier
    const vbOverlap = 1 + (parseFloat(data.vapourBarrier.overlapPercent) || 0) / 100;
    const vbArea = data.vapourBarrier.include ? totalSlabArea * vbOverlap : 0;
    const vbCost = vbArea * (parseFloat(data.vapourBarrier.pricePerM2) || 0);

    // Formwork
    const formworkMeters = parseFloat(data.formwork.linearMeters) || 0;
    const formworkCost = formworkMeters * (parseFloat(data.formwork.pricePerM) || 0);

    // Pump
    const pumpCost = data.pump.include ? parseFloat(data.pump.pumpCost) || 0 : 0;

    // Totals
    const subtotal = concreteCost + totalReoCost + vbCost + formworkCost + pumpCost;

    return {
      sectionCalcs,
      totalSlabArea,
      totalSlabVolume,
      edgeBeamCalcs,
      totalEdgeBeamVolume,
      rebateCalcs,
      totalRebateVolume,
      netConcreteVolume,
      volumeWithWastage,
      concreteCost,
      selectedMesh,
      reoSheets,
      reoCost,
      barChairs,
      barChairCost,
      totalReoCost,
      vbArea,
      vbCost,
      formworkMeters,
      formworkCost,
      pumpCost,
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

      <Accordion type="multiple" defaultValue={["sections", "concrete", "reo"]} className="space-y-4">
        {/* Slab Sections */}
        <AccordionItem value="sections" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>Slab Sections</span>
              {calculations.totalSlabArea > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {calculations.totalSlabArea.toFixed(1)}m²
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSection(section.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Length (m)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={section.length}
                        onChange={(e) => updateSection(section.id, "length", e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Width (m)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={section.width}
                        onChange={(e) => updateSection(section.id, "width", e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Thickness (mm)</Label>
                      <Input
                        type="number"
                        step="1"
                        value={section.thickness}
                        onChange={(e) => updateSection(section.id, "thickness", e.target.value)}
                        placeholder="100"
                      />
                    </div>
                  </div>
                  {calculations.sectionCalcs[idx]?.area > 0 && (
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>Area: {calculations.sectionCalcs[idx].area.toFixed(2)}m²</span>
                      <span>Volume: {calculations.sectionCalcs[idx].volume.toFixed(2)}m³</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addSection} className="gap-1">
              <Plus className="w-4 h-4" /> Add Section
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Edge Beams */}
        <AccordionItem value="edgebeams" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Square className="w-4 h-4" />
              <span>Edge Beams</span>
              {calculations.totalEdgeBeamVolume > 0 && (
                <Badge variant="secondary" className="ml-2">
                  +{calculations.totalEdgeBeamVolume.toFixed(2)}m³
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            {data.edgeBeams.length === 0 ? (
              <p className="text-sm text-muted-foreground">No edge beams added. Click below to add one.</p>
            ) : (
              data.edgeBeams.map((beam, idx) => (
                <Card key={beam.id} className="bg-muted/30">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Input
                        value={beam.name}
                        onChange={(e) => updateEdgeBeam(beam.id, "name", e.target.value)}
                        className="font-medium max-w-[200px]"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeEdgeBeam(beam.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Length (m)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={beam.length}
                          onChange={(e) => updateEdgeBeam(beam.id, "length", e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Width (mm)</Label>
                        <Input
                          type="number"
                          step="1"
                          value={beam.width}
                          onChange={(e) => updateEdgeBeam(beam.id, "width", e.target.value)}
                          placeholder="300"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Depth (mm)</Label>
                        <Input
                          type="number"
                          step="1"
                          value={beam.depth}
                          onChange={(e) => updateEdgeBeam(beam.id, "depth", e.target.value)}
                          placeholder="450"
                        />
                      </div>
                    </div>
                    {calculations.edgeBeamCalcs[idx]?.volume > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Volume: {calculations.edgeBeamCalcs[idx].volume.toFixed(3)}m³
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
            <Button type="button" variant="outline" size="sm" onClick={addEdgeBeam} className="gap-1">
              <Plus className="w-4 h-4" /> Add Edge Beam
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Rebates / Step-downs */}
        <AccordionItem value="rebates" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <ArrowDownUp className="w-4 h-4" />
              <span>Rebates / Step-downs</span>
              {calculations.totalRebateVolume > 0 && (
                <Badge variant="secondary" className="ml-2">
                  -{calculations.totalRebateVolume.toFixed(2)}m³
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Add rebates for garage entries, shower recesses, or other step-downs that reduce concrete volume.
            </p>
            {data.rebates.map((rebate, idx) => (
              <Card key={rebate.id} className="bg-muted/30">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Input
                      value={rebate.name}
                      onChange={(e) => updateRebate(rebate.id, "name", e.target.value)}
                      className="font-medium max-w-[200px]"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRebate(rebate.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Length (m)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={rebate.length}
                        onChange={(e) => updateRebate(rebate.id, "length", e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Width (m)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={rebate.width}
                        onChange={(e) => updateRebate(rebate.id, "width", e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Depth (mm)</Label>
                      <Input
                        type="number"
                        step="1"
                        value={rebate.depth}
                        onChange={(e) => updateRebate(rebate.id, "depth", e.target.value)}
                        placeholder="50"
                      />
                    </div>
                  </div>
                  {calculations.rebateCalcs[idx]?.volume > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Reduces volume by: {calculations.rebateCalcs[idx].volume.toFixed(3)}m³
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addRebate} className="gap-1">
              <Plus className="w-4 h-4" /> Add Rebate
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price per m³</Label>
                <Input
                  type="number"
                  value={data.concrete.pricePerM3}
                  onChange={(e) =>
                    onChange({ ...data, concrete: { ...data.concrete, pricePerM3: e.target.value } })
                  }
                  placeholder="280"
                />
              </div>
              <div className="space-y-2">
                <Label>MPa Strength</Label>
                <Select
                  value={data.concrete.mpaStrength}
                  onValueChange={(v) =>
                    onChange({ ...data, concrete: { ...data.concrete, mpaStrength: v } })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">N20</SelectItem>
                    <SelectItem value="25">N25</SelectItem>
                    <SelectItem value="32">N32</SelectItem>
                    <SelectItem value="40">N40</SelectItem>
                    <SelectItem value="50">N50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Slump (mm)</Label>
                <Input
                  type="number"
                  value={data.concrete.slump}
                  onChange={(e) =>
                    onChange({ ...data, concrete: { ...data.concrete, slump: e.target.value } })
                  }
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label>Wastage %</Label>
                <Input
                  type="number"
                  value={data.concrete.wastagePercent}
                  onChange={(e) =>
                    onChange({ ...data, concrete: { ...data.concrete, wastagePercent: e.target.value } })
                  }
                  placeholder="5"
                />
              </div>
            </div>
            {calculations.netConcreteVolume > 0 && (
              <div className="text-sm space-y-1 pt-2 border-t">
                <p>Slab volume: {calculations.totalSlabVolume.toFixed(2)}m³</p>
                {calculations.totalEdgeBeamVolume > 0 && (
                  <p>+ Edge beams: {calculations.totalEdgeBeamVolume.toFixed(2)}m³</p>
                )}
                {calculations.totalRebateVolume > 0 && (
                  <p>- Rebates: {calculations.totalRebateVolume.toFixed(2)}m³</p>
                )}
                <p className="font-medium">
                  Net volume: {calculations.netConcreteVolume.toFixed(2)}m³ (+{data.concrete.wastagePercent}% waste = {calculations.volumeWithWastage.toFixed(2)}m³)
                </p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Reinforcement */}
        <AccordionItem value="reo" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <span>Reinforcement</span>
              {calculations.reoSheets > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {calculations.reoSheets} sheets = {formatCurrency(calculations.totalReoCost)}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mesh Type</Label>
                <Select
                  value={data.reo.meshType}
                  onValueChange={(v) => {
                    const mesh = REO_MESH_TYPES.find((m) => m.id === v);
                    onChange({
                      ...data,
                      reo: {
                        ...data.reo,
                        meshType: v,
                        pricePerSheet: mesh?.defaultPrice.toString() || data.reo.pricePerSheet,
                      },
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REO_MESH_TYPES.map((mesh) => (
                      <SelectItem key={mesh.id} value={mesh.id}>
                        {mesh.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Price per Sheet</Label>
                <Input
                  type="number"
                  value={data.reo.pricePerSheet}
                  onChange={(e) =>
                    onChange({ ...data, reo: { ...data.reo, pricePerSheet: e.target.value } })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Overlap %</Label>
                <Input
                  type="number"
                  value={data.reo.overlapPercent}
                  onChange={(e) =>
                    onChange({ ...data, reo: { ...data.reo, overlapPercent: e.target.value } })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="barChairs"
                  checked={data.reo.includeBarChairs}
                  onCheckedChange={(c) =>
                    onChange({ ...data, reo: { ...data.reo, includeBarChairs: !!c } })
                  }
                />
                <Label htmlFor="barChairs" className="text-sm">Include bar chairs</Label>
              </div>
              {data.reo.includeBarChairs && (
                <>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      className="w-16"
                      value={data.reo.barChairsPerM2}
                      onChange={(e) =>
                        onChange({ ...data, reo: { ...data.reo, barChairsPerM2: e.target.value } })
                      }
                    />
                    <span className="text-sm text-muted-foreground">/m²</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm">@</span>
                    <Input
                      type="number"
                      className="w-20"
                      value={data.reo.barChairPrice}
                      onChange={(e) =>
                        onChange({ ...data, reo: { ...data.reo, barChairPrice: e.target.value } })
                      }
                    />
                    <span className="text-sm text-muted-foreground">each</span>
                  </div>
                </>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Vapour Barrier */}
        <AccordionItem value="vapour" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Vapour Barrier</span>
              {data.vapourBarrier.include && calculations.vbArea > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {calculations.vbArea.toFixed(1)}m² = {formatCurrency(calculations.vbCost)}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <div className="flex items-center gap-2">
              <Switch
                id="includeVB"
                checked={data.vapourBarrier.include}
                onCheckedChange={(c) =>
                  onChange({ ...data, vapourBarrier: { ...data.vapourBarrier, include: c } })
                }
              />
              <Label htmlFor="includeVB">Include vapour barrier</Label>
            </div>
            {data.vapourBarrier.include && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price per m²</Label>
                  <Input
                    type="number"
                    value={data.vapourBarrier.pricePerM2}
                    onChange={(e) =>
                      onChange({
                        ...data,
                        vapourBarrier: { ...data.vapourBarrier, pricePerM2: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Overlap %</Label>
                  <Input
                    type="number"
                    value={data.vapourBarrier.overlapPercent}
                    onChange={(e) =>
                      onChange({
                        ...data,
                        vapourBarrier: { ...data.vapourBarrier, overlapPercent: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Formwork & Pump */}
        <AccordionItem value="extras" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              <span>Formwork & Pump</span>
              {(calculations.formworkCost > 0 || calculations.pumpCost > 0) && (
                <Badge variant="secondary" className="ml-2">
                  {formatCurrency(calculations.formworkCost + calculations.pumpCost)}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Formwork (linear m)</Label>
                <Input
                  type="number"
                  value={data.formwork.linearMeters}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      formwork: { ...data.formwork, linearMeters: e.target.value },
                    })
                  }
                  placeholder="Perimeter in meters"
                />
              </div>
              <div className="space-y-2">
                <Label>Price per m</Label>
                <Input
                  type="number"
                  value={data.formwork.pricePerM}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      formwork: { ...data.formwork, pricePerM: e.target.value },
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="includePump"
                  checked={data.pump.include}
                  onCheckedChange={(c) =>
                    onChange({ ...data, pump: { ...data.pump, include: c } })
                  }
                />
                <Label htmlFor="includePump">Include concrete pump</Label>
              </div>
              {data.pump.include && (
                <div className="flex items-center gap-1">
                  <span className="text-sm">Cost:</span>
                  <Input
                    type="number"
                    className="w-24"
                    value={data.pump.pumpCost}
                    onChange={(e) =>
                      onChange({ ...data, pump: { ...data.pump, pumpCost: e.target.value } })
                    }
                  />
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Summary Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Material Cost Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Concrete ({calculations.volumeWithWastage.toFixed(2)}m³)</span>
            <span>{formatCurrency(calculations.concreteCost)}</span>
          </div>
          <div className="flex justify-between">
            <span>Reinforcement ({calculations.reoSheets} sheets + chairs)</span>
            <span>{formatCurrency(calculations.totalReoCost)}</span>
          </div>
          {calculations.vbCost > 0 && (
            <div className="flex justify-between">
              <span>Vapour Barrier ({calculations.vbArea.toFixed(1)}m²)</span>
              <span>{formatCurrency(calculations.vbCost)}</span>
            </div>
          )}
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
          <div className="flex justify-between font-semibold pt-2 border-t">
            <span>Materials Subtotal</span>
            <span>{formatCurrency(calculations.subtotal)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Export calculation helper for parent component
export function calculateHouseSlabTotals(data: HouseSlabData) {
  const sectionCalcs = data.sections.map((s) => {
    const l = parseFloat(s.length) || 0;
    const w = parseFloat(s.width) || 0;
    const t = (parseFloat(s.thickness) || 0) / 1000;
    return { area: l * w, volume: l * w * t };
  });
  const totalSlabArea = sectionCalcs.reduce((sum, s) => sum + s.area, 0);
  const totalSlabVolume = sectionCalcs.reduce((sum, s) => sum + s.volume, 0);

  const edgeBeamVolume = data.edgeBeams.reduce((sum, e) => {
    const l = parseFloat(e.length) || 0;
    const w = (parseFloat(e.width) || 0) / 1000;
    const d = (parseFloat(e.depth) || 0) / 1000;
    return sum + l * w * d;
  }, 0);

  const rebateVolume = data.rebates.reduce((sum, r) => {
    const l = parseFloat(r.length) || 0;
    const w = parseFloat(r.width) || 0;
    const d = (parseFloat(r.depth) || 0) / 1000;
    return sum + l * w * d;
  }, 0);

  const netVolume = totalSlabVolume + edgeBeamVolume - rebateVolume;
  const wastage = (parseFloat(data.concrete.wastagePercent) || 0) / 100;
  const volumeWithWastage = netVolume * (1 + wastage);
  const concreteCost = volumeWithWastage * (parseFloat(data.concrete.pricePerM3) || 0);

  const selectedMesh = REO_MESH_TYPES.find((m) => m.id === data.reo.meshType) || REO_MESH_TYPES[2];
  const reoOverlap = 1 + (parseFloat(data.reo.overlapPercent) || 0) / 100;
  const reoSheets = Math.ceil((totalSlabArea * reoOverlap) / selectedMesh.area);
  const reoCost = reoSheets * (parseFloat(data.reo.pricePerSheet) || 0);
  const barChairs = data.reo.includeBarChairs
    ? Math.ceil(totalSlabArea * (parseFloat(data.reo.barChairsPerM2) || 0))
    : 0;
  const barChairCost = barChairs * (parseFloat(data.reo.barChairPrice) || 0);

  const vbOverlap = 1 + (parseFloat(data.vapourBarrier.overlapPercent) || 0) / 100;
  const vbArea = data.vapourBarrier.include ? totalSlabArea * vbOverlap : 0;
  const vbCost = vbArea * (parseFloat(data.vapourBarrier.pricePerM2) || 0);

  const formworkCost =
    (parseFloat(data.formwork.linearMeters) || 0) * (parseFloat(data.formwork.pricePerM) || 0);
  const pumpCost = data.pump.include ? parseFloat(data.pump.pumpCost) || 0 : 0;

  // Labour calculations
  const labour = data.labour;
  const hourlyRate = parseFloat(labour.hourlyRate) || 0;
  let labourTotalManHours = 0;

  if (labour.useGuided) {
    const edgeFormwork = (parseFloat(labour.edgeFormworkMen) || 0) * (parseFloat(labour.edgeFormworkHours) || 0);
    const slabPrep = (parseFloat(labour.slabPrepMen) || 0) * (parseFloat(labour.slabPrepHours) || 0);
    const meshLaying = (parseFloat(labour.meshLayingMen) || 0) * (parseFloat(labour.meshLayingHours) || 0);
    const concretePlacement = (parseFloat(labour.concretePlacementMen) || 0) * (parseFloat(labour.concretePlacementHours) || 0);
    const pumpHours = parseFloat(labour.pumpHours) || 0;
    const waitingHours = (parseFloat(labour.concreteWaitingMinutes) || 0) / 60;
    labourTotalManHours = edgeFormwork + slabPrep + meshLaying + concretePlacement + pumpHours + waitingHours;
  } else {
    labourTotalManHours = (parseFloat(labour.manualMen) || 0) * (parseFloat(labour.manualHours) || 0);
  }

  const labourCost = labourTotalManHours * hourlyRate;

  return {
    totalSlabArea,
    volumeWithWastage,
    concreteCost,
    reoSheets,
    reoCost: reoCost + barChairCost,
    vbCost,
    formworkCost,
    pumpCost,
    labourTotalManHours,
    labourCost,
    subtotal: concreteCost + reoCost + barChairCost + vbCost + formworkCost + pumpCost + labourCost,
    mpaStrength: data.concrete.mpaStrength,
    slump: data.concrete.slump,
    meshType: data.reo.meshType,
  };
}
