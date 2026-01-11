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
  Car,
  Home,
  Building2,
  User,
  MapPin,
  ListChecks,
  Wrench,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

import { EstimateType } from "./EstimateTypeSelector";
import { ScopeType, SCOPE_OPTIONS } from "./ScopeSelector";
import { ModularCalculator } from "./calculators/ModularCalculator";
import { SCOPE_REGISTRY } from "@/lib/estimate-components/scopes";
import { ExclusionItem } from "@/lib/estimate-components/types";

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
}

interface EstimateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editEstimate?: Estimate | null;
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

const DEFAULT_INCLUSIONS = [
  { id: "concrete_supply", label: "Supply of concrete to site" },
  { id: "labour", label: "All labour for concrete placement and finishing" },
  { id: "reo_supply", label: "Supply and installation of reinforcement mesh" },
  { id: "finishing", label: "Power floating / finishing to specified standard" },
  { id: "curing", label: "Curing compound application" },
  { id: "site_cleanup", label: "Site cleanup on completion" },
  { id: "pump_hire", label: "Concrete pump hire" },
  { id: "formwork", label: "Edge formwork supply and installation" },
];

const DEFAULT_EXCLUSIONS = [
  { id: "exc_excavation", label: "Excavation and site preparation" },
  { id: "exc_soil_removal", label: "Removal of excavated material" },
  { id: "exc_boxing", label: "Boxing and formwork beyond edge forms" },
  { id: "exc_waterproofing", label: "Waterproofing membrane" },
  { id: "exc_drainage", label: "Drainage and stormwater works" },
  { id: "exc_saw_cutting", label: "Saw cutting control joints" },
  { id: "exc_sealing", label: "Concrete sealing" },
  { id: "exc_permits", label: "Council permits and inspections" },
  { id: "exc_engineering", label: "Engineering certification" },
];

// Modular calculator state type
export interface ModularScopeState {
  scopeAnswers: Record<string, any>;
  moduleAnswers: Record<string, Record<string, any>>;
  customExclusions: ExclusionItem[];
  calculatedTotal: number;
}

// Step definitions for clarity
type WizardStep = 
  | "type" 
  | "client" 
  | "scopes" 
  | "configure" 
  | "inclusions" 
  | "summary";

const STEP_ORDER: WizardStep[] = ["type", "client", "scopes", "configure", "inclusions", "summary"];
const STEP_LABELS: Record<WizardStep, string> = {
  type: "Project Type",
  client: "Client Details",
  scopes: "Scope Selection",
  configure: "Configure",
  inclusions: "Inclusions",
  summary: "Summary",
};

const ESTIMATE_TYPES = [
  { id: "driveway" as EstimateType, title: "Driveway", description: "Residential driveways, paths, and small pads", icon: Car },
  { id: "house_slab" as EstimateType, title: "House Slab", description: "Residential foundations with multiple sections", icon: Home },
  { id: "commercial_slab" as EstimateType, title: "Commercial Slab", description: "Industrial and commercial foundations", icon: Building2 },
];

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
        
      case 'suspended_slab':
        scopeAnswers.area = parseFloat(legacyData.slabArea) || parseFloat(legacyData.length) * parseFloat(legacyData.width) || 0;
        scopeAnswers.perimeter = parseFloat(legacyData.perimeter) || 0;
        scopeAnswers.thickness = parseInt(legacyData.slabThickness) || 200;
        scopeAnswers.height = parseInt(legacyData.height) || 3000;
        break;
        
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

