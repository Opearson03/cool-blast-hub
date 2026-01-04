import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Trash2, EyeOff, Layers, Square, ShieldCheck, Truck, Users, DollarSign, Calendar } from "lucide-react";

// ============= CONSTANTS =============

export const MPA_STRENGTHS = [
  { value: "20", label: "20 MPa" },
  { value: "25", label: "25 MPa" },
  { value: "32", label: "32 MPa" },
  { value: "40", label: "40 MPa" },
  { value: "50", label: "50 MPa" },
];

export const MESH_TYPES = [
  { id: "SL62", label: "SL62 (6.0mm)", area: 14.4, defaultPrice: 45 },
  { id: "SL72", label: "SL72 (7.0mm)", area: 14.4, defaultPrice: 55 },
  { id: "SL82", label: "SL82 (8.0mm)", area: 14.4, defaultPrice: 70 },
  { id: "SL92", label: "SL92 (9.0mm)", area: 14.4, defaultPrice: 90 },
  { id: "SL102", label: "SL102 (10.0mm)", area: 14.4, defaultPrice: 110 },
];

export const TRENCH_MESH_TYPES = [
  { id: "F62", label: "F62 Trench Mesh", kgPerM: 1.58, defaultPrice: 12 },
  { id: "F72", label: "F72 Trench Mesh", kgPerM: 2.16, defaultPrice: 18 },
  { id: "F82", label: "F82 Trench Mesh", kgPerM: 2.84, defaultPrice: 24 },
  { id: "F92", label: "F92 Trench Mesh", kgPerM: 3.60, defaultPrice: 32 },
];

export const REBAR_SIZES = [
  { id: "N10", label: "N10 (10mm)", kgPerM: 0.617, defaultPrice: 1.85 },
  { id: "N12", label: "N12 (12mm)", kgPerM: 0.888, defaultPrice: 2.20 },
  { id: "N16", label: "N16 (16mm)", kgPerM: 1.58, defaultPrice: 3.50 },
  { id: "N20", label: "N20 (20mm)", kgPerM: 2.47, defaultPrice: 5.20 },
  { id: "N24", label: "N24 (24mm)", kgPerM: 3.55, defaultPrice: 7.50 },
  { id: "N28", label: "N28 (28mm)", kgPerM: 4.83, defaultPrice: 10.20 },
  { id: "N32", label: "N32 (32mm)", kgPerM: 6.31, defaultPrice: 13.30 },
  { id: "N36", label: "N36 (36mm)", kgPerM: 7.99, defaultPrice: 16.85 },
];

export const LIGATURE_SIZES = [
  { id: "R6", label: "R6 (6mm)", kgPerM: 0.222, defaultPrice: 0.50 },
  { id: "R8", label: "R8 (8mm)", kgPerM: 0.395, defaultPrice: 0.75 },
  { id: "R10", label: "R10 (10mm)", kgPerM: 0.617, defaultPrice: 1.00 },
  { id: "R12", label: "R12 (12mm)", kgPerM: 0.888, defaultPrice: 1.50 },
];

// ============= INTERFACES =============

export interface BeamType {
  id: string;
  name: string;
  linearMeters: string;
  width: string;
  height: string;
  bottomReo: string;
  topReo: string;
  hasLigatures: boolean;
  ligatureSize: string;
  ligatureCentres: string;
  internalCorners: string;
  externalCorners: string;
}

export interface StripFootingType {
  id: string;
  name: string;
  linearMeters: string;
  width: string;
  height: string;
  bottomReo: string;
  topReo: string;
  hasLigatures: boolean;
  ligatureSize: string;
  ligatureCentres: string;
  internalCorners: string;
  externalCorners: string;
}

export interface PourDetail {
  id: string;
  name: string;
  crewSize: string;
  hoursPerMan: string;
  waitingMinutes: string;
  offsiteWashout: boolean;
  washoutCost: string;
}

export interface AdditionalCostItem {
  id: string;
  description: string;
  cost: string;
}

export interface RaftSlabData {
  // Raft slab core
  raftArea: string;
  concreteStrength: string;
  slabThickness: string;
  meshType: string;
  polyMembrane: boolean;
  polyLayers: string;
  detailedExcavation: boolean;
  
  // Edge beams (EB1-EB5)
  edgeBeamCount: string;
  edgeBeams: BeamType[];
  
  // Internal beams (IB1-IB5)
  internalBeamCount: string;
  internalBeams: BeamType[];
  
  // Additional strip footings
  hasStripFootings: boolean;
  stripFootings: StripFootingType[];
  
  // Additional material costs
  additionalMaterialCosts: AdditionalCostItem[];
  
  // Labour - Slab Prep
  slabPrepCrewSize: string;
  slabPrepDays: string;
  slabPrepHoursPerDay: string;
  
  // Multi-pour support
  pourCount: string;
  pours: PourDetail[];
  
  // Delivery costs
  concreteDeliveryCost: string;
  meshDeliveryCost: string;
  otherDeliveryCost: string;
  
  // Additional costs
  additionalCosts: AdditionalCostItem[];
  
  // Markup
  materialsMarkupPercent: string;
  labourMarkupPercent: string;
  
  // Pricing
  concretePrice: string;
  meshPrice: string;
  polyPrice: string;
  hourlyRate: string;
  wastagePercent: string;
}

export const initialRaftSlabData: RaftSlabData = {
  raftArea: "",
  concreteStrength: "32",
  slabThickness: "100",
  meshType: "SL82",
  polyMembrane: true,
  polyLayers: "1",
  detailedExcavation: false,
  
  edgeBeamCount: "1",
  edgeBeams: [
    createEmptyBeam("1", "EB1"),
  ],
  
  internalBeamCount: "0",
  internalBeams: [],
  
  hasStripFootings: false,
  stripFootings: [],
  
  additionalMaterialCosts: [],
  
  slabPrepCrewSize: "4",
  slabPrepDays: "",
  slabPrepHoursPerDay: "8",
  
  pourCount: "1",
  pours: [
    createEmptyPour("1", "Pour 1"),
  ],
  
  concreteDeliveryCost: "",
  meshDeliveryCost: "",
  otherDeliveryCost: "",
  
  additionalCosts: [],
  
  materialsMarkupPercent: "15",
  labourMarkupPercent: "15",
  
  concretePrice: "280",
  meshPrice: "70",
  polyPrice: "2.50",
  hourlyRate: "85",
  wastagePercent: "5",
};

