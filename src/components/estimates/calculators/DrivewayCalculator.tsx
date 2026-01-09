import { useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Plus, Ruler, Square, Shuffle } from "lucide-react";
import { StandardSlabData, initialStandardSlabData } from "./StandardSlabCalculator";

type DrivewayUnit = "m" | "mm";
type DrivewayShape = "straight" | "tapered";

interface DrivewaySection {
  id: string;
  name: string;
  shape: DrivewayShape;
  length: string;
  width: string;
  widthTop: string;
  widthBottom: string;
}

export interface DrivewayData extends StandardSlabData {
  drivewayType: "straight" | "tapered" | "multi";
  unit: DrivewayUnit;
  sections: DrivewaySection[];
}

const createSection = (index: number): DrivewaySection => ({
  id: Date.now().toString() + index,
  name: `Section ${index + 1}`,
  shape: "straight",
  length: "",
  width: "",
  widthTop: "",
  widthBottom: "",
});

export const initialDrivewayData: DrivewayData = {
  ...initialStandardSlabData,
  drivewayType: "straight",
  unit: "m",
  sections: [
    {
      id: "1",
      name: "Main run",
      shape: "straight",
      length: "",
      width: "",
      widthTop: "",
      widthBottom: "",
    },
  ],
};

interface DrivewayCalculatorProps {
  data: DrivewayData;
  onChange: (data: DrivewayData) => void;
}

const formatMeters = (value: string) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed.toFixed(1) : "—";
};

const formatUnitLabel = (unit: DrivewayUnit) => (unit === "m" ? "m" : "mm");

const toMeters = (value: string, unit: DrivewayUnit) => {
  if (!value) return "";
  const parsed = parseFloat(value);
  if (!Number.isFinite(parsed)) return "";
  return unit === "mm" ? (parsed / 1000).toString() : parsed.toString();
};

const fromMeters = (value: string, unit: DrivewayUnit) => {
  if (!value) return "";
  const parsed = parseFloat(value);
  if (!Number.isFinite(parsed)) return "";
  return unit === "mm" ? (parsed * 1000).toString() : value;
};

const shouldSuggestMm = (value: string, unit: DrivewayUnit) => {
  if (unit !== "m") return false;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 1000;
};

