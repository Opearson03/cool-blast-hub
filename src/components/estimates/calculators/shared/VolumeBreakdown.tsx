import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface VolumeBreakdownRow {
  label: string;
  dimensions: string;
  volume: number;
  note?: string;
}

/**
 * Compute a line-by-line breakdown of how concrete volume was derived.
 * This mirrors the calculateVolume logic in scopes.ts but decomposes
 * the total into labelled components for user transparency.
 */
export function computeVolumeBreakdown(
  scopeId: string,
  scopeAnswers: Record<string, any>,
  derivedScopeAnswers: Record<string, any>
): VolumeBreakdownRow[] {
  const rows: VolumeBreakdownRow[] = [];

  // ── Slab scopes with extra-depth beams ──────────────────────────
  const slabWithBeams = ["raft_slab", "standard_slab"];
  const drivewayLike = ["driveway", "crossovers", "paths_surrounds"];

  if (slabWithBeams.includes(scopeId)) {
    return buildSlabWithBeamsBreakdown(scopeId, scopeAnswers, derivedScopeAnswers, true);
  }

  if (drivewayLike.includes(scopeId)) {
    return buildSlabWithBeamsBreakdown(scopeId, scopeAnswers, derivedScopeAnswers, false);
  }

  // ── Waffle Pod ──────────────────────────────────────────────────
  if (scopeId === "waffle_pod") {
    return buildWafflePodBreakdown(scopeAnswers, derivedScopeAnswers);
  }

  // ── Piers ───────────────────────────────────────────────────────
  if (scopeId === "piers") {
    return buildPiersBreakdown(scopeAnswers);
  }

  // ── Strip Footings ──────────────────────────────────────────────
  if (scopeId === "strip_footings") {
    return buildFootingsBreakdown(scopeAnswers, "Footing");
  }

  // ── Retaining Wall Footings ─────────────────────────────────────
  if (scopeId === "retaining_wall_footings") {
    return buildRetainingWallFootingsBreakdown(scopeAnswers);
  }

  // ── Pad Footings ────────────────────────────────────────────────
  if (scopeId === "pad_footings") {
    return buildPadFootingsBreakdown(scopeAnswers);
  }

  // ── Simple area × thickness scopes ──────────────────────────────
  if (scopeId === "suspended_slab") {
    const area = Number(derivedScopeAnswers.area) || 0;
    const thicknessMM = Number(scopeAnswers.thickness) || 0;
    const thicknessM = thicknessMM / 1000;
    rows.push({
      label: "Slab",
      dimensions: `${area.toFixed(1)} m² × ${thicknessMM}mm`,
      volume: area * thicknessM,
    });
    return rows;
  }

  if (scopeId === "architectural_concrete") {
    const vol = Number(scopeAnswers.total_volume) || 0;
    rows.push({
      label: "Custom Elements",
      dimensions: "Manual entry",
      volume: vol,
    });
    return rows;
  }

  // ── Retaining Walls (full wall scope) ───────────────────────────
  if (scopeId === "retaining_walls") {
    return buildRetainingWallsBreakdown(scopeAnswers);
  }

  // ── Kerbs & Channels ───────────────────────────────────────────
  if (scopeId === "kerbs_channels") {
    return buildKerbsBreakdown(scopeAnswers);
  }

  // ── Bollards ───────────────────────────────────────────────────
  if (scopeId === "bollards") {
    return buildBollardsBreakdown(scopeAnswers);
  }

  // ── Other scopes: generic fallback ──────────────────────────────
  // For scopes not explicitly handled, don't show breakdown
  return rows;
}

// ═══════════════════════════════════════════════════════════════════
// Breakdown builders
// ═══════════════════════════════════════════════════════════════════

