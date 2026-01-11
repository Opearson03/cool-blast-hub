/**
 * Extracts Project Startup pre-fill data from estimate scope_data
 * This allows automatic population of procurement questions when a job is created from a quote
 */

import type { Tables } from "@/integrations/supabase/types";

type ProjectStartup = Tables<"project_startup">;

export interface StartupPrefillResult {
  data: Partial<ProjectStartup>;
  hasReinforcement: boolean;
  hasSurfaceFinishing: boolean;
  hasJoints: boolean;
  hasCuring: boolean;
  hasCaulking: boolean;
  autoFilledFields: string[];
}

export function extractStartupDataFromScopeData(
  scopeData: Record<string, unknown> | null | undefined
): StartupPrefillResult {
  const result: Partial<ProjectStartup> = {};
  const autoFilledFields: string[] = [];
  
  // Default flags for visibility
  let hasReinforcement = false;
  let hasSurfaceFinishing = false;
  let hasJoints = false;
  let hasCuring = false;
  let hasCaulking = false;

  if (!scopeData) {
    return {
      data: result,
      hasReinforcement,
      hasSurfaceFinishing,
      hasJoints,
      hasCuring,
      hasCaulking,
      autoFilledFields,
    };
  }

  // Get module answers from scope data
  const moduleAnswers = (scopeData._moduleAnswers as Record<string, Record<string, unknown>>) || {};

  // Concrete is always included in concrete jobs
  result.concrete_supply = true;
  autoFilledFields.push("concrete_supply");

  // === CONCRETE SUPPLY MODULE ===
  const concreteModule = moduleAnswers["concrete-supply"];
  if (concreteModule) {
    // Get concrete type for mix design
    const concreteType = concreteModule.concrete_type;
    if (concreteType && typeof concreteType === "string") {
      result.mix_design_text = concreteType;
      autoFilledFields.push("mix_design_text");
    }

    // Concrete testing
    const requireTesting = concreteModule.require_testing;
    if (typeof requireTesting === "boolean") {
      result.concrete_testing = requireTesting;
      autoFilledFields.push("concrete_testing");
    }
    
    // Concrete supplier
    const supplier = concreteModule.supplier;
    if (supplier && typeof supplier === "string") {
      result.concrete_supplier = supplier;
      autoFilledFields.push("concrete_supplier");
    }
  }

  // === REINFORCEMENT SLAB MODULE ===
  const reoModule = moduleAnswers["reinforcement-slab"];
  if (reoModule) {
    const reoType = reoModule.reo_type;
    if (reoType && typeof reoType === "string") {
      // If mesh or bar reinforcement is selected
      if (reoType !== "none" && reoType !== "fiber") {
        hasReinforcement = true;
        result.reo_supply = true;
        result.reo_fixing_subcontractor = true;
        autoFilledFields.push("reo_supply", "reo_fixing_subcontractor");
      } else {
        // No reinforcement needed
        result.reo_supply = false;
        result.reo_fixing_subcontractor = false;
        autoFilledFields.push("reo_supply", "reo_fixing_subcontractor");
      }
    }
  }

  // === REINFORCEMENT FOOTING MODULE (fallback) ===
  const reoFootingModule = moduleAnswers["reinforcement-footing"];
  if (reoFootingModule && !hasReinforcement) {
    const footingReoType = reoFootingModule.footing_reo_type;
    if (footingReoType && typeof footingReoType === "string" && footingReoType !== "none") {
      hasReinforcement = true;
      result.reo_supply = true;
      result.reo_fixing_subcontractor = true;
      autoFilledFields.push("reo_supply", "reo_fixing_subcontractor");
    }
  }

  // === SURFACE FINISHING MODULE ===
  const finishingModule = moduleAnswers["surface-finishing"];
  if (finishingModule) {
    hasSurfaceFinishing = true;
    
    // Curing required
    const curingRequired = finishingModule.curing_required;
    if (typeof curingRequired === "boolean") {
      hasCuring = true;
      result.curing_required = curingRequired;
      autoFilledFields.push("curing_required");
    }
  }

  // === JOINTS CONTROL MODULE (for caulking) ===
  const jointsControlModule = moduleAnswers["joints-control"];
  if (jointsControlModule) {
    hasJoints = true;
    
    // Caulking required
    const caulkingRequired = jointsControlModule.caulking_required;
    if (typeof caulkingRequired === "boolean") {
      hasCaulking = true;
      result.caulking_required = caulkingRequired;
      autoFilledFields.push("caulking_required");
    }
  }

  // === JOINTS EXPANSION MODULE (fallback for caulking) ===
  const jointsExpansionModule = moduleAnswers["joints-expansion"];
  if (jointsExpansionModule && !hasCaulking) {
    hasJoints = true;
    const expansionJointsRequired = jointsExpansionModule.expansion_joints_required;
    if (typeof expansionJointsRequired === "boolean" && expansionJointsRequired) {
      hasCaulking = true;
      result.caulking_required = true;
      autoFilledFields.push("caulking_required");
    }
  }

  return {
    data: result,
    hasReinforcement,
    hasSurfaceFinishing,
    hasJoints,
    hasCuring,
    hasCaulking,
    autoFilledFields,
  };
}

/**
 * Get the list of YES/NO items that should be visible based on quote data
 */
export function getVisibleYesNoItems(prefillResult: StartupPrefillResult) {
  const allItems = [
    { key: "concrete_supply", label: "Concrete Supply", supplierKey: "concrete_supplier", alwaysShow: true },
    { key: "concrete_testing", label: "Concrete Testing", alwaysShow: true },
    { key: "mix_design_approval", label: "Mix Design Approved", notesKey: "mix_design_approval_notes", alwaysShow: true },
    { key: "reo_supply", label: "REO Supply", supplierKey: "reo_supplier", showIf: "hasReinforcement" },
    { key: "reo_fixing_subcontractor", label: "REO Fixing", subcontractorKey: "reo_fixing_who", showIf: "hasReinforcement" },
    { key: "curing_required", label: "Curing Required", showIf: "hasCuring" },
    { key: "caulking_required", label: "Caulking Required", showIf: "hasCaulking" },
    { key: "long_longs_required", label: "Long Longs Required", alwaysShow: true },
  ] as const;

  return allItems.filter((item) => {
    if ("alwaysShow" in item && item.alwaysShow) return true;
    if ("showIf" in item && item.showIf) {
      return prefillResult[item.showIf as keyof StartupPrefillResult] === true;
    }
    return true;
  });
}