function createEmptyBeam(id: string, name: string): BeamType {
  return {
    id,
    name,
    linearMeters: "",
    width: "300",
    height: "450",
    bottomReo: "F72",
    topReo: "N12",
    hasLigatures: false,
    ligatureSize: "R10",
    ligatureCentres: "200",
    internalCorners: "0",
    externalCorners: "0",
  };
}

function createEmptyPour(id: string, name: string): PourDetail {
  return {
    id,
    name,
    crewSize: "4",
    hoursPerMan: "",
    waitingMinutes: "",
    offsiteWashout: false,
    washoutCost: "150",
  };
}

function createEmptyStripFooting(id: string, name: string): StripFootingType {
  return {
    id,
    name,
    linearMeters: "",
    width: "450",
    height: "300",
    bottomReo: "F72",
    topReo: "N12",
    hasLigatures: false,
    ligatureSize: "R10",
    ligatureCentres: "200",
    internalCorners: "0",
    externalCorners: "0",
  };
}

interface RaftSlabCalculatorProps {
  data: RaftSlabData;
  onChange: (data: RaftSlabData) => void;
}

export function RaftSlabCalculator({ data, onChange }: RaftSlabCalculatorProps) {
  // ============= HELPERS =============
  
  const updateEdgeBeam = (id: string, field: keyof BeamType, value: string | boolean) => {
    onChange({
      ...data,
      edgeBeams: data.edgeBeams.map((b) =>
        b.id === id ? { ...b, [field]: value } : b
      ),
    });
  };

  const updateInternalBeam = (id: string, field: keyof BeamType, value: string | boolean) => {
    onChange({
      ...data,
      internalBeams: data.internalBeams.map((b) =>
        b.id === id ? { ...b, [field]: value } : b
      ),
    });
  };

  const updateStripFooting = (id: string, field: keyof StripFootingType, value: string | boolean) => {
    onChange({
      ...data,
      stripFootings: data.stripFootings.map((f) =>
        f.id === id ? { ...f, [field]: value } : f
      ),
    });
  };

  const updatePour = (id: string, field: keyof PourDetail, value: string | boolean) => {
    onChange({
      ...data,
      pours: data.pours.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      ),
    });
  };

  const handleEdgeBeamCountChange = (count: string) => {
    const numCount = parseInt(count) || 0;
    const currentCount = data.edgeBeams.length;
    
    let newBeams = [...data.edgeBeams];
    if (numCount > currentCount) {
      for (let i = currentCount; i < numCount; i++) {
        newBeams.push(createEmptyBeam(Date.now().toString() + i, `EB${i + 1}`));
      }
    } else if (numCount < currentCount) {
      newBeams = newBeams.slice(0, numCount);
    }
    
    onChange({ ...data, edgeBeamCount: count, edgeBeams: newBeams });
  };

  const handleInternalBeamCountChange = (count: string) => {
    const numCount = parseInt(count) || 0;
    const currentCount = data.internalBeams.length;
    
    let newBeams = [...data.internalBeams];
    if (numCount > currentCount) {
      for (let i = currentCount; i < numCount; i++) {
        newBeams.push(createEmptyBeam(Date.now().toString() + i, `IB${i + 1}`));
      }
    } else if (numCount < currentCount) {
      newBeams = newBeams.slice(0, numCount);
    }
    
    onChange({ ...data, internalBeamCount: count, internalBeams: newBeams });
  };

  const handlePourCountChange = (count: string) => {
    const numCount = parseInt(count) || 1;
    const currentCount = data.pours.length;
    
    let newPours = [...data.pours];
    if (numCount > currentCount) {
      for (let i = currentCount; i < numCount; i++) {
        newPours.push(createEmptyPour(Date.now().toString() + i, `Pour ${i + 1}`));
      }
    } else if (numCount < currentCount) {
      newPours = newPours.slice(0, numCount);
    }
    
    onChange({ ...data, pourCount: count, pours: newPours });
  };

  const addStripFooting = () => {
    const newFooting = createEmptyStripFooting(
      Date.now().toString(),
      `SF${data.stripFootings.length + 1}`
    );
    onChange({ ...data, stripFootings: [...data.stripFootings, newFooting] });
  };

  const removeStripFooting = (id: string) => {
    onChange({ ...data, stripFootings: data.stripFootings.filter((f) => f.id !== id) });
  };

  const addAdditionalMaterialCost = () => {
    onChange({
      ...data,
      additionalMaterialCosts: [
        ...data.additionalMaterialCosts,
        { id: Date.now().toString(), description: "", cost: "" },
      ],
    });
  };

  const removeAdditionalMaterialCost = (id: string) => {
    onChange({
      ...data,
      additionalMaterialCosts: data.additionalMaterialCosts.filter((c) => c.id !== id),
    });
  };

  const addAdditionalCost = () => {
    onChange({
      ...data,
      additionalCosts: [
        ...data.additionalCosts,
        { id: Date.now().toString(), description: "", cost: "" },
      ],
    });
  };

  const removeAdditionalCost = (id: string) => {
    onChange({
      ...data,
      additionalCosts: data.additionalCosts.filter((c) => c.id !== id),
    });
  };

  // ============= CALCULATIONS =============
  
  const calculations = useMemo(() => {
    const raftArea = parseFloat(data.raftArea) || 0;
    const slabThickness = (parseFloat(data.slabThickness) || 0) / 1000;
    const slabVolume = raftArea * slabThickness;
    
    // Mesh calculations
    const selectedMesh = MESH_TYPES.find((m) => m.id === data.meshType) || MESH_TYPES[2];
    const meshSheets = Math.ceil((raftArea * 1.1) / selectedMesh.area); // 10% overlap
    const meshCost = meshSheets * (parseFloat(data.meshPrice) || selectedMesh.defaultPrice);
    
    // Poly membrane
    const polyCost = data.polyMembrane 
      ? raftArea * (parseInt(data.polyLayers) || 1) * (parseFloat(data.polyPrice) || 2.5)
      : 0;
    
    // Edge beam calculations
    let totalEdgeBeamVolume = 0;
    let totalEdgeBeamReoCost = 0;
    let totalEdgeBeamExcavationVolume = 0;
    
    data.edgeBeams.forEach((beam) => {
      const meters = parseFloat(beam.linearMeters) || 0;
      const width = (parseFloat(beam.width) || 0) / 1000;
      const height = (parseFloat(beam.height) || 0) / 1000;
      const volume = meters * width * height;
      totalEdgeBeamVolume += volume;
      totalEdgeBeamExcavationVolume += volume;
      
      // Reo cost (simplified - bottom and top)
      const bottomReo = TRENCH_MESH_TYPES.find((t) => t.id === beam.bottomReo) || REBAR_SIZES.find((r) => r.id === beam.bottomReo);
      const topReo = REBAR_SIZES.find((r) => r.id === beam.topReo);
      if (bottomReo) totalEdgeBeamReoCost += meters * bottomReo.defaultPrice;
      if (topReo) totalEdgeBeamReoCost += meters * topReo.defaultPrice;
      
      // Ligatures
      if (beam.hasLigatures) {
        const centres = (parseFloat(beam.ligatureCentres) || 200) / 1000;
        const ligatureCount = Math.ceil(meters / centres);
        const ligature = LIGATURE_SIZES.find((l) => l.id === beam.ligatureSize);
        if (ligature) {
          const ligatureLength = (width + height) * 2 + 0.2; // perimeter + laps
          totalEdgeBeamReoCost += ligatureCount * ligatureLength * ligature.defaultPrice;
        }
      }
    });
    
    // Internal beam calculations
    let totalInternalBeamVolume = 0;
    let totalInternalBeamReoCost = 0;
    let totalInternalBeamExcavationVolume = 0;
    
    data.internalBeams.forEach((beam) => {
      const meters = parseFloat(beam.linearMeters) || 0;
      const width = (parseFloat(beam.width) || 0) / 1000;
      const height = (parseFloat(beam.height) || 0) / 1000;
      const volume = meters * width * height;
      totalInternalBeamVolume += volume;
      totalInternalBeamExcavationVolume += volume;
      
      const bottomReo = TRENCH_MESH_TYPES.find((t) => t.id === beam.bottomReo) || REBAR_SIZES.find((r) => r.id === beam.bottomReo);
      const topReo = REBAR_SIZES.find((r) => r.id === beam.topReo);
      if (bottomReo) totalInternalBeamReoCost += meters * bottomReo.defaultPrice;
      if (topReo) totalInternalBeamReoCost += meters * topReo.defaultPrice;
      
      if (beam.hasLigatures) {
        const centres = (parseFloat(beam.ligatureCentres) || 200) / 1000;
        const ligatureCount = Math.ceil(meters / centres);
        const ligature = LIGATURE_SIZES.find((l) => l.id === beam.ligatureSize);
        if (ligature) {
          const ligatureLength = (width + height) * 2 + 0.2;
          totalInternalBeamReoCost += ligatureCount * ligatureLength * ligature.defaultPrice;
        }
      }
    });
    
    // Strip footing calculations
    let totalStripFootingVolume = 0;
    let totalStripFootingReoCost = 0;
    let totalStripFootingExcavationVolume = 0;
    
    data.stripFootings.forEach((footing) => {
      const meters = parseFloat(footing.linearMeters) || 0;
      const width = (parseFloat(footing.width) || 0) / 1000;
      const height = (parseFloat(footing.height) || 0) / 1000;
      const volume = meters * width * height;
      totalStripFootingVolume += volume;
      totalStripFootingExcavationVolume += volume;
      
      const bottomReo = TRENCH_MESH_TYPES.find((t) => t.id === footing.bottomReo) || REBAR_SIZES.find((r) => r.id === footing.bottomReo);
      const topReo = REBAR_SIZES.find((r) => r.id === footing.topReo);
      if (bottomReo) totalStripFootingReoCost += meters * bottomReo.defaultPrice;
      if (topReo) totalStripFootingReoCost += meters * topReo.defaultPrice;
      
      if (footing.hasLigatures) {
        const centres = (parseFloat(footing.ligatureCentres) || 200) / 1000;
        const ligatureCount = Math.ceil(meters / centres);
        const ligature = LIGATURE_SIZES.find((l) => l.id === footing.ligatureSize);
        if (ligature) {
          const ligatureLength = (width + height) * 2 + 0.2;
          totalStripFootingReoCost += ligatureCount * ligatureLength * ligature.defaultPrice;
        }
      }
    });
    
    // Total concrete
    const totalConcreteVolume = slabVolume + totalEdgeBeamVolume + totalInternalBeamVolume + totalStripFootingVolume;
    const wastage = (parseFloat(data.wastagePercent) || 5) / 100;
    const volumeWithWastage = totalConcreteVolume * (1 + wastage);
    const concreteCost = volumeWithWastage * (parseFloat(data.concretePrice) || 280);
    
    // Total excavation volume (if doing detailed excavation)
    const totalExcavationVolume = data.detailedExcavation 
      ? totalEdgeBeamExcavationVolume + totalInternalBeamExcavationVolume + totalStripFootingExcavationVolume
      : 0;
    
    // Total reinforcement cost
    const totalReoCost = meshCost + totalEdgeBeamReoCost + totalInternalBeamReoCost + totalStripFootingReoCost;
    
    // Additional material costs
    const additionalMaterialsCost = data.additionalMaterialCosts.reduce(
      (sum, c) => sum + (parseFloat(c.cost) || 0), 0
    );
    
    // Delivery costs
    const deliveryCosts = (parseFloat(data.concreteDeliveryCost) || 0) +
      (parseFloat(data.meshDeliveryCost) || 0) +
      (parseFloat(data.otherDeliveryCost) || 0);
    
    // Materials subtotal
    const materialsSubtotal = concreteCost + totalReoCost + polyCost + additionalMaterialsCost + deliveryCosts;
    
    // Materials with markup
    const materialsMarkup = materialsSubtotal * ((parseFloat(data.materialsMarkupPercent) || 0) / 100);
    const materialsTotal = materialsSubtotal + materialsMarkup;
    
    // Labour calculations
    const hourlyRate = parseFloat(data.hourlyRate) || 85;
    
    // Slab prep labour
    const slabPrepManHours = (parseFloat(data.slabPrepCrewSize) || 0) *
      (parseFloat(data.slabPrepDays) || 0) *
      (parseFloat(data.slabPrepHoursPerDay) || 8);
    const slabPrepCost = slabPrepManHours * hourlyRate;
    
    // Pour labour
    let pourLabourManHours = 0;
    let pourWashoutCost = 0;
    data.pours.forEach((pour) => {
      const crewSize = parseFloat(pour.crewSize) || 0;
      const hours = parseFloat(pour.hoursPerMan) || 0;
      const waiting = (parseFloat(pour.waitingMinutes) || 0) / 60;
      pourLabourManHours += crewSize * (hours + waiting);
      if (pour.offsiteWashout) {
        pourWashoutCost += parseFloat(pour.washoutCost) || 150;
      }
    });
    const pourLabourCost = pourLabourManHours * hourlyRate;
    
    // Additional costs
    const additionalCostsTotal = data.additionalCosts.reduce(
      (sum, c) => sum + (parseFloat(c.cost) || 0), 0
    );
    
    // Labour subtotal
    const labourSubtotal = slabPrepCost + pourLabourCost + pourWashoutCost + additionalCostsTotal;
    
    // Labour with markup
    const labourMarkup = labourSubtotal * ((parseFloat(data.labourMarkupPercent) || 0) / 100);
    const labourTotal = labourSubtotal + labourMarkup;
    
    // Grand total
    const grandTotal = materialsTotal + labourTotal;
    
    return {
      raftArea,
      slabVolume,
      meshSheets,
      meshCost,
      polyCost,
      totalEdgeBeamVolume,
      totalEdgeBeamReoCost,
      totalInternalBeamVolume,
      totalInternalBeamReoCost,
      totalStripFootingVolume,
      totalStripFootingReoCost,
      totalConcreteVolume,
      volumeWithWastage,
      concreteCost,
      totalExcavationVolume,
      totalReoCost,
      additionalMaterialsCost,
      deliveryCosts,
      materialsSubtotal,
      materialsMarkup,
      materialsTotal,
      slabPrepManHours,
      slabPrepCost,
      pourLabourManHours,
      pourLabourCost,
      pourWashoutCost,
      additionalCostsTotal,
      labourSubtotal,
      labourMarkup,
      labourTotal,
      grandTotal,
    };
  }, [data]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(amount);

  // ============= RENDER BEAM FORM =============
  
  const renderBeamForm = (
    beam: BeamType,
    updateFn: (id: string, field: keyof BeamType, value: string | boolean) => void,
    prefix: string
  ) => (
    <Card key={beam.id} className="bg-muted/30">
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <Input
            value={beam.name}
            onChange={(e) => updateFn(beam.id, "name", e.target.value)}
            className="font-medium max-w-[120px]"
            placeholder={`${prefix}1`}
          />
        </div>
        
        {/* Dimensions */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Total (m)</Label>
            <Input
              type="number"
              step="0.1"
              value={beam.linearMeters}
              onChange={(e) => updateFn(beam.id, "linearMeters", e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Width (mm)</Label>
            <Input
              type="number"
              value={beam.width}
              onChange={(e) => updateFn(beam.id, "width", e.target.value)}
              placeholder="300"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Height (mm)</Label>
            <Input
              type="number"
              value={beam.height}
              onChange={(e) => updateFn(beam.id, "height", e.target.value)}
              placeholder="450"
            />
          </div>
        </div>
        
        {/* Reinforcement */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Bottom Reo</Label>
            <Select
              value={beam.bottomReo}
              onValueChange={(v) => updateFn(beam.id, "bottomReo", v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Trench Mesh</SelectLabel>
                  {TRENCH_MESH_TYPES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Reo Bars</SelectLabel>
                  {REBAR_SIZES.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Top Reo</Label>
            <Select
              value={beam.topReo}
              onValueChange={(v) => updateFn(beam.id, "topReo", v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REBAR_SIZES.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Ligatures */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Switch
              checked={beam.hasLigatures}
              onCheckedChange={(c) => updateFn(beam.id, "hasLigatures", c)}
            />
            <Label className="text-sm">Ligatures/Ties</Label>
          </div>
          {beam.hasLigatures && (
            <div className="grid grid-cols-2 gap-3 pl-4 border-l-2 border-muted">
              <div className="space-y-1">
                <Label className="text-xs">Size</Label>
                <Select
                  value={beam.ligatureSize}
                  onValueChange={(v) => updateFn(beam.id, "ligatureSize", v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LIGATURE_SIZES.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Centres (mm)</Label>
                <Input
                  type="number"
                  value={beam.ligatureCentres}
                  onChange={(e) => updateFn(beam.id, "ligatureCentres", e.target.value)}
                  placeholder="200"
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Corners */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Internal Corners</Label>
            <Input
              type="number"
              value={beam.internalCorners}
              onChange={(e) => updateFn(beam.id, "internalCorners", e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">External Corners</Label>
            <Input
              type="number"
              value={beam.externalCorners}
              onChange={(e) => updateFn(beam.id, "externalCorners", e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // ============= RENDER =============
  
  return (
    <div className="space-y-6">
      {/* Internal cost notice */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
        <EyeOff className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-700 dark:text-amber-400">
          <strong>Internal costs only</strong> — These prices are for your calculation. The client will only see the final quoted amount.
        </p>
      </div>

      <Accordion type="multiple" defaultValue={["raft-core", "edge-beams"]} className="space-y-4">
        {/* Raft Slab Core */}
        <AccordionItem value="raft-core" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>Raft Slab</span>
              {calculations.raftArea > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {calculations.raftArea.toFixed(1)}m² / {calculations.volumeWithWastage.toFixed(2)}m³
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter total raft slab area excluding patios, porch, paths etc.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Area (m²)</Label>
                <Input
                  type="number"
                  value={data.raftArea}
                  onChange={(e) => onChange({ ...data, raftArea: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Slab Thickness (mm)</Label>
                <Input
                  type="number"
                  value={data.slabThickness}
                  onChange={(e) => onChange({ ...data, slabThickness: e.target.value })}
                  placeholder="100"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Concrete Strength</Label>
                <Select
                  value={data.concreteStrength}
                  onValueChange={(v) => onChange({ ...data, concreteStrength: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MPA_STRENGTHS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reinforcement Mesh</Label>
                <Select
                  value={data.meshType}
                  onValueChange={(v) => onChange({ ...data, meshType: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MESH_TYPES.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Poly Membrane */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={data.polyMembrane}
                  onCheckedChange={(c) => onChange({ ...data, polyMembrane: c })}
                />
                <Label>Poly membrane required?</Label>
              </div>
              {data.polyMembrane && (
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Layers:</Label>
                  <Select
                    value={data.polyLayers}
                    onValueChange={(v) => onChange({ ...data, polyLayers: v })}
                  >
                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            {/* Detailed Excavation */}
            <div className="flex items-center gap-2 pt-2">
              <Switch
                checked={data.detailedExcavation}
                onCheckedChange={(c) => onChange({ ...data, detailedExcavation: c })}
              />
              <Label>Are you completing the detailed excavation of the slab?</Label>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Edge Beams */}
        <AccordionItem value="edge-beams" className="border rounded-lg px-4">
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
            <div className="flex items-center gap-4">
              <Label>How many different edge beam types?</Label>
              <Select
                value={data.edgeBeamCount}
                onValueChange={handleEdgeBeamCountChange}
              >
                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Example: EB1 = brick rebate detail, EB2 = sliding door detail (no bricks)
            </p>
            
            {data.edgeBeams.map((beam) => renderBeamForm(beam, updateEdgeBeam, "EB"))}
          </AccordionContent>
        </AccordionItem>

        {/* Internal Beams */}
        <AccordionItem value="internal-beams" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Square className="w-4 h-4" />
              <span>Internal Beams</span>
              {calculations.totalInternalBeamVolume > 0 && (
                <Badge variant="secondary" className="ml-2">
                  +{calculations.totalInternalBeamVolume.toFixed(2)}m³
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <div className="flex items-center gap-4">
              <Label>How many different internal beam types?</Label>
              <Select
                value={data.internalBeamCount}
                onValueChange={handleInternalBeamCountChange}
              >
                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {data.internalBeams.map((beam) => renderBeamForm(beam, updateInternalBeam, "IB"))}
          </AccordionContent>
        </AccordionItem>

        {/* Strip Footings */}
        <AccordionItem value="strip-footings" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Square className="w-4 h-4" />
              <span>Additional Strip Footings</span>
              {calculations.totalStripFootingVolume > 0 && (
                <Badge variant="secondary" className="ml-2">
                  +{calculations.totalStripFootingVolume.toFixed(2)}m³
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <div className="flex items-center gap-3">
              <Switch
                checked={data.hasStripFootings}
                onCheckedChange={(c) => onChange({ ...data, hasStripFootings: c })}
              />
              <Label>Are there any additional strip footings?</Label>
            </div>
            
            {data.hasStripFootings && (
              <>
                {data.stripFootings.map((footing) => (
                  <Card key={footing.id} className="bg-muted/30">
                    <CardContent className="pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <Input
                          value={footing.name}
                          onChange={(e) => updateStripFooting(footing.id, "name", e.target.value)}
                          className="font-medium max-w-[120px]"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeStripFooting(footing.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Total (m)</Label>
                          <Input
                            type="number"
                            value={footing.linearMeters}
                            onChange={(e) => updateStripFooting(footing.id, "linearMeters", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Width (mm)</Label>
                          <Input
                            type="number"
                            value={footing.width}
                            onChange={(e) => updateStripFooting(footing.id, "width", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Height (mm)</Label>
                          <Input
                            type="number"
                            value={footing.height}
                            onChange={(e) => updateStripFooting(footing.id, "height", e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Bottom Reo</Label>
                          <Select
                            value={footing.bottomReo}
                            onValueChange={(v) => updateStripFooting(footing.id, "bottomReo", v)}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {TRENCH_MESH_TYPES.map((t) => (
                                <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                              ))}
                              {REBAR_SIZES.map((r) => (
                                <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Top Reo</Label>
                          <Select
                            value={footing.topReo}
                            onValueChange={(v) => updateStripFooting(footing.id, "topReo", v)}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {REBAR_SIZES.map((r) => (
                                <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={footing.hasLigatures}
                          onCheckedChange={(c) => updateStripFooting(footing.id, "hasLigatures", c)}
                        />
                        <Label className="text-sm">Ligatures/Ties</Label>
                      </div>
                      {footing.hasLigatures && (
                        <div className="grid grid-cols-2 gap-3 pl-4 border-l-2 border-muted">
                          <div className="space-y-1">
                            <Label className="text-xs">Size</Label>
                            <Select
                              value={footing.ligatureSize}
                              onValueChange={(v) => updateStripFooting(footing.id, "ligatureSize", v)}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {LIGATURE_SIZES.map((l) => (
                                  <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Centres (mm)</Label>
                            <Input
                              type="number"
                              value={footing.ligatureCentres}
                              onChange={(e) => updateStripFooting(footing.id, "ligatureCentres", e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Internal Corners</Label>
                          <Input
                            type="number"
                            value={footing.internalCorners}
                            onChange={(e) => updateStripFooting(footing.id, "internalCorners", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">External Corners</Label>
                          <Input
                            type="number"
                            value={footing.externalCorners}
                            onChange={(e) => updateStripFooting(footing.id, "externalCorners", e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addStripFooting} className="gap-1">
                  <Plus className="w-4 h-4" /> Add Strip Footing
                </Button>
              </>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Additional Material Costs */}
        <AccordionItem value="additional-materials" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>Additional Material Costs</span>
              {calculations.additionalMaterialsCost > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {formatCurrency(calculations.additionalMaterialsCost)}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Example: curved formwork, formply for dropped edge beams
            </p>
            
            {data.additionalMaterialCosts.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <Input
                  value={item.description}
                  onChange={(e) => onChange({
                    ...data,
                    additionalMaterialCosts: data.additionalMaterialCosts.map((c) =>
                      c.id === item.id ? { ...c, description: e.target.value } : c
                    ),
                  })}
                  placeholder="Description"
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={item.cost}
                  onChange={(e) => onChange({
                    ...data,
                    additionalMaterialCosts: data.additionalMaterialCosts.map((c) =>
                      c.id === item.id ? { ...c, cost: e.target.value } : c
                    ),
                  })}
                  placeholder="Cost"
                  className="w-28"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAdditionalMaterialCost(item.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
            
            <Button type="button" variant="outline" size="sm" onClick={addAdditionalMaterialCost} className="gap-1">
              <Plus className="w-4 h-4" /> Add Cost
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Slab Prep Labour */}
        <AccordionItem value="slab-prep" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Slab Preparation Labour</span>
              {calculations.slabPrepCost > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {calculations.slabPrepManHours.toFixed(1)} man-hrs = {formatCurrency(calculations.slabPrepCost)}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Crew Size (men)</Label>
                <Input
                  type="number"
                  value={data.slabPrepCrewSize}
                  onChange={(e) => onChange({ ...data, slabPrepCrewSize: e.target.value })}
                  placeholder="4"
                />
              </div>
              <div className="space-y-2">
                <Label>Days to prepare</Label>
                <Input
                  type="number"
                  value={data.slabPrepDays}
                  onChange={(e) => onChange({ ...data, slabPrepDays: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Hours per day</Label>
                <Input
                  type="number"
                  value={data.slabPrepHoursPerDay}
                  onChange={(e) => onChange({ ...data, slabPrepHoursPerDay: e.target.value })}
                  placeholder="8"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Multi-Pour */}
        <AccordionItem value="pours" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Concrete Pours</span>
              {calculations.pourLabourCost > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {calculations.pourLabourManHours.toFixed(1)} man-hrs = {formatCurrency(calculations.pourLabourCost)}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <div className="flex items-center gap-4">
              <Label>How many pours expected?</Label>
              <Select
                value={data.pourCount}
                onValueChange={handlePourCountChange}
              >
                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {data.pours.map((pour) => (
              <Card key={pour.id} className="bg-muted/30">
                <CardContent className="pt-4 space-y-3">
                  <Input
                    value={pour.name}
                    onChange={(e) => updatePour(pour.id, "name", e.target.value)}
                    className="font-medium max-w-[150px]"
                  />
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Crew Size</Label>
                      <Input
                        type="number"
                        value={pour.crewSize}
                        onChange={(e) => updatePour(pour.id, "crewSize", e.target.value)}
                        placeholder="4"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Hours per man</Label>
                      <Input
                        type="number"
                        value={pour.hoursPerMan}
                        onChange={(e) => updatePour(pour.id, "hoursPerMan", e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Waiting (mins)</Label>
                      <Input
                        type="number"
                        value={pour.waitingMinutes}
                        onChange={(e) => updatePour(pour.id, "waitingMinutes", e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={pour.offsiteWashout}
                      onCheckedChange={(c) => updatePour(pour.id, "offsiteWashout", c)}
                    />
                    <Label className="text-sm">Offsite pump washout required?</Label>
                    {pour.offsiteWashout && (
                      <Input
                        type="number"
                        value={pour.washoutCost}
                        onChange={(e) => updatePour(pour.id, "washoutCost", e.target.value)}
                        className="w-24"
                        placeholder="150"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* Delivery Costs */}
        <AccordionItem value="delivery" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              <span>Delivery Costs</span>
              {calculations.deliveryCosts > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {formatCurrency(calculations.deliveryCosts)}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Concrete Delivery</Label>
                <Input
                  type="number"
                  value={data.concreteDeliveryCost}
                  onChange={(e) => onChange({ ...data, concreteDeliveryCost: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Mesh/Reo Delivery</Label>
                <Input
                  type="number"
                  value={data.meshDeliveryCost}
                  onChange={(e) => onChange({ ...data, meshDeliveryCost: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Other Delivery</Label>
                <Input
                  type="number"
                  value={data.otherDeliveryCost}
                  onChange={(e) => onChange({ ...data, otherDeliveryCost: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Additional Costs */}
        <AccordionItem value="additional-costs" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>Additional Costs</span>
              {calculations.additionalCostsTotal > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {formatCurrency(calculations.additionalCostsTotal)}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            {data.additionalCosts.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <Input
                  value={item.description}
                  onChange={(e) => onChange({
                    ...data,
                    additionalCosts: data.additionalCosts.map((c) =>
                      c.id === item.id ? { ...c, description: e.target.value } : c
                    ),
                  })}
                  placeholder="Description"
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={item.cost}
                  onChange={(e) => onChange({
                    ...data,
                    additionalCosts: data.additionalCosts.map((c) =>
                      c.id === item.id ? { ...c, cost: e.target.value } : c
                    ),
                  })}
                  placeholder="Cost"
                  className="w-28"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAdditionalCost(item.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
            
            <Button type="button" variant="outline" size="sm" onClick={addAdditionalCost} className="gap-1">
              <Plus className="w-4 h-4" /> Add Cost
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Pricing & Markup */}
        <AccordionItem value="pricing" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>Pricing & Markup</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Concrete Price ($/m³)</Label>
                <Input
                  type="number"
                  value={data.concretePrice}
                  onChange={(e) => onChange({ ...data, concretePrice: e.target.value })}
                  placeholder="280"
                />
              </div>
              <div className="space-y-2">
                <Label>Mesh Price ($/sheet)</Label>
                <Input
                  type="number"
                  value={data.meshPrice}
                  onChange={(e) => onChange({ ...data, meshPrice: e.target.value })}
                  placeholder="70"
                />
              </div>
              <div className="space-y-2">
                <Label>Poly Price ($/m²)</Label>
                <Input
                  type="number"
                  value={data.polyPrice}
                  onChange={(e) => onChange({ ...data, polyPrice: e.target.value })}
                  placeholder="2.50"
                />
              </div>
              <div className="space-y-2">
                <Label>Wastage %</Label>
                <Input
                  type="number"
                  value={data.wastagePercent}
                  onChange={(e) => onChange({ ...data, wastagePercent: e.target.value })}
                  placeholder="5"
                />
              </div>
              <div className="space-y-2">
                <Label>Hourly Rate ($/hr)</Label>
                <Input
                  type="number"
                  value={data.hourlyRate}
                  onChange={(e) => onChange({ ...data, hourlyRate: e.target.value })}
                  placeholder="85"
                />
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Markup</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Materials Markup %</Label>
                  <Input
                    type="number"
                    value={data.materialsMarkupPercent}
                    onChange={(e) => onChange({ ...data, materialsMarkupPercent: e.target.value })}
                    placeholder="15"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Labour Markup %</Label>
                  <Input
                    type="number"
                    value={data.labourMarkupPercent}
                    onChange={(e) => onChange({ ...data, labourMarkupPercent: e.target.value })}
                    placeholder="15"
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Summary Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Cost Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="space-y-1">
            <p className="font-medium text-muted-foreground">Materials</p>
            <div className="flex justify-between pl-3">
              <span>Concrete ({calculations.volumeWithWastage.toFixed(2)}m³)</span>
              <span>{formatCurrency(calculations.concreteCost)}</span>
            </div>
            <div className="flex justify-between pl-3">
              <span>Mesh ({calculations.meshSheets} sheets)</span>
              <span>{formatCurrency(calculations.meshCost)}</span>
            </div>
            <div className="flex justify-between pl-3">
              <span>Beam/Footing Reo</span>
              <span>{formatCurrency(calculations.totalEdgeBeamReoCost + calculations.totalInternalBeamReoCost + calculations.totalStripFootingReoCost)}</span>
            </div>
            {calculations.polyCost > 0 && (
              <div className="flex justify-between pl-3">
                <span>Poly Membrane</span>
                <span>{formatCurrency(calculations.polyCost)}</span>
              </div>
            )}
            {calculations.deliveryCosts > 0 && (
              <div className="flex justify-between pl-3">
                <span>Delivery</span>
                <span>{formatCurrency(calculations.deliveryCosts)}</span>
              </div>
            )}
            {calculations.additionalMaterialsCost > 0 && (
              <div className="flex justify-between pl-3">
                <span>Additional Materials</span>
                <span>{formatCurrency(calculations.additionalMaterialsCost)}</span>
              </div>
            )}
            <div className="flex justify-between pl-3 text-muted-foreground">
              <span>Materials Subtotal</span>
              <span>{formatCurrency(calculations.materialsSubtotal)}</span>
            </div>
            {calculations.materialsMarkup > 0 && (
              <div className="flex justify-between pl-3 text-muted-foreground">
                <span>Markup ({data.materialsMarkupPercent}%)</span>
                <span>+{formatCurrency(calculations.materialsMarkup)}</span>
              </div>
            )}
            <div className="flex justify-between pl-3 font-medium">
              <span>Materials Total</span>
              <span>{formatCurrency(calculations.materialsTotal)}</span>
            </div>
          </div>
          
          <div className="space-y-1 pt-2 border-t">
            <p className="font-medium text-muted-foreground">Labour</p>
            {calculations.slabPrepCost > 0 && (
              <div className="flex justify-between pl-3">
                <span>Slab Prep ({calculations.slabPrepManHours.toFixed(1)} man-hrs)</span>
                <span>{formatCurrency(calculations.slabPrepCost)}</span>
              </div>
            )}
            {calculations.pourLabourCost > 0 && (
              <div className="flex justify-between pl-3">
                <span>Pour Labour ({calculations.pourLabourManHours.toFixed(1)} man-hrs)</span>
                <span>{formatCurrency(calculations.pourLabourCost)}</span>
              </div>
            )}
            {calculations.pourWashoutCost > 0 && (
              <div className="flex justify-between pl-3">
                <span>Pump Washout</span>
                <span>{formatCurrency(calculations.pourWashoutCost)}</span>
              </div>
            )}
            {calculations.additionalCostsTotal > 0 && (
              <div className="flex justify-between pl-3">
                <span>Additional Costs</span>
                <span>{formatCurrency(calculations.additionalCostsTotal)}</span>
              </div>
            )}
            <div className="flex justify-between pl-3 text-muted-foreground">
              <span>Labour Subtotal</span>
              <span>{formatCurrency(calculations.labourSubtotal)}</span>
            </div>
            {calculations.labourMarkup > 0 && (
              <div className="flex justify-between pl-3 text-muted-foreground">
                <span>Markup ({data.labourMarkupPercent}%)</span>
                <span>+{formatCurrency(calculations.labourMarkup)}</span>
              </div>
            )}
            <div className="flex justify-between pl-3 font-medium">
              <span>Labour Total</span>
              <span>{formatCurrency(calculations.labourTotal)}</span>
            </div>
          </div>
          
          <div className="flex justify-between font-semibold pt-3 border-t text-base">
            <span>Grand Total (ex GST)</span>
            <span>{formatCurrency(calculations.grandTotal)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Export calculation helper
export function calculateRaftSlabTotals(data: RaftSlabData) {
  const raftArea = parseFloat(data.raftArea) || 0;
  const slabThickness = (parseFloat(data.slabThickness) || 0) / 1000;
  const slabVolume = raftArea * slabThickness;
  
  const selectedMesh = MESH_TYPES.find((m) => m.id === data.meshType) || MESH_TYPES[2];
  const meshSheets = Math.ceil((raftArea * 1.1) / selectedMesh.area);
  const meshCost = meshSheets * (parseFloat(data.meshPrice) || selectedMesh.defaultPrice);
  
  const polyCost = data.polyMembrane 
    ? raftArea * (parseInt(data.polyLayers) || 1) * (parseFloat(data.polyPrice) || 2.5)
    : 0;
  
  let totalBeamVolume = 0;
  let totalReoCost = meshCost;
  
  [...data.edgeBeams, ...data.internalBeams].forEach((beam) => {
    const meters = parseFloat(beam.linearMeters) || 0;
    const width = (parseFloat(beam.width) || 0) / 1000;
    const height = (parseFloat(beam.height) || 0) / 1000;
    totalBeamVolume += meters * width * height;
    
    const bottomReo = TRENCH_MESH_TYPES.find((t) => t.id === beam.bottomReo) || REBAR_SIZES.find((r) => r.id === beam.bottomReo);
    const topReo = REBAR_SIZES.find((r) => r.id === beam.topReo);
    if (bottomReo) totalReoCost += meters * bottomReo.defaultPrice;
    if (topReo) totalReoCost += meters * topReo.defaultPrice;
  });
  
  data.stripFootings.forEach((footing) => {
    const meters = parseFloat(footing.linearMeters) || 0;
    const width = (parseFloat(footing.width) || 0) / 1000;
    const height = (parseFloat(footing.height) || 0) / 1000;
    totalBeamVolume += meters * width * height;
    
    const bottomReo = TRENCH_MESH_TYPES.find((t) => t.id === footing.bottomReo) || REBAR_SIZES.find((r) => r.id === footing.bottomReo);
    const topReo = REBAR_SIZES.find((r) => r.id === footing.topReo);
    if (bottomReo) totalReoCost += meters * bottomReo.defaultPrice;
    if (topReo) totalReoCost += meters * topReo.defaultPrice;
  });
  
  const totalConcreteVolume = slabVolume + totalBeamVolume;
  const wastage = (parseFloat(data.wastagePercent) || 5) / 100;
  const volumeWithWastage = totalConcreteVolume * (1 + wastage);
  const concreteCost = volumeWithWastage * (parseFloat(data.concretePrice) || 280);
  
  const additionalMaterialsCost = data.additionalMaterialCosts.reduce(
    (sum, c) => sum + (parseFloat(c.cost) || 0), 0
  );
  
  const deliveryCosts = (parseFloat(data.concreteDeliveryCost) || 0) +
    (parseFloat(data.meshDeliveryCost) || 0) +
    (parseFloat(data.otherDeliveryCost) || 0);
  
  const materialsSubtotal = concreteCost + totalReoCost + polyCost + additionalMaterialsCost + deliveryCosts;
  const materialsMarkup = materialsSubtotal * ((parseFloat(data.materialsMarkupPercent) || 0) / 100);
  const materialsTotal = materialsSubtotal + materialsMarkup;
  
  const hourlyRate = parseFloat(data.hourlyRate) || 85;
  const slabPrepManHours = (parseFloat(data.slabPrepCrewSize) || 0) *
    (parseFloat(data.slabPrepDays) || 0) *
    (parseFloat(data.slabPrepHoursPerDay) || 8);
  const slabPrepCost = slabPrepManHours * hourlyRate;
  
  let pourLabourManHours = 0;
  let pourWashoutCost = 0;
  data.pours.forEach((pour) => {
    const crewSize = parseFloat(pour.crewSize) || 0;
    const hours = parseFloat(pour.hoursPerMan) || 0;
    const waiting = (parseFloat(pour.waitingMinutes) || 0) / 60;
    pourLabourManHours += crewSize * (hours + waiting);
    if (pour.offsiteWashout) {
      pourWashoutCost += parseFloat(pour.washoutCost) || 150;
    }
  });
  const pourLabourCost = pourLabourManHours * hourlyRate;
  
  const additionalCostsTotal = data.additionalCosts.reduce(
    (sum, c) => sum + (parseFloat(c.cost) || 0), 0
  );
  
  const labourSubtotal = slabPrepCost + pourLabourCost + pourWashoutCost + additionalCostsTotal;
  const labourMarkup = labourSubtotal * ((parseFloat(data.labourMarkupPercent) || 0) / 100);
  const labourTotal = labourSubtotal + labourMarkup;
  
  const grandTotal = materialsTotal + labourTotal;
  
  return {
    raftArea,
    volumeWithWastage,
    concreteCost,
    meshSheets,
    totalReoCost,
    polyCost,
    materialsSubtotal,
    materialsMarkup,
    materialsTotal,
    labourTotalManHours: slabPrepManHours + pourLabourManHours,
    labourSubtotal,
    labourMarkup,
    labourTotal,
    grandTotal,
    concreteStrength: data.concreteStrength,
    meshType: data.meshType,
  };
}