function buildSlabWithBeamsBreakdown(
  scopeId: string,
  scopeAnswers: Record<string, any>,
  derivedScopeAnswers: Record<string, any>,
  alwaysIncludeBeams: boolean
): VolumeBreakdownRow[] {
  const rows: VolumeBreakdownRow[] = [];
  const thicknessMM = Number(scopeAnswers.thickness) || (scopeId === "raft_slab" ? 300 : 100);
  const thicknessM = thicknessMM / 1000;
  const totalArea = Number(derivedScopeAnswers.area) || 0;

  // Slab body
  const usePerAreaThickness = scopeAnswers.usePerAreaThickness === true;
  const areas = scopeAnswers.areas || [];
  let slabVolume = 0;

  if (usePerAreaThickness && areas.length > 0) {
    slabVolume = areas.reduce((sum: number, a: any) => {
      const areaM2 = a._actualArea && a._actualArea > 0
        ? a._actualArea
        : (Number(a.length) || 0) * (Number(a.width) || 0);
      const areaThicknessM = (Number(a.thickness) || thicknessMM) / 1000;
      return sum + areaM2 * areaThicknessM;
    }, 0);
    rows.push({
      label: "Slab Body",
      dimensions: `${totalArea.toFixed(1)} m² (per-area thickness)`,
      volume: slabVolume,
    });
  } else {
    slabVolume = totalArea * thicknessM;
    rows.push({
      label: "Slab Body",
      dimensions: `${totalArea.toFixed(1)} m² × ${thicknessMM}mm`,
      volume: slabVolume,
    });
  }

  // Edge beams / thickening
  const edgeBeams = scopeAnswers.edgeBeams || [];
  const showEdge = alwaysIncludeBeams
    ? edgeBeams.length > 0
    : scopeAnswers.hasEdgeBeams === true && edgeBeams.length > 0;

  if (showEdge) {
    let edgeVolume = 0;
    const edgeLengths: number[] = [];
    const edgeWidths: number[] = [];
    const edgeDepths: number[] = [];

    edgeBeams.forEach((beam: any) => {
      const lengthM = Number(beam.length) || 0;
      const widthMM = Number(beam.width) || (scopeId === "raft_slab" ? 450 : 300);
      const depthMM = Number(beam.depth) || (scopeId === "raft_slab" ? 450 : 300);
      const widthM = widthMM / 1000;
      const depthM = depthMM / 1000;
      const extraDepth = Math.max(0, depthM - thicknessM);
      edgeVolume += lengthM * widthM * extraDepth;
      edgeLengths.push(lengthM);
      edgeWidths.push(widthMM);
      edgeDepths.push(depthMM);
    });

    const totalLen = edgeLengths.reduce((s, l) => s + l, 0);
    const avgWidth = Math.round(edgeWidths.reduce((s, w) => s + w, 0) / edgeWidths.length);
    const avgDepth = Math.round(edgeDepths.reduce((s, d) => s + d, 0) / edgeDepths.length);
    const extraDepthMM = Math.max(0, avgDepth - thicknessMM);

    const label = scopeId === "raft_slab" ? "Edge Beams" : "Edge Thickening";
    rows.push({
      label,
      dimensions: `${totalLen.toFixed(1)}m × ${avgWidth}mm × (${avgDepth}−${thicknessMM})mm`,
      volume: edgeVolume,
      note: "Extra depth only — overlap with slab excluded",
    });
  }

  // Internal beams / thickening
  const beams = scopeAnswers.beams || [];
  const showInternal = alwaysIncludeBeams
    ? beams.length > 0
    : scopeAnswers.hasInternalBeams === true && beams.length > 0;

  if (showInternal) {
    let internalVolume = 0;
    const intLengths: number[] = [];
    const intWidths: number[] = [];
    const intDepths: number[] = [];

    beams.forEach((beam: any) => {
      const lengthM = Number(beam.length) || 0;
      const widthMM = Number(beam.width) || 300;
      const depthMM = Number(beam.depth) || (scopeId === "raft_slab" ? 400 : 300);
      const widthM = widthMM / 1000;
      const depthM = depthMM / 1000;
      const extraDepth = Math.max(0, depthM - thicknessM);
      internalVolume += lengthM * widthM * extraDepth;
      intLengths.push(lengthM);
      intWidths.push(widthMM);
      intDepths.push(depthMM);
    });

    const totalLen = intLengths.reduce((s, l) => s + l, 0);
    const avgWidth = Math.round(intWidths.reduce((s, w) => s + w, 0) / intWidths.length);
    const avgDepth = Math.round(intDepths.reduce((s, d) => s + d, 0) / intDepths.length);

    const label = scopeId === "raft_slab" ? "Internal Beams" : "Internal Thickening";
    rows.push({
      label,
      dimensions: `${totalLen.toFixed(1)}m × ${avgWidth}mm × (${avgDepth}−${thicknessMM})mm`,
      volume: internalVolume,
      note: "Extra depth only — overlap with slab excluded",
    });
  }

  return rows;
}

