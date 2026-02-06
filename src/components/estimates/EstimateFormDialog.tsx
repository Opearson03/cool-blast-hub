import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Calculator, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  Eye,
  User,
  MapPin,
  Wrench,
  CheckCircle,
  Percent,
  DollarSign,
  MessageSquareWarning
} from "lucide-react";
import { FeedbackDialog } from "@/components/feedback/FeedbackDialog";
import { cn } from "@/lib/utils";

import { ScopeType, SCOPE_OPTIONS, ScopeSelector } from "./ScopeSelector";
import { ModularCalculator } from "./calculators/ModularCalculator";
import { PlanTakeoffStep } from "./takeoff/PlanTakeoffStep";
import { SCOPE_REGISTRY } from "@/lib/estimate-components/scopes";
import { ExclusionItem } from "@/lib/estimate-components/types";
import { useTakeoffMarkups } from "@/hooks/useTakeoffMarkups";
import { SimplifiedScopeSummary } from "./SimplifiedScopeSummary";
import { ClientAutocomplete } from "@/components/contacts/ClientAutocomplete";
import type { Client } from "@/hooks/useClients";
// EstimateType kept for backwards compatibility with existing database values
type EstimateType = "driveway" | "house_slab" | "commercial_slab";

interface Estimate {
  id: string;
  estimate_number: string;
  client_name: string;
  company_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  site_address: string;
  description: string | null;
  total_amount: number;
  status: string;
  valid_until: string | null;
  notes: string | null;
  estimate_type?: EstimateType;
  scope_data?: Record<string, any> | null;
  selected_scopes?: ScopeType[] | null;
  site_visit_date?: string | null;
  follow_up_date?: string | null;
  payment_terms_type?: string | null;
  deposit_percentage?: number | null;
  quote_validity_days?: number | null;
}

interface EstimateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editEstimate?: Estimate | null;
  onFinalized?: (estimateId: string) => void;
}

interface FormData {
  client_name: string;
  company_name: string;
  client_email: string;
  client_phone: string;
  site_address: string;
  description: string;
  valid_until: string;
  notes: string;
  site_visit_date: string;
  follow_up_date: string;
}

interface FormErrors {
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  site_address?: string;
  valid_until?: string;
}

const initialFormData: FormData = {
  client_name: "",
  company_name: "",
  client_email: "",
  client_phone: "",
  site_address: "",
  description: "",
  valid_until: "",
  notes: "",
  site_visit_date: "",
  follow_up_date: "",
};

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Australian phone number regex (accepts various formats)
const PHONE_REGEX = /^(\+?61|0)[2-478](\s?\d){8}$/;

/**
 * Validate client form fields
 */
function validateClientForm(data: FormData): FormErrors {
  const errors: FormErrors = {};
  
  // Client name is required
  if (!data.client_name.trim()) {
    errors.client_name = "Client name is required";
  } else if (data.client_name.trim().length < 2) {
    errors.client_name = "Client name must be at least 2 characters";
  }
  
  // Site address is required  
  if (!data.site_address.trim()) {
    errors.site_address = "Site address is required";
  } else if (data.site_address.trim().length < 5) {
    errors.site_address = "Please enter a complete address";
  }
  
  // Email format validation (if provided)
  if (data.client_email.trim() && !EMAIL_REGEX.test(data.client_email.trim())) {
    errors.client_email = "Please enter a valid email address";
  }
  
  // Phone format validation (if provided)
  if (data.client_phone.trim()) {
    const cleanPhone = data.client_phone.replace(/\s/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 12) {
      errors.client_phone = "Please enter a valid phone number";
    }
  }
  
  // Valid until date should be in the future (if provided)
  if (data.valid_until) {
    const validUntilDate = new Date(data.valid_until);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (validUntilDate < today) {
      errors.valid_until = "Valid until date must be in the future";
    }
  }
  
  return errors;
}

 interface InclusionExclusionItem {
   id: string;
   label: string;
   relevantModules?: string[]; // If undefined or empty, item is always shown (global)
   excludeWhenModulesActive?: string[]; // Hide this item from scopes where ANY of these modules are active
 }
 
 const DEFAULT_INCLUSIONS: InclusionExclusionItem[] = [
   // Concrete-related inclusions
   { id: "concrete_supply", label: "Supply of concrete to site", relevantModules: ["concrete-supply"] },
   { id: "labour", label: "All labour for concrete placement and finishing", relevantModules: ["labour-prep", "labour-place"] },
   { id: "reo_supply", label: "Supply and installation of reinforcement mesh", relevantModules: ["reinforcement-slab", "reinforcement-raft", "reinforcement-piers", "reinforcement-footing", "reinforcement-pad"] },
   { id: "finishing", label: "Power floating / finishing to specified standard", relevantModules: ["surface-finishing", "architectural-finishing"] },
   { id: "curing", label: "Curing compound application", relevantModules: ["surface-finishing"] },
   { id: "site_cleanup", label: "Site cleanup on completion", relevantModules: ["cleanup"] },
   { id: "pump_hire", label: "Concrete pump hire", relevantModules: ["concrete-pumping"] },
   { id: "formwork", label: "Edge formwork supply and installation", relevantModules: ["formwork"] },
   // Demolition-specific inclusions
   { id: "demo_removal", label: "Removal and disposal of demolished concrete", relevantModules: ["demolition"] },
   { id: "demo_saw_cutting", label: "Saw cutting as required", relevantModules: ["demolition"] },
   // Base preparation inclusions
   { id: "base_prep", label: "Base preparation and compaction", relevantModules: ["base-preparation"] },
   // Excavation inclusions
   { id: "excavation", label: "Excavation works as required", relevantModules: ["excavation"] },
   // Waffle pod specific
   { id: "pods_supply", label: "Supply and placement of waffle pods and accessories", relevantModules: ["pods"] },
   // Sundries (present in most scopes)
   { id: "sundries", label: "Sundries and consumables", relevantModules: ["sundries"] },
   // Connections/joints
   { id: "connections", label: "Dowels, tie bars, and connection accessories", relevantModules: ["connections-joints"] },
   // Control joints
   { id: "control_joints", label: "Control joint cutting", relevantModules: ["joints-control"] },
   // Plumbing penetrations
   { id: "plumbing_penetrations", label: "Plumbing penetrations and pip-eyes", relevantModules: ["plumbing"] },
 ];

 const DEFAULT_EXCLUSIONS: InclusionExclusionItem[] = [
   // Global exclusions (always available regardless of scope)
   { id: "exc_permits", label: "Council permits and inspections" }, // Global
   { id: "exc_engineering", label: "Engineering certification" }, // Global
   { id: "exc_waterproofing", label: "Waterproofing membrane" }, // Global
   // Excavation-related exclusions (show when excavation NOT enabled or when relevant)
   { id: "exc_excavation", label: "Excavation and site preparation", relevantModules: ["base-preparation", "formwork"], excludeWhenModulesActive: ["excavation"] },
   { id: "exc_soil_removal", label: "Removal of excavated material", relevantModules: ["excavation", "demolition"] },
   // Formwork-related exclusions
   { id: "exc_boxing", label: "Boxing and formwork beyond edge forms", relevantModules: ["formwork", "architectural-formwork"] },
   // Plumbing/drainage exclusions
   { id: "exc_drainage", label: "Drainage and stormwater works", relevantModules: ["plumbing"] },
   // Finishing-related exclusions
   { id: "exc_saw_cutting", label: "Saw cutting control joints", relevantModules: ["surface-finishing"], excludeWhenModulesActive: ["joints-control"] },
   { id: "exc_sealing", label: "Concrete sealing", relevantModules: ["surface-finishing", "architectural-finishing"] },
   // Demolition-specific exclusions
   { id: "exc_service_scanning", label: "Service scanning and locating", relevantModules: ["demolition"] },
   { id: "exc_asbestos", label: "Asbestos removal or handling", relevantModules: ["demolition"] },
   // Subgrade exclusion (show under scopes with excavation but NOT base-preparation)
   { id: "exc_subgrade", label: "Subgrade preparation and compaction", relevantModules: ["excavation"], excludeWhenModulesActive: ["base-preparation"] },
 ];

// Modular calculator state type
export interface ModularScopeState {
  scopeAnswers: Record<string, any>;
  moduleAnswers: Record<string, Record<string, any>>;
  customExclusions: ExclusionItem[];
  calculatedTotal: number;
  doneModules?: string[];  // Array of module IDs marked as done
  userOverrides?: Record<string, string[]>;  // Module ID -> array of field IDs that were manually overridden
}

// Step definitions for clarity
type WizardStep = 
  | "scopes" 
  | "client" 
  | "takeoff"
  | "configure" 
  | "margin"
  | "conditions" 
  | "summary";

const STEP_ORDER: WizardStep[] = ["client", "scopes", "takeoff", "configure", "margin", "conditions", "summary"];
const STEP_LABELS: Record<WizardStep, string> = {
  scopes: "Scope Selection",
  client: "Client Details",
  takeoff: "Plan Takeoff",
  configure: "Configure",
  margin: "Markup",
  conditions: "Conditions",
  summary: "Summary",
};

// Payment terms options
type PaymentTermsType = 'deposit_balance' | 'progress' | 'on_completion' | 'net_14' | 'net_30' | 'custom';

const PAYMENT_TERMS_OPTIONS: { value: PaymentTermsType; label: string; description: string }[] = [
  { value: 'deposit_balance', label: 'Deposit + Balance', description: 'Deposit required, balance on completion' },
  { value: 'progress', label: 'Progress Payments', description: 'Payments at milestones' },
  { value: 'on_completion', label: 'On Completion', description: 'Full payment on completion' },
  { value: 'net_14', label: 'Net 14 Days', description: 'Payment within 14 days of invoice' },
  { value: 'net_30', label: 'Net 30 Days', description: 'Payment within 30 days of invoice' },
  { value: 'custom', label: 'Custom Terms', description: 'Specify in notes' },
];

// Default estimate type for new estimates (commercial includes all scopes)
const DEFAULT_ESTIMATE_TYPE: EstimateType = "commercial_slab";
 
 /**
  * Get all active module IDs from the selected scopes
  */
 function getActiveModulesFromScopes(selectedScopes: Set<ScopeType>): Set<string> {
   const activeModules = new Set<string>();
   
   for (const scopeId of selectedScopes) {
     const scopeDef = SCOPE_REGISTRY[scopeId];
     if (scopeDef?.moduleIds) {
       scopeDef.moduleIds.forEach(m => activeModules.add(m));
     }
   }
   
   return activeModules;
 }

/**
 * Extract only user-entered notes, stripping out generated content
 * (SCOPE BREAKDOWN, INCLUSIONS, EXCLUSIONS sections)
 */
function extractUserNotes(notes: string | null): string {
  if (!notes) return "";
  
  // Find the start of generated content markers
  const scopeBreakdownIndex = notes.indexOf("SCOPE BREAKDOWN:");
  const inclusionsIndex = notes.indexOf("INCLUSIONS:");
  const exclusionsIndex = notes.indexOf("EXCLUSIONS:");
  
  // Get the earliest marker, or -1 if none found
  const markers = [scopeBreakdownIndex, inclusionsIndex, exclusionsIndex]
    .filter(i => i !== -1);
  
  if (markers.length === 0) return notes.trim();
  
  const firstMarker = Math.min(...markers);
  return notes.substring(0, firstMarker).trim();
}

/**
 * Migrate legacy estimate scope_data to new modular format
 * Returns the migrated modular scope states
 */
