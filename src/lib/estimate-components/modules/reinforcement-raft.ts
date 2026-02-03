import type { EstimateModule, ComponentCost, ExclusionItem, CostLineItem, PriceMap, BeamConfig, MeasurementArea, HorizontalBarConfig, VerticalBarConfig, WafflePodZone } from '../types';
import { getPrice, REBAR_WEIGHTS } from '../types';

/**
 * Raft Slab Reinforcement Module (Unified)
 * 
 * Supports per-item reinforcement configuration:
 * - Each slab area can have different mesh/bar settings
 * - Each beam (edge/internal) can have different TM and ligature settings
 */

const getChairTypeFromThickness = (thickness: number): string => {
  if (thickness < 100) return '2540C';
  if (thickness < 125) return '5065C';
  if (thickness < 175) return '7590C';
  if (thickness < 250) return '100120C';
  return '125150C';
};

const CHAIR_LABELS: Record<string, string> = {
  '2540C': '25-40mm',
  '5065C': '50-65mm',
  '7590C': '75-90mm',
  '100120C': '100-120mm',
  '125150C': '125-150mm',
};

export const reinforcementRaftModule: EstimateModule = {
  id: 'reinforcement-raft',
  name: 'Reinforcement',
  description: 'Steel reinforcement for raft slab',
  icon: 'Grid3X3',

  questions: [
    // ═══════════════════════════════════════════════════════════════
    // SECTION 1: SLAB SURFACE (pricing/calculation params only)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'mesh_lap_allowance',
      type: 'number',
      label: 'Mesh Lap Allowance',
      defaultValue: 12.5,
      min: 0,
      max: 30,
      unit: '%',
      sectionLabel: 'Slab Surface',
    },
    // Note: Slab chairs are now configured per-area inside AreaReinforcementInput

    // ═══════════════════════════════════════════════════════════════
    // SECTION 2: EDGE BEAMS / EDGE THICKENING (toggle only - per-beam config in UI)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'edge_beam_reo',
      type: 'boolean',
      label: 'Include Edge Beam Reinforcement',
      defaultValue: false,
      sectionLabel: 'Edge Beams',
      // Scope-aware labels for driveway, crossovers, paths_surrounds, standard_slab (uses "Edge Thickening" instead of "Edge Beams")
      getScopeLabel: (scopeId: string) => {
        const edgeThickeningScopes = ['driveway', 'crossovers', 'paths_surrounds', 'standard_slab'];
        return edgeThickeningScopes.includes(scopeId) 
          ? 'Include Edge Thickening Reinforcement' 
          : 'Include Edge Beam Reinforcement';
      },
      getScopeSectionLabel: (scopeId: string) => {
        const edgeThickeningScopes = ['driveway', 'crossovers', 'paths_surrounds', 'standard_slab'];
        return edgeThickeningScopes.includes(scopeId) 
          ? 'Edge Thickening' 
          : 'Edge Beams';
      },
    },
    // Note: Edge beam chairs are now configured per-beam inside BeamReinforcementInput

    // ═══════════════════════════════════════════════════════════════
    // SECTION 3: INTERNAL BEAMS (toggle only - per-beam config in UI)
    // Hidden for driveway, crossovers, paths_surrounds scopes (no internal beams)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'internal_beam_reo',
      type: 'boolean',
      label: 'Include Internal Beam Reinforcement',
      defaultValue: false,
      sectionLabel: 'Internal Beams',
      // Hide for driveway, crossovers, paths_surrounds, standard_slab scopes (no internal beams)
      showIf: (_answers: Record<string, any>, scopeData?: Record<string, any>) => {
        const noInternalBeamScopes = ['driveway', 'crossovers', 'paths_surrounds', 'standard_slab'];
        return !noInternalBeamScopes.includes(scopeData?.scopeId || '');
      },
    },
    // Note: Internal beam chairs are now configured per-beam inside BeamReinforcementInput
    
    // ═══════════════════════════════════════════════════════════════
    // SECTION 4: OTHER ACCESSORIES
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'tie_wire',
      type: 'boolean',
      label: 'Include Tie Wire',
      defaultValue: false,
      sectionLabel: 'Other Accessories',
    },
    {
      id: 'tie_wire_coils',
      type: 'number',
      label: 'Coils',
      defaultValue: 2,
      min: 1,
      showIf: (answers) => answers.tie_wire === true,
    },
    {
      id: 'tie_wire_price',
      type: 'currency',
      label: 'Price/Coil',
      defaultValue: 15,
      showIf: (answers) => answers.tie_wire === true,
      deriveFrom: (_scopeData, _moduleAnswers, priceMap) => {
        return priceMap?.['consumables']?.['TIE WIRE'];
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // SECTION 5: DELIVERY
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'reo_delivery',
      type: 'currency',
      label: 'Reinforcement Delivery',
      defaultValue: 150,
      sectionLabel: 'Delivery',
      priceListKey: 'rebar.REO DELIVERY',
    },
  ],

  calculate: (answers, priceMap, scopeData): ComponentCost => {
    const lineItems: CostLineItem[] = [];
    let subtotal = 0;
    const LAP_ALLOWANCE = 1.125;

    // Hardcoded defaults (per-area overrides take precedence)
    const defaultSlabReoType = 'mesh';
    const defaultMeshType = 'SL82';
    const defaultBarSize = 'N12';
    const defaultBarSpacing = '200';
    const defaultBarLayers = '2';

    // Get areas and beams from scope data
    const areas: MeasurementArea[] = scopeData?.areas || [];
    const edgeBeams: BeamConfig[] = scopeData?.edgeBeams || [];
    const internalBeams: BeamConfig[] = scopeData?.beams || [];
    const totalArea = Number(scopeData?.area) || 0;

    // Check if any area has reinforcement
    const hasAnySlabReo = areas.length > 0 
      ? areas.some(a => (a.reo_type || defaultSlabReoType) !== 'none' && (a.reo_type || defaultSlabReoType) !== 'fiber')
      : true; // Default to mesh if no areas defined

    if (!hasAnySlabReo && !answers.edge_beam_reo && !answers.internal_beam_reo) {
      return {
        moduleId: 'reinforcement-raft',
        moduleName: 'Reinforcement',
        lineItems: [],
        subtotal: 0,
        exclusions: [],
      };
    }

    // ═══════════════════════════════════════════════════════════════
    // SLAB SURFACE REINFORCEMENT (per area)
    // ═══════════════════════════════════════════════════════════════
    const lapPercent = 1 + (Number(answers.mesh_lap_allowance) || 12.5) / 100;
    const sheetArea = 14.4;
    const pricePerTonne = getPrice(priceMap, 'rebar', `${defaultBarSize} CB`, 2100);

    // Skip generic area mesh for waffle pods - they use dedicated WafflePodToppingMeshInput
    const skipGenericAreaMesh = scopeData?.scopeId === 'waffle_pod';

    if (areas.length > 0 && !skipGenericAreaMesh) {
      areas.forEach((area) => {
        const reoType = area.reo_type || defaultSlabReoType;
        const areaValue = area._actualArea || (Number(area.length) || 0) * (Number(area.width) || 0);
        
        if (areaValue <= 0 || reoType === 'none' || reoType === 'fiber') return;

        if (reoType === 'mesh') {
          const meshType = area.mesh_type || defaultMeshType;
          const meshLayers = Number(area.mesh_layers) || 1;
          const meshTypeTop = area.mesh_type_top || meshType;
          const totalMeshArea = areaValue * lapPercent;
          const sheetsPerLayer = Math.ceil(totalMeshArea / sheetArea);
          
          // Bottom layer (always present)
          const pricePerSheetBottom = Number(answers.mesh_price_per_sheet) || getPrice(priceMap, 'mesh', meshType, 95);
          const bottomCost = sheetsPerLayer * pricePerSheetBottom;
          
          lineItems.push({
            id: `mesh_${area.id}_bottom`,
            description: meshLayers > 1 
              ? `${area.name} – ${meshType} (${sheetsPerLayer} sheets) – Bottom`
              : `${area.name} – ${meshType} (${sheetsPerLayer} sheets)`,
            quantity: sheetsPerLayer,
            unit: 'sheets',
            unitPrice: pricePerSheetBottom,
            total: Math.round(bottomCost * 100) / 100,
            category: 'materials',
          });
          subtotal += bottomCost;
          
          // Top layer (only if 2 layers)
          if (meshLayers > 1) {
            const pricePerSheetTop = getPrice(priceMap, 'mesh', meshTypeTop, 95);
            const topCost = sheetsPerLayer * pricePerSheetTop;
            
            lineItems.push({
              id: `mesh_${area.id}_top`,
              description: `${area.name} – ${meshTypeTop} (${sheetsPerLayer} sheets) – Top`,
              quantity: sheetsPerLayer,
              unit: 'sheets',
              unitPrice: pricePerSheetTop,
              total: Math.round(topCost * 100) / 100,
              category: 'materials',
            });
            subtotal += topCost;
          }
        }

        if (reoType === 'bar') {
          const barSize = area.bar_size || defaultBarSize;
          const spacing = Number(area.bar_spacing || defaultBarSpacing);
          const layers = Number(area.bar_layers || defaultBarLayers);
          const weightPerMetre = REBAR_WEIGHTS[barSize] || 0.888;

          const barsPerMetre = 1000 / spacing;
          const sideLength = Math.sqrt(areaValue);
          const barsPerDirection = Math.ceil(sideLength * barsPerMetre);
          const totalBarLength = barsPerDirection * sideLength * 2 * layers * LAP_ALLOWANCE;
          const totalWeight = totalBarLength * weightPerMetre;
          const cost = (totalWeight / 1000) * pricePerTonne;

          lineItems.push({
            id: `bar_${area.id}`,
            description: `${area.name} – ${barSize} @ ${spacing}mm (${layers}L, ${Math.round(totalWeight)}kg)`,
            quantity: Math.round(totalWeight),
            unit: 'kg',
            unitPrice: pricePerTonne / 1000,
            total: Math.round(cost * 100) / 100,
            category: 'materials',
          });
          subtotal += cost;
        }
      });
    } else if (totalArea > 0) {
      // Fallback for single area without per-area breakdown - default to mesh
      const pricePerSheet = getPrice(priceMap, 'mesh', defaultMeshType, 95);
      const totalMeshArea = totalArea * lapPercent;
      const sheets = Math.ceil(totalMeshArea / sheetArea);
      const cost = sheets * pricePerSheet;

      lineItems.push({
        id: 'mesh_slab',
        description: `Slab ${defaultMeshType} (${sheets} sheets)`,
        quantity: sheets,
        unit: 'sheets',
        unitPrice: pricePerSheet,
        total: Math.round(cost * 100) / 100,
        category: 'materials',
      });
      subtotal += cost;
    }

    // ═══════════════════════════════════════════════════════════════
    // SLAB CHAIRS (per-area configuration)
    // ═══════════════════════════════════════════════════════════════
    if (areas.length > 0) {
      // Group chair requirements by type for aggregation
      const chairsByType: Record<string, { count: number; price: number }> = {};
      let layerChairsTotal = 0;
      let layerChairPrice = 35;
      
      areas.forEach((area) => {
        const reoType = area.reo_type || defaultSlabReoType;
        if (reoType === 'none' || reoType === 'fiber') return;
        if (!area.chairs_enabled) return;
        
        const areaValue = area._actualArea || (Number(area.length) || 0) * (Number(area.width) || 0);
        if (areaValue <= 0) return;
        
        const chairType = area.chair_type || '7590C';
        const chairsPerM2 = area.chairs_per_m2 ?? 4;
        const chairPrice = area.chair_price_per_bag ?? getPrice(priceMap, 'consumables', chairType, 35);
        
        const totalChairs = Math.ceil(areaValue * chairsPerM2);
        
        if (!chairsByType[chairType]) {
          chairsByType[chairType] = { count: 0, price: chairPrice };
        }
        chairsByType[chairType].count += totalChairs;
        
        // Layer chairs (between mesh layers)
        if (area.layer_chairs_enabled && (area.mesh_layers ?? 1) > 1) {
          const layerChairsPerM2 = area.layer_chairs_per_m2 ?? 2;
          layerChairsTotal += Math.ceil(areaValue * layerChairsPerM2);
          layerChairPrice = area.layer_chair_price ?? 35;
        }
      });
      
      // Generate line items for each chair type
      Object.entries(chairsByType).forEach(([chairType, { count, price }]) => {
        const bags = Math.ceil(count / 100);
        const cost = bags * price;
        
        lineItems.push({
          id: `slab_chairs_${chairType}`,
          description: `Slab Bar Chairs ${CHAIR_LABELS[chairType] || chairType} (${bags} × 100)`,
          quantity: bags,
          unit: 'bags',
          unitPrice: price,
          total: Math.round(cost * 100) / 100,
          category: 'materials',
        });
        subtotal += cost;
      });
      
      // Layer chairs between mesh layers
      if (layerChairsTotal > 0) {
        const bags = Math.ceil(layerChairsTotal / 100);
        const cost = bags * layerChairPrice;
        
        lineItems.push({
          id: 'slab_layer_chairs',
          description: `Mesh Layer Spacer Chairs (${bags} × 100)`,
          quantity: bags,
          unit: 'bags',
          unitPrice: layerChairPrice,
          total: Math.round(cost * 100) / 100,
          category: 'materials',
        });
        subtotal += cost;
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // WAFFLE POD SPECIFIC REINFORCEMENT (GEOMETRIC CALCULATION)
    // 
    // Supports multi-zone waffle pods with different pod depths per zone.
    // Rib bars are calculated per zone and aggregated.
    // ═══════════════════════════════════════════════════════════════
    const isWafflePod = scopeData?.scopeId === 'waffle_pod';
    if (isWafflePod) {
      const podZones: WafflePodZone[] = scopeData?.podZones || [];
      const hasZones = podZones.length > 0;
      
      // Stock length preference
      const stockLength = Number(scopeData?.stock_length) || 6;

      // ═══════════════════════════════════════════════════════════════
      // MULTI-ZONE RIB BAR REINFORCEMENT
      // Boss's formula: ribs reo = pods × 2.4 (per layer)
      // Calculate per zone for different configurations
      // ═══════════════════════════════════════════════════════════════
      if (hasZones) {
        // Aggregate rib bars by size for combined line items
        const ribBarsBySize: Record<string, { 
          totalLength: number; 
          weight: number; 
          position: 'bottom' | 'top';
          zones: string[];
        }> = {};

        podZones.forEach(zone => {
          const zonePodCount = Number(zone.pod_count) || 0;
          if (zonePodCount === 0) return;
          
          // Total rib length per layer = (pods × 2.4) - (perimeter / 2)
          // Deduct half perimeter as ribs don't extend into edge beams
          const zonePerimeter = Number(zone.perimeter) || 0;
          const ribLengthPerLayerM = Math.max(0, (zonePodCount * 2.4) - (zonePerimeter / 2));
          
          // Bottom bars configuration
          const bottomBarsPerRib = Number(zone.rib_bottom_bars) || 2;
          const bottomBarSize = String(zone.rib_bottom_bar_size || 'N12');
          const bottomBarWeight = REBAR_WEIGHTS[bottomBarSize] || 0.888;
          
          // Top bars configuration (support 0 for no top bars)
          const topBarsPerRib = zone.rib_top_bars !== undefined && zone.rib_top_bars !== null 
            ? Number(zone.rib_top_bars) : 1;
          const topBarSize = String(zone.rib_top_bar_size || 'N12');
          const topBarWeight = REBAR_WEIGHTS[topBarSize] || 0.888;
          
          // Calculate bottom bar totals with lap allowance
          const bottomTotalLength = ribLengthPerLayerM * bottomBarsPerRib * LAP_ALLOWANCE;
          const bottomWeightKg = bottomTotalLength * bottomBarWeight;
          
          // Aggregate bottom bars
          const bottomKey = `${bottomBarSize}_bottom`;
          if (!ribBarsBySize[bottomKey]) {
            ribBarsBySize[bottomKey] = { totalLength: 0, weight: 0, position: 'bottom', zones: [] };
          }
          ribBarsBySize[bottomKey].totalLength += bottomTotalLength;
          ribBarsBySize[bottomKey].weight += bottomWeightKg;
          ribBarsBySize[bottomKey].zones.push(zone.name);
          
          // Calculate top bar totals with lap allowance
          if (topBarsPerRib > 0) {
            const topTotalLength = ribLengthPerLayerM * topBarsPerRib * LAP_ALLOWANCE;
            const topWeightKg = topTotalLength * topBarWeight;
            
            // Aggregate top bars
            const topKey = `${topBarSize}_top`;
            if (!ribBarsBySize[topKey]) {
              ribBarsBySize[topKey] = { totalLength: 0, weight: 0, position: 'top', zones: [] };
            }
            ribBarsBySize[topKey].totalLength += topTotalLength;
            ribBarsBySize[topKey].weight += topWeightKg;
            ribBarsBySize[topKey].zones.push(zone.name);
          }
        });

        // Generate line items for aggregated rib bars
        Object.entries(ribBarsBySize).forEach(([key, data]) => {
          const [barSize, position] = key.split('_');
          const stockQty = Math.ceil(data.totalLength / stockLength);
          const rebarPricePerTonne = getPrice(priceMap, 'rebar', `${barSize} CB`, 2100);
          const cost = (data.weight / 1000) * rebarPricePerTonne;
          
          const zoneNote = data.zones.length <= 2 
            ? data.zones.join(' & ') 
            : `${data.zones.length} zones`;
          
          lineItems.push({
            id: `waffle_rib_${position}_${barSize}`,
            description: `Rib ${position === 'bottom' ? 'Bottom' : 'Top'} ${barSize} (${stockQty} × ${stockLength}m, ${Math.round(data.weight)}kg) – ${zoneNote}`,
            quantity: stockQty,
            unit: 'lengths',
            unitPrice: Math.round((cost / stockQty) * 100) / 100,
            total: Math.round(cost * 100) / 100,
            category: 'materials',
          });
          subtotal += cost;
        });
      } else {
        // Legacy single-zone calculation (backward compatibility)
        const podCount = Number(scopeData?.pod_count) || 0;
        
        if (podCount > 0) {
          // Total rib length per layer = (pods × 2.4) - (perimeter / 2)
          // Deduct half perimeter as ribs don't extend into edge beams
          const perimeter = Number(scopeData?.perimeter) || 0;
          const ribLengthPerLayerM = Math.max(0, (podCount * 2.4) - (perimeter / 2));
          
          // Bottom bars configuration
          const bottomBarsPerRib = Number(scopeData?.rib_bottom_bars) || 2;
          const bottomBarSize = String(scopeData?.rib_bottom_bar_size || 'N12');
          const bottomBarWeight = REBAR_WEIGHTS[bottomBarSize] || 0.888;
          
          // Top bars configuration (support 0 for no top bars)
          const topBarsPerRib = scopeData?.rib_top_bars !== undefined && scopeData?.rib_top_bars !== null 
            ? Number(scopeData.rib_top_bars) : 1;
          const topBarSize = String(scopeData?.rib_top_bar_size || 'N12');
          const topBarWeight = REBAR_WEIGHTS[topBarSize] || 0.888;
          
          // Calculate bottom bar totals with lap allowance
          const bottomTotalLength = ribLengthPerLayerM * bottomBarsPerRib * LAP_ALLOWANCE;
          const bottomWeightKg = bottomTotalLength * bottomBarWeight;
          const bottomStockQty = Math.ceil(bottomTotalLength / stockLength);
          
          // Calculate top bar totals with lap allowance
          const topTotalLength = ribLengthPerLayerM * topBarsPerRib * LAP_ALLOWANCE;
          const topWeightKg = topTotalLength * topBarWeight;
          const topStockQty = Math.ceil(topTotalLength / stockLength);
          
          // Price per tonne for rebar
          const rebarPricePerTonne = getPrice(priceMap, 'rebar', `${bottomBarSize} CB`, 2100);
          
          // Bottom bars line item
          if (bottomBarsPerRib > 0 && bottomTotalLength > 0) {
            const bottomCost = (bottomWeightKg / 1000) * rebarPricePerTonne;
            
            lineItems.push({
              id: 'waffle_rib_bottom',
              description: `Rib Bottom ${bottomBarSize} × ${bottomBarsPerRib} (${bottomStockQty} × ${stockLength}m, ${Math.round(bottomWeightKg)}kg)`,
              quantity: bottomStockQty,
              unit: 'lengths',
              unitPrice: Math.round((bottomCost / bottomStockQty) * 100) / 100,
              total: Math.round(bottomCost * 100) / 100,
              category: 'materials',
            });
            subtotal += bottomCost;
          }
          
          // Top bars line item
          if (topBarsPerRib > 0 && topTotalLength > 0) {
            const topRebarPricePerTonne = getPrice(priceMap, 'rebar', `${topBarSize} CB`, 2100);
            const topCost = (topWeightKg / 1000) * topRebarPricePerTonne;
            
            lineItems.push({
              id: 'waffle_rib_top',
              description: `Rib Top ${topBarSize} × ${topBarsPerRib} (${topStockQty} × ${stockLength}m, ${Math.round(topWeightKg)}kg)`,
              quantity: topStockQty,
              unit: 'lengths',
              unitPrice: Math.round((topCost / topStockQty) * 100) / 100,
              total: Math.round(topCost * 100) / 100,
              category: 'materials',
            });
            subtotal += topCost;
          }
        }
      }
      
      // Get aggregated values for mesh calculation
      const tmChairsCount = Number(scopeData?.tm_chairs_count) || 0;
      const barChairsCount = Number(scopeData?.bar_chairs_count) || 0;
      const perimeter = Number(scopeData?.perimeter) || 0;
      const podCount = Number(scopeData?.pod_count) || 0;
      
      // ═══════════════════════════════════════════════════════════════
      // TOPPING SLAB MESH (SELECTABLE COVERAGE AREA)
      // ═══════════════════════════════════════════════════════════════
      const meshType = String(scopeData?.topping_mesh_type || 'SL82');
      const meshLayers = Number(scopeData?.topping_mesh_layers) || 1;
      const meshAreaMode = String(scopeData?.topping_mesh_area_mode || 'pod_field');
      const meshLapPercent = 1 + (Number(scopeData?.topping_mesh_lap_percent) || 12.5) / 100;
      // Use volumeBreakdown if available, otherwise fall back to full area (no 0.85 reduction)
      const podFieldArea = Number(scopeData?.volumeBreakdown?.podFieldArea_m2) || totalArea;
      
      // Determine mesh coverage area based on mode
      let meshCoverageArea = totalArea;
      let coverageNote = '';
      switch (meshAreaMode) {
        case 'pod_field':
          meshCoverageArea = podFieldArea;
          coverageNote = 'pod field';
          break;
        case 'full_slab':
          meshCoverageArea = totalArea;
          coverageNote = 'full slab';
          break;
        case 'custom':
          meshCoverageArea = Number(scopeData?.topping_mesh_custom_area) || totalArea;
          coverageNote = 'custom';
          break;
      }
      
      if (meshCoverageArea > 0) {
        const meshAreaWithLap = meshCoverageArea * meshLapPercent * meshLayers;
        const meshSheets = Math.ceil(meshAreaWithLap / sheetArea);
        const meshPrice = getPrice(priceMap, 'mesh', meshType, 95);
        const meshCost = meshSheets * meshPrice;
        
        const layerNote = meshLayers > 1 ? ` × ${meshLayers}L` : '';
        lineItems.push({
          id: 'waffle_slab_mesh',
          description: `Topping ${meshType}${layerNote} (${meshSheets} sheets, ${coverageNote})`,
          quantity: meshSheets,
          unit: 'sheets',
          unitPrice: meshPrice,
          total: Math.round(meshCost * 100) / 100,
          category: 'materials',
        });
        subtotal += meshCost;
      }
      
      // ═══════════════════════════════════════════════════════════════
      // ACCESSORIES (ALLOWANCES - LABELED AND EDITABLE)
      // These are heuristic-based allowances for quoting purposes
      // ═══════════════════════════════════════════════════════════════
      
      // TM Chairs for perimeter beams (heuristic: perimeter ÷ 1.2)
      if (tmChairsCount > 0) {
        const tmChairPrice = getPrice(priceMap, 'consumables', 'TMCHAIR', 12.50);
        const bags = Math.ceil(tmChairsCount / 25);
        const cost = bags * tmChairPrice;
        
        lineItems.push({
          id: 'waffle_tm_chairs',
          description: `TM Chairs (${bags} × 25) [allowance: perimeter ÷ 1.2]`,
          quantity: bags,
          unit: 'bags',
          unitPrice: tmChairPrice,
          total: Math.round(cost * 100) / 100,
          category: 'materials',
        });
        subtotal += cost;
      }
      
      // Bar Chairs for pod support (heuristic: pods × 3)
      if (barChairsCount > 0) {
        const barChairPrice = getPrice(priceMap, 'consumables', '2540C', 35);
        const bags = Math.ceil(barChairsCount / 100);
        const cost = bags * barChairPrice;
        
        lineItems.push({
          id: 'waffle_bar_chairs',
          description: `Bar Chairs 25-40mm (${bags} × 100) [allowance: pods × 3]`,
          quantity: bags,
          unit: 'bags',
          unitPrice: barChairPrice,
          total: Math.round(cost * 100) / 100,
          category: 'materials',
        });
        subtotal += cost;
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // EDGE BEAM CHAIRS (per-beam configuration)
    // ═══════════════════════════════════════════════════════════════
    if (answers.edge_beam_reo && edgeBeams.length > 0) {
      let totalChairs = 0;
      let totalLayerChairs = 0;
      let chairPrice = 12.50;
      let layerChairPrice = 12.50;
      
      edgeBeams.forEach((beam) => {
        if (!beam.chairs_enabled) return;
        const length = Number(beam.length) || 0;
        if (length <= 0) return;
        
        const chairsPerM = beam.chairs_per_m ?? 1.4;
        chairPrice = beam.chair_price_per_bag ?? getPrice(priceMap, 'consumables', 'TMCHAIR', 12.50);
        totalChairs += Math.ceil(length * chairsPerM);
        
        // Layer chairs (between TM layers)
        if (beam.layer_chairs_enabled && (beam.tm_layers ?? 1) > 1) {
          const layerChairsPerM = beam.layer_chairs_per_m ?? 1;
          layerChairPrice = beam.layer_chair_price ?? 12.50;
          totalLayerChairs += Math.ceil(length * layerChairsPerM);
        }
      });
      
      if (totalChairs > 0) {
        const bags = Math.ceil(totalChairs / 25);
        const cost = bags * chairPrice;
        
        lineItems.push({
          id: 'edge_beam_chairs',
          description: `Edge Beam TM Chairs (${bags} × 25)`,
          quantity: bags,
          unit: 'bags',
          unitPrice: chairPrice,
          total: Math.round(cost * 100) / 100,
          category: 'materials',
        });
        subtotal += cost;
      }
      
      if (totalLayerChairs > 0) {
        const bags = Math.ceil(totalLayerChairs / 25);
        const cost = bags * layerChairPrice;
        
        lineItems.push({
          id: 'edge_beam_layer_chairs',
          description: `Edge Beam TM Layer Chairs (${bags} × 25)`,
          quantity: bags,
          unit: 'bags',
          unitPrice: layerChairPrice,
          total: Math.round(cost * 100) / 100,
          category: 'materials',
        });
        subtotal += cost;
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // INTERNAL BEAM CHAIRS (per-beam configuration)
    // ═══════════════════════════════════════════════════════════════
    if (answers.internal_beam_reo && internalBeams.length > 0) {
      let totalChairs = 0;
      let totalLayerChairs = 0;
      let chairPrice = 12.50;
      let layerChairPrice = 12.50;
      
      internalBeams.forEach((beam) => {
        if (!beam.chairs_enabled) return;
        const length = Number(beam.length) || 0;
        if (length <= 0) return;
        
        const chairsPerM = beam.chairs_per_m ?? 1.4;
        chairPrice = beam.chair_price_per_bag ?? getPrice(priceMap, 'consumables', 'TMCHAIR', 12.50);
        totalChairs += Math.ceil(length * chairsPerM);
        
        // Layer chairs (between TM layers)
        if (beam.layer_chairs_enabled && (beam.tm_layers ?? 1) > 1) {
          const layerChairsPerM = beam.layer_chairs_per_m ?? 1;
          layerChairPrice = beam.layer_chair_price ?? 12.50;
          totalLayerChairs += Math.ceil(length * layerChairsPerM);
        }
      });
      
      if (totalChairs > 0) {
        const bags = Math.ceil(totalChairs / 25);
        const cost = bags * chairPrice;
        
        lineItems.push({
          id: 'internal_beam_chairs',
          description: `Internal Beam TM Chairs (${bags} × 25)`,
          quantity: bags,
          unit: 'bags',
          unitPrice: chairPrice,
          total: Math.round(cost * 100) / 100,
          category: 'materials',
        });
        subtotal += cost;
      }
      
      if (totalLayerChairs > 0) {
        const bags = Math.ceil(totalLayerChairs / 25);
        const cost = bags * layerChairPrice;
        
        lineItems.push({
          id: 'internal_beam_layer_chairs',
          description: `Internal Beam TM Layer Chairs (${bags} × 25)`,
          quantity: bags,
          unit: 'bags',
          unitPrice: layerChairPrice,
          total: Math.round(cost * 100) / 100,
          category: 'materials',
        });
        subtotal += cost;
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // OTHER ACCESSORIES
    // ═══════════════════════════════════════════════════════════════
    if (answers.tie_wire && hasAnySlabReo) {
      const coils = Number(answers.tie_wire_coils) || 2;
      const pricePerCoil = Number(answers.tie_wire_price) || getPrice(priceMap, 'consumables', 'TIE WIRE', 15);
      const cost = coils * pricePerCoil;

      lineItems.push({
        id: 'tie_wire',
        description: `Tie Wire (${coils} coils)`,
        quantity: coils,
        unit: 'coils',
        unitPrice: pricePerCoil,
        total: Math.round(cost * 100) / 100,
        category: 'materials',
      });
      subtotal += cost;
    }

    // ═══════════════════════════════════════════════════════════════
    // EDGE BEAMS (per beam - all config stored on beam object)
    // ═══════════════════════════════════════════════════════════════
    if (answers.edge_beam_reo && edgeBeams.length > 0) {
      // Hardcoded defaults for beams that don't have explicit settings
      const DEFAULT_TM_TYPE = 'L11TM4';
      const DEFAULT_ADD_LIGS = false;
      const DEFAULT_LIG_SIZE = 'R10';
      const DEFAULT_LIG_CENTRES = 200;

      edgeBeams.forEach((beam) => {
        const length = Number(beam.length) || 0;
        if (length <= 0) return;

        const tmType = beam.tm_type || DEFAULT_TM_TYPE;
        const tmLayers = Number(beam.tm_layers) || 1;
        const tmTypeTop = beam.tm_type_top || tmType;
        const addLigs = beam.add_ligs ?? DEFAULT_ADD_LIGS;
        const ligSize = beam.lig_size || DEFAULT_LIG_SIZE;
        const ligCentres = beam.lig_centres ?? DEFAULT_LIG_CENTRES;

        // Skip trench mesh if set to 'none'
        if (tmType !== 'none') {
          const tmLengthWithLap = length * LAP_ALLOWANCE;
          const tmSheetsPerLayer = Math.ceil(tmLengthWithLap / 6);
          
          // Bottom layer (always present)
          const tmPriceBottom = getPrice(priceMap, 'trench_mesh', tmType, 108);
          const bottomCost = tmSheetsPerLayer * tmPriceBottom;
          
          lineItems.push({
            id: `edge_tm_${beam.id}_bottom`,
            description: tmLayers > 1 
              ? `${beam.name} – ${tmType} (${tmSheetsPerLayer} sheets) – Bottom`
              : `${beam.name} – ${tmType} (${tmSheetsPerLayer} sheets)`,
            quantity: tmSheetsPerLayer,
            unit: 'sheets',
            unitPrice: tmPriceBottom,
            total: Math.round(bottomCost * 100) / 100,
            category: 'materials',
          });
          subtotal += bottomCost;
          
          // Top layer (only if 2 layers)
          if (tmLayers > 1) {
            const tmPriceTop = getPrice(priceMap, 'trench_mesh', tmTypeTop, 108);
            const topCost = tmSheetsPerLayer * tmPriceTop;
            
            lineItems.push({
              id: `edge_tm_${beam.id}_top`,
              description: `${beam.name} – ${tmTypeTop} (${tmSheetsPerLayer} sheets) – Top`,
              quantity: tmSheetsPerLayer,
              unit: 'sheets',
              unitPrice: tmPriceTop,
              total: Math.round(topCost * 100) / 100,
              category: 'materials',
            });
            subtotal += topCost;
          }
        }

        if (addLigs) {
          const ligPrice = getPrice(priceMap, 'rebar', `${ligSize} COIL`, 2100);
          const ligWeightPerM = REBAR_WEIGHTS[ligSize] || 0.617;
          const ligCount = Math.ceil((length * 1000) / ligCentres);
          const ligPerimeter = 2 * ((Number(beam.width) / 1000) + (Number(beam.depth) / 1000)) + 0.1;
          const ligTotalLength = ligCount * ligPerimeter;
          const ligWeight = ligTotalLength * ligWeightPerM;
          const ligCost = (ligWeight / 1000) * ligPrice;

          lineItems.push({
            id: `edge_ligs_${beam.id}`,
            description: `${beam.name} – ${ligSize} Ligs @ ${ligCentres}mm (${ligCount} pcs)`,
            quantity: ligCount,
            unit: 'pcs',
            unitPrice: Math.round((ligCost / ligCount) * 100) / 100,
            total: Math.round(ligCost * 100) / 100,
            category: 'materials',
          });
          subtotal += ligCost;
        }

        // ═══════════════════════════════════════════════════════════════
        // HORIZONTAL BARS for edge beams
        // ═══════════════════════════════════════════════════════════════
        const hBars = beam.horizontal_bars || [];
        if (hBars.length > 0) {
          hBars.forEach((bar: HorizontalBarConfig) => {
            const barSize = bar.bar_size || 'N12';
            const barQuantity = bar.quantity || 1;
            const position = bar.position || 'bottom';
            const barLength = length * barQuantity * LAP_ALLOWANCE;
            const weightPerMetre = REBAR_WEIGHTS[barSize] || 0.888;
            const totalWeight = barLength * weightPerMetre;
            const pricePerTonne = getPrice(priceMap, 'rebar', `${barSize} CB`, 2100);
            const cost = (totalWeight / 1000) * pricePerTonne;

            lineItems.push({
              id: `edge_bar_${beam.id}_${barSize}_${position}`,
              description: `${beam.name} – ${barSize} ${position} (${barQuantity} × ${Math.round(totalWeight)}kg)`,
              quantity: Math.round(totalWeight),
              unit: 'kg',
              unitPrice: pricePerTonne / 1000,
              total: Math.round(cost * 100) / 100,
              category: 'materials',
            });
            subtotal += cost;
          });
        }

        // ═══════════════════════════════════════════════════════════════
        // VERTICAL BARS (starters) for edge beams
        // ═══════════════════════════════════════════════════════════════
        const vBars = beam.vertical_bars || [];
        if (vBars.length > 0) {
          vBars.forEach((bar: VerticalBarConfig) => {
            const barSize = bar.bar_size || 'N16';
            const centres = bar.centres || 400;
            const barLengthMm = bar.length || 1200;
            const barLengthM = barLengthMm / 1000;
            const barCount = Math.ceil((length * 1000) / centres);
            const weightPerMetre = REBAR_WEIGHTS[barSize] || 1.58;
            const totalWeight = barCount * barLengthM * weightPerMetre * LAP_ALLOWANCE;
            const pricePerTonne = getPrice(priceMap, 'rebar', `${barSize} CB`, 2100);
            const cost = (totalWeight / 1000) * pricePerTonne;

            lineItems.push({
              id: `edge_vbar_${beam.id}_${barSize}`,
              description: `${beam.name} – ${barSize} Starters @ ${centres}mm (${barCount} pcs, ${Math.round(totalWeight)}kg)`,
              quantity: barCount,
              unit: 'pcs',
              unitPrice: Math.round((cost / barCount) * 100) / 100,
              total: Math.round(cost * 100) / 100,
              category: 'materials',
            });
            subtotal += cost;
          });
        }
      });
    } else if (answers.edge_beam_reo && !edgeBeams.length) {
      const perimeter = Number(scopeData?.perimeter) || Number(scopeData?.edge_beam_length) || 0;
      if (perimeter > 0) {
        const tmType = 'L11TM4';
        const tmPrice = getPrice(priceMap, 'trench_mesh', tmType, 108);
        const tmLengthWithLap = perimeter * LAP_ALLOWANCE;
        const tmSheets = Math.ceil(tmLengthWithLap / 6);
        const tmCost = tmSheets * tmPrice;

        lineItems.push({
          id: 'edge_beam_tm',
          description: `Edge Beams – ${tmType} (${tmSheets} sheets)`,
          quantity: tmSheets,
          unit: 'sheets',
          unitPrice: tmPrice,
          total: Math.round(tmCost * 100) / 100,
          category: 'materials',
        });
        subtotal += tmCost;
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // INTERNAL BEAMS (per beam - all config stored on beam object)
    // ═══════════════════════════════════════════════════════════════
    if (answers.internal_beam_reo && internalBeams.length > 0) {
      // Hardcoded defaults for beams that don't have explicit settings
      const DEFAULT_TM_TYPE = 'L11TM4';
      const DEFAULT_ADD_LIGS = false;
      const DEFAULT_LIG_SIZE = 'R10';
      const DEFAULT_LIG_CENTRES = 200;

      internalBeams.forEach((beam) => {
        const length = Number(beam.length) || 0;
        if (length <= 0) return;

        const tmType = beam.tm_type || DEFAULT_TM_TYPE;
        const tmLayers = Number(beam.tm_layers) || 1;
        const tmTypeTop = beam.tm_type_top || tmType;
        const addLigs = beam.add_ligs ?? DEFAULT_ADD_LIGS;
        const ligSize = beam.lig_size || DEFAULT_LIG_SIZE;
        const ligCentres = beam.lig_centres ?? DEFAULT_LIG_CENTRES;

        // Skip trench mesh if set to 'none'
        if (tmType !== 'none') {
          const tmLengthWithLap = length * LAP_ALLOWANCE;
          const tmSheetsPerLayer = Math.ceil(tmLengthWithLap / 6);
          
          // Bottom layer (always present)
          const tmPriceBottom = getPrice(priceMap, 'trench_mesh', tmType, 108);
          const bottomCost = tmSheetsPerLayer * tmPriceBottom;
          
          lineItems.push({
            id: `internal_tm_${beam.id}_bottom`,
            description: tmLayers > 1 
              ? `${beam.name} – ${tmType} (${tmSheetsPerLayer} sheets) – Bottom`
              : `${beam.name} – ${tmType} (${tmSheetsPerLayer} sheets)`,
            quantity: tmSheetsPerLayer,
            unit: 'sheets',
            unitPrice: tmPriceBottom,
            total: Math.round(bottomCost * 100) / 100,
            category: 'materials',
          });
          subtotal += bottomCost;
          
          // Top layer (only if 2 layers)
          if (tmLayers > 1) {
            const tmPriceTop = getPrice(priceMap, 'trench_mesh', tmTypeTop, 108);
            const topCost = tmSheetsPerLayer * tmPriceTop;
            
            lineItems.push({
              id: `internal_tm_${beam.id}_top`,
              description: `${beam.name} – ${tmTypeTop} (${tmSheetsPerLayer} sheets) – Top`,
              quantity: tmSheetsPerLayer,
              unit: 'sheets',
              unitPrice: tmPriceTop,
              total: Math.round(topCost * 100) / 100,
              category: 'materials',
            });
            subtotal += topCost;
          }
        }

        if (addLigs) {
          const ligPrice = getPrice(priceMap, 'rebar', `${ligSize} COIL`, 2100);
          const ligWeightPerM = REBAR_WEIGHTS[ligSize] || 0.617;
          const ligCount = Math.ceil((length * 1000) / ligCentres);
          const ligPerimeter = 2 * ((Number(beam.width) / 1000) + (Number(beam.depth) / 1000)) + 0.1;
          const ligTotalLength = ligCount * ligPerimeter;
          const ligWeight = ligTotalLength * ligWeightPerM;
          const ligCost = (ligWeight / 1000) * ligPrice;

          lineItems.push({
            id: `internal_ligs_${beam.id}`,
            description: `${beam.name} – ${ligSize} Ligs @ ${ligCentres}mm (${ligCount} pcs)`,
            quantity: ligCount,
            unit: 'pcs',
            unitPrice: Math.round((ligCost / ligCount) * 100) / 100,
            total: Math.round(ligCost * 100) / 100,
            category: 'materials',
          });
          subtotal += ligCost;
        }

        // ═══════════════════════════════════════════════════════════════
        // HORIZONTAL BARS for internal beams
        // ═══════════════════════════════════════════════════════════════
        const hBars = beam.horizontal_bars || [];
        if (hBars.length > 0) {
          hBars.forEach((bar: HorizontalBarConfig) => {
            const barSize = bar.bar_size || 'N12';
            const barQuantity = bar.quantity || 1;
            const position = bar.position || 'bottom';
            const barLength = length * barQuantity * LAP_ALLOWANCE;
            const weightPerMetre = REBAR_WEIGHTS[barSize] || 0.888;
            const totalWeight = barLength * weightPerMetre;
            const pricePerTonne = getPrice(priceMap, 'rebar', `${barSize} CB`, 2100);
            const cost = (totalWeight / 1000) * pricePerTonne;

            lineItems.push({
              id: `internal_bar_${beam.id}_${barSize}_${position}`,
              description: `${beam.name} – ${barSize} ${position} (${barQuantity} × ${Math.round(totalWeight)}kg)`,
              quantity: Math.round(totalWeight),
              unit: 'kg',
              unitPrice: pricePerTonne / 1000,
              total: Math.round(cost * 100) / 100,
              category: 'materials',
            });
            subtotal += cost;
          });
        }

        // ═══════════════════════════════════════════════════════════════
        // VERTICAL BARS (starters) for internal beams
        // ═══════════════════════════════════════════════════════════════
        const vBars = beam.vertical_bars || [];
        if (vBars.length > 0) {
          vBars.forEach((bar: VerticalBarConfig) => {
            const barSize = bar.bar_size || 'N16';
            const centres = bar.centres || 400;
            const barLengthMm = bar.length || 1200;
            const barLengthM = barLengthMm / 1000;
            const barCount = Math.ceil((length * 1000) / centres);
            const weightPerMetre = REBAR_WEIGHTS[barSize] || 1.58;
            const totalWeight = barCount * barLengthM * weightPerMetre * LAP_ALLOWANCE;
            const pricePerTonne = getPrice(priceMap, 'rebar', `${barSize} CB`, 2100);
            const cost = (totalWeight / 1000) * pricePerTonne;

            lineItems.push({
              id: `internal_vbar_${beam.id}_${barSize}`,
              description: `${beam.name} – ${barSize} Starters @ ${centres}mm (${barCount} pcs, ${Math.round(totalWeight)}kg)`,
              quantity: barCount,
              unit: 'pcs',
              unitPrice: Math.round((cost / barCount) * 100) / 100,
              total: Math.round(cost * 100) / 100,
              category: 'materials',
            });
            subtotal += cost;
          });
        }
      });
    } else if (answers.internal_beam_reo) {
      const totalInternalLength = Number(scopeData?.internal_beams_length) || 0;
      if (totalInternalLength > 0) {
        const tmType = 'L11TM4';
        const tmPrice = getPrice(priceMap, 'trench_mesh', tmType, 108);
        const tmLengthWithLap = totalInternalLength * LAP_ALLOWANCE;
        const tmSheets = Math.ceil(tmLengthWithLap / 6);
        const tmCost = tmSheets * tmPrice;

        lineItems.push({
          id: 'internal_beam_tm',
          description: `Internal Beams – ${tmType} (${tmSheets} sheets)`,
          quantity: tmSheets,
          unit: 'sheets',
          unitPrice: tmPrice,
          total: Math.round(tmCost * 100) / 100,
          category: 'materials',
        });
        subtotal += tmCost;
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // DELIVERY
    // ═══════════════════════════════════════════════════════════════
    const delivery = Number(answers.reo_delivery) || 150;
    if (delivery > 0 && lineItems.length > 0) {
      lineItems.push({
        id: 'reo_delivery',
        description: 'Reinforcement Delivery',
        quantity: 1,
        unit: 'item',
        unitPrice: delivery,
        total: delivery,
        category: 'materials',
      });
      subtotal += delivery;
    }

    return {
      moduleId: 'reinforcement-raft',
      moduleName: 'Reinforcement',
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      exclusions: [],
    };
  },

  getExclusions: (answers, scopeData): ExclusionItem[] => {
    const exclusions: ExclusionItem[] = [];
    const defaultSlabReoType = answers.slab_reo_type || 'mesh';
    const areas: MeasurementArea[] = scopeData?.areas || [];

    // Check if any area has no reinforcement
    const areasWithNoReo = areas.filter(a => (a.reo_type || defaultSlabReoType) === 'none');
    const areasWithFiber = areas.filter(a => (a.reo_type || defaultSlabReoType) === 'fiber');

    if (areasWithNoReo.length > 0 && areasWithNoReo.length === areas.length) {
      exclusions.push({
        id: 'no_reinforcement',
        text: 'Steel reinforcement is not included.',
        moduleId: 'reinforcement-raft',
      });
    } else if (areasWithNoReo.length > 0) {
      exclusions.push({
        id: 'partial_no_reo',
        text: `Steel reinforcement excluded for: ${areasWithNoReo.map(a => a.name).join(', ')}.`,
        moduleId: 'reinforcement-raft',
      });
    }

    if (areasWithFiber.length > 0) {
      exclusions.push({
        id: 'fiber_areas',
        text: `Fiber reinforcement only (no steel) for: ${areasWithFiber.map(a => a.name).join(', ')}.`,
        moduleId: 'reinforcement-raft',
      });
    }

    if (!answers.edge_beam_reo) {
      exclusions.push({
        id: 'no_edge_beam_reo',
        text: 'Edge beam reinforcement excluded.',
        moduleId: 'reinforcement-raft',
      });
    }

    if (!answers.internal_beam_reo) {
      const internalBeams = scopeData?.beams || [];
      const hasInternalBeams = internalBeams.length > 0 || Number(scopeData?.internal_beams_length) > 0;
      if (hasInternalBeams) {
        exclusions.push({
          id: 'no_internal_beam_reo',
          text: 'Internal beam reinforcement excluded.',
          moduleId: 'reinforcement-raft',
        });
      }
    }

    return exclusions;
  },

  validate: (answers: Record<string, any>) => {
    const errors: string[] = [];

    if (answers.slab_reo_type === 'mesh' && !answers.mesh_type) {
      errors.push('Please select a mesh type');
    }

    if (answers.slab_reo_type === 'bar' && !answers.bar_size) {
      errors.push('Please select a bar size');
    }

    return { valid: errors.length === 0, errors };
  },
};