function buildWafflePodBreakdown(
  scopeAnswers: Record<string, any>,
  derivedScopeAnswers: Record<string, any>
): VolumeBreakdownRow[] {
  const rows: VolumeBreakdownRow[] = [];
  const totalArea = Number(derivedScopeAnswers.area) || 0;
  const topSlabMM = Number(scopeAnswers.top_slab_thickness) || 85;
  const topSlabM = topSlabMM / 1000;
  const podThicknessMM = Number(scopeAnswers.pod_thickness) || 225;
  const podThicknessM = podThicknessMM / 1000;
  const podCount = Number(scopeAnswers.pod_count) || 0;
  const totalHeightM = topSlabM + podThicknessM;

  // Topping slab
  rows.push({
    label: "Topping Slab",
    dimensions: `${totalArea.toFixed(1)} m² × ${topSlabMM}mm`,
    volume: totalArea * topSlabM,
  });

  // Pod field (ribs)
  const ribVolume = podCount * 0.2519 * podThicknessM;
  rows.push({
    label: "Pod Field (ribs)",
    dimensions: `${podCount} pods × 0.2519 × ${podThicknessMM}mm`,
    volume: ribVolume,
  });

  // Edge beams (full depth for waffle pod)
  const edgeBeams = scopeAnswers.edgeBeams || [];
  if (Array.isArray(edgeBeams) && edgeBeams.length > 0) {
    let edgeVolume = 0;
    const totalLen = edgeBeams.reduce((s: number, b: any) => s + (Number(b.length) || 0), 0);

    edgeBeams.forEach((beam: any) => {
      const lengthM = Number(beam.length) || 0;
      const widthM = (Number(beam.width) || 450) / 1000;
      const depthM = (Number(beam.depth) || totalHeightM * 1000) / 1000;
      edgeVolume += lengthM * widthM * depthM;
    });

    // Corner overlap deduction
    const avgEdgeWidthM = edgeBeams.reduce((s: number, b: any) => s + (Number(b.width) || 450), 0) / edgeBeams.length / 1000;
    const avgEdgeDepthM = edgeBeams.reduce((s: number, b: any) => s + (Number(b.depth) || totalHeightM * 1000), 0) / edgeBeams.length / 1000;
    const cornerOverlap = 4 * avgEdgeWidthM * avgEdgeWidthM * avgEdgeDepthM;
    edgeVolume = Math.max(0, edgeVolume - cornerOverlap);

    rows.push({
      label: "Edge Beams",
      dimensions: `${totalLen.toFixed(1)}m (full depth)`,
      volume: edgeVolume,
    });
  }

  // Internal beams (full depth for waffle pod)
  const beams = scopeAnswers.beams || [];
  const internalBeams = Array.isArray(beams)
    ? beams.filter((b: any) => b.type !== "edge_beam" && b.markup_type !== "edge_beam")
    : [];

  if (internalBeams.length > 0) {
    let intVolume = 0;
    const totalLen = internalBeams.reduce((s: number, b: any) => s + (Number(b.length) || 0), 0);

    internalBeams.forEach((beam: any) => {
      const lengthM = Number(beam.length) || 0;
      const widthM = (Number(beam.width) || 110) / 1000;
      const depthM = (Number(beam.depth) || totalHeightM * 1000) / 1000;
      intVolume += lengthM * widthM * depthM;
    });

    // Intersection overlap deduction
    const avgEdgeWidthM = edgeBeams.length > 0
      ? edgeBeams.reduce((s: number, b: any) => s + (Number(b.width) || 450), 0) / edgeBeams.length / 1000
      : 0.45;
    const avgIntWidthM = internalBeams.reduce((s: number, b: any) => s + (Number(b.width) || 110), 0) / internalBeams.length / 1000;
    const avgEdgeDepthM = edgeBeams.length > 0
      ? edgeBeams.reduce((s: number, b: any) => s + (Number(b.depth) || totalHeightM * 1000), 0) / edgeBeams.length / 1000
      : totalHeightM;
    const avgIntDepthM = internalBeams.reduce((s: number, b: any) => s + (Number(b.depth) || totalHeightM * 1000), 0) / internalBeams.length / 1000;
    const edgeIntersectionCount = internalBeams.length * 2;
    const intersectionOverlap = edgeIntersectionCount * avgIntWidthM * avgEdgeWidthM * Math.max(avgIntDepthM, avgEdgeDepthM);
    intVolume = Math.max(0, intVolume - intersectionOverlap);

    rows.push({
      label: "Internal Beams",
      dimensions: `${totalLen.toFixed(1)}m (full depth)`,
      volume: intVolume,
    });
  }

  return rows;
}

