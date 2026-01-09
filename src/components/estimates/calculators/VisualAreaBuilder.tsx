import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  Square, 
  CornerDownRight, 
  Plus, 
  Trash2, 
  Calculator, 
  ArrowRight,
  ArrowLeft,
  Check,
  Ruler,
  HelpCircle,
  X
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ============= TYPES =============

export type ShapeType = "rectangle" | "l-shape";

export interface RectangleShape {
  type: "rectangle";
  length: string;
  width: string;
}

export interface LShapeShape {
  type: "l-shape";
  mainLength: string;
  mainWidth: string;
  extensionLength: string;
  extensionWidth: string;
  extensionPosition: "right" | "bottom";
}

export interface AreaShape {
  id: string;
  name: string;
  shape: RectangleShape | LShapeShape;
  calculatedArea: number;
}

export interface VisualAreaBuilderData {
  shapes: AreaShape[];
  totalArea: number;
}

// ============= SHAPE COLORS =============

const SHAPE_COLORS = [
  { fill: "hsl(var(--primary) / 0.2)", stroke: "hsl(var(--primary))" },
  { fill: "hsl(var(--accent) / 0.3)", stroke: "hsl(var(--accent-foreground))" },
  { fill: "hsl(142 76% 36% / 0.2)", stroke: "hsl(142 76% 36%)" },
  { fill: "hsl(280 67% 60% / 0.2)", stroke: "hsl(280 67% 60%)" },
];

// ============= HELPER FUNCTIONS =============

function calculateShapeArea(shape: RectangleShape | LShapeShape): number {
  if (shape.type === "rectangle") {
    const length = parseFloat(shape.length) || 0;
    const width = parseFloat(shape.width) || 0;
    return length * width;
  } else {
    const mainLength = parseFloat(shape.mainLength) || 0;
    const mainWidth = parseFloat(shape.mainWidth) || 0;
    const extLength = parseFloat(shape.extensionLength) || 0;
    const extWidth = parseFloat(shape.extensionWidth) || 0;
    return (mainLength * mainWidth) + (extLength * extWidth);
  }
}

function createEmptyRectangle(): RectangleShape {
  return { type: "rectangle", length: "", width: "" };
}

function createEmptyLShape(): LShapeShape {
  return {
    type: "l-shape",
    mainLength: "",
    mainWidth: "",
    extensionLength: "",
    extensionWidth: "",
    extensionPosition: "right",
  };
}

// ============= PRESET DIMENSIONS =============

const COMMON_PRESETS = [
  { label: "5m", value: "5" },
  { label: "8m", value: "8" },
  { label: "10m", value: "10" },
  { label: "12m", value: "12" },
  { label: "15m", value: "15" },
  { label: "20m", value: "20" },
];

// ============= SUB-COMPONENTS =============

interface PresetButtonsProps {
  onSelect: (value: string) => void;
  currentValue: string;
}

function PresetButtons({ onSelect, currentValue }: PresetButtonsProps) {
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {COMMON_PRESETS.map((preset) => (
        <Button
          key={preset.value}
          type="button"
          variant={currentValue === preset.value ? "default" : "outline"}
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => onSelect(preset.value)}
        >
          {preset.label}
        </Button>
      ))}
    </div>
  );
}

interface MeasurementHintProps {
  type: "length" | "width";
}

