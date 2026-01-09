import React, { useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Square,
  Plus,
  Trash2,
  Edit2,
  Check,
  ChevronRight,
  ChevronLeft,
  Ruler,
  HelpCircle,
  Calculator,
  Triangle as TriangleIcon,
  Circle as CircleIcon,
  Hexagon,
  Image,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Upload,
  X,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ShapeType = "rectangle" | "l-shape" | "u-shape" | "triangle" | "trapezoid" | "circle" | "semi-circle";

export interface RectangleShape { type: "rectangle"; length: string; width: string; }
export interface LShapeShape { type: "l-shape"; mainLength: string; mainWidth: string; extensionLength: string; extensionWidth: string; }
export interface UShapeShape { type: "u-shape"; mainLength: string; mainWidth: string; leftWingLength: string; rightWingLength: string; wingWidth: string; }
export interface TriangleShape { type: "triangle"; base: string; height: string; }
export interface TrapezoidShape { type: "trapezoid"; length: string; topWidth: string; bottomWidth: string; }
export interface CircleShape { type: "circle"; diameter: string; }
export interface SemiCircleShape { type: "semi-circle"; diameter: string; }

export type AreaShape = RectangleShape | LShapeShape | UShapeShape | TriangleShape | TrapezoidShape | CircleShape | SemiCircleShape;

export interface PhotoOverlay { imageUrl: string; }

export interface VisualAreaBuilderData {
  shapes: AreaShape[];
  totalArea: number;
  totalPerimeter: number;
  photoOverlay?: PhotoOverlay;
}

export interface VisualAreaBuilderProps {
  value: string;
  onChange: (value: string) => void;
  onPerimeterChange?: (perimeter: string) => void;
  onDataChange?: (data: VisualAreaBuilderData) => void;
  label?: string;
  placeholder?: string;
  showPerimeter?: boolean;
}

// ============================================================================
// CONSTANTS & HELPERS
// ============================================================================

const SHAPE_COLORS = ["hsl(var(--primary))", "hsl(142 76% 36%)", "hsl(38 92% 50%)", "hsl(280 67% 52%)", "hsl(199 89% 48%)", "hsl(0 72% 51%)"];

const SHAPE_OPTIONS: { type: ShapeType; label: string; icon: React.ReactNode; desc: string }[] = [
  { type: "rectangle", label: "Rectangle", icon: <Square className="w-5 h-5" />, desc: "Standard area" },
  { type: "l-shape", label: "L-Shape", icon: <span className="text-lg font-bold">L</span>, desc: "Two rectangles" },
  { type: "u-shape", label: "U-Shape", icon: <span className="text-lg font-bold">U</span>, desc: "Wraparound" },
  { type: "triangle", label: "Triangle", icon: <TriangleIcon className="w-5 h-5" />, desc: "Corner section" },
  { type: "trapezoid", label: "Trapezoid", icon: <Hexagon className="w-5 h-5" />, desc: "Tapered area" },
  { type: "circle", label: "Circle", icon: <CircleIcon className="w-5 h-5" />, desc: "Round area" },
  { type: "semi-circle", label: "Half Circle", icon: <span className="text-sm font-bold">◗</span>, desc: "Rounded edge" },
];

function calculateShapeArea(shape: AreaShape): number {
  switch (shape.type) {
    case "rectangle": return (parseFloat(shape.length) || 0) * (parseFloat(shape.width) || 0);
    case "l-shape": return (parseFloat(shape.mainLength) || 0) * (parseFloat(shape.mainWidth) || 0) + (parseFloat(shape.extensionLength) || 0) * (parseFloat(shape.extensionWidth) || 0);
    case "u-shape": return (parseFloat(shape.mainLength) || 0) * (parseFloat(shape.mainWidth) || 0) + ((parseFloat(shape.leftWingLength) || 0) + (parseFloat(shape.rightWingLength) || 0)) * (parseFloat(shape.wingWidth) || 0);
    case "triangle": return ((parseFloat(shape.base) || 0) * (parseFloat(shape.height) || 0)) / 2;
    case "trapezoid": return (((parseFloat(shape.topWidth) || 0) + (parseFloat(shape.bottomWidth) || 0)) / 2) * (parseFloat(shape.length) || 0);
    case "circle": { const r = (parseFloat(shape.diameter) || 0) / 2; return Math.PI * r * r; }
    case "semi-circle": { const r = (parseFloat(shape.diameter) || 0) / 2; return (Math.PI * r * r) / 2; }
    default: return 0;
  }
}

function calculateShapePerimeter(shape: AreaShape): number {
  switch (shape.type) {
    case "rectangle": return 2 * ((parseFloat(shape.length) || 0) + (parseFloat(shape.width) || 0));
    case "l-shape": { const ml = parseFloat(shape.mainLength) || 0, mw = parseFloat(shape.mainWidth) || 0, el = parseFloat(shape.extensionLength) || 0, ew = parseFloat(shape.extensionWidth) || 0; return 2 * ml + mw + el + 2 * ew + Math.abs(mw - ew); }
    case "u-shape": { const ml = parseFloat(shape.mainLength) || 0, mw = parseFloat(shape.mainWidth) || 0, lw = parseFloat(shape.leftWingLength) || 0, rw = parseFloat(shape.rightWingLength) || 0, ww = parseFloat(shape.wingWidth) || 0; return ml + 2 * mw + 2 * lw + 2 * rw + 2 * ww + Math.abs(ml - 2 * ww); }
    case "triangle": { const b = parseFloat(shape.base) || 0, h = parseFloat(shape.height) || 0; return b + h + Math.sqrt(b * b + h * h); }
    case "trapezoid": { const l = parseFloat(shape.length) || 0, tw = parseFloat(shape.topWidth) || 0, bw = parseFloat(shape.bottomWidth) || 0; const wd = Math.abs(bw - tw) / 2; return tw + bw + 2 * Math.sqrt(l * l + wd * wd); }
    case "circle": return Math.PI * (parseFloat(shape.diameter) || 0);
    case "semi-circle": { const d = parseFloat(shape.diameter) || 0; return (Math.PI * d) / 2 + d; }
    default: return 0;
  }
}

function createEmptyShape(type: ShapeType): AreaShape {
  switch (type) {
    case "rectangle": return { type: "rectangle", length: "", width: "" };
    case "l-shape": return { type: "l-shape", mainLength: "", mainWidth: "", extensionLength: "", extensionWidth: "" };
    case "u-shape": return { type: "u-shape", mainLength: "", mainWidth: "", leftWingLength: "", rightWingLength: "", wingWidth: "" };
    case "triangle": return { type: "triangle", base: "", height: "" };
    case "trapezoid": return { type: "trapezoid", length: "", topWidth: "", bottomWidth: "" };
    case "circle": return { type: "circle", diameter: "" };
    case "semi-circle": return { type: "semi-circle", diameter: "" };
  }
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const PresetButtons: React.FC<{ onSelect: (v: string) => void; presets: number[] }> = ({ onSelect, presets }) => (
  <div className="flex flex-wrap gap-2 mt-2">
    {presets.map((p) => <Button key={p} type="button" variant="outline" size="sm" onClick={() => onSelect(p.toString())} className="text-xs">{p}m</Button>)}
  </div>
);

const MeasurementHint: React.FC<{ type: string }> = ({ type }) => {
  const hints: Record<string, string> = { length: "Measure the longest side", width: "Measure perpendicular to length", height: "Measure from base to top", base: "Measure the bottom edge", diameter: "Measure across through center", wing: "Measure the arm length" };
  return (
    <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6" type="button"><HelpCircle className="h-4 w-4 text-muted-foreground" /></Button></TooltipTrigger><TooltipContent><p className="max-w-[200px] text-sm">{hints[type] || "Enter measurement"}</p></TooltipContent></Tooltip></TooltipProvider>
  );
};

// ============================================================================
// SHAPE PREVIEW
// ============================================================================

const ShapePreview: React.FC<{ shapes: AreaShape[]; photoOverlay?: PhotoOverlay; zoom: number; panX: number; panY: number }> = ({ shapes, photoOverlay, zoom, panX, panY }) => {
  if (shapes.length === 0 && !photoOverlay) return <div className="w-full h-48 bg-muted/30 rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/20"><p className="text-muted-foreground text-sm">Add shapes to see preview</p></div>;

  let maxX = 0, maxY = 0;
  shapes.forEach((s) => {
    if (s.type === "rectangle") { maxX = Math.max(maxX, parseFloat(s.length) || 0); maxY = Math.max(maxY, parseFloat(s.width) || 0); }
    else if (s.type === "circle") { const d = parseFloat(s.diameter) || 0; maxX = Math.max(maxX, d); maxY = Math.max(maxY, d); }
    else if (s.type === "semi-circle") { const d = parseFloat(s.diameter) || 0; maxX = Math.max(maxX, d); maxY = Math.max(maxY, d / 2); }
    else if (s.type === "triangle") { maxX = Math.max(maxX, parseFloat(s.base) || 0); maxY = Math.max(maxY, parseFloat(s.height) || 0); }
    else if (s.type === "trapezoid") { maxX = Math.max(maxX, Math.max(parseFloat(s.topWidth) || 0, parseFloat(s.bottomWidth) || 0)); maxY = Math.max(maxY, parseFloat(s.length) || 0); }
    else if (s.type === "l-shape") { maxX = Math.max(maxX, parseFloat(s.mainLength) || 0); maxY = Math.max(maxY, (parseFloat(s.mainWidth) || 0) + (parseFloat(s.extensionWidth) || 0)); }
    else if (s.type === "u-shape") { maxX = Math.max(maxX, parseFloat(s.mainLength) || 0); maxY = Math.max(maxY, (parseFloat(s.mainWidth) || 0) + Math.max(parseFloat(s.leftWingLength) || 0, parseFloat(s.rightWingLength) || 0)); }
  });

  const padding = 40, svgW = 320, svgH = 200;
  const scale = Math.min(maxX > 0 ? (svgW - padding * 2) / maxX : 1, maxY > 0 ? (svgH - padding * 2) / maxY : 1) * zoom;
  const gridSize = 20, gridReal = gridSize / scale;

  const renderShape = (s: AreaShape, i: number) => {
    const color = SHAPE_COLORS[i % SHAPE_COLORS.length];
    const ox = padding + panX, oy = padding + panY;

    if (s.type === "rectangle") {
      const l = (parseFloat(s.length) || 0) * scale, w = (parseFloat(s.width) || 0) * scale;
      return <g key={i}><rect x={ox} y={oy} width={l} height={w} fill={color} fillOpacity={0.3} stroke={color} strokeWidth={2} />{l > 0 && <><text x={ox + l / 2} y={oy - 8} textAnchor="middle" className="text-[10px] fill-foreground font-medium">{s.length}m</text><text x={ox + l + 8} y={oy + w / 2} textAnchor="start" className="text-[10px] fill-foreground font-medium" dominantBaseline="middle">{s.width}m</text></>}</g>;
    }
    if (s.type === "circle") {
      const d = (parseFloat(s.diameter) || 0) * scale, r = d / 2;
      return <g key={i}><circle cx={ox + r} cy={oy + r} r={r} fill={color} fillOpacity={0.3} stroke={color} strokeWidth={2} />{d > 0 && <text x={ox + r} y={oy + r - 8} textAnchor="middle" className="text-[10px] fill-foreground font-medium">⌀{s.diameter}m</text>}</g>;
    }
    if (s.type === "semi-circle") {
      const d = (parseFloat(s.diameter) || 0) * scale, r = d / 2;
      return <g key={i}><path d={`M ${ox} ${oy + r} A ${r} ${r} 0 0 1 ${ox + d} ${oy + r} L ${ox} ${oy + r}`} fill={color} fillOpacity={0.3} stroke={color} strokeWidth={2} />{d > 0 && <text x={ox + r} y={oy + r + 15} textAnchor="middle" className="text-[10px] fill-foreground font-medium">⌀{s.diameter}m</text>}</g>;
    }
    if (s.type === "triangle") {
      const b = (parseFloat(s.base) || 0) * scale, h = (parseFloat(s.height) || 0) * scale;
      return <g key={i}><polygon points={`${ox},${oy + h} ${ox + b},${oy + h} ${ox + b},${oy}`} fill={color} fillOpacity={0.3} stroke={color} strokeWidth={2} />{b > 0 && <><text x={ox + b / 2} y={oy + h + 15} textAnchor="middle" className="text-[10px] fill-foreground font-medium">{s.base}m</text><text x={ox + b + 8} y={oy + h / 2} textAnchor="start" className="text-[10px] fill-foreground font-medium" dominantBaseline="middle">{s.height}m</text></>}</g>;
    }
    if (s.type === "trapezoid") {
      const l = (parseFloat(s.length) || 0) * scale, tw = (parseFloat(s.topWidth) || 0) * scale, bw = (parseFloat(s.bottomWidth) || 0) * scale, to = (bw - tw) / 2;
      return <g key={i}><polygon points={`${ox + to},${oy} ${ox + to + tw},${oy} ${ox + bw},${oy + l} ${ox},${oy + l}`} fill={color} fillOpacity={0.3} stroke={color} strokeWidth={2} />{tw > 0 && <><text x={ox + to + tw / 2} y={oy - 8} textAnchor="middle" className="text-[10px] fill-foreground font-medium">{s.topWidth}m</text><text x={ox + bw / 2} y={oy + l + 15} textAnchor="middle" className="text-[10px] fill-foreground font-medium">{s.bottomWidth}m</text></>}</g>;
    }
    if (s.type === "l-shape") {
      const ml = (parseFloat(s.mainLength) || 0) * scale, mw = (parseFloat(s.mainWidth) || 0) * scale, el = (parseFloat(s.extensionLength) || 0) * scale, ew = (parseFloat(s.extensionWidth) || 0) * scale;
      return <g key={i}><path d={`M ${ox} ${oy} L ${ox + ml} ${oy} L ${ox + ml} ${oy + mw} L ${ox + el} ${oy + mw} L ${ox + el} ${oy + mw + ew} L ${ox} ${oy + mw + ew} Z`} fill={color} fillOpacity={0.3} stroke={color} strokeWidth={2} /></g>;
    }
    if (s.type === "u-shape") {
      const ml = (parseFloat(s.mainLength) || 0) * scale, mw = (parseFloat(s.mainWidth) || 0) * scale, lw = (parseFloat(s.leftWingLength) || 0) * scale, rw = (parseFloat(s.rightWingLength) || 0) * scale, ww = (parseFloat(s.wingWidth) || 0) * scale;
      return <g key={i}><path d={`M ${ox} ${oy} L ${ox + ml} ${oy} L ${ox + ml} ${oy + mw + rw} L ${ox + ml - ww} ${oy + mw + rw} L ${ox + ml - ww} ${oy + mw} L ${ox + ww} ${oy + mw} L ${ox + ww} ${oy + mw + lw} L ${ox} ${oy + mw + lw} Z`} fill={color} fillOpacity={0.3} stroke={color} strokeWidth={2} /></g>;
    }
    return null;
  };

  return (
    <div className="relative w-full bg-muted/20 rounded-lg border overflow-hidden">
      <svg width="100%" height="200" viewBox={`0 0 ${svgW} ${svgH}`} className="block">
        <defs><pattern id="grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse"><path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#grid)" opacity="0.4" />
        {photoOverlay && <image href={photoOverlay.imageUrl} x="0" y="0" width={svgW} height={svgH} preserveAspectRatio="xMidYMid slice" opacity="0.5" />}
        {shapes.map(renderShape)}
      </svg>
      {shapes.length > 0 && <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded">Grid ≈ {gridReal.toFixed(1)}m</div>}
    </div>
  );
};

const ZoomControls: React.FC<{ zoom: number; onZoomIn: () => void; onZoomOut: () => void; onReset: () => void }> = ({ zoom, onZoomIn, onZoomOut, onReset }) => (
  <div className="absolute top-2 right-2 flex gap-1 bg-background/80 rounded-md p-1">
    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onZoomOut} disabled={zoom <= 0.5}><ZoomOut className="w-4 h-4" /></Button>
    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onReset}><Maximize2 className="w-4 h-4" /></Button>
    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onZoomIn} disabled={zoom >= 2}><ZoomIn className="w-4 h-4" /></Button>
  </div>
);