function buildPiersBreakdown(scopeAnswers: Record<string, any>): VolumeBreakdownRow[] {
  const rows: VolumeBreakdownRow[] = [];

  // Check pierGroups first, then legacy piers
  const pierGroups = scopeAnswers.pierGroups || [];
  const piers = scopeAnswers.piers || [];
  const groups = pierGroups.length > 0 ? pierGroups : piers;

  groups.forEach((group: any, i: number) => {
    const qty = Number(group.quantity) || 1;
    const diamMM = Number(group.diameter) || 0;
    const depthMM = Number(group.depth) || 0;
    const diamM = diamMM / 1000;
    const depthM = depthMM / 1000;
    const radius = diamM / 2;
    const vol = qty * Math.PI * radius * radius * depthM;
    const label = group.name || `Group ${i + 1}`;

    rows.push({
      label: `${qty}× ${label}`,
      dimensions: `${diamMM}mm dia × ${depthMM}mm deep`,
      volume: vol,
    });
  });

  return rows;
}

function buildFootingsBreakdown(
  scopeAnswers: Record<string, any>,
  typeLabel: string
): VolumeBreakdownRow[] {
  const rows: VolumeBreakdownRow[] = [];
  const footings = scopeAnswers.footings || [];

  if (footings.length > 0) {
    footings.forEach((f: any, i: number) => {
      const length = Number(f._actualLength) || Number(f.length) || 0;
      const widthMM = Number(f.width) || 0;
      const depthMM = Number(f.depth) || 0;
      const vol = length * (widthMM / 1000) * (depthMM / 1000);
      const label = f.name || `${typeLabel} ${i + 1}`;

      rows.push({
        label,
        dimensions: `${length.toFixed(1)}m × ${widthMM}mm × ${depthMM}mm`,
        volume: vol,
      });
    });
  } else {
    const length = Number(scopeAnswers.total_length) || 0;
    const widthMM = Number(scopeAnswers.width) || 0;
    const depthMM = Number(scopeAnswers.depth) || 0;
    const vol = length * (widthMM / 1000) * (depthMM / 1000);
    rows.push({
      label: typeLabel,
      dimensions: `${length.toFixed(1)}m × ${widthMM}mm × ${depthMM}mm`,
      volume: vol,
    });
  }

  return rows;
}

