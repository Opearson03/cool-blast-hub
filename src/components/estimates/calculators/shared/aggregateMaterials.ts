import { CostLineItem } from "@/lib/estimate-components/types";

export interface AggregatedMaterial {
  key: string;
  displayName: string;
  items: CostLineItem[];
  totalQuantity: number;
  unit: string;
  totalCost: number;
  unitPrice: number | null; // Average unit price when items have consistent pricing
}

interface AggregatedGroup {
  title: string;
  materials: AggregatedMaterial[];
  totalCost: number;
}

/**
 * Extract material type from description or ID
 * Examples:
 * - "EB1 - L11TM4 (3 sheets)" -> "L11TM4"
 * - "IB1 - R10 Ligatures (45 pcs)" -> "R10"
 * - "Slab 1 - SL82 Mesh (5 sheets)" -> "SL82"
 */
function extractMaterialKey(item: CostLineItem): string {
  const desc = item.description;
  
  // Trench mesh pattern: L{number}TM{number}
  const tmMatch = desc.match(/L\d+TM\d+/);
  if (tmMatch) return tmMatch[0];
  
  // Mesh pattern: SL{number} or RL{number}
  const meshMatch = desc.match(/[SR]L\d+/);
  if (meshMatch) return meshMatch[0];
  
  // Bar/ligature pattern: N{number} or R{number}
  const barMatch = desc.match(/\b([NR]\d+)\b/);
  if (barMatch) return barMatch[1];
  
  // For non-material items, use the ID
  return item.id;
}

/**
 * Get display name for aggregated material
 */
function getMaterialDisplayName(key: string, items: CostLineItem[]): string {
  // Trench mesh
  if (/^L\d+TM\d+$/.test(key)) {
    return `${key} Trench Mesh`;
  }
  
  // Mesh
  if (/^[SR]L\d+$/.test(key)) {
    return `${key} Mesh`;
  }
  
  // Bar/ligature
  if (/^[NR]\d+$/.test(key)) {
    // Check if it's ligatures based on description
    const isLig = items.some(i => i.description.toLowerCase().includes('ligature'));
    return isLig ? `${key} Ligatures` : `${key} Bars`;
  }
  
  // Chairs
  if (key.includes('chair')) {
    if (key.includes('slab')) return 'Slab Bar Chairs';
    if (key.includes('edge')) return 'Edge Beam TM Chairs';
    if (key.includes('internal')) return 'Internal Beam TM Chairs';
    return 'Bar Chairs';
  }
  
  // Tie wire
  if (key.includes('tie_wire')) return 'Tie Wire';
  
  // Delivery
  if (key.includes('delivery')) return 'Reinforcement Delivery';
  
  // Use first item description as fallback
  return items[0]?.description || key;
}

/**
 * Aggregate line items by material type within a group
 */
function aggregateItems(items: CostLineItem[]): AggregatedMaterial[] {
  const grouped: Record<string, CostLineItem[]> = {};
  
  items.forEach(item => {
    const key = extractMaterialKey(item);
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  });
  
  return Object.entries(grouped).map(([key, groupItems]) => {
    // Get unit price - use first item's unitPrice if all items have the same price
    const firstUnitPrice = groupItems[0]?.unitPrice;
    const allSamePrice = groupItems.every(i => i.unitPrice === firstUnitPrice);
    const unitPrice = allSamePrice && firstUnitPrice !== undefined ? firstUnitPrice : null;
    
    return {
      key,
      displayName: getMaterialDisplayName(key, groupItems),
      items: groupItems,
      totalQuantity: groupItems.reduce((sum, i) => sum + i.quantity, 0),
      unit: groupItems[0]?.unit || '',
      totalCost: groupItems.reduce((sum, i) => sum + i.total, 0),
      unitPrice,
    };
  });
}

/**
 * Aggregate raft reinforcement line items into grouped categories
 */
export function aggregateRaftReinforcementItems(lineItems: CostLineItem[]): AggregatedGroup[] {
  // Categorize items
  // Include waffle pod topping mesh (waffle_slab_mesh) in slab items
  const slabItems = lineItems.filter(item => 
    item.id.startsWith('mesh_') || item.id.startsWith('bar_') || item.id === 'waffle_slab_mesh'
  );
  const edgeBeamItems = lineItems.filter(item => 
    item.id.startsWith('edge_tm_') || item.id.startsWith('edge_ligs_') ||
    item.id.startsWith('edge_bar_') || item.id.startsWith('edge_vbar_')
  );
  const internalBeamItems = lineItems.filter(item => 
    item.id.startsWith('internal_tm_') || item.id.startsWith('internal_ligs_') ||
    item.id.startsWith('internal_bar_') || item.id.startsWith('internal_vbar_')
  );
  const accessoryItems = lineItems.filter(item => 
    item.id.includes('chair') || item.id === 'tie_wire' || item.id === 'reo_delivery'
  );
  const otherItems = lineItems.filter(item => 
    !slabItems.includes(item) && 
    !edgeBeamItems.includes(item) && 
    !internalBeamItems.includes(item) &&
    !accessoryItems.includes(item)
  );

  const groups: AggregatedGroup[] = [];

  if (slabItems.length > 0) {
    const materials = aggregateItems(slabItems);
    groups.push({
      title: 'Slab Areas',
      materials,
      totalCost: materials.reduce((sum, m) => sum + m.totalCost, 0),
    });
  }

  if (edgeBeamItems.length > 0) {
    const materials = aggregateItems(edgeBeamItems);
    groups.push({
      title: 'Edge Beams',
      materials,
      totalCost: materials.reduce((sum, m) => sum + m.totalCost, 0),
    });
  }

  if (internalBeamItems.length > 0) {
    const materials = aggregateItems(internalBeamItems);
    groups.push({
      title: 'Internal Beams',
      materials,
      totalCost: materials.reduce((sum, m) => sum + m.totalCost, 0),
    });
  }

  if (accessoryItems.length > 0) {
    const materials = aggregateItems(accessoryItems);
    groups.push({
      title: 'Accessories',
      materials,
      totalCost: materials.reduce((sum, m) => sum + m.totalCost, 0),
    });
  }

  if (otherItems.length > 0) {
    const materials = aggregateItems(otherItems);
    groups.push({
      title: 'Other',
      materials,
      totalCost: materials.reduce((sum, m) => sum + m.totalCost, 0),
    });
  }

  return groups;
}