export function EstimateFormDialog({ open, onOpenChange, editEstimate }: EstimateFormDialogProps) {
  const hasInitializedOnOpenRef = useRef(false);
  
  const [currentStep, setCurrentStep] = useState<WizardStep>("type");
  const [estimateType, setEstimateType] = useState<EstimateType | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [selectedInclusions, setSelectedInclusions] = useState<Set<string>>(new Set(DEFAULT_INCLUSIONS.slice(0, 6).map(i => i.id)));
  const [selectedExclusions, setSelectedExclusions] = useState<Set<string>>(new Set(DEFAULT_EXCLUSIONS.slice(0, 4).map(e => e.id)));
  
  const [selectedScopes, setSelectedScopes] = useState<Set<ScopeType>>(new Set());
  const [modularScopeStates, setModularScopeStates] = useState<Record<ScopeType, ModularScopeState>>({} as Record<ScopeType, ModularScopeState>);
  const [activeScopeIndex, setActiveScopeIndex] = useState(0);
  const scopeContainerRef = useRef<HTMLDivElement>(null);
  const dialogScrollRef = useRef<HTMLDivElement>(null);
  
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
      piers: { total: 0, description: "" },
      retaining_wall_footings: { total: 0, description: "" },
      strip_footings: { total: 0, description: "" },
      standard_slab: { total: 0, description: "" },
      raft_slab: { total: 0, description: "" },
      waffle_pod: { total: 0, description: "" },
      suspended_slab: { total: 0, description: "" },
      driveway: { total: 0, description: "" },
      paths_surrounds: { total: 0, description: "" },
      crossovers: { total: 0, description: "" },
      architectural_concrete: { total: 0, description: "" },
    };

    for (const scopeType of Array.from(selectedScopes)) {
      const state = modularScopeStates[scopeType];
      const scopeDef = SCOPE_REGISTRY[scopeType];
      
      if (state?.calculatedTotal > 0) {
        // Build description from scope answers
        let desc = scopeDef?.name || scopeType;
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

  const combinedTotal = useMemo(() => {
    return selectedScopesArray.reduce((sum, scope) => sum + scopeTotals[scope].total, 0);
  }, [selectedScopesArray, scopeTotals]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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
        description: editEstimate.description || "",
        valid_until: editEstimate.valid_until || "",
        notes: editEstimate.notes || "",
        site_visit_date: editEstimate.site_visit_date || "",
        follow_up_date: editEstimate.follow_up_date || "",
      });
      setEstimateType(editEstimate.estimate_type || "driveway");

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

      // Determine starting step based on draft progress
      if (editEstimate.status === "draft") {
        // Check how much data we have to determine where to resume
        const hasClientInfo = editEstimate.client_name && editEstimate.site_address;
        const hasScopeData = editEstimate.scope_data && Object.keys(editEstimate.scope_data).length > 0;
        
        if (!editEstimate.estimate_type) {
          // No type selected yet
          setCurrentStep("type");
        } else if (!hasClientInfo) {
          // Has type but no client info
          setCurrentStep("client");
        } else if (!hasScopes) {
          // Has client info but no scopes selected
          setCurrentStep("scopes");
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
      setCurrentStep("type");
      setEstimateType(null);
      setFormData(initialFormData);
      setSelectedInclusions(new Set(DEFAULT_INCLUSIONS.slice(0, 6).map(i => i.id)));
      setSelectedExclusions(new Set(DEFAULT_EXCLUSIONS.slice(0, 4).map(e => e.id)));
      setSelectedScopes(new Set());
      setModularScopeStates({} as Record<ScopeType, ModularScopeState>);
      setActiveScopeIndex(0);
    }
  }, [editEstimate, open]);

  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const progressPercent = ((currentStepIndex + 1) / STEP_ORDER.length) * 100;

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case "type": return !!estimateType;
      case "client": return !!formData.client_name && !!formData.site_address;
      case "scopes": return selectedScopes.size > 0;
      case "configure": return true;
      case "inclusions": return true;
      case "summary": return true;
      default: return false;
    }
  }, [currentStep, estimateType, formData.client_name, formData.site_address, selectedScopes.size]);

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEP_ORDER.length) {
      setCurrentStep(STEP_ORDER[nextIndex]);
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEP_ORDER[prevIndex]);
    }
  };

  const getScopeLabel = (scope: ScopeType) => {
    return SCOPE_OPTIONS.find(s => s.id === scope)?.label || scope;
  };

  const availableScopes = useMemo(() => {
    return SCOPE_OPTIONS.filter(scope => 
      estimateType ? scope.availableFor.includes(estimateType) : true
    );
  }, [estimateType]);

  const handleScopeToggle = (scopeId: ScopeType, checked: boolean) => {
    const newScopes = new Set(selectedScopes);
    if (checked) {
      newScopes.add(scopeId);
      // Clear any stale state for this scope so it starts fresh
      setModularScopeStates(prev => {
        const updated = { ...prev };
        delete updated[scopeId];
        return updated;
      });
    } else {
      newScopes.delete(scopeId);
      // Also clear the state when removing a scope
      setModularScopeStates(prev => {
        const updated = { ...prev };
        delete updated[scopeId];
        return updated;
      });
    }
    setSelectedScopes(newScopes);
    // Reset active scope index if needed
    if (activeScopeIndex >= newScopes.size) {
      setActiveScopeIndex(Math.max(0, newScopes.size - 1));
    }
  };

  // Build scope_data for saving (new modular format)
  const buildScopeDataForSave = (): Record<string, any> => {
    const data: Record<string, any> = {};
    
    for (const scopeType of selectedScopesArray) {
      const state = modularScopeStates[scopeType];
      if (state) {
        data[scopeType] = {
          scopeAnswers: state.scopeAnswers,
          moduleAnswers: state.moduleAnswers,
          customExclusions: state.customExclusions,
          calculatedTotal: state.calculatedTotal,
        };
      }
    }
    
    return data;
  };

  // Save Draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!profile?.business_id) throw new Error("No business found");

      const scopeDescriptions = selectedScopesArray.map((scope) => {
        const label = SCOPE_OPTIONS.find(s => s.id === scope)?.label || scope;
        return `${label}: ${scopeTotals[scope].description || 'Not configured'}`;
      });

      const estimateData = {
        business_id: profile.business_id,
        client_name: formData.client_name || "Draft Estimate",
        company_name: formData.company_name || null,
        client_email: formData.client_email || null,
        client_phone: formData.client_phone || null,
        site_address: formData.site_address || "No address",
        description: scopeDescriptions.length > 0 
          ? scopeDescriptions.join("\n") + (formData.description ? `\n\n${formData.description}` : "")
          : formData.description || null,
        valid_until: formData.valid_until || null,
        notes: formData.notes || null,
        total_amount: combinedTotal,
        estimate_type: estimateType || "driveway",
        status: "draft" as const,
        scope_data: buildScopeDataForSave() as unknown as Json,
        selected_scopes: selectedScopesArray as unknown as Json,
        site_visit_date: formData.site_visit_date || null,
        follow_up_date: formData.follow_up_date || null,
      };

      if (editEstimate) {
        const { error } = await supabase
          .from("estimates")
          .update(estimateData)
          .eq("id", editEstimate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("estimates")
          .insert([{ ...estimateData, created_by: (await supabase.auth.getUser()).data.user?.id }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      toast({ title: "Draft saved", description: "You can continue editing this estimate later." });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error saving draft", description: error.message, variant: "destructive" });
    },
  });

  // Finalize Quote mutation - marks estimate as pending (ready to send)
  const finalizeMutation = useMutation({
    mutationFn: async () => {
      if (!formData.client_name || !formData.site_address) {
        throw new Error("Please fill in client name and site address");
      }
      if (selectedScopes.size === 0) {
        throw new Error("Please select at least one scope of work");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!profile?.business_id) throw new Error("No business found");

      const descriptionParts = selectedScopesArray.map(scope => {
        const label = getScopeLabel(scope);
        const { description } = scopeTotals[scope];
        return `${label}: ${description}`;
      });
      
      if (formData.description) {
        descriptionParts.push(formData.description);
      }

      const inclusionsList = DEFAULT_INCLUSIONS
        .filter(i => selectedInclusions.has(i.id))
        .map(i => i.label);
      const exclusionsList = DEFAULT_EXCLUSIONS
        .filter(e => selectedExclusions.has(e.id))
        .map(e => e.label);

      let fullNotes = formData.notes || "";
      if (inclusionsList.length > 0) {
        fullNotes += (fullNotes ? "\n\n" : "") + "INCLUSIONS:\n• " + inclusionsList.join("\n• ");
      }
      if (exclusionsList.length > 0) {
        fullNotes += (fullNotes ? "\n\n" : "") + "EXCLUSIONS:\n• " + exclusionsList.join("\n• ");
      }

      let scopeBreakdown = "SCOPE BREAKDOWN:\n";
      selectedScopesArray.forEach(scope => {
        const label = getScopeLabel(scope);
        const { total } = scopeTotals[scope];
        scopeBreakdown += `• ${label}: ${formatCurrency(total)}\n`;
      });
      fullNotes = scopeBreakdown + "\n" + fullNotes;

      const estimateData = {
        business_id: profile.business_id,
        client_name: formData.client_name,
        company_name: formData.company_name || null,
        client_email: formData.client_email || null,
        client_phone: formData.client_phone || null,
        site_address: formData.site_address,
        description: descriptionParts.join(" | ") || null,
        total_amount: combinedTotal,
        valid_until: formData.valid_until || null,
        notes: fullNotes || null,
        created_by: user.id,
        estimate_type: estimateType || "driveway",
        scope_data: buildScopeDataForSave() as unknown as Json,
        selected_scopes: selectedScopesArray as unknown as Json,
        site_visit_date: formData.site_visit_date || null,
        follow_up_date: formData.follow_up_date || null,
        status: "pending" as const,
      };

      if (editEstimate) {
        const { error } = await supabase
          .from("estimates")
          .update(estimateData)
          .eq("id", editEstimate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("estimates")
          .insert(estimateData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      toast({ 
        title: "Quote finalized", 
        description: "Ready to send to the client when you're ready." 
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error finalizing quote", description: error.message, variant: "destructive" });
    },
  });

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!profile?.business_id) throw new Error("No business found");

      const descriptionParts = selectedScopesArray.map(scope => {
        const label = getScopeLabel(scope);
        const { description } = scopeTotals[scope];
        return `${label}: ${description}`;
      });
      
      if (formData.description) {
        descriptionParts.push(formData.description);
      }

      const inclusionsList = DEFAULT_INCLUSIONS
        .filter(i => selectedInclusions.has(i.id))
        .map(i => i.label);
      const exclusionsList = DEFAULT_EXCLUSIONS
        .filter(e => selectedExclusions.has(e.id))
        .map(e => e.label);

      let fullNotes = formData.notes || "";
      if (inclusionsList.length > 0) {
        fullNotes += (fullNotes ? "\n\n" : "") + "INCLUSIONS:\n• " + inclusionsList.join("\n• ");
      }
      if (exclusionsList.length > 0) {
        fullNotes += (fullNotes ? "\n\n" : "") + "EXCLUSIONS:\n• " + exclusionsList.join("\n• ");
      }

      let scopeBreakdown = "SCOPE BREAKDOWN:\n";
      selectedScopesArray.forEach(scope => {
        const label = getScopeLabel(scope);
        const { total } = scopeTotals[scope];
        scopeBreakdown += `• ${label}: ${formatCurrency(total)}\n`;
      });
      fullNotes = scopeBreakdown + "\n" + fullNotes;

      const estimateData = {
        business_id: profile.business_id,
        client_name: formData.client_name,
        company_name: formData.company_name || null,
        client_email: formData.client_email || null,
        client_phone: formData.client_phone || null,
        site_address: formData.site_address,
        description: descriptionParts.join(" | ") || null,
        total_amount: combinedTotal,
        valid_until: formData.valid_until || null,
        notes: fullNotes || null,
        created_by: user.id,
        estimate_type: estimateType || "driveway",
        scope_data: buildScopeDataForSave() as unknown as Json,
        selected_scopes: selectedScopesArray as unknown as Json,
        site_visit_date: formData.site_visit_date || null,
        follow_up_date: formData.follow_up_date || null,
      };

      if (editEstimate) {
        const { error } = await supabase
          .from("estimates")
          .update(estimateData)
          .eq("id", editEstimate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("estimates")
          .insert(estimateData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      toast({ title: editEstimate ? "Estimate updated" : "Estimate created" });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error saving estimate:", error);
      toast({ title: "Failed to save estimate", variant: "destructive" });
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
  }) => {
    setModularScopeStates(prev => ({
      ...prev,
      [scopeType]: {
        scopeAnswers: state.scopeAnswers,
        moduleAnswers: state.moduleAnswers,
        customExclusions: state.customExclusions,
        calculatedTotal: state.total,
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
    return (
      <ModularCalculator
        key={scope}
        scope={scopeDefinition}
        initialScopeAnswers={currentState?.scopeAnswers}
        initialModuleAnswers={currentState?.moduleAnswers}
        initialCustomExclusions={currentState?.customExclusions}
        onStateChange={(state) => handleModularStateChange(scope, state)}
      />
    );
  };

  // Render wizard footer inline to avoid re-creating component on every render
  const renderWizardFooter = (options: { nextLabel?: string; onNext?: () => void; showBack?: boolean; showSaveDraft?: boolean } = {}) => {
    const { nextLabel, onNext, showBack = true, showSaveDraft = true } = options;
    return (
      <div className="flex items-center justify-between pt-4 border-t mt-4">
        <div className="flex gap-2">
          {showBack && currentStepIndex > 0 && (
            <Button type="button" variant="outline" onClick={goBack} className="gap-1">
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
          )}
          {showSaveDraft && (
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => saveDraftMutation.mutate()}
              disabled={saveDraftMutation.isPending}
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
          disabled={!canProceed}
          className="gap-1"
        >
          {nextLabel || "Continue"} <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
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
          {/* Step 1: Project Type */}
          {currentStep === "type" && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <h3 className="text-lg font-semibold">What type of project?</h3>
                <p className="text-sm text-muted-foreground">This determines which scopes are available</p>
              </div>

              <div className="grid gap-3">
                {ESTIMATE_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = estimateType === type.id;

                  return (
                    <Card
                      key={type.id}
                      role="button"
                      tabIndex={0}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        isSelected && "ring-2 ring-primary bg-primary/5"
                      )}
                      onClick={() => setEstimateType(type.id)}
                    >
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{type.title}</h4>
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                        </div>
                        {isSelected && <Check className="w-5 h-5 text-primary shrink-0" />}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {renderWizardFooter({ showBack: false, showSaveDraft: false })}
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
                    <Input
                      id="client_name"
                      name="client_name"
                      value={formData.client_name}
                      onChange={handleChange}
                      placeholder="e.g., John Smith"
                    />
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_phone">Phone</Label>
                    <Input
                      id="client_phone"
                      name="client_phone"
                      value={formData.client_phone}
                      onChange={handleChange}
                      placeholder="0412 345 678"
                    />
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
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="valid_until">Quote Valid Until</Label>
                    <Input
                      id="valid_until"
                      name="valid_until"
                      type="date"
                      value={formData.valid_until}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {renderWizardFooter()}
            </div>
          )}

          {/* Step 3: Scope Selection */}
          {currentStep === "scopes" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <ListChecks className="w-4 h-4" />
                <span className="text-sm">Select all applicable scopes for this estimate</span>
              </div>

              <div className="grid gap-2">
                {availableScopes.map((scope) => {
                  const isSelected = selectedScopes.has(scope.id);
                  return (
                    <label
                      key={scope.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                        isSelected 
                          ? "border-primary bg-primary/5 shadow-sm" 
                          : "border-border hover:border-muted-foreground/50 hover:bg-muted/30"
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleScopeToggle(scope.id, checked === true)}
                      />
                      <div className="flex-1">
                        <span className="font-medium">{scope.label}</span>
                        <p className="text-xs text-muted-foreground">{scope.description}</p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-primary" />}
                    </label>
                  );
                })}
              </div>

              {selectedScopes.size > 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  {selectedScopes.size} scope{selectedScopes.size !== 1 ? "s" : ""} selected — you'll configure each one next
                </p>
              )}

              {renderWizardFooter({ nextLabel: `Configure ${selectedScopes.size} Scope${selectedScopes.size !== 1 ? "s" : ""}` })}
            </div>
          )}

          {/* Step 4: Configure Scopes */}
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
                  <div className="flex items-center justify-between pt-4 border-t">
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
                        onClick={() => saveDraftMutation.mutate()}
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
                        Continue to Inclusions <ChevronRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 5: Inclusions */}
          {currentStep === "inclusions" && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    What's Included
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {DEFAULT_INCLUSIONS.map((item) => (
                      <label key={item.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-muted/50">
                        <Checkbox
                          checked={selectedInclusions.has(item.id)}
                          onCheckedChange={(checked) => {
                            const newSet = new Set(selectedInclusions);
                            if (checked) newSet.add(item.id);
                            else newSet.delete(item.id);
                            setSelectedInclusions(newSet);
                          }}
                        />
                        <span className="text-sm">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-orange-500">
                    <Eye className="w-4 h-4" />
                    What's Excluded
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {DEFAULT_EXCLUSIONS.map((item) => (
                      <label key={item.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-muted/50">
                        <Checkbox
                          checked={selectedExclusions.has(item.id)}
                          onCheckedChange={(checked) => {
                            const newSet = new Set(selectedExclusions);
                            if (checked) newSet.add(item.id);
                            else newSet.delete(item.id);
                            setSelectedExclusions(newSet);
                          }}
                        />
                        <span className="text-sm">{item.label}</span>
                      </label>
                    ))}
                  </div>
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

                  {/* Scope breakdown */}
                  <div className="space-y-2">
                    {selectedScopesArray.map((scope) => (
                      <div key={scope} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {getScopeLabel(scope)} ({scopeTotals[scope].description})
                        </span>
                        <span className="font-medium font-mono">{formatCurrency(scopeTotals[scope].total)}</span>
                      </div>
                    ))}
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
                      onClick={() => saveDraftMutation.mutate()}
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