function buildRetainingWallFootingsBreakdown(
  scopeAnswers: Record<string, any>
): VolumeBreakdownRow[] {
  const rows: VolumeBreakdownRow[] = [];
  const footings = scopeAnswers.footings || [];

  if (footings.length > 0) {
    footings.forEach((f: any, i: number) => {
      const length = Number(f._actualLength) || Number(f.length) || 0;
      const widthMM = Number(f.width) || 0;
      const depthMM = Number(f.depth) || 0;
      const mainVol = length * (widthMM / 1000) * (depthMM / 1000);
      const label = f.name || `Footing ${i + 1}`;

      rows.push({
        label,
        dimensions: `${length.toFixed(1)}m × ${widthMM}mm × ${depthMM}mm`,
        volume: mainVol,
      });

      // Toe volume if applicable
      if (f.has_toe === true) {
        const toeWidthMM = Number(f.toe_width) || 0;
        const toeDepthMM = Number(f.toe_depth) || 0;
        const toeVol = length * (toeWidthMM / 1000) * (toeDepthMM / 1000);
        if (toeVol > 0) {
          rows.push({
            label: `${label} (toe)`,
            dimensions: `${length.toFixed(1)}m × ${toeWidthMM}mm × ${toeDepthMM}mm`,
            volume: toeVol,
          });
        }
      }
    });
  }

  return rows;
}

function buildPadFootingsBreakdown(scopeAnswers: Record<string, any>): VolumeBreakdownRow[] {
  const rows: VolumeBreakdownRow[] = [];

  // Check padGroups first, then legacy pads/footings
  const padGroups = scopeAnswers.padGroups || [];
  const pads = scopeAnswers.pads || scopeAnswers.footings || [];
  const groups = padGroups.length > 0 ? padGroups : pads;

  if (groups.length > 0) {
    groups.forEach((g: any, i: number) => {
      const qty = Number(g.quantity) || 1;
      const lengthMM = Number(g.length) || 0;
      const widthMM = Number(g.width) || 0;
      const depthMM = Number(g.depth) || 0;
      const vol = qty * (lengthMM / 1000) * (widthMM / 1000) * (depthMM / 1000);
      const label = g.name || `Pad Group ${i + 1}`;

      rows.push({
        label: `${qty}× ${label}`,
        dimensions: `${lengthMM}mm × ${widthMM}mm × ${depthMM}mm`,
        volume: vol,
      });
    });
  }

  return rows;
}

function buildRetainingWallsBreakdown(scopeAnswers: Record<string, any>): VolumeBreakdownRow[] {
  const rows: VolumeBreakdownRow[] = [];
  const footings = scopeAnswers.footings || [];
  const totalLength = footings.length > 0
    ? footings.reduce((s: number, f: any) => s + (Number(f.length) || 0), 0)
    : Number(scopeAnswers.total_length) || 0;

  const wallHeightMM = Number(scopeAnswers.wall_height) || 1200;
  const wallThickMM = Number(scopeAnswers.wall_thickness) || 200;
  const wallVol = totalLength * (wallHeightMM / 1000) * (wallThickMM / 1000);

  rows.push({
    label: "Wall",
    dimensions: `${totalLength.toFixed(1)}m × ${wallHeightMM}mm × ${wallThickMM}mm`,
    volume: wallVol,
  });

  if (scopeAnswers.include_footing) {
    const footingWidthMM = Number(scopeAnswers.footing_width) || 600;
    const footingDepthMM = Number(scopeAnswers.footing_depth) || 300;
    const footingVol = totalLength * (footingWidthMM / 1000) * (footingDepthMM / 1000);

    rows.push({
      label: "Strip Footing",
      dimensions: `${totalLength.toFixed(1)}m × ${footingWidthMM}mm × ${footingDepthMM}mm`,
      volume: footingVol,
    });
  }

  return rows;
}