const PhotoUploader: React.FC<{ onPhotoSelect: (url: string) => void; onClose: () => void }> = ({ onPhotoSelect, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const reader = new FileReader(); reader.onload = (ev) => onPhotoSelect(ev.target?.result as string); reader.readAsDataURL(file); }
  };
  return (
    <Card className="mb-4"><CardContent className="p-4">
      <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><Image className="w-5 h-5 text-primary" /><span className="font-medium">Photo Reference</span></div><Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="w-4 h-4" /></Button></div>
      <p className="text-sm text-muted-foreground mb-3">Upload a site photo to draw shapes on top</p>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}><Upload className="w-4 h-4 mr-2" />Upload Photo</Button>
    </CardContent></Card>
  );
};

const ShapeSelector: React.FC<{ onSelect: (t: ShapeType) => void; onCancel: () => void }> = ({ onSelect, onCancel }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between"><h4 className="font-medium text-sm">Select Shape Type</h4><Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button></div>
    <div className="grid grid-cols-2 gap-2">
      {SHAPE_OPTIONS.map((o) => <Button key={o.type} type="button" variant="outline" className="h-auto py-3 px-3 flex flex-col items-center gap-1" onClick={() => onSelect(o.type)}><div className="w-8 h-8 flex items-center justify-center text-primary">{o.icon}</div><span className="text-sm font-medium">{o.label}</span><span className="text-[10px] text-muted-foreground">{o.desc}</span></Button>)}
    </div>
  </div>
);