const MeasurementSketch = ({ shape }: { shape: DrivewayShape }) => {
  if (shape === "tapered") {
    return (
      <svg viewBox="0 0 120 80" className="w-full max-w-[160px] text-primary">
        <polygon
          points="20,10 100,20 90,70 30,60"
          fill="rgba(59,130,246,0.15)"
          stroke="currentColor"
          strokeWidth="2"
        />
        <line x1="20" y1="10" x2="100" y2="20" stroke="currentColor" strokeDasharray="4 3" />
        <line x1="30" y1="60" x2="90" y2="70" stroke="currentColor" strokeDasharray="4 3" />
        <line x1="60" y1="15" x2="60" y2="65" stroke="currentColor" strokeDasharray="4 3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 120 80" className="w-full max-w-[160px] text-primary">
      <rect
        x="25"
        y="15"
        width="70"
        height="50"
        fill="rgba(59,130,246,0.15)"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line x1="25" y1="15" x2="95" y2="15" stroke="currentColor" strokeDasharray="4 3" />
      <line x1="25" y1="65" x2="95" y2="65" stroke="currentColor" strokeDasharray="4 3" />
      <line x1="60" y1="15" x2="60" y2="65" stroke="currentColor" strokeDasharray="4 3" />
    </svg>
  );
};

export function DrivewayCalculator({ data, onChange }: DrivewayCalculatorProps) {
  const updateSection = (id: string, field: keyof DrivewaySection, value: string) => {
    onChange({
      ...data,
      sections: data.sections.map((section) =>
        section.id === id ? { ...section, [field]: value } : section
      ),
    });
  };

  const setDrivewayType = (drivewayType: DrivewayData["drivewayType"]) => {
    onChange({
      ...data,
      drivewayType,
      sections: data.sections.map((section, index) =>
        index === 0
          ? { ...section, shape: drivewayType === "tapered" ? "tapered" : "straight" }
          : section
      ),
    });
  };

  const addSection = () => {
    onChange({
      ...data,
      sections: [...data.sections, createSection(data.sections.length)],
    });
  };

  const setUnit = (unit: DrivewayUnit) => {
    onChange({
      ...data,
      unit,
    });
  };

  const setThickness = (value: string) => {
    onChange({ ...data, slabThickness: value });
  };

  const setAllowance = (value: string) => {
    onChange({ ...data, wastagePercent: value });
  };

  const drivewayArea = useMemo(() => {
    const sectionsToMeasure = data.drivewayType === "multi" ? data.sections : [data.sections[0]];
    return sectionsToMeasure.reduce((sum, section) => {
      const length = parseFloat(section.length) || 0;
      if (section.shape === "straight") {
        const width = parseFloat(section.width) || 0;
        if (length <= 0 || width <= 0) return sum;
        return sum + length * width;
      }
      const widthTop = parseFloat(section.widthTop) || 0;
      const widthBottom = parseFloat(section.widthBottom) || 0;
      if (length <= 0 || widthTop <= 0 || widthBottom <= 0) return sum;
      return sum + length * (widthTop + widthBottom) / 2;
    }, 0);
  }, [data.drivewayType, data.sections]);

  useEffect(() => {
    const nextArea = drivewayArea > 0 ? drivewayArea.toFixed(2) : "";
    if (nextArea !== data.slabArea) {
      onChange({ ...data, slabArea: nextArea });
    }
  }, [data, drivewayArea, onChange]);

  const thicknessMeters = (parseFloat(data.slabThickness) || 0) / 1000;
  const allowance = (parseFloat(data.wastagePercent) || 0) / 100;
  const volume = drivewayArea * thicknessMeters;
  const volumeWithAllowance = volume * (1 + allowance);

  const renderSectionInputs = (section: DrivewaySection, index: number) => {
    const shape = data.drivewayType === "multi" ? section.shape : data.drivewayType;
    const showTapered = shape === "tapered";
    const unitLabel = formatUnitLabel(data.unit);
    const lengthValue = fromMeters(section.length, data.unit);
    const widthValue = fromMeters(section.width, data.unit);
    const widthTopValue = fromMeters(section.widthTop, data.unit);
    const widthBottomValue = fromMeters(section.widthBottom, data.unit);

    return (
      <Card key={section.id} className="border-dashed">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">
              {data.drivewayType === "multi" ? section.name : "Driveway"}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {showTapered ? "Different width at each end" : "Same width both ends"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            <div className="flex items-center justify-center bg-muted/40 rounded-lg p-3">
              <MeasurementSketch shape={showTapered ? "tapered" : "straight"} />
            </div>
            <div className="flex-1 space-y-3">
              {data.drivewayType === "multi" && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={section.shape === "straight" ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSection(section.id, "shape", "straight")}
                  >
                    Same width both ends
                  </Button>
                  <Button
                    type="button"
                    variant={section.shape === "tapered" ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSection(section.id, "shape", "tapered")}
                  >
                    Different width at each end
                  </Button>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>{showTapered ? "How long down the middle?" : "How long?"}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={lengthValue}
                    onChange={(e) => updateSection(section.id, "length", toMeters(e.target.value, data.unit))}
                    placeholder={data.unit === "mm" ? "e.g. 12000" : "e.g. 12"}
                  />
                  {shouldSuggestMm(section.length, data.unit) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto px-0 text-xs text-primary"
                      onClick={() => updateSection(section.id, "length", (parseFloat(section.length) / 1000).toFixed(1))}
                    >
                      Looks like mm → convert to {(parseFloat(section.length) / 1000).toFixed(1)} m?
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">{unitLabel}</p>
                </div>
                {showTapered ? (
                  <>
                    <div className="space-y-1">
                      <Label>Width at garage</Label>
                      <Input
                        type="number"
                        min="0"
                        value={widthTopValue}
                        onChange={(e) => updateSection(section.id, "widthTop", toMeters(e.target.value, data.unit))}
                        placeholder={data.unit === "mm" ? "e.g. 3200" : "e.g. 3.2"}
                      />
                      {shouldSuggestMm(section.widthTop, data.unit) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto px-0 text-xs text-primary"
                          onClick={() => updateSection(section.id, "widthTop", (parseFloat(section.widthTop) / 1000).toFixed(1))}
                        >
                          Looks like mm → convert to {(parseFloat(section.widthTop) / 1000).toFixed(1)} m?
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground">{unitLabel}</p>
                    </div>
                    <div className="space-y-1">
                      <Label>Width at street</Label>
                      <Input
                        type="number"
                        min="0"
                        value={widthBottomValue}
                        onChange={(e) => updateSection(section.id, "widthBottom", toMeters(e.target.value, data.unit))}
                        placeholder={data.unit === "mm" ? "e.g. 4800" : "e.g. 4.8"}
                      />
                      {shouldSuggestMm(section.widthBottom, data.unit) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto px-0 text-xs text-primary"
                          onClick={() => updateSection(section.id, "widthBottom", (parseFloat(section.widthBottom) / 1000).toFixed(1))}
                        >
                          Looks like mm → convert to {(parseFloat(section.widthBottom) / 1000).toFixed(1)} m?
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground">{unitLabel}</p>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1">
                    <Label>How wide?</Label>
                    <Input
                      type="number"
                      min="0"
                      value={widthValue}
                      onChange={(e) => updateSection(section.id, "width", toMeters(e.target.value, data.unit))}
                      placeholder={data.unit === "mm" ? "e.g. 3000" : "e.g. 3.0"}
                    />
                    {shouldSuggestMm(section.width, data.unit) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto px-0 text-xs text-primary"
                        onClick={() => updateSection(section.id, "width", (parseFloat(section.width) / 1000).toFixed(1))}
                      >
                        Looks like mm → convert to {(parseFloat(section.width) / 1000).toFixed(1)} m?
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground">{unitLabel}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            You entered: {formatMeters(section.length)} m long
            {showTapered
              ? `, ${formatMeters(section.widthTop)} m at garage, ${formatMeters(section.widthBottom)} m at street`
              : `, ${formatMeters(section.width)} m wide`}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Ruler className="w-4 h-4 text-primary" />
            Driveway measurements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm">Choose the driveway shape</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={data.drivewayType === "straight" ? "default" : "outline"}
                size="lg"
                onClick={() => setDrivewayType("straight")}
              >
                Same width both ends
              </Button>
              <Button
                type="button"
                variant={data.drivewayType === "tapered" ? "default" : "outline"}
                size="lg"
                onClick={() => setDrivewayType("tapered")}
              >
                Different width at each end
              </Button>
              <Button
                type="button"
                variant={data.drivewayType === "multi" ? "default" : "outline"}
                size="lg"
                onClick={() => setDrivewayType("multi")}
              >
                Measure it in pieces
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Label className="text-sm">Units</Label>
            <ToggleGroup type="single" value={data.unit} onValueChange={(value) => value && setUnit(value as DrivewayUnit)}>
              <ToggleGroupItem value="m">m</ToggleGroupItem>
              <ToggleGroupItem value="mm">mm</ToggleGroupItem>
            </ToggleGroup>
            <span className="text-xs text-muted-foreground">Default is metres</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {(data.drivewayType === "multi" ? data.sections : [data.sections[0]]).map(renderSectionInputs)}
      </div>

      {data.drivewayType === "multi" && (
        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={addSection}
        >
          <Plus className="w-4 h-4 mr-2" /> Add another section
        </Button>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Square className="w-4 h-4 text-primary" />
            Area & volume
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-3xl font-semibold">
            {drivewayArea > 0 ? drivewayArea.toFixed(2) : "—"} m²
          </div>
          <div className="text-sm text-muted-foreground">
            Sanity check: {data.slabArea ? `${data.slabArea} m² total` : "Enter measurements to see total area"}
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Thickness preset (mm)</Label>
            <div className="flex flex-wrap gap-2">
              {["80", "100", "120", "150"].map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={data.slabThickness === value ? "default" : "outline"}
                  onClick={() => setThickness(value)}
                >
                  {value} mm
                </Button>
              ))}
              <Input
                type="number"
                min="0"
                className="w-24"
                value={data.slabThickness}
                onChange={(e) => setThickness(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Add allowance</Label>
            <div className="flex flex-wrap gap-2">
              {["5", "7.5", "10"].map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={data.wastagePercent === value ? "default" : "outline"}
                  onClick={() => setAllowance(value)}
                >
                  {value}%
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border bg-muted/40">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shuffle className="w-4 h-4" /> Concrete volume
              </div>
              <div className="text-xl font-semibold">{volume.toFixed(2)} m³</div>
            </div>
            <div className="p-3 rounded-lg border bg-muted/40">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shuffle className="w-4 h-4" /> Trucks incl. allowance
              </div>
              <div className="text-xl font-semibold">{volumeWithAllowance.toFixed(2)} m³</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