function MeasurementHint({ type }: MeasurementHintProps) {
  const tips = {
    length: "Walk along the longest edge and count your steps (1 step ≈ 0.75m)",
    width: "Measure the shorter side, or count steps across",
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px] text-xs">
          <p>{tips[type]}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============= SVG SHAPE RENDERERS =============

interface ShapePreviewProps {
  shapes: AreaShape[];
  currentShapeIndex?: number;
}

function ShapePreview({ shapes, currentShapeIndex }: ShapePreviewProps) {
  const hasValidShapes = shapes.some(s => s.calculatedArea > 0);
  
  if (!hasValidShapes) {
    return (
      <div className="h-32 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-lg bg-muted/30">
        <div className="text-center">
          <Ruler className="w-6 h-6 mx-auto mb-1 opacity-50" />
          <p>Enter dimensions to see preview</p>
        </div>
      </div>
    );
  }

  // Calculate bounds for scaling
  let maxWidth = 0;
  let maxHeight = 0;
  
  shapes.forEach(s => {
    if (s.shape.type === "rectangle") {
      maxWidth = Math.max(maxWidth, parseFloat(s.shape.length) || 0);
      maxHeight = Math.max(maxHeight, parseFloat(s.shape.width) || 0);
    } else {
      const mainL = parseFloat(s.shape.mainLength) || 0;
      const mainW = parseFloat(s.shape.mainWidth) || 0;
      const extL = parseFloat(s.shape.extensionLength) || 0;
      const extW = parseFloat(s.shape.extensionWidth) || 0;
      
      if (s.shape.extensionPosition === "right") {
        maxWidth = Math.max(maxWidth, mainL + extL);
        maxHeight = Math.max(maxHeight, Math.max(mainW, extW));
      } else {
        maxWidth = Math.max(maxWidth, Math.max(mainL, extL));
        maxHeight = Math.max(maxHeight, mainW + extW);
      }
    }
  });

  const viewBoxWidth = 300;
  const viewBoxHeight = 150;
  const padding = 20;
  const usableWidth = viewBoxWidth - (padding * 2);
  const usableHeight = viewBoxHeight - (padding * 2);
  
  const scale = Math.min(usableWidth / (maxWidth || 1), usableHeight / (maxHeight || 1));

  let currentX = padding;

  return (
    <div className="relative">
      <svg 
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} 
        className="w-full h-32 rounded-lg border bg-background"
      >
        {shapes.map((shape, index) => {
          const color = SHAPE_COLORS[index % SHAPE_COLORS.length];
          const isActive = currentShapeIndex === index;
          
          if (shape.shape.type === "rectangle") {
            const w = (parseFloat(shape.shape.length) || 0) * scale;
            const h = (parseFloat(shape.shape.width) || 0) * scale;
            
            if (w <= 0 || h <= 0) return null;
            
            const x = currentX;
            const y = padding + (usableHeight - h) / 2;
            currentX += w + 10;
            
            return (
              <g key={shape.id}>
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill={color.fill}
                  stroke={color.stroke}
                  strokeWidth={isActive ? 3 : 2}
                  rx={2}
                />
                <text
                  x={x + w / 2}
                  y={y + h / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-foreground text-[10px] font-medium"
                >
                  {shape.calculatedArea.toFixed(1)}m²
                </text>
              </g>
            );
          } else {
            // L-Shape rendering
            const mainL = (parseFloat(shape.shape.mainLength) || 0) * scale;
            const mainW = (parseFloat(shape.shape.mainWidth) || 0) * scale;
            const extL = (parseFloat(shape.shape.extensionLength) || 0) * scale;
            const extW = (parseFloat(shape.shape.extensionWidth) || 0) * scale;
            
            if (mainL <= 0 || mainW <= 0) return null;
            
            const x = currentX;
            const y = padding;
            currentX += (shape.shape.extensionPosition === "right" ? mainL + extL : Math.max(mainL, extL)) + 10;
            
            // Build L-shape path
            let path = "";
            if (shape.shape.extensionPosition === "right") {
              path = `M ${x} ${y} 
                      L ${x + mainL} ${y} 
                      L ${x + mainL} ${y + extW} 
                      L ${x + mainL + extL} ${y + extW}
                      L ${x + mainL + extL} ${y + extW + (mainW - extW)}
                      L ${x + mainL} ${y + mainW}
                      L ${x} ${y + mainW} Z`;
            } else {
              path = `M ${x} ${y}
                      L ${x + mainL} ${y}
                      L ${x + mainL} ${y + mainW}
                      L ${x + extL} ${y + mainW}
                      L ${x + extL} ${y + mainW + extW}
                      L ${x} ${y + mainW + extW} Z`;
            }
            
            return (
              <g key={shape.id}>
                <path
                  d={path}
                  fill={color.fill}
                  stroke={color.stroke}
                  strokeWidth={isActive ? 3 : 2}
                />
                <text
                  x={x + mainL / 2}
                  y={y + mainW / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-foreground text-[10px] font-medium"
                >
                  {shape.calculatedArea.toFixed(1)}m²
                </text>
              </g>
            );
          }
        })}
      </svg>
      
      {/* Total badge */}
      <Badge 
        className="absolute top-2 right-2 bg-primary text-primary-foreground"
      >
        Total: {shapes.reduce((sum, s) => sum + s.calculatedArea, 0).toFixed(1)}m²
      </Badge>
    </div>
  );
}

// ============= SHAPE SELECTOR =============

interface ShapeSelectorProps {
  onSelect: (type: ShapeType) => void;
}

function ShapeSelector({ onSelect }: ShapeSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">What shape is your area closest to?</Label>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onSelect("rectangle")}
          className="flex flex-col items-center gap-2 p-4 border-2 border-dashed rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <Square className="w-10 h-10 text-primary" />
          <span className="text-sm font-medium">Rectangle</span>
          <span className="text-xs text-muted-foreground">Simple shape</span>
        </button>
        <button
          type="button"
          onClick={() => onSelect("l-shape")}
          className="flex flex-col items-center gap-2 p-4 border-2 border-dashed rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <CornerDownRight className="w-10 h-10 text-primary" />
          <span className="text-sm font-medium">L-Shape</span>
          <span className="text-xs text-muted-foreground">Two parts joined</span>
        </button>
      </div>
    </div>
  );
}

// ============= RECTANGLE FORM =============

interface RectangleFormProps {
  shape: RectangleShape;
  onChange: (shape: RectangleShape) => void;
  onComplete: () => void;
  onCancel: () => void;
  isEditing?: boolean;
}

function RectangleForm({ shape, onChange, onComplete, onCancel, isEditing }: RectangleFormProps) {
  const [step, setStep] = useState<"length" | "width" | "confirm">(
    shape.length ? (shape.width ? "confirm" : "width") : "length"
  );
  
  const area = calculateShapeArea(shape);
  
  const handleLengthNext = () => {
    if (parseFloat(shape.length) > 0) setStep("width");
  };
  
  const handleWidthNext = () => {
    if (parseFloat(shape.width) > 0) setStep("confirm");
  };

  return (
    <div className="space-y-4">
      {/* Visual diagram */}
      <div className="relative p-4 border rounded-lg bg-muted/30">
        <svg viewBox="0 0 200 120" className="w-full h-24">
          <rect
            x="30"
            y="20"
            width="140"
            height="80"
            fill="hsl(var(--primary) / 0.15)"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            rx="2"
          />
          {/* Length arrow */}
          <line x1="30" y1="110" x2="170" y2="110" stroke="hsl(var(--primary))" strokeWidth="2" markerEnd="url(#arrowhead)" />
          <text x="100" y="118" textAnchor="middle" className="fill-primary text-[10px] font-medium">
            Length {shape.length ? `(${shape.length}m)` : "→"}
          </text>
          {/* Width arrow */}
          <line x1="180" y1="20" x2="180" y2="100" stroke="hsl(var(--primary))" strokeWidth="2" />
          <text x="188" y="60" textAnchor="start" className="fill-primary text-[10px] font-medium" transform="rotate(90, 188, 60)">
            Width {shape.width ? `(${shape.width}m)` : "→"}
          </text>
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="hsl(var(--primary))" />
            </marker>
          </defs>
        </svg>
      </div>

      {/* Step-by-step input */}
      {step === "length" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">How long is the longest side?</Label>
            <MeasurementHint type="length" />
          </div>
          <Input
            type="number"
            step="0.1"
            value={shape.length}
            onChange={(e) => onChange({ ...shape, length: e.target.value })}
            placeholder="Enter length in meters"
            className="text-lg h-12"
            autoFocus
          />
          <PresetButtons 
            onSelect={(v) => onChange({ ...shape, length: v })} 
            currentValue={shape.length} 
          />
          <div className="flex justify-between pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
            <Button 
              type="button" 
              size="sm" 
              onClick={handleLengthNext}
              disabled={!parseFloat(shape.length)}
            >
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {step === "width" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">How wide is it?</Label>
            <MeasurementHint type="width" />
          </div>
          <Input
            type="number"
            step="0.1"
            value={shape.width}
            onChange={(e) => onChange({ ...shape, width: e.target.value })}
            placeholder="Enter width in meters"
            className="text-lg h-12"
            autoFocus
          />
          <PresetButtons 
            onSelect={(v) => onChange({ ...shape, width: v })} 
            currentValue={shape.width} 
          />
          <div className="flex justify-between pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setStep("length")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button 
              type="button" 
              size="sm" 
              onClick={handleWidthNext}
              disabled={!parseFloat(shape.width)}
            >
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {step === "confirm" && (
        <div className="space-y-3">
          <div className="p-4 bg-primary/10 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Calculated Area</p>
            <p className="text-3xl font-bold text-primary">{area.toFixed(1)} m²</p>
            <p className="text-xs text-muted-foreground mt-1">
              {shape.length}m × {shape.width}m
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => setStep("length")}
            >
              Edit
            </Button>
            <Button 
              type="button" 
              className="flex-1"
              onClick={onComplete}
            >
              <Check className="w-4 h-4 mr-1" /> {isEditing ? "Update" : "Add Shape"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============= L-SHAPE FORM =============

interface LShapeFormProps {
  shape: LShapeShape;
  onChange: (shape: LShapeShape) => void;
  onComplete: () => void;
  onCancel: () => void;
  isEditing?: boolean;
}

function LShapeForm({ shape, onChange, onComplete, onCancel, isEditing }: LShapeFormProps) {
  const [step, setStep] = useState<"main-length" | "main-width" | "ext-length" | "ext-width" | "confirm">("main-length");
  
  const area = calculateShapeArea(shape);
  const mainArea = (parseFloat(shape.mainLength) || 0) * (parseFloat(shape.mainWidth) || 0);
  const extArea = (parseFloat(shape.extensionLength) || 0) * (parseFloat(shape.extensionWidth) || 0);

  return (
    <div className="space-y-4">
      {/* Visual guide */}
      <div className="p-3 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground text-center mb-2">
          Think of your L-shape as two rectangles joined together
        </p>
        <svg viewBox="0 0 200 120" className="w-full h-28">
          {/* Main rectangle */}
          <rect
            x="20"
            y="10"
            width="80"
            height="60"
            fill={step.startsWith("main") ? "hsl(var(--primary) / 0.25)" : "hsl(var(--primary) / 0.1)"}
            stroke="hsl(var(--primary))"
            strokeWidth={step.startsWith("main") ? 3 : 1.5}
            rx="2"
          />
          <text x="60" y="45" textAnchor="middle" className="fill-primary text-[10px] font-semibold">
            MAIN
          </text>
          {mainArea > 0 && (
            <text x="60" y="58" textAnchor="middle" className="fill-muted-foreground text-[8px]">
              {mainArea.toFixed(1)}m²
            </text>
          )}
          
          {/* Extension rectangle */}
          <rect
            x="100"
            y="30"
            width="60"
            height="40"
            fill={step.startsWith("ext") ? "hsl(var(--accent) / 0.4)" : "hsl(var(--accent) / 0.15)"}
            stroke="hsl(var(--accent-foreground))"
            strokeWidth={step.startsWith("ext") ? 3 : 1.5}
            rx="2"
          />
          <text x="130" y="52" textAnchor="middle" className="fill-accent-foreground text-[9px] font-semibold">
            EXT
          </text>
          {extArea > 0 && (
            <text x="130" y="65" textAnchor="middle" className="fill-muted-foreground text-[8px]">
              {extArea.toFixed(1)}m²
            </text>
          )}
          
          {/* Dimension labels */}
          {shape.mainLength && (
            <text x="60" y="80" textAnchor="middle" className="fill-muted-foreground text-[8px]">
              {shape.mainLength}m × {shape.mainWidth || "?"}m
            </text>
          )}
        </svg>
      </div>

      {/* Step indicators */}
      <div className="flex justify-center gap-1">
        {["main-length", "main-width", "ext-length", "ext-width", "confirm"].map((s, i) => (
          <div 
            key={s}
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              step === s ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Step inputs */}
      {step === "main-length" && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Main part - length?</Label>
          <Input
            type="number"
            step="0.1"
            value={shape.mainLength}
            onChange={(e) => onChange({ ...shape, mainLength: e.target.value })}
            placeholder="e.g. 12"
            className="text-lg h-12"
            autoFocus
          />
          <PresetButtons 
            onSelect={(v) => onChange({ ...shape, mainLength: v })} 
            currentValue={shape.mainLength} 
          />
          <div className="flex justify-between pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
            <Button 
              type="button" 
              size="sm" 
              onClick={() => setStep("main-width")}
              disabled={!parseFloat(shape.mainLength)}
            >
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {step === "main-width" && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Main part - width?</Label>
          <Input
            type="number"
            step="0.1"
            value={shape.mainWidth}
            onChange={(e) => onChange({ ...shape, mainWidth: e.target.value })}
            placeholder="e.g. 10"
            className="text-lg h-12"
            autoFocus
          />
          <PresetButtons 
            onSelect={(v) => onChange({ ...shape, mainWidth: v })} 
            currentValue={shape.mainWidth} 
          />
          <div className="flex justify-between pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setStep("main-length")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button 
              type="button" 
              size="sm" 
              onClick={() => setStep("ext-length")}
              disabled={!parseFloat(shape.mainWidth)}
            >
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {step === "ext-length" && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Extension part - length?</Label>
          <Input
            type="number"
            step="0.1"
            value={shape.extensionLength}
            onChange={(e) => onChange({ ...shape, extensionLength: e.target.value })}
            placeholder="e.g. 6"
            className="text-lg h-12"
            autoFocus
          />
          <PresetButtons 
            onSelect={(v) => onChange({ ...shape, extensionLength: v })} 
            currentValue={shape.extensionLength} 
          />
          <div className="flex justify-between pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setStep("main-width")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button 
              type="button" 
              size="sm" 
              onClick={() => setStep("ext-width")}
              disabled={!parseFloat(shape.extensionLength)}
            >
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {step === "ext-width" && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Extension part - width?</Label>
          <Input
            type="number"
            step="0.1"
            value={shape.extensionWidth}
            onChange={(e) => onChange({ ...shape, extensionWidth: e.target.value })}
            placeholder="e.g. 4"
            className="text-lg h-12"
            autoFocus
          />
          <PresetButtons 
            onSelect={(v) => onChange({ ...shape, extensionWidth: v })} 
            currentValue={shape.extensionWidth} 
          />
          <div className="flex justify-between pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setStep("ext-length")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button 
              type="button" 
              size="sm" 
              onClick={() => setStep("confirm")}
              disabled={!parseFloat(shape.extensionWidth)}
            >
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {step === "confirm" && (
        <div className="space-y-3">
          <div className="p-4 bg-primary/10 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Total L-Shape Area</p>
            <p className="text-3xl font-bold text-primary">{area.toFixed(1)} m²</p>
            <p className="text-xs text-muted-foreground mt-1">
              Main: {mainArea.toFixed(1)}m² + Extension: {extArea.toFixed(1)}m²
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => setStep("main-length")}
            >
              Edit
            </Button>
            <Button 
              type="button" 
              className="flex-1"
              onClick={onComplete}
            >
              <Check className="w-4 h-4 mr-1" /> {isEditing ? "Update" : "Add Shape"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============= MAIN COMPONENT =============

export interface VisualAreaBuilderProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export function VisualAreaBuilder({
  value,
  onChange,
  label = "Area (m²)",
  placeholder = "e.g. 120",
}: VisualAreaBuilderProps) {
  const [showBuilder, setShowBuilder] = useState(false);
  const [shapes, setShapes] = useState<AreaShape[]>([]);
  const [currentShape, setCurrentShape] = useState<RectangleShape | LShapeShape | null>(null);
  const [editingShapeId, setEditingShapeId] = useState<string | null>(null);
  const [selectingShape, setSelectingShape] = useState(false);

  const totalArea = useMemo(() => {
    return shapes.reduce((sum, s) => sum + s.calculatedArea, 0);
  }, [shapes]);

  // Sync total area back to parent
  const handleComplete = useCallback(() => {
    onChange(totalArea.toFixed(2));
    setShowBuilder(false);
  }, [totalArea, onChange]);

  const handleAddShape = (shapeData: RectangleShape | LShapeShape) => {
    const area = calculateShapeArea(shapeData);
    
    if (editingShapeId) {
      setShapes(prev => prev.map(s => 
        s.id === editingShapeId 
          ? { ...s, shape: shapeData, calculatedArea: area }
          : s
      ));
      setEditingShapeId(null);
    } else {
      const newShape: AreaShape = {
        id: Date.now().toString(),
        name: `Section ${shapes.length + 1}`,
        shape: shapeData,
        calculatedArea: area,
      };
      setShapes(prev => [...prev, newShape]);
    }
    
    setCurrentShape(null);
    setSelectingShape(false);
  };

  const handleRemoveShape = (id: string) => {
    setShapes(prev => prev.filter(s => s.id !== id));
  };

  const handleEditShape = (id: string) => {
    const shape = shapes.find(s => s.id === id);
    if (shape) {
      setEditingShapeId(id);
      setCurrentShape(shape.shape);
    }
  };

  const handleSelectShapeType = (type: ShapeType) => {
    if (type === "rectangle") {
      setCurrentShape(createEmptyRectangle());
    } else {
      setCurrentShape(createEmptyLShape());
    }
    setSelectingShape(false);
  };

  const handleToggleBuilder = () => {
    if (showBuilder) {
      // Closing - apply changes
      if (totalArea > 0) {
        onChange(totalArea.toFixed(2));
      }
      setShapes([]);
      setCurrentShape(null);
      setSelectingShape(false);
    }
    setShowBuilder(!showBuilder);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleToggleBuilder}
          className={cn(
            "h-7 px-2 text-xs gap-1",
            showBuilder && "text-primary"
          )}
        >
          {showBuilder ? (
            <>
              <X className="w-3 h-3" />
              Close
            </>
          ) : (
            <>
              <Calculator className="w-3 h-3" />
              Area Builder
            </>
          )}
        </Button>
      </div>

      {showBuilder ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 space-y-4">
            {/* Shape preview */}
            <ShapePreview shapes={shapes} />

            {/* Existing shapes list */}
            {shapes.length > 0 && !currentShape && (
              <div className="space-y-2">
                {shapes.map((shape, index) => (
                  <div 
                    key={shape.id}
                    className="flex items-center justify-between p-2 bg-background rounded border"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {shape.shape.type === "rectangle" ? "Rectangle" : "L-Shape"}
                      </Badge>
                      <span className="text-sm font-medium">
                        {shape.calculatedArea.toFixed(1)}m²
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleEditShape(shape.id)}
                      >
                        <Calculator className="w-3 h-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive"
                        onClick={() => handleRemoveShape(shape.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Shape form or selector */}
            {currentShape ? (
              currentShape.type === "rectangle" ? (
                <RectangleForm
                  shape={currentShape}
                  onChange={setCurrentShape as (s: RectangleShape) => void}
                  onComplete={() => handleAddShape(currentShape)}
                  onCancel={() => {
                    setCurrentShape(null);
                    setEditingShapeId(null);
                  }}
                  isEditing={!!editingShapeId}
                />
              ) : (
                <LShapeForm
                  shape={currentShape}
                  onChange={setCurrentShape as (s: LShapeShape) => void}
                  onComplete={() => handleAddShape(currentShape)}
                  onCancel={() => {
                    setCurrentShape(null);
                    setEditingShapeId(null);
                  }}
                  isEditing={!!editingShapeId}
                />
              )
            ) : selectingShape ? (
              <ShapeSelector onSelect={handleSelectShapeType} />
            ) : (
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setSelectingShape(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {shapes.length === 0 ? "Add First Shape" : "Add Another Shape"}
                </Button>
                
                {shapes.length > 0 && (
                  <Button
                    type="button"
                    className="w-full"
                    onClick={handleComplete}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Done - Use {totalArea.toFixed(1)}m²
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Input
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