function migrateLegacyScopeData(
  scopeData: Record<string, any> | null,
  selectedScopes: ScopeType[] | null
): Record<ScopeType, ModularScopeState> {
  const result: Record<ScopeType, ModularScopeState> = {} as Record<ScopeType, ModularScopeState>;
  
  if (!scopeData || !selectedScopes) return result;
  
  for (const scopeType of selectedScopes) {
    const legacyData = scopeData[scopeType];
    if (!legacyData) continue;
    
    // Check if this is already new modular format (has scopeAnswers property)
    if (legacyData.scopeAnswers !== undefined) {
      result[scopeType] = {
        scopeAnswers: legacyData.scopeAnswers || {},
        moduleAnswers: legacyData.moduleAnswers || {},
        customExclusions: legacyData.customExclusions || [],
        calculatedTotal: legacyData.calculatedTotal || 0,
        doneModules: legacyData.doneModules || [],
        userOverrides: legacyData.userOverrides || {},  // Restore saved user overrides
      };
      continue;
    }
    
    // Migrate legacy format to new modular format
    const scopeAnswers: Record<string, any> = {};
    const moduleAnswers: Record<string, Record<string, any>> = {};
    
    // Common field mappings from legacy to new format
    switch (scopeType) {
      case 'piers':
        if (legacyData.piers) {
          const totalPiers = legacyData.piers.reduce((sum: number, p: any) => sum + (parseInt(p.quantity) || 0), 0);
          scopeAnswers.num_piers = totalPiers;
          const firstPier = legacyData.piers[0];
          if (firstPier) {
            scopeAnswers.diameter = parseInt(firstPier.diameter) || 450;
            scopeAnswers.depth = parseInt(firstPier.depth) || 600;
          }
        }
        break;
        
      case 'standard_slab':
      case 'driveway':
        scopeAnswers.area = parseFloat(legacyData.slabArea) || parseFloat(legacyData.length) * parseFloat(legacyData.width) || 0;
        scopeAnswers.perimeter = parseFloat(legacyData.perimeter) || (parseFloat(legacyData.length) + parseFloat(legacyData.width)) * 2 || 0;
        scopeAnswers.thickness = parseInt(legacyData.slabThickness) || parseInt(legacyData.thickness) || 100;
        break;
        
      case 'raft_slab':
        scopeAnswers.area = parseFloat(legacyData.raftArea) || parseFloat(legacyData.length) * parseFloat(legacyData.width) || 0;
        scopeAnswers.perimeter = parseFloat(legacyData.perimeter) || (parseFloat(legacyData.length) + parseFloat(legacyData.width)) * 2 || 0;
        scopeAnswers.thickness = parseInt(legacyData.raftThickness) || 300;
        scopeAnswers.edge_beam_depth = parseInt(legacyData.edgeBeamDepth) || 450;
        break;
        
      case 'waffle_pod':
        scopeAnswers.area = parseFloat(legacyData.slabArea) || parseFloat(legacyData.length) * parseFloat(legacyData.width) || 0;
        scopeAnswers.perimeter = parseFloat(legacyData.perimeter) || 0;
        scopeAnswers.pod_count = parseInt(legacyData.podCount) || Math.ceil((scopeAnswers.area || 0) / 1.1);
        break;
        
      case 'strip_footings':
        scopeAnswers.total_length = parseFloat(legacyData.totalLength) || 
          (legacyData.footings?.reduce((sum: number, f: any) => sum + (parseFloat(f.length) || 0), 0)) || 0;
        scopeAnswers.width = parseInt(legacyData.width) || 450;
        scopeAnswers.depth = parseInt(legacyData.depth) || 300;
        break;
        
      case 'retaining_wall_footings':
        scopeAnswers.total_length = parseFloat(legacyData.totalLength) || 
          (legacyData.footings?.reduce((sum: number, f: any) => sum + (parseFloat(f.length) || 0), 0)) || 0;
        scopeAnswers.footing_width = parseInt(legacyData.width) || 600;
        scopeAnswers.footing_depth = parseInt(legacyData.depth) || 300;
        break;
        
      // suspended_slab removed
        
      case 'paths_surrounds':
        scopeAnswers.area = parseFloat(legacyData.totalArea) || 
          (legacyData.sections?.reduce((sum: number, s: any) => sum + ((parseFloat(s.length) || 0) * (parseFloat(s.width) || 0)), 0)) || 0;
        scopeAnswers.perimeter = parseFloat(legacyData.perimeter) || 0;
        scopeAnswers.thickness = parseInt(legacyData.thickness) || 75;
        break;
        
      case 'crossovers':
        scopeAnswers.area = parseFloat(legacyData.totalArea) ||
          (legacyData.crossovers?.reduce((sum: number, c: any) => sum + ((parseFloat(c.length) || 0) * (parseFloat(c.width) || 0)), 0)) || 0;
        scopeAnswers.perimeter = parseFloat(legacyData.perimeter) || 0;
        scopeAnswers.thickness = parseInt(legacyData.thickness) || 125;
        break;
    }
    
    // Migrate pricing fields to module answers
    if (legacyData.concreteRate) {
      moduleAnswers['concrete-supply'] = moduleAnswers['concrete-supply'] || {};
      moduleAnswers['concrete-supply'].concrete_rate = parseFloat(legacyData.concreteRate);
    }
    if (legacyData.labourRate) {
      moduleAnswers['concrete-placement'] = moduleAnswers['concrete-placement'] || {};
      moduleAnswers['concrete-placement'].placement_rate = parseFloat(legacyData.labourRate);
    }
    if (legacyData.formworkRate) {
      moduleAnswers['formwork'] = moduleAnswers['formwork'] || {};
      moduleAnswers['formwork'].formwork_rate = parseFloat(legacyData.formworkRate);
    }
    if (legacyData.marginPercent) {
      moduleAnswers['margin'] = moduleAnswers['margin'] || {};
      moduleAnswers['margin'].margin_percent = parseFloat(legacyData.marginPercent);
    }
    
    result[scopeType] = {
      scopeAnswers,
      moduleAnswers,
      customExclusions: [],
      calculatedTotal: 0, // Will be recalculated by the modular calculator
    };
  }
  
  return result;
}

