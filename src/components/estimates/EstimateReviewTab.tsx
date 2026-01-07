import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calculator, PenLine } from "lucide-react";
import { ScopeType, SCOPE_OPTIONS } from "./ScopeSelector";
import { ScopeCalculatorData } from "./EstimateFormDialog";

interface EstimateReviewTabProps {
  selectedScopes: Set<ScopeType>;
  scopeData: ScopeCalculatorData;
  onScopeDataChange: <K extends keyof ScopeCalculatorData>(
    scope: K,
    data: ScopeCalculatorData[K]
  ) => void;
  scopeTotals: Record<ScopeType, { total: number; description: string }>;
  formatCurrency: (amount: number) => string;
}

export function EstimateReviewTab({
  selectedScopes,
  scopeData,
  onScopeDataChange,
  scopeTotals,
  formatCurrency,
}: EstimateReviewTabProps) {
  const renderStandardSlabReview = (dataKey: "standard_slab" | "driveway", label: string) => {
    const data = scopeData[dataKey];
    return (
      <Card key={dataKey}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PenLine className="w-4 h-4" />
            {label}
            <Badge variant="secondary" className="ml-auto">
              {formatCurrency(scopeTotals[dataKey].total)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Slab Area (m²)</Label>
            <Input
              type="number"
              value={data.slabArea}
              onChange={(e) =>
                onScopeDataChange(dataKey, { ...data, slabArea: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Thickness (mm)</Label>
            <Input
              type="number"
              value={data.slabThickness}
              onChange={(e) =>
                onScopeDataChange(dataKey, { ...data, slabThickness: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Concrete $/m³</Label>
            <Input
              type="number"
              value={data.concretePrice}
              onChange={(e) =>
                onScopeDataChange(dataKey, { ...data, concretePrice: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Hourly Rate</Label>
            <Input
              type="number"
              value={data.hourlyRate}
              onChange={(e) =>
                onScopeDataChange(dataKey, { ...data, hourlyRate: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Materials Markup %</Label>
            <Input
              type="number"
              value={data.materialsMarkupPercent}
              onChange={(e) =>
                onScopeDataChange(dataKey, { ...data, materialsMarkupPercent: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Labour Markup %</Label>
            <Input
              type="number"
              value={data.labourMarkupPercent}
              onChange={(e) =>
                onScopeDataChange(dataKey, { ...data, labourMarkupPercent: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderRaftSlabReview = () => {
    const data = scopeData.raft_slab;
    return (
      <Card key="raft_slab">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PenLine className="w-4 h-4" />
            Raft Slab
            <Badge variant="secondary" className="ml-auto">
              {formatCurrency(scopeTotals.raft_slab.total)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Raft Area (m²)</Label>
            <Input
              type="number"
              value={data.raftArea}
              onChange={(e) =>
                onScopeDataChange("raft_slab", { ...data, raftArea: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Slab Thickness (mm)</Label>
            <Input
              type="number"
              value={data.slabThickness}
              onChange={(e) =>
                onScopeDataChange("raft_slab", { ...data, slabThickness: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Concrete $/m³</Label>
            <Input
              type="number"
              value={data.concretePrice}
              onChange={(e) =>
                onScopeDataChange("raft_slab", { ...data, concretePrice: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Hourly Rate</Label>
            <Input
              type="number"
              value={data.hourlyRate}
              onChange={(e) =>
                onScopeDataChange("raft_slab", { ...data, hourlyRate: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Materials Markup %</Label>
            <Input
              type="number"
              value={data.materialsMarkupPercent}
              onChange={(e) =>
                onScopeDataChange("raft_slab", { ...data, materialsMarkupPercent: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Labour Markup %</Label>
            <Input
              type="number"
              value={data.labourMarkupPercent}
              onChange={(e) =>
                onScopeDataChange("raft_slab", { ...data, labourMarkupPercent: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderPiersReview = () => {
    const data = scopeData.piers;
    const totalPiers = data.piers.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0);
    return (
      <Card key="piers">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PenLine className="w-4 h-4" />
            Piers ({totalPiers} total)
            <Badge variant="secondary" className="ml-auto">
              {formatCurrency(scopeTotals.piers.total)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Concrete $/m³</Label>
            <Input
              type="number"
              value={data.concretePricePerM3}
              onChange={(e) =>
                onScopeDataChange("piers", { ...data, concretePricePerM3: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Hourly Rate</Label>
            <Input
              type="number"
              value={data.labourHourlyRate}
              onChange={(e) =>
                onScopeDataChange("piers", { ...data, labourHourlyRate: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Hours Per Pier</Label>
            <Input
              type="number"
              value={data.labourHoursPerPier}
              onChange={(e) =>
                onScopeDataChange("piers", { ...data, labourHoursPerPier: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Materials Markup %</Label>
            <Input
              type="number"
              value={data.materialsMarkupPercent}
              onChange={(e) =>
                onScopeDataChange("piers", { ...data, materialsMarkupPercent: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Labour Markup %</Label>
            <Input
              type="number"
              value={data.labourMarkupPercent}
              onChange={(e) =>
                onScopeDataChange("piers", { ...data, labourMarkupPercent: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderWafflePodReview = () => {
    const data = scopeData.waffle_pod;
    const area = (parseFloat(data.slabLength) || 0) * (parseFloat(data.slabWidth) || 0);
    return (
      <Card key="waffle_pod">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PenLine className="w-4 h-4" />
            Waffle Pod ({area.toFixed(1)}m²)
            <Badge variant="secondary" className="ml-auto">
              {formatCurrency(scopeTotals.waffle_pod.total)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Length (m)</Label>
            <Input
              type="number"
              value={data.slabLength}
              onChange={(e) =>
                onScopeDataChange("waffle_pod", { ...data, slabLength: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Width (m)</Label>
            <Input
              type="number"
              value={data.slabWidth}
              onChange={(e) =>
                onScopeDataChange("waffle_pod", { ...data, slabWidth: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Concrete $/m³</Label>
            <Input
              type="number"
              value={data.concretePricePerM3}
              onChange={(e) =>
                onScopeDataChange("waffle_pod", { ...data, concretePricePerM3: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Hourly Rate</Label>
            <Input
              type="number"
              value={data.labourHourlyRate}
              onChange={(e) =>
                onScopeDataChange("waffle_pod", { ...data, labourHourlyRate: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Materials Markup %</Label>
            <Input
              type="number"
              value={data.materialsMarkupPercent}
              onChange={(e) =>
                onScopeDataChange("waffle_pod", { ...data, materialsMarkupPercent: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Labour Markup %</Label>
            <Input
              type="number"
              value={data.labourMarkupPercent}
              onChange={(e) =>
                onScopeDataChange("waffle_pod", { ...data, labourMarkupPercent: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderRetainingWallReview = () => {
    const data = scopeData.retaining_wall_footings;
    return (
      <Card key="retaining_wall_footings">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PenLine className="w-4 h-4" />
            Retaining Wall Footings ({data.footings.length} types)
            <Badge variant="secondary" className="ml-auto">
              {formatCurrency(scopeTotals.retaining_wall_footings.total)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Concrete $/m³</Label>
            <Input
              type="number"
              value={data.concretePricePerM3}
              onChange={(e) =>
                onScopeDataChange("retaining_wall_footings", { ...data, concretePricePerM3: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Hourly Rate</Label>
            <Input
              type="number"
              value={data.labourHourlyRate}
              onChange={(e) =>
                onScopeDataChange("retaining_wall_footings", { ...data, labourHourlyRate: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Hours Per Metre</Label>
            <Input
              type="number"
              value={data.labourHoursPerM}
              onChange={(e) =>
                onScopeDataChange("retaining_wall_footings", { ...data, labourHoursPerM: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Materials Markup %</Label>
            <Input
              type="number"
              value={data.materialsMarkupPercent}
              onChange={(e) =>
                onScopeDataChange("retaining_wall_footings", { ...data, materialsMarkupPercent: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Labour Markup %</Label>
            <Input
              type="number"
              value={data.labourMarkupPercent}
              onChange={(e) =>
                onScopeDataChange("retaining_wall_footings", { ...data, labourMarkupPercent: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderStripFootingsReview = () => {
    const data = scopeData.strip_footings;
    return (
      <Card key="strip_footings">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PenLine className="w-4 h-4" />
            Strip Footings ({data.footings.length} types)
            <Badge variant="secondary" className="ml-auto">
              {formatCurrency(scopeTotals.strip_footings.total)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Concrete $/m³</Label>
            <Input
              type="number"
              value={data.concretePricePerM3}
              onChange={(e) =>
                onScopeDataChange("strip_footings", { ...data, concretePricePerM3: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Hourly Rate</Label>
            <Input
              type="number"
              value={data.hourlyRate}
              onChange={(e) =>
                onScopeDataChange("strip_footings", { ...data, hourlyRate: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Crew Size</Label>
            <Input
              type="number"
              value={data.crewSize}
              onChange={(e) =>
                onScopeDataChange("strip_footings", { ...data, crewSize: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Materials Markup %</Label>
            <Input
              type="number"
              value={data.materialsMarkupPercent}
              onChange={(e) =>
                onScopeDataChange("strip_footings", { ...data, materialsMarkupPercent: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Labour Markup %</Label>
            <Input
              type="number"
              value={data.labourMarkupPercent}
              onChange={(e) =>
                onScopeDataChange("strip_footings", { ...data, labourMarkupPercent: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSuspendedSlabReview = () => {
    const data = scopeData.suspended_slab;
    return (
      <Card key="suspended_slab">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PenLine className="w-4 h-4" />
            Suspended Slab
            <Badge variant="secondary" className="ml-auto">
              {formatCurrency(scopeTotals.suspended_slab.total)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Slab Area (m²)</Label>
            <Input
              type="number"
              value={data.slabArea}
              onChange={(e) =>
                onScopeDataChange("suspended_slab", { ...data, slabArea: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Slab Thickness (mm)</Label>
            <Input
              type="number"
              value={data.slabThickness}
              onChange={(e) =>
                onScopeDataChange("suspended_slab", { ...data, slabThickness: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Concrete $/m³</Label>
            <Input
              type="number"
              value={data.concretePrice}
              onChange={(e) =>
                onScopeDataChange("suspended_slab", { ...data, concretePrice: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Hourly Rate</Label>
            <Input
              type="number"
              value={data.hourlyRate}
              onChange={(e) =>
                onScopeDataChange("suspended_slab", { ...data, hourlyRate: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Materials Markup %</Label>
            <Input
              type="number"
              value={data.materialsMarkupPercent}
              onChange={(e) =>
                onScopeDataChange("suspended_slab", { ...data, materialsMarkupPercent: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Labour Markup %</Label>
            <Input
              type="number"
              value={data.labourMarkupPercent}
              onChange={(e) =>
                onScopeDataChange("suspended_slab", { ...data, labourMarkupPercent: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCrossoversReview = () => {
    const data = scopeData.crossovers;
    return (
      <Card key="crossovers">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PenLine className="w-4 h-4" />
            Crossovers ({data.crossovers.length})
            <Badge variant="secondary" className="ml-auto">
              {formatCurrency(scopeTotals.crossovers.total)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Concrete $/m³</Label>
            <Input
              type="number"
              value={data.concretePricePerM3}
              onChange={(e) =>
                onScopeDataChange("crossovers", { ...data, concretePricePerM3: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Hourly Rate</Label>
            <Input
              type="number"
              value={data.labourHourlyRate}
              onChange={(e) =>
                onScopeDataChange("crossovers", { ...data, labourHourlyRate: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Hours Per m²</Label>
            <Input
              type="number"
              value={data.labourHoursPerM2}
              onChange={(e) =>
                onScopeDataChange("crossovers", { ...data, labourHoursPerM2: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Materials Markup %</Label>
            <Input
              type="number"
              value={data.materialsMarkupPercent}
              onChange={(e) =>
                onScopeDataChange("crossovers", { ...data, materialsMarkupPercent: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Labour Markup %</Label>
            <Input
              type="number"
              value={data.labourMarkupPercent}
              onChange={(e) =>
                onScopeDataChange("crossovers", { ...data, labourMarkupPercent: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderPathsSurroundsReview = () => {
    const data = scopeData.paths_surrounds;
    return (
      <Card key="paths_surrounds">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PenLine className="w-4 h-4" />
            Paths & Surrounds ({data.sections.length} sections)
            <Badge variant="secondary" className="ml-auto">
              {formatCurrency(scopeTotals.paths_surrounds.total)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Concrete $/m³</Label>
            <Input
              type="number"
              value={data.concretePricePerM3}
              onChange={(e) =>
                onScopeDataChange("paths_surrounds", { ...data, concretePricePerM3: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Hourly Rate</Label>
            <Input
              type="number"
              value={data.labourHourlyRate}
              onChange={(e) =>
                onScopeDataChange("paths_surrounds", { ...data, labourHourlyRate: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Hours Per m²</Label>
            <Input
              type="number"
              value={data.labourHoursPerM2}
              onChange={(e) =>
                onScopeDataChange("paths_surrounds", { ...data, labourHoursPerM2: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Materials Markup %</Label>
            <Input
              type="number"
              value={data.materialsMarkupPercent}
              onChange={(e) =>
                onScopeDataChange("paths_surrounds", { ...data, materialsMarkupPercent: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Labour Markup %</Label>
            <Input
              type="number"
              value={data.labourMarkupPercent}
              onChange={(e) =>
                onScopeDataChange("paths_surrounds", { ...data, labourMarkupPercent: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderScopeReview = (scope: ScopeType) => {
    switch (scope) {
      case "standard_slab":
        return renderStandardSlabReview("standard_slab", "Standard Slab");
      case "driveway":
        return renderStandardSlabReview("driveway", "Driveway");
      case "raft_slab":
        return renderRaftSlabReview();
      case "piers":
        return renderPiersReview();
      case "waffle_pod":
        return renderWafflePodReview();
      case "retaining_wall_footings":
        return renderRetainingWallReview();
      case "strip_footings":
        return renderStripFootingsReview();
      case "suspended_slab":
        return renderSuspendedSlabReview();
      case "crossovers":
        return renderCrossoversReview();
      case "paths_surrounds":
        return renderPathsSurroundsReview();
      default:
        return null;
    }
  };

  if (selectedScopes.size === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No scopes selected. Go back to Details to select scope of works.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
        <Calculator className="w-4 h-4" />
        <span>Review and adjust key values. Changes update the quote total instantly.</span>
      </div>

      {Array.from(selectedScopes).map((scope) => renderScopeReview(scope))}
    </div>
  );
}