function buildKerbsBreakdown(scopeAnswers: Record<string, any>): VolumeBreakdownRow[] {
  const rows: VolumeBreakdownRow[] = [];
  const footings = scopeAnswers.footings || [];

  const kerbType = scopeAnswers.kerb_type || 'barrier';
  const kerbLabels: Record<string, { label: string; dims: string; area: number }> = {
    barrier: { label: 'Barrier Kerb', dims: '150mm × 300mm', area: 0.15 * 0.30 },
    mountable: { label: 'Mountable Kerb', dims: '150mm × 150mm', area: 0.15 * 0.15 },
    rollover: { label: 'Roll-top Kerb', dims: '150mm × 200mm', area: 0.15 * 0.20 },
    channel: { label: 'Channel Only', dims: '300mm × 75mm', area: 0.30 * 0.075 },
    kerb_channel: { label: 'Kerb & Channel', dims: '450mm × 300mm', area: 0.45 * 0.30 },
  };
  const profile = kerbLabels[kerbType] || kerbLabels.barrier;

  if (footings.length > 0) {
    footings.forEach((f: any, i: number) => {
      const length = Number(f._actualLength) || Number(f.length) || 0;
      const vol = length * profile.area;
      const label = f.name || `Section ${i + 1}`;
      rows.push({
        label,
        dimensions: `${length.toFixed(1)}m × ${profile.dims} (${profile.label})`,
        volume: vol,
      });
    });
  } else {
    const length = Number(scopeAnswers.total_length) || 0;
    const vol = length * profile.area;
    rows.push({
      label: profile.label,
      dimensions: `${length.toFixed(1)}m × ${profile.dims}`,
      volume: vol,
    });
  }

  return rows;
}

function buildBollardsBreakdown(scopeAnswers: Record<string, any>): VolumeBreakdownRow[] {
  const rows: VolumeBreakdownRow[] = [];
  const numBollards = Number(scopeAnswers.num_bollards) || 4;
  const diamMM = Number(scopeAnswers.diameter) || 200;
  const heightAboveMM = Number(scopeAnswers.height_above) || 900;
  const embedMM = Number(scopeAnswers.embedment_depth) || 400;
  const footingDiamMM = Number(scopeAnswers.footing_diameter) || 400;

  const bollardR = (diamMM / 1000) / 2;
  const footingR = (footingDiamMM / 1000) / 2;
  const totalH = (heightAboveMM + embedMM) / 1000;
  const embedM = embedMM / 1000;

  const bollardVol = Math.PI * bollardR * bollardR * totalH;
  const footingVol = Math.PI * footingR * footingR * embedM;
  const additionalFooting = Math.max(0, footingVol - (Math.PI * bollardR * bollardR * embedM));
  const perBollard = bollardVol + additionalFooting;

  rows.push({
    label: `${numBollards}× Bollards`,
    dimensions: `ø${diamMM}mm × ${heightAboveMM + embedMM}mm tall + ø${footingDiamMM}mm footing`,
    volume: numBollards * perBollard,
    note: `Each bollard: ${perBollard.toFixed(4)} m³`,
  });

  return rows;
}

// ═══════════════════════════════════════════════════════════════════
// React Component
// ═══════════════════════════════════════════════════════════════════

interface VolumeBreakdownProps {
  scopeId: string;
  scopeAnswers: Record<string, any>;
  derivedScopeAnswers: Record<string, any>;
}

export function VolumeBreakdown({
  scopeId,
  scopeAnswers,
  derivedScopeAnswers,
}: VolumeBreakdownProps) {
  const [open, setOpen] = useState(false);

  const rows = computeVolumeBreakdown(scopeId, scopeAnswers, derivedScopeAnswers);
  if (rows.length === 0) return null;

  const total = rows.reduce((s, r) => s + r.volume, 0);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-0.5">
        <span>How it's calculated</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-2 space-y-1.5">
        {rows.map((row, i) => (
          <div key={i} className="space-y-0.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-mono tabular-nums">
                {row.volume.toFixed(2)} m³
              </span>
            </div>
            <div className="text-xs text-muted-foreground/70 pl-2">
              {row.dimensions}
            </div>
            {row.note && (
              <div className="text-xs italic text-muted-foreground/60 pl-2">
                {row.note}
              </div>
            )}
          </div>
        ))}

        {rows.length > 1 && (
          <div className="flex justify-between text-sm font-medium border-t pt-1.5 mt-1.5">
            <span>Total Volume</span>
            <span className="font-mono tabular-nums">{total.toFixed(2)} m³</span>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