// ============================================================================
// SHAPE FORMS (Simplified for brevity - step-based wizards)
// ============================================================================

const SimpleShapeForm: React.FC<{ shape: AreaShape; onChange: (s: AreaShape) => void; onComplete: () => void; onCancel: () => void }> = ({ shape, onChange, onComplete, onCancel }) => {
  const area = calculateShapeArea(shape);
  const perimeter = calculateShapePerimeter(shape);

  const fields = useMemo(() => {
    switch (shape.type) {
      case "rectangle": return [{ key: "length", label: "Length", hint: "length" }, { key: "width", label: "Width", hint: "width" }];
      case "triangle": return [{ key: "base", label: "Base", hint: "base" }, { key: "height", label: "Height", hint: "height" }];
      case "circle": case "semi-circle": return [{ key: "diameter", label: "Diameter", hint: "diameter" }];
      case "trapezoid": return [{ key: "length", label: "Length", hint: "length" }, { key: "topWidth", label: "Top Width", hint: "width" }, { key: "bottomWidth", label: "Bottom Width", hint: "width" }];
      case "l-shape": return [{ key: "mainLength", label: "Main Length", hint: "length" }, { key: "mainWidth", label: "Main Width", hint: "width" }, { key: "extensionLength", label: "Extension Length", hint: "length" }, { key: "extensionWidth", label: "Extension Width", hint: "width" }];
      case "u-shape": return [{ key: "mainLength", label: "Total Length", hint: "length" }, { key: "mainWidth", label: "Base Width", hint: "width" }, { key: "wingWidth", label: "Wing Width", hint: "wing" }, { key: "leftWingLength", label: "Left Wing Length", hint: "wing" }, { key: "rightWingLength", label: "Right Wing Length", hint: "wing" }];
      default: return [];
    }
  }, [shape.type]);

  const isComplete = fields.every((f) => (shape as any)[f.key]);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {fields.map((f) => (
          <div key={f.key} className="space-y-1">
            <div className="flex items-center gap-2"><Label>{f.label}</Label><MeasurementHint type={f.hint} /></div>
            <div className="flex gap-2">
              <Input type="number" step="0.1" value={(shape as any)[f.key]} onChange={(e) => onChange({ ...shape, [f.key]: e.target.value })} placeholder={f.label} />
              <span className="flex items-center text-muted-foreground">m</span>
            </div>
          </div>
        ))}
      </div>
      {isComplete && (
        <div className="bg-primary/10 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1 capitalize">{shape.type.replace("-", " ")} Area</p>
          <p className="text-2xl font-bold text-primary">{area.toFixed(2)} m²</p>
          <p className="text-sm text-muted-foreground mt-1">Perimeter: {perimeter.toFixed(2)}m</p>
        </div>
      )}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="button" onClick={onComplete} disabled={!isComplete} className="flex-1"><Check className="w-4 h-4 mr-1" /> Add Shape</Button>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const VisualAreaBuilder: React.FC<VisualAreaBuilderProps> = ({ value, onChange, onPerimeterChange, onDataChange, label = "Area", placeholder = "Enter area or use calculator", showPerimeter = true }) => {
  const [showBuilder, setShowBuilder] = useState(false);
  const [shapes, setShapes] = useState<AreaShape[]>([]);
  const [currentShape, setCurrentShape] = useState<AreaShape | null>(null);
  const [isSelectingShape, setIsSelectingShape] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [photoOverlay, setPhotoOverlay] = useState<PhotoOverlay | null>(null);
  const [showPhotoUploader, setShowPhotoUploader] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  const totalArea = useMemo(() => shapes.reduce((sum, s) => sum + calculateShapeArea(s), 0), [shapes]);
  const totalPerimeter = useMemo(() => shapes.reduce((sum, s) => sum + calculateShapePerimeter(s), 0), [shapes]);

  const handleComplete = () => {
    onChange(totalArea.toFixed(2));
    onPerimeterChange?.(totalPerimeter.toFixed(2));
    onDataChange?.({ shapes, totalArea, totalPerimeter, photoOverlay: photoOverlay || undefined });
    setShowBuilder(false);
  };

  const handleAddShape = () => {
    if (currentShape) {
      if (editingIndex !== null) { const newShapes = [...shapes]; newShapes[editingIndex] = currentShape; setShapes(newShapes); setEditingIndex(null); }
      else { setShapes([...shapes, currentShape]); }
      setCurrentShape(null);
    }
  };

  if (!showBuilder) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex gap-2">
          <Input type="number" step="0.01" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
          <span className="flex items-center text-muted-foreground">m²</span>
          <TooltipProvider><Tooltip><TooltipTrigger asChild><Button type="button" variant="outline" size="icon" onClick={() => setShowBuilder(true)}><Calculator className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Open Area Calculator</p></TooltipContent></Tooltip></TooltipProvider>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Ruler className="w-5 h-5 text-primary" /><span className="font-semibold">Area Calculator</span></div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowPhotoUploader(!showPhotoUploader)} className={photoOverlay ? "text-primary" : ""}><Image className="w-4 h-4 mr-1" />Photo</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowBuilder(false)}><X className="w-4 h-4" /></Button>
          </div>
        </div>

        {showPhotoUploader && !photoOverlay && <PhotoUploader onPhotoSelect={(url) => { setPhotoOverlay({ imageUrl: url }); setShowPhotoUploader(false); }} onClose={() => setShowPhotoUploader(false)} />}
        {photoOverlay && <div className="flex items-center justify-between bg-muted/50 rounded-lg p-2"><span className="text-sm text-muted-foreground flex items-center gap-2"><Image className="w-4 h-4" />Photo active</span><Button type="button" variant="ghost" size="sm" onClick={() => setPhotoOverlay(null)}>Remove</Button></div>}

        <div className="relative">
          <ShapePreview shapes={shapes} photoOverlay={photoOverlay || undefined} zoom={zoom} panX={panX} panY={panY} />
          {shapes.length > 0 && <ZoomControls zoom={zoom} onZoomIn={() => setZoom(z => Math.min(z + 0.25, 2))} onZoomOut={() => setZoom(z => Math.max(z - 0.25, 0.5))} onReset={() => { setZoom(1); setPanX(0); setPanY(0); }} />}
        </div>

        {shapes.length > 0 && <div className="flex flex-wrap gap-2 items-center"><Badge variant="secondary" className="text-sm">Total: {totalArea.toFixed(2)} m²</Badge>{showPerimeter && <Badge variant="outline" className="text-sm">Perimeter: {totalPerimeter.toFixed(2)}m</Badge>}<span className="text-xs text-muted-foreground">{shapes.length} shape{shapes.length !== 1 ? "s" : ""}</span></div>}

        {shapes.length > 0 && !currentShape && !isSelectingShape && (
          <div className="space-y-2">
            {shapes.map((s, i) => (
              <div key={i} className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: SHAPE_COLORS[i % SHAPE_COLORS.length] }} /><span className="text-sm font-medium capitalize">{s.type.replace("-", " ")}</span><span className="text-sm text-muted-foreground">{calculateShapeArea(s).toFixed(2)} m²</span></div>
                <div className="flex gap-1"><Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setCurrentShape(shapes[i]); setEditingIndex(i); }}><Edit2 className="w-3 h-3" /></Button><Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setShapes(shapes.filter((_, idx) => idx !== i))}><Trash2 className="w-3 h-3" /></Button></div>
              </div>
            ))}
          </div>
        )}

        {isSelectingShape && <ShapeSelector onSelect={(t) => { setCurrentShape(createEmptyShape(t)); setIsSelectingShape(false); }} onCancel={() => setIsSelectingShape(false)} />}
        {currentShape && <SimpleShapeForm shape={currentShape} onChange={(s) => setCurrentShape(s)} onComplete={handleAddShape} onCancel={() => { setCurrentShape(null); setEditingIndex(null); }} />}

        {!currentShape && !isSelectingShape && (
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setIsSelectingShape(true)} className="flex-1"><Plus className="w-4 h-4 mr-1" /> Add Shape</Button>
            {shapes.length > 0 && <Button type="button" onClick={handleComplete} className="flex-1"><Check className="w-4 h-4 mr-1" /> Done - {totalArea.toFixed(2)} m²</Button>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VisualAreaBuilder;