export function EstimateFormDialog({ open, onOpenChange, editEstimate, onFinalized }: EstimateFormDialogProps) {
  const hasInitializedOnOpenRef = useRef(false);
  
  const [currentStep, setCurrentStep] = useState<WizardStep>("client");
  const [estimateType, setEstimateType] = useState<EstimateType>(DEFAULT_ESTIMATE_TYPE);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [selectedInclusions, setSelectedInclusions] = useState<Record<string, Set<string>>>({});
  const [selectedExclusions, setSelectedExclusions] = useState<Record<string, Set<string>>>({});
  
  // Global margin/markup (applied to all scopes)
  const [globalMarginPercent, setGlobalMarginPercent] = useState<number>(15);
  
  // Payment terms state
  const [paymentTermsType, setPaymentTermsType] = useState<PaymentTermsType>('deposit_balance');
  const [depositPercentage, setDepositPercentage] = useState<number>(50);
  const [quoteValidityDays, setQuoteValidityDays] = useState<number>(14);
  
  const [selectedScopes, setSelectedScopes] = useState<Set<ScopeType>>(new Set());
  const [modularScopeStates, setModularScopeStates] = useState<Record<ScopeType, ModularScopeState>>({} as Record<ScopeType, ModularScopeState>);
  const [activeScopeIndex, setActiveScopeIndex] = useState(0);
  const scopeContainerRef = useRef<HTMLDivElement>(null);
  const dialogScrollRef = useRef<HTMLDivElement>(null);
  
  // Draft estimate ID for takeoff step (created when entering takeoff for new estimates)
  // We use both state (for React re-renders) and a ref (for synchronous access in closures)
  const [draftEstimateId, setDraftEstimateIdState] = useState<string | null>(null);
  const draftEstimateIdRef = useRef<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  
  // Concurrency lock for draft creation - prevents duplicate inserts from rapid clicks
  const createDraftPromiseRef = useRef<Promise<string | null> | null>(null);
  
  // Transition lock - prevents double navigation while async operations are in flight
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitioningRef = useRef(false);
  
  // Pending scope for takeoff - when user clicks "Mark on plans", we store the scope
  // so takeoff can auto-activate it and start drawing mode
  // Can be a ScopeType or a string identifier like "scopeId:beamType:typeName"
  const [pendingTakeoffScope, setPendingTakeoffScope] = useState<ScopeType | string | null>(null);
  // Ref to track the marked scope for use in navigation (state may be cleared before goNext runs)
  const markedTakeoffScopeRef = useRef<ScopeType | string | null>(null);
  
  // Track which module to force open when returning from takeoff (for joints)
  const [forceOpenModuleId, setForceOpenModuleId] = useState<string | null>(null);
  
  // Form validation errors
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  
  // Helper to update both state and ref synchronously
  const setDraftEstimateId = useCallback((id: string | null) => {
    draftEstimateIdRef.current = id;
    setDraftEstimateIdState(id);
  }, []);
  
  // Get takeoff markups for this estimate to pre-fill scope answers
  const estimateIdForTakeoff = draftEstimateId || editEstimate?.id || null;
const { 
    isLoading: takeoffLoading,
    hasFiles: hasUploadedPlans,
    getAreaForScope, 
    getPerimeterForScope, 
    hasMarkupForScope,
    getMarkupsForScope,
    getPierDataForScope,
    getBollardDataForScope,
    getPadFootingDataForScope,
    getLinearDataForScope,
    // New grouped config functions
    getPierConfigsForScope,
    getBollardConfigsForScope,
    getPadConfigsForScope,
    getFootingConfigsForScope,
    // Raft slab specific
    getRaftSlabAreasForScope,
    // Demolition specific
    getDemolitionAreasForScope,
    // Expansion joints specific
    getExpansionJointTotalLength,
    // Control joints specific
    getControlJointTotalLength,
    refetch: refetchMarkups 
  } = useTakeoffMarkups(estimateIdForTakeoff);
  
  // Scroll to top when changing scope
  useEffect(() => {
    if (currentStep === "configure") {
      // Scroll the scope calculator container
      if (scopeContainerRef.current) {
        scopeContainerRef.current.scrollTop = 0;
      }
      // Also scroll the main dialog content area
      if (dialogScrollRef.current) {
        dialogScrollRef.current.scrollTop = 0;
      }
    }
  }, [activeScopeIndex, currentStep]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const selectedScopesArray = useMemo(() => Array.from(selectedScopes), [selectedScopes]);
  const activeScopeType = selectedScopesArray[activeScopeIndex] || null;

  // Calculate totals for each scope from modular calculator
  const scopeTotals = useMemo(() => {
    const totals: Record<ScopeType, { total: number; description: string }> = {
      demolition: { total: 0, description: "" },
      piers: { total: 0, description: "" },
      retaining_wall_footings: { total: 0, description: "" },
      strip_footings: { total: 0, description: "" },
      standard_slab: { total: 0, description: "" },
      raft_slab: { total: 0, description: "" },
      waffle_pod: { total: 0, description: "" },
      driveway: { total: 0, description: "" },
      paths_surrounds: { total: 0, description: "" },
      crossovers: { total: 0, description: "" },
      pad_footings: { total: 0, description: "" },
    };

    for (const scopeType of Array.from(selectedScopes)) {
      const state = modularScopeStates[scopeType];
      const scopeDef = SCOPE_REGISTRY[scopeType];
      
      if (state?.calculatedTotal > 0) {
        // Build description from scope answers - avoid duplicating scope name
        let desc = "";
        if (state.scopeAnswers) {
          if (state.scopeAnswers.area) {
            desc = `${state.scopeAnswers.area}m²`;
          } else if (state.scopeAnswers.num_piers) {
            desc = `${state.scopeAnswers.num_piers} piers`;
          } else if (state.scopeAnswers.total_length) {
            desc = `${state.scopeAnswers.total_length}m`;
          }
        }
        
        totals[scopeType] = { 
          total: state.calculatedTotal, 
          description: desc
        };
      }
    }

    return totals;
  }, [selectedScopes, modularScopeStates]);

  // Calculate scope subtotals (before margin) and combined subtotal
  const combinedSubtotal = useMemo(() => {
    return selectedScopesArray.reduce((sum, scope) => sum + scopeTotals[scope].total, 0);
  }, [selectedScopesArray, scopeTotals]);

  // Calculate margin amount and final total (uses percentage as source of truth)
  const marginAmount = useMemo(() => {
    return combinedSubtotal * (globalMarginPercent / 100);
  }, [combinedSubtotal, globalMarginPercent]);

  const combinedTotal = useMemo(() => {
    return combinedSubtotal + marginAmount;
  }, [combinedSubtotal, marginAmount]);

  // Derived fixed profit amount -- always in sync with percentage (source of truth)
  const fixedProfitAmount = useMemo(() => {
    return Math.round(combinedSubtotal * (globalMarginPercent / 100));
  }, [combinedSubtotal, globalMarginPercent]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Initialize on open
  useEffect(() => {
    if (!open) {
      hasInitializedOnOpenRef.current = false;
      return;
    }

    if (hasInitializedOnOpenRef.current) return;
    hasInitializedOnOpenRef.current = true;

    if (editEstimate) {
      setFormData({
        client_name: editEstimate.client_name,
        company_name: editEstimate.company_name || "",
        client_email: editEstimate.client_email || "",
        client_phone: editEstimate.client_phone || "",
        site_address: editEstimate.site_address,
        description: "", // Description is rebuilt fresh from scope data, not stored
        valid_until: editEstimate.valid_until || "",
        notes: extractUserNotes(editEstimate.notes), // Strip generated content
        site_visit_date: editEstimate.site_visit_date || "",
        follow_up_date: editEstimate.follow_up_date || "",
      });
      setEstimateType(editEstimate.estimate_type || "driveway");
      setDraftEstimateId(editEstimate.id);

      // Set selected scopes
      const hasScopes = editEstimate.selected_scopes && Array.isArray(editEstimate.selected_scopes) && editEstimate.selected_scopes.length > 0;
      if (hasScopes) {
        setSelectedScopes(new Set(editEstimate.selected_scopes as ScopeType[]));
        
        // Migrate legacy scope data to new modular format
        const migratedStates = migrateLegacyScopeData(
          editEstimate.scope_data,
          editEstimate.selected_scopes as ScopeType[]
        );
        setModularScopeStates(migratedStates);
      }
      
      // Load per-scope inclusions/exclusions from scope_data (new format)
      if (editEstimate.scope_data?._inclusions) {
        const loadedInc: Record<string, Set<string>> = {};
        for (const [key, labels] of Object.entries(editEstimate.scope_data._inclusions as Record<string, string[]>)) {
          const ids = new Set<string>();
          for (const label of labels) {
            const item = DEFAULT_INCLUSIONS.find(i => i.label === label);
            if (item) ids.add(item.id);
          }
          if (ids.size > 0) loadedInc[key] = ids;
        }
        setSelectedInclusions(loadedInc);
      }
      if (editEstimate.scope_data?._exclusions) {
        const loadedExc: Record<string, Set<string>> = {};
        for (const [key, labels] of Object.entries(editEstimate.scope_data._exclusions as Record<string, string[]>)) {
          const ids = new Set<string>();
          for (const label of labels) {
            const item = DEFAULT_EXCLUSIONS.find(i => i.label === label);
            if (item) ids.add(item.id);
          }
          if (ids.size > 0) loadedExc[key] = ids;
        }
        setSelectedExclusions(loadedExc);
      }
      
      // Load global margin from scope_data
      if (editEstimate.scope_data?._globalMargin !== undefined) {
        setGlobalMarginPercent(Number(editEstimate.scope_data._globalMargin) || 15);
      } else {
        // For legacy estimates, check if any scope has margin module data
        let legacyMargin = 15;
        if (editEstimate.scope_data) {
          for (const scopeData of Object.values(editEstimate.scope_data)) {
            if (scopeData && typeof scopeData === 'object') {
              const moduleAnswers = (scopeData as Record<string, any>).moduleAnswers;
              if (moduleAnswers?.margin?.margin_percent !== undefined) {
                legacyMargin = Number(moduleAnswers.margin.margin_percent) || 15;
                break;
              }
            }
          }
        }
        setGlobalMarginPercent(legacyMargin);
      }
      
      // Load payment terms from estimate
      setPaymentTermsType((editEstimate.payment_terms_type as PaymentTermsType) || 'deposit_balance');
      setDepositPercentage(editEstimate.deposit_percentage ?? 50);
      setQuoteValidityDays(editEstimate.quote_validity_days ?? 14);

      // Determine starting step based on draft progress
      // Check if forceStartStep flag is set (from Inbox "Start Estimate")
      const forceStartStep = (editEstimate as any)?._forceStartStep === true;
      
      if (forceStartStep) {
        // Force start at client step to allow review of auto-filled details
        setCurrentStep("client");
      } else if (editEstimate.status === "draft") {
        // Check how much data we have to determine where to resume
        const hasClientInfo = editEstimate.client_name && editEstimate.site_address;
        const hasScopeData = editEstimate.scope_data && Object.keys(editEstimate.scope_data).length > 0;
        
        if (!hasScopes) {
          // No scopes selected yet - start at scope selection
          setCurrentStep("scopes");
        } else if (!hasClientInfo) {
          // Has scopes but no client info
          setCurrentStep("client");
        } else if (hasScopeData) {
          // Has scope data - go to configure to continue or review
          setCurrentStep("configure");
          setActiveScopeIndex(0);
        } else {
          // Has scopes but no data entered yet
          setCurrentStep("configure");
          setActiveScopeIndex(0);
        }
      } else {
        // Non-draft estimates go to summary for viewing
        setCurrentStep("summary");
      }
    } else {
      setCurrentStep("client"); // Start at client details for new quotes
      setEstimateType(DEFAULT_ESTIMATE_TYPE);
      setFormData(initialFormData);
       // Don't pre-select inclusions/exclusions here - they'll be set when scopes are selected
       setSelectedInclusions({});
       setSelectedExclusions({});
      setSelectedScopes(new Set());
      setModularScopeStates({} as Record<ScopeType, ModularScopeState>);
      setActiveScopeIndex(0);
      setDraftEstimateId(null);
      setGlobalMarginPercent(15); // Reset to default margin
      setPaymentTermsType('deposit_balance');
      setDepositPercentage(50);
      setQuoteValidityDays(14);
    }
    
    // Fetch business ID
    const fetchBusinessId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("business_id")
          .eq("id", user.id)
          .single();
        if (profile?.business_id) {
          setBusinessId(profile.business_id);
        }
      }
    };
    fetchBusinessId();
  }, [editEstimate, open]);

  // Auto-sync inclusions/exclusions based on module answers (per-scope)
  useEffect(() => {
    let needsIncUpdate = false;
    let needsExcUpdate = false;
    const incUpdates: Record<string, string[]> = {};
    const excRemoves: Record<string, string[]> = {};
    
    for (const scopeType of Array.from(selectedScopes)) {
      const state = modularScopeStates[scopeType];
      if (!state?.moduleAnswers) continue;
      
      // Check concrete-pumping module - add pump_hire to this scope
      const pumpingAnswers = state.moduleAnswers['concrete-pumping'];
      if (pumpingAnswers?.pump_required === true && !selectedInclusions[scopeType]?.has('pump_hire')) {
        if (!incUpdates[scopeType]) incUpdates[scopeType] = [];
        incUpdates[scopeType].push('pump_hire');
        needsIncUpdate = true;
      }
      
      // exc_excavation is now handled by excludeWhenModulesActive filtering
      // No additional dynamic sync needed for it
    }
    
    if (needsIncUpdate) {
      setSelectedInclusions(prev => {
        const updated = { ...prev };
        for (const [scopeId, ids] of Object.entries(incUpdates)) {
          updated[scopeId] = new Set(prev[scopeId] || []);
          ids.forEach(id => updated[scopeId].add(id));
        }
        return updated;
      });
    }
    
    if (needsExcUpdate) {
      setSelectedExclusions(prev => {
        const updated = { ...prev };
        for (const [scopeId, ids] of Object.entries(excRemoves)) {
          updated[scopeId] = new Set(prev[scopeId] || []);
          ids.forEach(id => updated[scopeId].delete(id));
        }
        return updated;
      });
    }
  }, [modularScopeStates, selectedScopes, selectedInclusions, selectedExclusions]);
 
   // Auto-select relevant inclusions/exclusions when scopes change (per-scope)
   // Only runs when scopes array length changes (add/remove scope)
   const prevScopeCountRef = useRef(0);
   useEffect(() => {
     const currentCount = selectedScopes.size;
     const prevCount = prevScopeCountRef.current;
     prevScopeCountRef.current = currentCount;
     
     if (currentCount === 0) return;
     
     // Only auto-update on first scope selection (not when editing with loaded data)
     if (prevCount === 0 && currentCount > 0) {
       // Don't auto-select if already loaded from saved data
       if (Object.keys(selectedInclusions).length > 0 || Object.keys(selectedExclusions).length > 0) return;
       
       const newInclusions: Record<string, Set<string>> = { _general: new Set() };
       const newExclusions: Record<string, Set<string>> = { _general: new Set() };
       
       for (const scopeId of selectedScopes) {
         newInclusions[scopeId] = new Set();
         newExclusions[scopeId] = new Set();
         const scopeDef = SCOPE_REGISTRY[scopeId];
         if (!scopeDef) continue;
         
         for (const item of DEFAULT_INCLUSIONS) {
           if (!item.relevantModules || item.relevantModules.length === 0) {
             newInclusions._general.add(item.id);
           } else if (
             item.relevantModules.some(m => scopeDef.moduleIds.includes(m)) &&
             !(item.excludeWhenModulesActive?.some(m => scopeDef.moduleIds.includes(m)))
           ) {
             newInclusions[scopeId].add(item.id);
           }
         }
         
         for (const item of DEFAULT_EXCLUSIONS) {
           if (!item.relevantModules || item.relevantModules.length === 0) {
             newExclusions._general.add(item.id);
           } else if (
             item.relevantModules.some(m => scopeDef.moduleIds.includes(m)) &&
             !(item.excludeWhenModulesActive?.some(m => scopeDef.moduleIds.includes(m)))
           ) {
             newExclusions[scopeId].add(item.id);
           }
         }
       }
       
       setSelectedInclusions(newInclusions);
       setSelectedExclusions(newExclusions);
     }
   }, [selectedScopes]);

  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const progressPercent = ((currentStepIndex + 1) / STEP_ORDER.length) * 100;

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case "scopes": return selectedScopes.size > 0;
      case "client": return !!formData.client_name && !!formData.site_address;
      case "takeoff": return true; // Takeoff is optional, can always proceed
      case "configure": return true;
      case "margin": return globalMarginPercent >= 0; // Margin must be set (can be 0)
      case "conditions": return true;
      case "summary": return true;
      default: return false;
    }
  }, [currentStep, formData.client_name, formData.site_address, selectedScopes.size, globalMarginPercent]);
 
   // Note: inclusions/exclusions are now grouped per-scope in selectedInclusions/selectedExclusions
   // No flat filtering needed - each scope section shows its relevant items directly

  // Create a draft estimate for takeoff step (needed for file uploads)
  // Uses a promise lock to prevent duplicate inserts from concurrent calls
  const createDraftForTakeoff = useCallback(async (): Promise<string | null> => {
    // 1. Already have a draft? Return it immediately
    if (draftEstimateIdRef.current) return draftEstimateIdRef.current;
    
    // 2. Another call is already creating the draft? Wait for that one
    if (createDraftPromiseRef.current) {
      return createDraftPromiseRef.current;
    }
    
    // 3. Start the draft creation and store the promise
    const createPromise = (async (): Promise<string | null> => {
      try {
        // Double-check after acquiring "lock" in case another call finished first
        if (draftEstimateIdRef.current) return draftEstimateIdRef.current;
        
        let workingBusinessId = businessId;
        
        if (!workingBusinessId) {
          // Fetch business ID if not yet available
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' });
            return null;
          }
          const { data: profile } = await supabase
            .from("profiles")
            .select("business_id")
            .eq("id", user.id)
            .single();
          if (!profile?.business_id) {
            toast({ title: 'Error', description: 'No business found', variant: 'destructive' });
            return null;
          }
          workingBusinessId = profile.business_id;
          setBusinessId(workingBusinessId);
        }
        
        // Final check before insert - another concurrent call may have finished
        if (draftEstimateIdRef.current) return draftEstimateIdRef.current;
        
        // Create minimal draft estimate
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        
        const { data, error } = await supabase
          .from("estimates")
          .insert({
            business_id: workingBusinessId,
            client_name: formData.client_name || "Draft Estimate",
            site_address: formData.site_address || "Draft",
            estimate_type: estimateType || "driveway",
            status: "draft",
            selected_scopes: selectedScopesArray as unknown as Json,
            created_by: user.id,
          })
          .select("id")
          .single();
        
        if (error) {
          console.error('Error creating draft:', error);
          toast({ title: 'Error', description: 'Failed to create draft estimate', variant: 'destructive' });
          return null;
        }
        
        setDraftEstimateId(data.id);
        return data.id;
      } finally {
        // Clear the promise lock when done (success or failure)
        createDraftPromiseRef.current = null;
      }
    })();
    
    createDraftPromiseRef.current = createPromise;
    return createPromise;
  }, [businessId, formData.client_name, formData.site_address, estimateType, selectedScopesArray, toast, setDraftEstimateId]);

  const goNext = async () => {
    // Prevent concurrent navigation
    if (transitioningRef.current) return;
    
    // Validate client form before leaving client step
    if (currentStep === "client") {
      const errors = validateClientForm(formData);
      setFormErrors(errors);
      if (Object.keys(errors).length > 0) {
        toast({ title: "Please fix the errors", description: "Some required fields need attention", variant: "destructive" });
        return;
      }
    }
    
    transitioningRef.current = true;
    setIsTransitioning(true);
    
    try {
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < STEP_ORDER.length) {
        const nextStep = STEP_ORDER[nextIndex];
        
        // If entering takeoff step without a draft, create one
        // Use ref for immediate check (avoids stale closure)
        if (nextStep === "takeoff" && !draftEstimateIdRef.current && !editEstimate) {
          const newDraftId = await createDraftForTakeoff();
          if (!newDraftId) {
            return; // Failed to create draft, don't proceed
          }
        }
        
        // If leaving takeoff step, refetch markups so calculators get fresh data
        if (currentStep === "takeoff" && nextStep === "configure") {
          await refetchMarkups();
          
          // Clear state for any scopes that have takeoff markups to ensure fresh data is used
          // This handles both "Mark on plans" flow and regular takeoff marking
          const scopesWithMarkups = selectedScopesArray.filter(s => hasMarkupForScope(s));
          if (scopesWithMarkups.length > 0) {
            setModularScopeStates(prev => {
              const updated = { ...prev };
              scopesWithMarkups.forEach(s => {
                // Only clear if the existing state was not from takeoff or has empty defaults
                const existingState = updated[s];
                if (existingState?.scopeAnswers) {
                  // For demolition, check if existing areas are just empty defaults
                  if (s === 'demolition') {
                    const existingAreas = (existingState.moduleAnswers as any)?.demolition?.demolition_areas;
                    const hasRealData = Array.isArray(existingAreas) && existingAreas.some((a: any) =>
                      (Number(a.length) > 0 || Number(a.width) > 0) && a._fromTakeoff !== true
                    );
                    if (!hasRealData) {
                      delete updated[s];
                    }
                  } else {
                    // For other scopes, check if areas are empty defaults
                    const existingAreas = existingState.scopeAnswers.areas;
                    const hasRealData = existingAreas?.some((a: any) => 
                      (a.length > 0 || a.width > 0 || a._actualArea > 0) && a._fromTakeoff !== true
                    );
                    if (!hasRealData) {
                      delete updated[s];
                    }
                  }
                }
              });
              return updated;
            });
          }
          
          // If we came from a "Mark on plans" action, set active scope to the one we just marked
          const markedScope = markedTakeoffScopeRef.current;
          if (markedScope) {
            // Extract base scope from identifier (e.g., "raft_slab:edge_beam:EB1" -> "raft_slab")
            const baseScope = (typeof markedScope === 'string' && markedScope.includes(':'))
              ? markedScope.split(':')[0] as ScopeType
              : markedScope as ScopeType;
            
            const scopeIndex = selectedScopesArray.indexOf(baseScope);
            if (scopeIndex >= 0) {
              setActiveScopeIndex(scopeIndex);
            }
            // Clear the ref now that we've used it
            markedTakeoffScopeRef.current = null;
          }
          // Ensure state is also cleared
          setPendingTakeoffScope(null);
        }
        
        setCurrentStep(nextStep);
      }
    } finally {
      transitioningRef.current = false;
      setIsTransitioning(false);
    }
  };

  const goBack = async () => {
    // Prevent concurrent navigation
    if (transitioningRef.current) return;
    transitioningRef.current = true;
    setIsTransitioning(true);
    
    try {
      const prevIndex = currentStepIndex - 1;
      if (prevIndex >= 0) {
        setCurrentStep(STEP_ORDER[prevIndex]);
      }
    } finally {
      transitioningRef.current = false;
      setIsTransitioning(false);
    }
  };

  /**
   * Handle joint markup complete - called when user confirms joint marking in takeoff
   * Updates the specific joint's total_length_m in module answers and auto-navigates back to configure step
   */
  const handleJointMarkupComplete = useCallback(async (scopeId: string, lengthMeters: number) => {
    const markedScope = markedTakeoffScopeRef.current;
    
   // Check if this is a specific joint markup
   // New format: "{parentScope}:{jointType}:joint:{jointId}" (e.g., "driveway:expansion_joints:joint:abc123")
   // Legacy format: "{jointType}:joint:{jointId}" (e.g., "expansion_joints:joint:abc123")
    if (markedScope && typeof markedScope === 'string' && markedScope.includes(':joint:')) {
      const parts = markedScope.split(':');
     
     // Parse both formats
     let parentScopeId: string | null = null;
     let jointModuleType: string;
     let jointId: string;
     
     if (parts.length >= 4) {
       // New format: [parentScope, jointType, 'joint', jointId]
       parentScopeId = parts[0];
       jointModuleType = parts[1]; // 'expansion_joints' or 'control_joints'
       jointId = parts[3];
     } else {
       // Legacy format: [jointType, 'joint', jointId]
       jointModuleType = parts[0];
       jointId = parts[2];
     }
      
     // Find the target scope - use parentScopeId directly if available, otherwise search
     let targetScope: string | undefined;
     
    if (parentScopeId && selectedScopesArray.includes(parentScopeId as ScopeType)) {
       // New format: use the parent scope directly
       targetScope = parentScopeId;
     } else {
       // Legacy format: search for the scope containing this joint
       targetScope = selectedScopesArray.find(s => {
         const state = modularScopeStates[s];
         if (!state?.moduleAnswers) return false;
         
         // Check if this scope has the joint module with matching joint ID
         if (jointModuleType === 'expansion_joints') {
           const joints = state.moduleAnswers['connections-joints']?.expansion_joints || [];
           return joints.some((j: any) => j.id === jointId);
         } else if (jointModuleType === 'control_joints') {
           const joints = state.moduleAnswers['joints-control']?.control_joints || [];
           return joints.some((j: any) => j.id === jointId);
         }
         return false;
       });
     }
      
      if (targetScope) {
        // Update the specific joint's total_length_m in module answers
        setModularScopeStates(prev => {
          const updated = { ...prev };
          const scopeState = { ...updated[targetScope] };
          const moduleAnswers = { ...scopeState.moduleAnswers };
          
          if (jointModuleType === 'expansion_joints') {
            const connectionsModule = { ...(moduleAnswers['connections-joints'] || {}) };
            const joints = [...(connectionsModule.expansion_joints || [])];
            const jointIndex = joints.findIndex((j: any) => j.id === jointId);
            if (jointIndex >= 0) {
              joints[jointIndex] = {
                ...joints[jointIndex],
                total_length_m: parseFloat(lengthMeters.toFixed(2)),
                measured_on_plans: true,
              };
              connectionsModule.expansion_joints = joints;
              moduleAnswers['connections-joints'] = connectionsModule;
            }
          } else if (jointModuleType === 'control_joints') {
            const controlModule = { ...(moduleAnswers['joints-control'] || {}) };
            const joints = [...(controlModule.control_joints || [])];
            const jointIndex = joints.findIndex((j: any) => j.id === jointId);
            if (jointIndex >= 0) {
              joints[jointIndex] = {
                ...joints[jointIndex],
                total_length_m: parseFloat(lengthMeters.toFixed(2)),
                measured_on_plans: true,
              };
              controlModule.control_joints = joints;
              moduleAnswers['joints-control'] = controlModule;
            }
          }
          
          scopeState.moduleAnswers = moduleAnswers;
          updated[targetScope] = scopeState;
          return updated;
        });
        
        // Set the active scope index to show the correct scope when returning
        const scopeIndex = selectedScopesArray.indexOf(targetScope as ScopeType);
        if (scopeIndex >= 0) {
          setActiveScopeIndex(scopeIndex);
        }
        
        // Set the module to force open when returning
        // expansion joints → connections-joints, control joints → joints-control
        const returnModuleId = jointModuleType === 'expansion_joints' ? 'connections-joints' : 'joints-control';
        setForceOpenModuleId(returnModuleId);
      }
    }
    
    // Clear the ref and navigate back to configure step
    markedTakeoffScopeRef.current = null;
    setPendingTakeoffScope(null);
    await refetchMarkups();
    setCurrentStep('configure');
    
    // Clear forceOpenModuleId after a short delay so it doesn't persist
    setTimeout(() => setForceOpenModuleId(null), 500);
  }, [selectedScopesArray, modularScopeStates, refetchMarkups]);

  const getScopeLabel = (scope: ScopeType) => {
    return SCOPE_OPTIONS.find(s => s.id === scope)?.label || scope;
  };

  /**
   * Handle scope changes with proper state cleanup
   * Clears modularScopeStates for scopes that are added/removed
   * to ensure calculators start fresh
   */
  const handleScopesChange = useCallback((newScopes: Set<ScopeType>) => {
    // Find scopes that were removed and clear their state
    const removedScopes = Array.from(selectedScopes).filter(s => !newScopes.has(s));
    
    if (removedScopes.length > 0) {
      setModularScopeStates(prev => {
        const updated = { ...prev };
        removedScopes.forEach(scopeId => {
          delete updated[scopeId];
        });
        return updated;
      });
    }
    
    setSelectedScopes(newScopes);
    
    // Reset active scope index if needed
    if (activeScopeIndex >= newScopes.size) {
      setActiveScopeIndex(Math.max(0, newScopes.size - 1));
    }
  }, [selectedScopes, activeScopeIndex]);

  // Build scope_data for saving (new modular format)
  const buildScopeDataForSave = (): Record<string, any> => {
    const data: Record<string, any> = {};
    
    // Store global margin at root level
    data._globalMargin = globalMarginPercent;
    
    // Store per-scope inclusions/exclusions (labels for PDF rendering)
    const inclusionData: Record<string, string[]> = {};
    for (const [scopeKey, ids] of Object.entries(selectedInclusions)) {
      const labels = DEFAULT_INCLUSIONS
        .filter(i => ids.has(i.id))
        .map(i => i.label);
      if (labels.length > 0) {
        inclusionData[scopeKey] = labels;
      }
    }
    data._inclusions = inclusionData;
    
    const exclusionData: Record<string, string[]> = {};
    for (const [scopeKey, ids] of Object.entries(selectedExclusions)) {
      const labels = DEFAULT_EXCLUSIONS
        .filter(e => ids.has(e.id))
        .map(e => e.label);
      if (labels.length > 0) {
        exclusionData[scopeKey] = labels;
      }
    }
    data._exclusions = exclusionData;
    
    for (const scopeType of selectedScopesArray) {
      const state = modularScopeStates[scopeType];
      if (state) {
        data[scopeType] = {
          scopeAnswers: state.scopeAnswers,
          moduleAnswers: state.moduleAnswers,
          customExclusions: state.customExclusions,
          calculatedTotal: state.calculatedTotal,
          doneModules: state.doneModules || [],
          userOverrides: state.userOverrides || {},  // Persist user overrides
        };
      }
    }
    
    return data;
  };

  /**
   * Shared helper to build estimate data and save it
   * Consolidates logic from saveDraftMutation, finalizeMutation, and mutation
   */
  const saveEstimate = async (status: 'draft' | 'pending'): Promise<string> => {
    // Validation for non-draft saves
    if (status !== 'draft') {
      if (!formData.client_name || !formData.site_address) {
        throw new Error("Please fill in client name and site address");
      }
      if (selectedScopes.size === 0) {
        throw new Error("Please select at least one scope of work");
      }
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: profile } = await supabase
      .from("profiles")
      .select("business_id")
      .eq("id", user.id)
      .single();

    if (!profile?.business_id) throw new Error("No business found");

    // Build description from scope data
    const descriptionParts = selectedScopesArray.map(scope => {
      const label = getScopeLabel(scope);
      const { description } = scopeTotals[scope];
      // If no meaningful description, just show the label
      return description ? `${label}: ${description}` : label;
    });

    // Build notes with scope breakdown and inclusions/exclusions
    let fullNotes = "";
    
    // Scope breakdown
    if (selectedScopesArray.length > 0) {
      let scopeBreakdown = "SCOPE BREAKDOWN:\n";
      selectedScopesArray.forEach(scope => {
        const label = getScopeLabel(scope);
        const { total } = scopeTotals[scope];
        scopeBreakdown += `• ${label}: ${formatCurrency(total)}\n`;
      });
      fullNotes = scopeBreakdown;
    }
    
    // User notes (already cleaned of generated content when loaded)
    const userNotes = formData.notes?.trim();
    if (userNotes) {
      fullNotes += (fullNotes ? "\n" : "") + userNotes;
    }
    
    // Inclusions and exclusions only for non-draft (per-scope format)
    if (status !== 'draft') {
      const inclusionEntries = Object.entries(selectedInclusions)
        .map(([key, ids]) => ({
          label: key === '_general' ? 'General' : getScopeLabel(key as ScopeType),
          items: DEFAULT_INCLUSIONS.filter(i => ids.has(i.id)).map(i => i.label),
        }))
        .filter(e => e.items.length > 0);
      
      const exclusionEntries = Object.entries(selectedExclusions)
        .map(([key, ids]) => ({
          label: key === '_general' ? 'General' : getScopeLabel(key as ScopeType),
          items: DEFAULT_EXCLUSIONS.filter(e => ids.has(e.id)).map(e => e.label),
        }))
        .filter(e => e.items.length > 0);
      
      if (inclusionEntries.length > 0) {
        fullNotes += "\n\nINCLUSIONS:";
        for (const entry of inclusionEntries) {
          fullNotes += `\n[${entry.label}]`;
          fullNotes += "\n• " + entry.items.join("\n• ");
        }
      }
      if (exclusionEntries.length > 0) {
        fullNotes += "\n\nEXCLUSIONS:";
        for (const entry of exclusionEntries) {
          fullNotes += `\n[${entry.label}]`;
          fullNotes += "\n• " + entry.items.join("\n• ");
        }
      }
    }

    const estimateData = {
      business_id: profile.business_id,
      client_name: formData.client_name || "Draft Estimate",
      company_name: formData.company_name || null,
      client_email: formData.client_email || null,
      client_phone: formData.client_phone || null,
      site_address: formData.site_address || "No address",
      description: descriptionParts.length > 0 
        ? descriptionParts.join(" | ") 
        : formData.description || null,
      total_amount: combinedTotal,
      valid_until: formData.valid_until || (quoteValidityDays ? new Date(Date.now() + quoteValidityDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null),
      notes: fullNotes || null,
      estimate_type: estimateType || "driveway",
      status,
      scope_data: buildScopeDataForSave() as unknown as Json,
      selected_scopes: selectedScopesArray as unknown as Json,
      site_visit_date: formData.site_visit_date || null,
      follow_up_date: formData.follow_up_date || null,
      payment_terms_type: paymentTermsType,
      deposit_percentage: depositPercentage,
      quote_validity_days: quoteValidityDays,
    };

    // Use existing estimate ID if available (editEstimate or draftEstimateId)
    // Read from ref to avoid stale closure issues
    const workingEstimateId = editEstimate?.id ?? draftEstimateIdRef.current;
    
    if (workingEstimateId) {
      // Update existing estimate (includes drafts created for takeoff)
      const { error } = await supabase
        .from("estimates")
        .update(estimateData)
        .eq("id", workingEstimateId);
      if (error) throw error;
      return workingEstimateId;
    } else {
      // Create new estimate and capture the ID
      const { data, error } = await supabase
        .from("estimates")
        .insert([{ ...estimateData, created_by: user.id }])
        .select("id")
        .single();
      if (error) throw error;
      // Store the new ID so subsequent saves update instead of insert
      setDraftEstimateId(data.id);
      return data.id;
    }
  };

  type SaveDraftOptions = {
    /**
     * When true, closes the EstimateFormDialog after saving.
     * (Used for the explicit "Save Draft" button)
     */
    closeAfter?: boolean;
    /**
     * When false, no toast is shown (useful for autosave).
     */
    showToast?: boolean;
  };

  // Save Draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async (_opts: SaveDraftOptions = {}) => {
      await saveEstimate("draft");
    },
    onSuccess: (_data, opts) => {
      const closeAfter = opts?.closeAfter ?? true;
      const showToast = opts?.showToast ?? true;

      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      if (showToast) {
        toast({
          title: "Draft saved",
          description: "You can continue editing this estimate later.",
        });
      }
      if (closeAfter) {
        onOpenChange(false);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving draft",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Finalize Quote mutation - marks estimate as pending (ready to send)
  const finalizeMutation = useMutation({
    mutationFn: () => saveEstimate('pending'),
    onSuccess: (estimateId: string) => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      toast({ 
        title: "Quote finalised", 
        description: "Ready to send to the client when you're ready." 
      });
      onOpenChange(false);
      // Auto-open the finalized estimate detail sheet
      if (onFinalized) {
        onFinalized(estimateId);
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error finalising quote", description: error.message, variant: "destructive" });
    },
  });

  // Create/Update mutation (used by handleSubmit)
  const mutation = useMutation({
    mutationFn: () => saveEstimate('pending'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      toast({ title: editEstimate ? "Estimate updated" : "Estimate created" });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      console.error("Error saving estimate:", error);
      toast({ title: "Failed to save estimate", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!formData.client_name || !formData.site_address) {
      toast({ title: "Please fill in client name and site address", variant: "destructive" });
      setCurrentStep("client");
      return;
    }
    if (selectedScopes.size === 0) {
      toast({ title: "Please select at least one scope of work", variant: "destructive" });
      setCurrentStep("scopes");
      return;
    }
    mutation.mutate();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Handler for modular calculator state changes
  const handleModularStateChange = useCallback((scopeType: ScopeType, state: {
    scopeAnswers: Record<string, any>;
    moduleAnswers: Record<string, Record<string, any>>;
    customExclusions: ExclusionItem[];
    total: number;
    doneModules?: string[];
    userOverrides?: Record<string, string[]>;
  }) => {
    setModularScopeStates(prev => ({
      ...prev,
      [scopeType]: {
        scopeAnswers: state.scopeAnswers,
        moduleAnswers: state.moduleAnswers,
        customExclusions: state.customExclusions,
        calculatedTotal: state.total,
        doneModules: state.doneModules || [],
        userOverrides: state.userOverrides || {},  // Persist user overrides
      },
    }));
  }, []);

  const renderScopeCalculator = (scope: ScopeType) => {
    const scopeDefinition = SCOPE_REGISTRY[scope];
    if (!scopeDefinition) {
      return (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Calculator not available for this scope type.</p>
        </Card>
      );
    }
    
    const currentState = modularScopeStates[scope];
    
    // Check if there's takeoff data for this scope and merge it into initial answers
    const hasMarkup = hasMarkupForScope(scope);
    let initialScopeAnswers = currentState?.scopeAnswers || {};
    let initialModuleAnswers = currentState?.moduleAnswers || {};
    
    // Only pre-fill from takeoff if we have markup AND the user hasn't already entered data
    if (hasMarkup) {
      const scopeMarkups = getMarkupsForScope(scope);
      
      // For multi-area scopes with edge beam support,
      // convert each markup into a named MeasurementArea and extract beam data
      // Special handling for scopes with supportsMultipleEdgeBeams
      const slabScopesWithBeams = ['raft_slab', 'waffle_pod', 'standard_slab', 'driveway', 'crossovers', 'paths_surrounds'];
      if (slabScopesWithBeams.includes(scope) && scopeDefinition.supportsMultipleAreas) {
        const raftSlabAreas = getRaftSlabAreasForScope(scope);
        
        if (raftSlabAreas.length > 0) {
          // Check if user hasn't already overridden with their own values
          // Also merge takeoff if areas exist but are missing _actualArea (need fresh takeoff data)
          // OR if edgeBeams exist in takeoff but not in saved state (missing beam lengths)
          const hasUserData = initialScopeAnswers.areas?.some((a: any) => 
            (a.length > 0 || a.width > 0 || a._actualArea > 0) && a._fromTakeoff !== true
          );
          const areasNeedMerge = !initialScopeAnswers.areas?.some((a: any) => a._actualArea > 0);
          
          // Check if edge beams need merging: takeoff has beams with length but saved state doesn't
          const takeoffHasEdgeBeams = raftSlabAreas.some(s => s.edgeBeams && s.edgeBeams.length > 0 && 
            s.edgeBeams.some(b => b.length > 0));
          const savedEdgeBeamsHaveLength = initialScopeAnswers.edgeBeams?.some((b: any) => 
            b.length > 0 && b._fromTakeoff === true
          );
          const edgeBeamsNeedMerge = takeoffHasEdgeBeams && !savedEdgeBeamsHaveLength;
          
          const needsTakeoffMerge = !hasUserData || areasNeedMerge || edgeBeamsNeedMerge;
          
          if (needsTakeoffMerge) {
            // Convert raft slab areas to MeasurementArea format
            const areasFromTakeoff = raftSlabAreas.map((slab) => {
              const side = Math.sqrt(slab.area);
              return {
                id: slab.id,
                name: slab.name,
                length: parseFloat(side.toFixed(2)),
                width: parseFloat(side.toFixed(2)),
                _fromTakeoff: true,
                _actualArea: slab.area,
                _actualPerimeter: slab.perimeter,
              };
            });
            
            // Collect ALL edge beams from all slab areas into a single array
            const allEdgeBeams = raftSlabAreas.flatMap(s => s.edgeBeams || []);
            const totalEdgeBeamLength = allEdgeBeams.reduce((sum, b) => sum + b.length, 0);
            const hasEdgeBeams = allEdgeBeams.length > 0;
            
            // Collect ALL internal beams from all slab areas
            const allInternalBeams = raftSlabAreas.flatMap(s => s.internalBeams || []);
            const totalInternalBeamLength = allInternalBeams.reduce((sum, b) => sum + b.length, 0);
            const hasInternalBeams = allInternalBeams.length > 0;
            
            // Calculate weighted averages for edge beams
            let edgeBeamAvgWidth = 450, edgeBeamAvgDepth = 450;
            if (totalEdgeBeamLength > 0) {
              edgeBeamAvgWidth = allEdgeBeams.reduce((sum, b) => sum + b.length * b.width, 0) / totalEdgeBeamLength;
              edgeBeamAvgDepth = allEdgeBeams.reduce((sum, b) => sum + b.length * b.depth, 0) / totalEdgeBeamLength;
            }
            
            // Calculate weighted averages for internal beams
            let internalBeamAvgWidth = 300, internalBeamAvgDepth = 400;
            if (totalInternalBeamLength > 0) {
              internalBeamAvgWidth = allInternalBeams.reduce((sum, b) => sum + b.length * b.width, 0) / totalInternalBeamLength;
              internalBeamAvgDepth = allInternalBeams.reduce((sum, b) => sum + b.length * b.depth, 0) / totalInternalBeamLength;
            }
            
            initialScopeAnswers = {
              ...initialScopeAnswers,
              _fromTakeoff: true,
              areas: areasFromTakeoff,
              // Edge beam array for MultiBeamInput
              ...(hasEdgeBeams && { hasEdgeBeams: true }),
              ...(hasEdgeBeams && {
                edgeBeams: allEdgeBeams.map((b) => ({
                  id: b.id,
                  name: b.name,
                  length: parseFloat(b.length.toFixed(2)),
                  width: b.width,
                  depth: b.depth,
                  _fromTakeoff: true,
                })),
              }),
              // Legacy aggregate edge beam fields for calculations
              ...(totalEdgeBeamLength > 0 && { edge_beam_length: parseFloat(totalEdgeBeamLength.toFixed(2)) }),
              ...(hasEdgeBeams && { edge_beam_width: Math.round(edgeBeamAvgWidth) }),
              ...(hasEdgeBeams && { edge_beam_depth: Math.round(edgeBeamAvgDepth) }),
              // Internal beams array for MultiBeamInput
              ...(hasInternalBeams && { hasInternalBeams: true }),
              ...(hasInternalBeams && {
                beams: allInternalBeams.map((b) => ({
                  id: b.id,
                  name: b.name,
                  length: parseFloat(b.length.toFixed(2)),
                  width: b.width,
                  depth: b.depth,
                  _fromTakeoff: true,
                })),
              }),
              // Legacy aggregate internal beam fields
              ...(hasInternalBeams && { internal_beams_length: parseFloat(totalInternalBeamLength.toFixed(2)) }),
              ...(hasInternalBeams && { internal_beam_width: Math.round(internalBeamAvgWidth) }),
              ...(hasInternalBeams && { internal_beam_depth: Math.round(internalBeamAvgDepth) }),
            };
            
            // For waffle pod scope, use actual counted values if available, otherwise estimate
            if (scope === 'waffle_pod') {
              // Get the first area which contains waffle pod counting data from takeoff
              const firstArea = raftSlabAreas[0];
              
              // Calculate total area for estimation fallback
              const totalArea = areasFromTakeoff.reduce((sum, a) => sum + (a._actualArea || 0), 0);
              // Standard pod size is 1090mm × 1090mm with ~110mm ribs
              // Effective grid is ~1200mm × 1200mm per pod = 1.44m² per pod
              // Estimate: pods = area / 1.44 (round up)
              const podSizeM = 1.09; // Default pod size in meters
              const ribWidth = 0.11; // Default rib width in meters
              const effectiveGridM = podSizeM + ribWidth; // ~1.2m
              const estimatedPodCount = Math.ceil(totalArea / (effectiveGridM * effectiveGridM));
              
              // Use actual counted values from takeoff if available, otherwise use estimates
              const podCount = firstArea?.podCount ?? estimatedPodCount;
              const podThickness = firstArea?.podThicknessMm ?? 225;
              // Only set spacer counts if explicitly provided from takeoff - let calculation fallback work otherwise
              const spacer4WayCount = firstArea?.spacer4WayCount;
              const spacer2WayCount = firstArea?.spacer2WayCount;
              
              initialScopeAnswers = {
                ...initialScopeAnswers,
                // Use actual counted pod count if available from takeoff
                pod_count: podCount,
                // Spacer counts from takeoff - only include if defined (let auto-calculation work otherwise)
                ...(spacer4WayCount !== undefined && { spacer_4way_count: spacer4WayCount }),
                ...(spacer2WayCount !== undefined && { spacer_2way_count: spacer2WayCount }),
                // Set waffle pod dimensions (use takeoff value or defaults)
                pod_size: '1090',
                pod_thickness: podThickness,
                top_slab_thickness: 85, // Default 85mm top
              };
            }
          }
        }
      } else if (scope === 'demolition') {
        // Special handling for demolition scope - prefill demolition_areas
        const demolitionAreas = getDemolitionAreasForScope(scope);
        
        if (demolitionAreas.length > 0) {
          // Check if user hasn't already overridden with their own values
          // Demolition UI reads from moduleAnswers.demolition.demolition_areas
          const existingAreas = (initialModuleAnswers as any)?.demolition?.demolition_areas;
          const hasUserData = Array.isArray(existingAreas) && existingAreas.some((a: any) =>
            ((Number(a.length) > 0 || Number(a.width) > 0) && a._fromTakeoff !== true)
          );
          
          if (!hasUserData) {
            // Convert to demolition areas format
            const areasFromTakeoff = demolitionAreas.map((area) => ({
              id: area.id,
              name: area.name,
              length: area.length,
              width: area.width,
              thickness: area.thickness,
              _fromTakeoff: true,
              _actualArea: area._actualArea,
            }));
            
            initialScopeAnswers = {
              ...initialScopeAnswers,
              _fromTakeoff: true,
            };

            initialModuleAnswers = {
              ...initialModuleAnswers,
              demolition: {
                ...((initialModuleAnswers as any).demolition || {}),
                demolition_required: true,
                demolition_areas: areasFromTakeoff,
              },
            };
          }
        }
      } else if (scopeDefinition.supportsMultipleAreas && !slabScopesWithBeams.includes(scope) && scopeMarkups.length > 0) {
        // Check if user hasn't already overridden with their own values
        const hasUserData = initialScopeAnswers.areas?.some((a: any) => a.length > 0 || a.width > 0);
        
        if (!hasUserData) {
          // Convert markups to MeasurementArea format
          // Since we don't have length/width from polygon, we'll set area directly
          // and use approximate square dimensions for display
          const areasFromTakeoff = scopeMarkups.map((markup, index) => {
            const area = markup.area_sqm || 0;
            const perimeter = markup.perimeter_m || 0;
            // Calculate approximate square dimensions for the area
            const side = Math.sqrt(area);
            return {
              id: `takeoff-${markup.markup_id}`,
              name: markup.name || `Area ${index + 1}`,
              length: parseFloat(side.toFixed(2)),
              width: parseFloat(side.toFixed(2)),
              _fromTakeoff: true,
              _actualArea: area, // Store actual measured area
              _actualPerimeter: perimeter, // Store actual measured perimeter
            };
          });
          
          initialScopeAnswers = {
            ...initialScopeAnswers,
            _fromTakeoff: true,
            areas: areasFromTakeoff,
          };
        }
      } else if (scopeDefinition.supportsMultiplePiers) {
        // For pier scopes, get pier configs grouped by unique dimensions
        const pierConfigs = getPierConfigsForScope(scope);
        
        if (pierConfigs.length > 0) {
          // Check if user hasn't already overridden with their own values
          const hasUserData = initialScopeAnswers.pierGroups?.some((p: any) => (p.quantity || 0) > 0 && p._fromTakeoff !== true);
          
          if (!hasUserData) {
            // Convert pier configs to new PierGroup format
            const pierGroups = pierConfigs.map((config, index) => ({
              id: config.id || `pier-group-${Date.now()}-${index}`,
              name: config.name || `Pier Group ${index + 1}`,
              quantity: config.quantity || 1,
              diameter: config.diameter || 450,
              depth: config.depth || 600,
              _fromTakeoff: true,
            }));
            
            initialScopeAnswers = {
              ...initialScopeAnswers,
              _fromTakeoff: true,
              pierGroups,
            };
          }
        }
      } else if (scope === 'pad_footings') {
        // For pad footings, get configs grouped by unique dimensions
        const padConfigs = getPadConfigsForScope(scope);
        
        if (padConfigs.length > 0) {
          // Check for existing user data using correct field names
          const hasUserData = initialScopeAnswers.total_num_pads > 0;
          
          if (!hasUserData) {
            // Sum up total count from all config types
            const totalCount = padConfigs.reduce((sum, c) => sum + c.quantity, 0);
            // Use first config for dimensions
            const firstConfig = padConfigs[0];
            
            // Map takeoff configs to padGroups for the new grouped system
            const padGroupsFromTakeoff = padConfigs.map((p: any) => ({
              id: p.id,
              name: p.name,
              quantity: Number(p.quantity) || 1,
              length: Number(p.length) || 450,
              width: Number(p.width) || 450,
              depth: Number(p.depth) || 300,
              _fromTakeoff: true,
            }));

            // Pad footings use padGroups and derived totals
            initialScopeAnswers = {
              ...initialScopeAnswers,
              _fromTakeoff: true,
              total_num_pads: totalCount,
              total_length: firstConfig.length,
              total_width: firstConfig.width,
              total_depth: firstConfig.depth,
              // Use new grouped system
              padGroups: padGroupsFromTakeoff,
            };
          }
        }
      } else if (scopeDefinition.supportsMultipleFootings || scopeDefinition.supportsLinearSections) {
        // Linear scopes (strip footings / kerbs / retaining walls) use MultiLinearInput (linearSections)
        // while older/legacy scope calculations still rely on `footings` + total_length/width/depth.
        // So: prefill BOTH shapes to keep UI + calculations in sync.
        const footingConfigs = getFootingConfigsForScope(scope);

        if (footingConfigs.length > 0) {
          const hasUserFootings = initialScopeAnswers.footings?.some(
            (f: any) => (Number(f.length) || 0) > 0 && f._fromTakeoff !== true
          );
          const hasUserLinearSections = initialScopeAnswers.linearSections?.some(
            (s: any) => (Number(s.length) || 0) > 0 && s._fromTakeoff !== true
          );
          const hasUserData = hasUserFootings || hasUserLinearSections;

          if (!hasUserData) {
            // Helper to round length (in meters) to nearest 10mm (0.01m)
            const roundTo10mm = (m: number) => Math.round(m * 100) / 100;

            // Map takeoff polyline markups to the MultiLinearInput shape
            const linearSectionsFromTakeoff = footingConfigs.map((f: any) => {
              const rawLen = Number(f.length) || 0;
              const rawActual = Number(f._actualLength) || rawLen;
              return {
                id: f.id,
                name: f.name,
                length: roundTo10mm(rawLen),
                dimension1: Number(f.width) || 0,
                dimension2: Number(f.depth) || 0,
                // Toe dimensions for retaining wall footings
                has_toe: (f.toe_width && f.toe_width > 0) || (f.toe_depth && f.toe_depth > 0),
                toe_width: Number(f.toe_width) || 0,
                toe_depth: Number(f.toe_depth) || 0,
                _fromTakeoff: true,
                _actualLength: roundTo10mm(rawActual),
              };
            });

            // Also compute derived totals/averages to match what handleLinearSectionsChange would produce
            const totalLength = linearSectionsFromTakeoff.reduce((sum: number, s: any) => {
              const len = s._actualLength && s._actualLength > 0 ? s._actualLength : (Number(s.length) || 0);
              return sum + len;
            }, 0);

            let weightedDim1 = 0;
            let weightedDim2 = 0;
            if (totalLength > 0) {
              linearSectionsFromTakeoff.forEach((s: any) => {
                const len = s._actualLength && s._actualLength > 0 ? s._actualLength : (Number(s.length) || 0);
                weightedDim1 += len * (Number(s.dimension1) || 0);
                weightedDim2 += len * (Number(s.dimension2) || 0);
              });
              weightedDim1 = weightedDim1 / totalLength;
              weightedDim2 = weightedDim2 / totalLength;
            }

            initialScopeAnswers = {
              ...initialScopeAnswers,
              _fromTakeoff: true,
              // UI
              linearSections: linearSectionsFromTakeoff,
              // Back-compat for scope.calculateVolume + module deriveFrom fields
              footings: footingConfigs,
              total_length: totalLength,
              width: weightedDim1,
              depth: weightedDim2,
              footing_width: weightedDim1,
              footing_depth: weightedDim2,
              wall_thickness: weightedDim1,
              wall_height: weightedDim2,
            };
          }
        }
      } else {
        // For standard scopes, pre-fill area and perimeter directly
        const takeoffArea = getAreaForScope(scope);
        const takeoffPerimeter = getPerimeterForScope(scope);
        
        if (takeoffArea !== null || takeoffPerimeter !== null) {
          // Check if user hasn't already overridden with their own values
          const hasUserArea = initialScopeAnswers.area > 0;
          
          if (!hasUserArea) {
            initialScopeAnswers = {
              ...initialScopeAnswers,
              _fromTakeoff: true,
              ...(takeoffArea !== null && { area: takeoffArea }),
              ...(takeoffPerimeter !== null && { perimeter: takeoffPerimeter }),
            };
          }
        }
      }
    }
    
    // Show loading state while takeoff data is being fetched to prevent race condition
    if (takeoffLoading) {
      return (
        <Card className="p-8">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            <span className="text-muted-foreground">Loading takeoff data...</span>
          </div>
        </Card>
      );
    }
    
    // Use a key that includes takeoff status to force re-mount when data arrives
    // For demolition, include the count of areas to ensure remount when areas load
    const demolitionAreaCount = scope === 'demolition' ? getDemolitionAreasForScope(scope).length : 0;
    const calculatorKey = `${scope}-${hasMarkup ? 'with-takeoff' : 'no-takeoff'}-${demolitionAreaCount}`;
    
    return (
      <ModularCalculator
        key={calculatorKey}
        scope={scopeDefinition}
        initialScopeAnswers={initialScopeAnswers}
        initialModuleAnswers={initialModuleAnswers}
        initialCustomExclusions={currentState?.customExclusions}
        initialDoneModules={currentState?.doneModules}
        initialUserOverrides={currentState?.userOverrides}
        forceOpenModuleId={forceOpenModuleId}
        onStateChange={(state) => handleModularStateChange(scope, state)}
        onModuleDone={() => {
          // Auto-save when a module is marked as done (do not close dialog)
          saveDraftMutation.mutate({ closeAfter: false, showToast: false });
        }}
        // Markup prompt support - navigate to takeoff when user wants to mark on plans
        onRequestMarkup={(identifier) => {
          void (async () => {
            try {
              // Store which scope the user wants to mark so takeoff can auto-activate it
              // identifier can be just "scope" or "scope:beamType:typeName"
              if (identifier) {
                setPendingTakeoffScope(identifier);
                markedTakeoffScopeRef.current = identifier;
              } else {
                setPendingTakeoffScope(scope);
                markedTakeoffScopeRef.current = scope;
              }
              // Ensure estimate state is persisted before jumping to takeoff
              await saveDraftMutation.mutateAsync({ closeAfter: false, showToast: true });
              setCurrentStep("takeoff");
            } catch {
              // Error toast handled by mutation
            }
          })();
        }}
        hasPlans={hasUploadedPlans}
      />
    );
  };

  // Check if any mutation or navigation is in progress
  const isAnyOperationPending = isTransitioning || saveDraftMutation.isPending || mutation.isPending || finalizeMutation.isPending;

  // Render wizard footer inline to avoid re-creating component on every render
  const renderWizardFooter = (options: { nextLabel?: string; onNext?: () => void; showBack?: boolean; showSaveDraft?: boolean } = {}) => {
    const { nextLabel, onNext, showBack = true, showSaveDraft = true } = options;
    return (
      <div className="space-y-3 pt-4 border-t mt-4">
        {/* Testing feedback banner */}
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquareWarning className="w-4 h-4 text-orange-500 shrink-0" />
            <span>Stuck on an issue? We're still testing and want to help.</span>
          </div>
          <FeedbackDialog 
            trigger={
              <Button variant="outline" size="sm" className="shrink-0 border-orange-500/50 text-orange-500 hover:bg-orange-500/10 hover:text-orange-600">
                Report Issue
              </Button>
            }
          />
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {showBack && currentStepIndex > 0 && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={goBack} 
                disabled={isAnyOperationPending}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
            )}
            {showSaveDraft && (
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => saveDraftMutation.mutate({ closeAfter: true, showToast: true })}
                disabled={isAnyOperationPending}
                className="text-muted-foreground"
              >
                {saveDraftMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Draft
              </Button>
            )}
          </div>
          <Button 
            type="button" 
            onClick={onNext || goNext} 
            disabled={!canProceed || isAnyOperationPending}
            className="gap-1"
          >
            {isTransitioning && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            {nextLabel || "Continue"} <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "max-h-[95vh] overflow-hidden flex flex-col",
          currentStep === "takeoff" ? "max-w-[95vw] w-full" : "max-w-4xl"
        )}
        onEscapeKeyDown={(e) => {
          // Always prevent Escape from closing the estimate wizard
          // Individual steps handle Escape internally (e.g., takeoff for canceling markups)
          e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          // Prevent clicking outside from closing the wizard
          e.preventDefault();
        }}
      >
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            {editEstimate ? "Edit Estimate" : "New Estimate"}
          </DialogTitle>
          
          {/* Progress indicator */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Step {currentStepIndex + 1} of {STEP_ORDER.length}: <strong className="text-foreground">{STEP_LABELS[currentStep]}</strong></span>
              {combinedTotal > 0 && (
                <Badge variant="secondary" className="font-mono">
                  {formatCurrency(combinedTotal)}
                </Badge>
              )}
            </div>
            <Progress value={progressPercent} className="h-1" />
          </div>
        </DialogHeader>

        <div ref={dialogScrollRef} className="flex-1 overflow-y-auto py-2">
          {/* Step 1: Scope Selection */}
          {currentStep === "scopes" && (
            <div className="space-y-4">
              <ScopeSelector
                selectedScopes={selectedScopes}
                onScopesChange={handleScopesChange}
              />

              {selectedScopes.size > 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  {selectedScopes.size} scope{selectedScopes.size !== 1 ? "s" : ""} selected — enter client details next
                </p>
              )}

              {renderWizardFooter({ showBack: false, nextLabel: "Continue" })}
            </div>
          )}

          {/* Step 2: Client Details */}
          {currentStep === "client" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <User className="w-4 h-4" />
                <span className="text-sm">Enter the client and site information</span>
              </div>

              <div className="grid gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client_name">Client Name *</Label>
                    <ClientAutocomplete
                      value={formData.client_name}
                      onChange={(value) => setFormData(prev => ({ ...prev, client_name: value }))}
                      onSelect={(client: Client) => {
                        setFormData(prev => ({
                          ...prev,
                          client_name: client.name,
                          company_name: client.company_name || prev.company_name,
                          client_email: client.email || prev.client_email,
                          client_phone: client.phone || prev.client_phone,
                          // Don't prefill site_address - each estimate is for a different site
                        }));
                      }}
                      placeholder="Start typing to search clients..."
                      error={formErrors.client_name}
                    />
                    {formErrors.client_name && (
                      <p className="text-xs text-destructive">{formErrors.client_name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleChange}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client_email">Email</Label>
                    <Input
                      id="client_email"
                      name="client_email"
                      type="email"
                      value={formData.client_email}
                      onChange={handleChange}
                      placeholder="client@example.com"
                      className={formErrors.client_email ? "border-destructive" : ""}
                      maxLength={255}
                    />
                    {formErrors.client_email && (
                      <p className="text-xs text-destructive">{formErrors.client_email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_phone">Phone</Label>
                    <Input
                      id="client_phone"
                      name="client_phone"
                      value={formData.client_phone}
                      onChange={handleChange}
                      placeholder="0412 345 678"
                      className={formErrors.client_phone ? "border-destructive" : ""}
                      maxLength={20}
                    />
                    {formErrors.client_phone && (
                      <p className="text-xs text-destructive">{formErrors.client_phone}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="site_address" className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Site Address *
                  </Label>
                  <Input
                    id="site_address"
                    name="site_address"
                    value={formData.site_address}
                    onChange={handleChange}
                    placeholder="123 Main Street, Sydney NSW"
                    className={formErrors.site_address ? "border-destructive" : ""}
                    maxLength={200}
                  />
                  {formErrors.site_address && (
                    <p className="text-xs text-destructive">{formErrors.site_address}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="site_visit_date">Site Visit Date</Label>
                  <Input
                    id="site_visit_date"
                    name="site_visit_date"
                    type="date"
                    value={formData.site_visit_date}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {renderWizardFooter()}
            </div>
          )}

          {/* Step 3: Plan Takeoff (Optional) */}
          {currentStep === "takeoff" && (
            <PlanTakeoffStep
              estimateId={editEstimate?.id || draftEstimateId}
              businessId={businessId}
              selectedScopes={selectedScopesArray}
              scopeLabels={Object.fromEntries(
                selectedScopesArray.map(s => [s, getScopeLabel(s)])
              )}
              initialScope={pendingTakeoffScope}
              onInitialScopeHandled={() => setPendingTakeoffScope(null)}
              onJointMarkupComplete={handleJointMarkupComplete}
              onContinue={goNext}
              onBack={goBack}
              onSkip={goNext}
              isNavigating={isTransitioning}
            />
          )}

          {/* Step 5: Configure Scopes */}
          {currentStep === "configure" && (
            <div className="space-y-4">
              {selectedScopesArray.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No scopes selected. Go back to select scope of works.</p>
                </Card>
              ) : (
                <>
                  {/* Scope navigation header */}
                  <div className="bg-muted/50 rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">
                          Scope {activeScopeIndex + 1} of {selectedScopesArray.length}: {getScopeLabel(activeScopeType!)}
                        </span>
                      </div>
                      {scopeTotals[activeScopeType!]?.total > 0 && (
                        <Badge variant="outline" className="font-mono">
                          {formatCurrency(scopeTotals[activeScopeType!].total)}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Scope progress dots */}
                    <div className="flex items-center gap-1.5">
                      {selectedScopesArray.map((scope, index) => (
                        <button
                          key={scope}
                          type="button"
                          onClick={() => setActiveScopeIndex(index)}
                          className={cn(
                            "h-2 rounded-full transition-all",
                            index === activeScopeIndex 
                              ? "w-6 bg-primary" 
                              : scopeTotals[scope].total > 0 
                                ? "w-2 bg-primary/50" 
                                : "w-2 bg-muted-foreground/30"
                          )}
                          title={getScopeLabel(scope)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Calculator */}
                  <div ref={scopeContainerRef} className="min-h-[400px] overflow-y-auto">
                    {activeScopeType && renderScopeCalculator(activeScopeType)}
                  </div>

                  {/* Scope navigation footer */}
                  <div className="space-y-3 pt-4 border-t">
                    {/* Testing feedback banner */}
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MessageSquareWarning className="w-4 h-4 text-orange-500 shrink-0" />
                        <span>Stuck on an issue? We're still testing and want to help.</span>
                      </div>
                      <FeedbackDialog 
                        trigger={
                          <Button variant="outline" size="sm" className="shrink-0 border-orange-500/50 text-orange-500 hover:bg-orange-500/10 hover:text-orange-600">
                            Report Issue
                          </Button>
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {activeScopeIndex > 0 ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setActiveScopeIndex(activeScopeIndex - 1)}
                            className="gap-1"
                          >
                            <ChevronLeft className="w-4 h-4" /> Previous Scope
                          </Button>
                        ) : (
                          <Button type="button" variant="outline" onClick={goBack} className="gap-1">
                            <ChevronLeft className="w-4 h-4" /> Back
                          </Button>
                        )}
                        <Button 
                          type="button" 
                          variant="ghost" 
                          onClick={() => saveDraftMutation.mutate({ closeAfter: true, showToast: true })}
                          disabled={saveDraftMutation.isPending}
                          className="text-muted-foreground"
                        >
                          Save Draft
                        </Button>
                      </div>
                      
                      {activeScopeIndex < selectedScopesArray.length - 1 ? (
                        <Button
                          type="button"
                          onClick={() => setActiveScopeIndex(activeScopeIndex + 1)}
                          className="gap-1"
                        >
                          Next Scope <ChevronRight className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button type="button" onClick={goNext} className="gap-1">
                          Continue to Markup <ChevronRight className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 5: Markup */}
          {currentStep === "margin" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="w-5 h-5" />
                    Project Markup
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Scope subtotals breakdown */}
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Scope Subtotals</Label>
                    {selectedScopesArray.map((scope) => (
                      <div key={scope} className="flex justify-between text-sm">
                        <span>{getScopeLabel(scope)}</span>
                        <span className="font-mono">{formatCurrency(scopeTotals[scope].total)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Subtotal (before markup)</span>
                      <span className="font-mono">{formatCurrency(combinedSubtotal)}</span>
                    </div>
                  </div>

                  {/* Markup inputs - side by side */}
                  <div className="grid sm:grid-cols-2 gap-6">
                    {/* Percentage input */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="margin" className="flex items-center gap-1.5">
                          <Percent className="w-4 h-4" />
                          Markup Percentage
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          id="margin"
                          type="number"
                          value={globalMarginPercent}
                          onChange={(e) => {
                            const percent = Number(e.target.value) || 0;
                            setGlobalMarginPercent(percent);
                          }}
                          className="flex-1"
                          min={0}
                          max={100}
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                      {/* Quick presets */}
                      <div className="flex flex-wrap gap-2">
                        {[10, 15, 20, 25].map((preset) => (
                          <Button
                            key={preset}
                            type="button"
                            variant={globalMarginPercent === preset ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setGlobalMarginPercent(preset);
                            }}
                          >
                            {preset}%
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Fixed profit input */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="fixed-profit" className="flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4" />
                          Fixed Profit
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">$</span>
                        <Input
                          id="fixed-profit"
                          type="number"
                          value={fixedProfitAmount || ''}
                          onChange={(e) => {
                            const amount = Number(e.target.value) || 0;
                            if (combinedSubtotal > 0) {
                              setGlobalMarginPercent(Math.round((amount / combinedSubtotal) * 100 * 10) / 10);
                            }
                          }}
                          className="flex-1"
                          min={0}
                          placeholder="Enter profit amount"
                        />
                      </div>
                      {/* Quick preset amounts */}
                      <div className="flex flex-wrap gap-2">
                        {[2000, 5000, 10000, 15000].map((preset) => (
                          <Button
                            key={preset}
                            type="button"
                            variant={fixedProfitAmount === preset ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              if (combinedSubtotal > 0) {
                                setGlobalMarginPercent(Math.round((preset / combinedSubtotal) * 100 * 10) / 10);
                              }
                            }}
                          >
                            ${preset.toLocaleString()}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Changing either value will automatically update the other
                  </p>

                  {/* Final totals */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total (ex GST)</span>
                      <span className="text-primary font-mono">{formatCurrency(combinedTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>GST (10%)</span>
                      <span className="font-mono">{formatCurrency(combinedTotal * 0.1)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total (inc GST)</span>
                      <span className="text-primary font-mono">{formatCurrency(combinedTotal * 1.1)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {renderWizardFooter()}
            </div>
          )}

          {/* Step 6: Conditions */}
          {currentStep === "conditions" && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    What's Included
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {/* General inclusions (items without relevantModules) */}
                  {(() => {
                    const generalItems = DEFAULT_INCLUSIONS.filter(i => !i.relevantModules || i.relevantModules.length === 0);
                    if (generalItems.length === 0) return null;
                    return (
                      <Collapsible defaultOpen>
                        <CollapsibleTrigger className="group flex items-center gap-2 w-full text-left py-1.5 px-2 rounded hover:bg-muted/50">
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
                          <span className="text-sm font-semibold">General</span>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pl-6 pt-1">
                          <div className="grid sm:grid-cols-2 gap-1">
                            {generalItems.map(item => (
                              <label key={item.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-muted/50">
                                <Checkbox
                                  checked={selectedInclusions._general?.has(item.id) || false}
                                  onCheckedChange={(checked) => {
                                    setSelectedInclusions(prev => {
                                      const updated = { ...prev };
                                      updated._general = new Set(prev._general || []);
                                      if (checked) updated._general.add(item.id);
                                      else updated._general.delete(item.id);
                                      return updated;
                                    });
                                  }}
                                />
                                <span className="text-sm">{item.label}</span>
                              </label>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })()}
                  {/* Per-scope inclusions */}
                  {selectedScopesArray.map(scopeId => {
                    const scopeDef = SCOPE_REGISTRY[scopeId];
                    if (!scopeDef) return null;
                   const scopeItems = DEFAULT_INCLUSIONS.filter(item =>
                     item.relevantModules && item.relevantModules.length > 0 &&
                     item.relevantModules.some(m => scopeDef.moduleIds.includes(m)) &&
                     !(item.excludeWhenModulesActive?.some(m => scopeDef.moduleIds.includes(m)))
                   );
                    if (scopeItems.length === 0) return null;
                    const selectedCount = scopeItems.filter(item => selectedInclusions[scopeId]?.has(item.id)).length;
                    return (
                      <Collapsible key={scopeId} defaultOpen>
                        <CollapsibleTrigger className="group flex items-center gap-2 w-full text-left py-1.5 px-2 rounded hover:bg-muted/50">
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
                          <span className="text-sm font-semibold">{getScopeLabel(scopeId)}</span>
                          <Badge variant="secondary" className="text-xs ml-auto">{selectedCount}/{scopeItems.length}</Badge>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pl-6 pt-1">
                          <div className="grid sm:grid-cols-2 gap-1">
                            {scopeItems.map(item => (
                              <label key={item.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-muted/50">
                                <Checkbox
                                  checked={selectedInclusions[scopeId]?.has(item.id) || false}
                                  onCheckedChange={(checked) => {
                                    setSelectedInclusions(prev => {
                                      const updated = { ...prev };
                                      updated[scopeId] = new Set(prev[scopeId] || []);
                                      if (checked) updated[scopeId].add(item.id);
                                      else updated[scopeId].delete(item.id);
                                      return updated;
                                    });
                                  }}
                                />
                                <span className="text-sm">{item.label}</span>
                              </label>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                  {selectedScopesArray.length === 0 && (
                    <p className="text-sm text-muted-foreground py-2">Select scopes first to see relevant inclusions.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-orange-500">
                    <Eye className="w-4 h-4" />
                    What's Excluded
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {/* General exclusions */}
                  {(() => {
                    const generalItems = DEFAULT_EXCLUSIONS.filter(i => !i.relevantModules || i.relevantModules.length === 0);
                    if (generalItems.length === 0) return null;
                    return (
                      <Collapsible defaultOpen>
                        <CollapsibleTrigger className="group flex items-center gap-2 w-full text-left py-1.5 px-2 rounded hover:bg-muted/50">
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
                          <span className="text-sm font-semibold">General</span>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pl-6 pt-1">
                          <div className="grid sm:grid-cols-2 gap-1">
                            {generalItems.map(item => (
                              <label key={item.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-muted/50">
                                <Checkbox
                                  checked={selectedExclusions._general?.has(item.id) || false}
                                  onCheckedChange={(checked) => {
                                    setSelectedExclusions(prev => {
                                      const updated = { ...prev };
                                      updated._general = new Set(prev._general || []);
                                      if (checked) updated._general.add(item.id);
                                      else updated._general.delete(item.id);
                                      return updated;
                                    });
                                  }}
                                />
                                <span className="text-sm">{item.label}</span>
                              </label>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })()}
                  {/* Per-scope exclusions */}
                  {selectedScopesArray.map(scopeId => {
                    const scopeDef = SCOPE_REGISTRY[scopeId];
                    if (!scopeDef) return null;
                   const scopeItems = DEFAULT_EXCLUSIONS.filter(item =>
                     item.relevantModules && item.relevantModules.length > 0 &&
                     item.relevantModules.some(m => scopeDef.moduleIds.includes(m)) &&
                     !(item.excludeWhenModulesActive?.some(m => scopeDef.moduleIds.includes(m)))
                   );
                    if (scopeItems.length === 0) return null;
                    const selectedCount = scopeItems.filter(item => selectedExclusions[scopeId]?.has(item.id)).length;
                    return (
                      <Collapsible key={scopeId} defaultOpen>
                        <CollapsibleTrigger className="group flex items-center gap-2 w-full text-left py-1.5 px-2 rounded hover:bg-muted/50">
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
                          <span className="text-sm font-semibold">{getScopeLabel(scopeId)}</span>
                          <Badge variant="secondary" className="text-xs ml-auto">{selectedCount}/{scopeItems.length}</Badge>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pl-6 pt-1">
                          <div className="grid sm:grid-cols-2 gap-1">
                            {scopeItems.map(item => (
                              <label key={item.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-muted/50">
                                <Checkbox
                                  checked={selectedExclusions[scopeId]?.has(item.id) || false}
                                  onCheckedChange={(checked) => {
                                    setSelectedExclusions(prev => {
                                      const updated = { ...prev };
                                      updated[scopeId] = new Set(prev[scopeId] || []);
                                      if (checked) updated[scopeId].add(item.id);
                                      else updated[scopeId].delete(item.id);
                                      return updated;
                                    });
                                  }}
                                />
                                <span className="text-sm">{item.label}</span>
                              </label>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                  {selectedScopesArray.length === 0 && (
                    <p className="text-sm text-muted-foreground py-2">Select scopes first to see relevant exclusions.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-primary" />
                    Payment Terms
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quote_validity">Quote Valid For</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="quote_validity"
                          type="number"
                          value={quoteValidityDays}
                          onChange={(e) => setQuoteValidityDays(Number(e.target.value) || 14)}
                          min={1}
                          max={90}
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">days</span>
                      </div>
                    </div>
                    
                    {(paymentTermsType === 'deposit_balance') && (
                      <div className="space-y-2">
                        <Label htmlFor="deposit_percent">Deposit Percentage</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="deposit_percent"
                            type="number"
                            value={depositPercentage}
                            onChange={(e) => setDepositPercentage(Number(e.target.value) || 50)}
                            min={0}
                            max={100}
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Terms</Label>
                    <div className="grid gap-2">
                      {PAYMENT_TERMS_OPTIONS.map((option) => (
                        <label 
                          key={option.value} 
                          className={cn(
                            "flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-colors",
                            paymentTermsType === option.value 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover:bg-muted/50"
                          )}
                        >
                          <input
                            type="radio"
                            name="payment_terms"
                            value={option.value}
                            checked={paymentTermsType === option.value}
                            onChange={(e) => setPaymentTermsType(e.target.value as PaymentTermsType)}
                            className="mt-1 accent-primary"
                          />
                          <div>
                            <span className="font-medium text-sm">{option.label}</span>
                            <p className="text-xs text-muted-foreground">{option.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {paymentTermsType === 'custom' && (
                    <div className="space-y-2">
                      <Label htmlFor="custom_terms">Custom Terms</Label>
                      <Textarea
                        id="custom_terms"
                        value={formData.notes}
                        onChange={handleChange}
                        name="notes"
                        placeholder="Enter your custom payment terms..."
                        rows={3}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {renderWizardFooter({ nextLabel: "Review Summary" })}
            </div>
          )}

          {/* Step 6: Summary */}
          {currentStep === "summary" && (
            <div className="space-y-4">
              {/* Internal costs notice */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-start gap-2">
                <Eye className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  <strong>Your cost breakdown (internal)</strong> — The client will see the scope breakdown and total amount.
                </p>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Estimate Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Client info */}
                  <div className="grid sm:grid-cols-2 gap-4 pb-4 border-b">
                    <div>
                      <p className="text-xs text-muted-foreground">Client</p>
                      <p className="font-medium">{formData.client_name}</p>
                      {formData.company_name && <p className="text-sm text-muted-foreground">{formData.company_name}</p>}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Site Address</p>
                      <p className="font-medium">{formData.site_address}</p>
                    </div>
                  </div>

                  {/* Simplified Scope breakdown with key metrics */}
                  <div className="space-y-2">
                    {selectedScopesArray.map((scope) => {
                      const scopeState = modularScopeStates[scope];
                      return (
                        <SimplifiedScopeSummary
                          key={scope}
                          scopeId={scope}
                          scopeLabel={getScopeLabel(scope)}
                          scopeEntry={{
                            scopeAnswers: scopeState?.scopeAnswers,
                            moduleAnswers: scopeState?.moduleAnswers,
                            calculatedTotal: scopeState?.calculatedTotal || scopeTotals[scope]?.total || 0,
                          }}
                        />
                      );
                    })}
                  </div>

                  <div className="border-t pt-3 space-y-1">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total (ex GST)</span>
                      <span className="text-primary font-mono">{formatCurrency(combinedTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>GST (10%)</span>
                      <span className="font-mono">{formatCurrency(combinedTotal * 0.1)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total (inc GST)</span>
                      <span className="text-primary font-mono">{formatCurrency(combinedTotal * 1.1)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes / Terms</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Payment terms, conditions..."
                  rows={2}
                />
              </div>

              {/* Footer with Create/Update/Finalize buttons */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={goBack} className="gap-1">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </Button>
                  {(!editEstimate || editEstimate.status === "draft") && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => saveDraftMutation.mutate({ closeAfter: true, showToast: true })}
                      disabled={saveDraftMutation.isPending}
                      className="text-muted-foreground"
                    >
                      {saveDraftMutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                      Save Draft
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {/* For drafts: show Update and Finalize buttons */}
                  {editEstimate && editEstimate.status === "draft" && (
                    <>
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={handleSubmit}
                        disabled={mutation.isPending || selectedScopes.size === 0}
                      >
                        {mutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                        Update Draft
                      </Button>
                      <Button 
                        type="button"
                        onClick={() => finalizeMutation.mutate()}
                        disabled={finalizeMutation.isPending || selectedScopes.size === 0}
                        className="gap-2"
                      >
                        {finalizeMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        <CheckCircle className="w-4 h-4" />
                        Finalize Quote
                        <Badge variant="secondary" className="ml-1 font-mono">
                          {formatCurrency(combinedTotal * 1.1)}
                        </Badge>
                      </Button>
                    </>
                  )}
                  {/* For non-drafts being edited: just show Update */}
                  {editEstimate && editEstimate.status !== "draft" && (
                    <Button 
                      type="button"
                      onClick={handleSubmit}
                      disabled={mutation.isPending || selectedScopes.size === 0}
                      className="gap-2"
                    >
                      {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                      Update Quote
                      <Badge variant="secondary" className="ml-1 font-mono">
                        {formatCurrency(combinedTotal * 1.1)}
                      </Badge>
                    </Button>
                  )}
                  {/* For new estimates: show Create and Finalize */}
                  {!editEstimate && (
                    <>
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={handleSubmit}
                        disabled={mutation.isPending || selectedScopes.size === 0}
                      >
                        {mutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                        Save as Draft
                      </Button>
                      <Button 
                        type="button"
                        onClick={() => finalizeMutation.mutate()}
                        disabled={finalizeMutation.isPending || selectedScopes.size === 0}
                        className="gap-2"
                      >
                        {finalizeMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        <CheckCircle className="w-4 h-4" />
                        Finalize Quote
                        <Badge variant="secondary" className="ml-1 font-mono">
                          {formatCurrency(combinedTotal * 1.1)}
                        </Badge>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
