/**
 * Utility functions for extracting and formatting quote PDF data from scope_data
 */

export interface ProjectSummary {
  totalVolume: number;      // Total m³
  totalArea: number;        // Total m²
  concreteStrength: string; // e.g., "32MPa"
  thickness: number;        // mm
  perimeter: number;        // m
  pourCount: number;        // Number of pours
}

export interface ReinforcementDetails {
  meshType: string;         // e.g., "SL82"
  meshSheets: number;
  rebarDetails?: string;    // e.g., "N16 bars"
}

export interface ScopeBreakdown {
  scopeName: string;
  volume: number;
  area?: number;
  details: string;
  /** Individual areas for multi-area scopes */
  areas?: Array<{ name: string; length: number; width: number; area: number }>;
}

export interface QuoteLineItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  category: string;
}

export interface QuotePDFData {
  projectSummary: ProjectSummary;
  reinforcement: ReinforcementDetails | null;
  scopeBreakdowns: ScopeBreakdown[];
  lineItems: QuoteLineItem[];
  exclusions: string[];
}

/**
 * Format scope name from ID
 */
function formatScopeName(scopeId: string): string {
  const names: Record<string, string> = {
    raft_slab: 'Raft Slab',
    suspended_slab: 'Suspended Slab',
    conventional_slab: 'Conventional Slab',
    driveway: 'Small Slab',
    paths: 'Paths',
    piers: 'Piers',
    footings: 'Footings',
    retaining_wall: 'Retaining Wall',
    pool_shell: 'Pool Shell',
    shed_slab: 'Shed Slab',
  };
  return names[scopeId] || scopeId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Extract project summary from scope data
 */
export function extractProjectSummary(
  scopeData: Record<string, any> | null,
  selectedScopes: string[] | null
): ProjectSummary {
  const summary: ProjectSummary = {
    totalVolume: 0,
    totalArea: 0,
    concreteStrength: '',
    thickness: 0,
    perimeter: 0,
    pourCount: 0,
  };

  if (!scopeData) return summary;

  // Check if this is the new format with scopes object
  const scopes = scopeData.scopes || { [scopeData.scopeId || 'default']: scopeData };
  
  for (const scopeId of Object.keys(scopes)) {
    const scope = scopes[scopeId];
    const scopeAnswers = scope.scopeAnswers || scope;
    
    // Extract volume
    if (scopeAnswers.concreteVolume) {
      summary.totalVolume += Number(scopeAnswers.concreteVolume) || 0;
    }
    if (scopeAnswers.total_volume) {
      summary.totalVolume += Number(scopeAnswers.total_volume) || 0;
    }
    if (scopeAnswers.volume) {
      summary.totalVolume += Number(scopeAnswers.volume) || 0;
    }
    
    // Extract area - check for multi-area format first
    if (scopeAnswers.areas && Array.isArray(scopeAnswers.areas)) {
      summary.totalArea += scopeAnswers.areas.reduce((sum: number, area: any) => {
        const l = Number(area.length) || 0;
        const w = Number(area.width) || 0;
        return sum + l * w;
      }, 0);
    } else if (scopeAnswers.area) {
      summary.totalArea += Number(scopeAnswers.area) || 0;
    } else if (scopeAnswers.length && scopeAnswers.width) {
      summary.totalArea += (Number(scopeAnswers.length) || 0) * (Number(scopeAnswers.width) || 0);
    }
    
    // Extract thickness (take first non-zero)
    if (!summary.thickness && scopeAnswers.thickness) {
      summary.thickness = Number(scopeAnswers.thickness) || 0;
    }
    if (!summary.thickness && scopeAnswers.slab_thickness) {
      summary.thickness = Number(scopeAnswers.slab_thickness) || 0;
    }
    
    // Extract perimeter
    if (scopeAnswers.perimeter) {
      summary.perimeter += Number(scopeAnswers.perimeter) || 0;
    } else if (scopeAnswers.length && scopeAnswers.width) {
      summary.perimeter += 2 * ((Number(scopeAnswers.length) || 0) + (Number(scopeAnswers.width) || 0));
    }
    
    // Extract concrete strength (take first non-empty)
    if (!summary.concreteStrength) {
      const strength = scopeAnswers.mpa_strength || 
                       scopeAnswers.concreteStrength || 
                       scopeAnswers.concrete_strength ||
                       scope.moduleAnswers?.['concrete-supply']?.mpa_strength;
      if (strength) {
        summary.concreteStrength = String(strength).includes('MPa') ? String(strength) : `${strength}MPa`;
      }
    }
    
    // Count pours
    if (scopeAnswers.number_of_pours) {
      summary.pourCount += Number(scopeAnswers.number_of_pours) || 1;
    } else {
      summary.pourCount += 1;
    }
  }

  return summary;
}

/**
 * Extract reinforcement details from scope data
 */
export function extractReinforcementDetails(
  scopeData: Record<string, any> | null
): ReinforcementDetails | null {
  if (!scopeData) return null;
  
  const scopes = scopeData.scopes || { default: scopeData };
  
  for (const scopeId of Object.keys(scopes)) {
    const scope = scopes[scopeId];
    const scopeAnswers = scope.scopeAnswers || scope;
    const moduleAnswers = scope.moduleAnswers || {};
    const reinforcement = moduleAnswers['reinforcement'] || {};
    
    const meshType = reinforcement.mesh_type || 
                     scopeAnswers.mesh_type || 
                     scopeAnswers.meshType;
    
    if (meshType) {
      return {
        meshType: String(meshType),
        meshSheets: Number(reinforcement.mesh_sheets || scopeAnswers.mesh_sheets || 0),
        rebarDetails: reinforcement.rebar_size ? `${reinforcement.rebar_size} bars` : undefined,
      };
    }
  }
  
  return null;
}

/**
 * Extract scope breakdowns from scope data
 */
export function extractScopeBreakdowns(
  scopeData: Record<string, any> | null,
  selectedScopes: string[] | null
): ScopeBreakdown[] {
  const breakdowns: ScopeBreakdown[] = [];
  
  if (!scopeData) return breakdowns;
  
  const scopes = scopeData.scopes || { [scopeData.scopeId || 'default']: scopeData };
  
  for (const scopeId of Object.keys(scopes)) {
    const scope = scopes[scopeId];
    const scopeAnswers = scope.scopeAnswers || scope;
    
    const volume = Number(scopeAnswers.concreteVolume || scopeAnswers.total_volume || scopeAnswers.volume || 0);
    let area = Number(scopeAnswers.area || 0);
    
    if (!area && scopeAnswers.length && scopeAnswers.width) {
      area = Number(scopeAnswers.length) * Number(scopeAnswers.width);
    }
    
    const thickness = scopeAnswers.thickness || scopeAnswers.slab_thickness;
    
    // Extract individual areas for multi-area scopes
    let individualAreas: Array<{ name: string; length: number; width: number; area: number }> | undefined;
    if (scopeAnswers.areas && Array.isArray(scopeAnswers.areas)) {
      individualAreas = scopeAnswers.areas
        .filter((a: any) => (Number(a.length) || 0) > 0 && (Number(a.width) || 0) > 0)
        .map((a: any) => ({
          name: a.name || 'Unnamed Area',
          length: Number(a.length) || 0,
          width: Number(a.width) || 0,
          area: (Number(a.length) || 0) * (Number(a.width) || 0),
        }));
    }
    
    breakdowns.push({
      scopeName: formatScopeName(scopeId),
      volume,
      area: area > 0 ? area : undefined,
      details: thickness ? `${thickness}mm thick` : '',
      areas: individualAreas,
    });
  }
  
  return breakdowns.filter(b => b.volume > 0 || (b.area && b.area > 0));
}

/**
 * Generate line items from calculated costs in scope data
 */
export function generateLineItems(
  scopeData: Record<string, any> | null
): QuoteLineItem[] {
  const lineItems: QuoteLineItem[] = [];
  
  if (!scopeData) return lineItems;
  
  // Check for calculated costs in the state
  const calculatedCosts = scopeData.calculatedCosts || [];
  
  for (const moduleCost of calculatedCosts) {
    if (moduleCost.lineItems && Array.isArray(moduleCost.lineItems)) {
      for (const item of moduleCost.lineItems) {
        // Only include items that would make sense to show on quote
        // Skip internal cost items that are too granular
        if (item.total > 0) {
          lineItems.push({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            total: item.total,
            category: item.category || 'other',
          });
        }
      }
    }
  }
  
  return lineItems;
}

/**
 * Collect all exclusions from scope data
 */
export function collectExclusions(
  scopeData: Record<string, any> | null
): string[] {
  const exclusions: string[] = [];
  
  if (!scopeData) return exclusions;
  
  // Standard exclusions from the estimate state
  const stateExclusions = scopeData.exclusions || [];
  const customExclusions = scopeData.customExclusions || [];
  
  for (const exc of [...stateExclusions, ...customExclusions]) {
    if (exc.text && !exclusions.includes(exc.text)) {
      exclusions.push(exc.text);
    }
  }
  
  // Check module-level exclusions in calculated costs
  const calculatedCosts = scopeData.calculatedCosts || [];
  for (const moduleCost of calculatedCosts) {
    if (moduleCost.exclusions && Array.isArray(moduleCost.exclusions)) {
      for (const exc of moduleCost.exclusions) {
        if (exc.text && !exclusions.includes(exc.text)) {
          exclusions.push(exc.text);
        }
      }
    }
  }
  
  return exclusions;
}

/**
 * Main function to extract all quote PDF data
 */
export function extractQuotePDFData(
  scopeData: Record<string, any> | null,
  selectedScopes: string[] | null,
  description: string | null
): QuotePDFData {
  return {
    projectSummary: extractProjectSummary(scopeData, selectedScopes),
    reinforcement: extractReinforcementDetails(scopeData),
    scopeBreakdowns: extractScopeBreakdowns(scopeData, selectedScopes),
    lineItems: generateLineItems(scopeData),
    exclusions: collectExclusions(scopeData),
  };
}

/**
 * Check if we have enough data for a detailed summary
 */
export function hasDetailedData(data: QuotePDFData): boolean {
  return data.projectSummary.totalVolume > 0 || 
         data.projectSummary.totalArea > 0 ||
         data.scopeBreakdowns.length > 0;
}
