import { useState, useEffect, useMemo } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Calculator, FileText, Check, ChevronRight, Eye, EyeOff, ListChecks, ClipboardCheck } from "lucide-react";
import { EstimateReviewTab } from "./EstimateReviewTab";

import { EstimateTypeSelector, EstimateType } from "./EstimateTypeSelector";
import { ScopeSelector, ScopeType, SCOPE_OPTIONS } from "./ScopeSelector";
import { PiersCalculator, PiersData, initialPiersData, calculatePiersTotals } from "./calculators/PiersCalculator";
import { WafflePodCalculator, WafflePodData, initialWafflePodData, calculateWafflePodTotals } from "./calculators/WafflePodCalculator";
import { RetainingWallCalculator, RetainingWallData, initialRetainingWallData, calculateRetainingWallTotals } from "./calculators/RetainingWallCalculator";
import { StripFootingsCalculator, StripFootingsData, initialStripFootingsData, calculateStripFootingsTotals } from "./calculators/StripFootingsCalculator";
import { CrossoversCalculator, CrossoversData, initialCrossoversData, calculateCrossoversTotals } from "./calculators/CrossoversCalculator";
import { PathsSurroundsCalculator, PathsSurroundsData, initialPathsSurroundsData, calculatePathsSurroundsTotals } from "./calculators/PathsSurroundsCalculator";
import { RaftSlabCalculator, RaftSlabData, initialRaftSlabData, calculateRaftSlabTotals } from "./calculators/RaftSlabCalculator";
import { StandardSlabCalculator, StandardSlabData, initialStandardSlabData, calculateStandardSlabTotals } from "./calculators/StandardSlabCalculator";
import { SuspendedSlabCalculator, SuspendedSlabData, initialSuspendedSlabData, calculateSuspendedSlabTotals } from "./calculators/SuspendedSlabCalculator";

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
  scope_data?: ScopeCalculatorData | null;
  selected_scopes?: ScopeType[] | null;
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
  markupPercent: string;
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
  markupPercent: "15",
};

// Default inclusions and exclusions for concreting quotes
const DEFAULT_INCLUSIONS = [
  { id: "concrete_supply", label: "Supply of concrete to site", category: "inclusion" },
  { id: "labour", label: "All labour for concrete placement and finishing", category: "inclusion" },
  { id: "reo_supply", label: "Supply and installation of reinforcement mesh", category: "inclusion" },
  { id: "finishing", label: "Power floating / finishing to specified standard", category: "inclusion" },
  { id: "curing", label: "Curing compound application", category: "inclusion" },
  { id: "site_cleanup", label: "Site cleanup on completion", category: "inclusion" },
  { id: "pump_hire", label: "Concrete pump hire", category: "inclusion" },
  { id: "formwork", label: "Edge formwork supply and installation", category: "inclusion" },
];

const DEFAULT_EXCLUSIONS = [
  { id: "exc_excavation", label: "Excavation and site preparation", category: "exclusion" },
  { id: "exc_soil_removal", label: "Removal of excavated material", category: "exclusion" },
  { id: "exc_boxing", label: "Boxing and formwork beyond edge forms", category: "exclusion" },
  { id: "exc_waterproofing", label: "Waterproofing membrane", category: "exclusion" },
  { id: "exc_drainage", label: "Drainage and stormwater works", category: "exclusion" },
  { id: "exc_saw_cutting", label: "Saw cutting control joints", category: "exclusion" },
  { id: "exc_sealing", label: "Concrete sealing", category: "exclusion" },
  { id: "exc_permits", label: "Council permits and inspections", category: "exclusion" },
  { id: "exc_engineering", label: "Engineering certification", category: "exclusion" },
];

// Scope calculator data types - exported for reuse in job conversion
export interface ScopeCalculatorData {
  piers: PiersData;
  retaining_wall_footings: RetainingWallData;
  strip_footings: StripFootingsData;
  standard_slab: StandardSlabData;
  raft_slab: RaftSlabData;
  waffle_pod: WafflePodData;
  suspended_slab: SuspendedSlabData;
  driveway: StandardSlabData; // Simple slab calculator for driveways
  paths_surrounds: PathsSurroundsData;
  crossovers: CrossoversData;
}

const initialScopeData: ScopeCalculatorData = {
  piers: initialPiersData,
  retaining_wall_footings: initialRetainingWallData,
  strip_footings: initialStripFootingsData,
  standard_slab: initialStandardSlabData,
  raft_slab: initialRaftSlabData,
  waffle_pod: initialWafflePodData,
  suspended_slab: initialSuspendedSlabData,
  driveway: initialStandardSlabData,
  paths_surrounds: initialPathsSurroundsData,
  crossovers: initialCrossoversData,
};

type TabId = "details" | "scopes" | "inclusions" | "review" | "summary";
type FormStep = "type_selection" | "calculator";

export function EstimateFormDialog({ open, onOpenChange, editEstimate }: EstimateFormDialogProps) {
  const [formStep, setFormStep] = useState<FormStep>("type_selection");
  const [estimateType, setEstimateType] = useState<EstimateType | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [activeTab, setActiveTab] = useState<TabId>("details");
  const [visitedTabs, setVisitedTabs] = useState<Set<TabId>>(new Set(["details"]));
  const [selectedInclusions, setSelectedInclusions] = useState<Set<string>>(new Set(DEFAULT_INCLUSIONS.slice(0, 6).map(i => i.id)));
  const [selectedExclusions, setSelectedExclusions] = useState<Set<string>>(new Set(DEFAULT_EXCLUSIONS.slice(0, 4).map(e => e.id)));
  
  // Scope selection state
  const [selectedScopes, setSelectedScopes] = useState<Set<ScopeType>>(new Set());
  const [scopeData, setScopeData] = useState<ScopeCalculatorData>(initialScopeData);
  const [activeScopeTab, setActiveScopeTab] = useState<ScopeType | null>(null);
  const [visitedScopes, setVisitedScopes] = useState<Set<ScopeType>>(new Set());
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const tabOrder: TabId[] = ["details", "scopes", "inclusions", "review", "summary"];

  // Track visited tabs
  useEffect(() => {
    setVisitedTabs(prev => new Set([...prev, activeTab]));
  }, [activeTab]);

  // Check if all tabs have been visited
  const allTabsVisited = useMemo(() => {
    return tabOrder.every(tab => visitedTabs.has(tab));
  }, [visitedTabs]);

  // Check if all selected scopes have been visited
  const allScopesVisited = useMemo(() => {
    if (selectedScopes.size === 0) return false;
    return Array.from(selectedScopes).every(scope => visitedScopes.has(scope));
  }, [selectedScopes, visitedScopes]);

  // Track visited scope tabs
  useEffect(() => {
    if (activeScopeTab) {
      setVisitedScopes(prev => new Set([...prev, activeScopeTab]));
    }
  }, [activeScopeTab]);

  // Update active scope tab when scopes change
  useEffect(() => {
    if (selectedScopes.size > 0 && !activeScopeTab) {
      setActiveScopeTab(Array.from(selectedScopes)[0]);
    } else if (selectedScopes.size === 0) {
      setActiveScopeTab(null);
    } else if (activeScopeTab && !selectedScopes.has(activeScopeTab)) {
      setActiveScopeTab(Array.from(selectedScopes)[0]);
    }
  }, [selectedScopes, activeScopeTab]);

  // Calculate totals for each scope
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
    };

    if (selectedScopes.has("piers")) {
      const calcs = calculatePiersTotals(scopeData.piers);
      totals.piers = { total: calcs.grandTotal, description: `${scopeData.piers.piers.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0)} piers` };
    }
    if (selectedScopes.has("retaining_wall_footings")) {
      const calcs = calculateRetainingWallTotals(scopeData.retaining_wall_footings);
      totals.retaining_wall_footings = { total: calcs.grandTotal, description: `${scopeData.retaining_wall_footings.footings.length} footing types` };
    }
    if (selectedScopes.has("strip_footings")) {
      const calcs = calculateStripFootingsTotals(scopeData.strip_footings);
      totals.strip_footings = { total: calcs.grandTotal, description: `${calcs.totalLength.toFixed(1)}m strip footings` };
    }
    if (selectedScopes.has("standard_slab")) {
      const calcs = calculateStandardSlabTotals(scopeData.standard_slab);
      totals.standard_slab = { total: calcs.grandTotal, description: `${calcs.slabArea.toFixed(1)}m² standard slab` };
    }
    if (selectedScopes.has("raft_slab")) {
      const calcs = calculateRaftSlabTotals(scopeData.raft_slab);
      totals.raft_slab = { total: calcs.grandTotal, description: `${calcs.raftArea.toFixed(1)}m² slab` };
    }
    if (selectedScopes.has("waffle_pod")) {
      const calcs = calculateWafflePodTotals(scopeData.waffle_pod);
      totals.waffle_pod = { total: calcs.grandTotal, description: `${calcs.slabArea.toFixed(1)}m² waffle pod` };
    }
    if (selectedScopes.has("suspended_slab")) {
      const calcs = calculateSuspendedSlabTotals(scopeData.suspended_slab);
      totals.suspended_slab = { total: calcs.grandTotal, description: `${calcs.slabArea.toFixed(1)}m² suspended slab` };
    }
    if (selectedScopes.has("driveway")) {
      const calcs = calculateStandardSlabTotals(scopeData.driveway);
      totals.driveway = { total: calcs.grandTotal, description: `${calcs.slabArea.toFixed(1)}m² driveway` };
    }
    if (selectedScopes.has("paths_surrounds")) {
      const calcs = calculatePathsSurroundsTotals(scopeData.paths_surrounds);
      totals.paths_surrounds = { total: calcs.grandTotal, description: `${scopeData.paths_surrounds.sections.length} path sections` };
    }
    if (selectedScopes.has("crossovers")) {
      const calcs = calculateCrossoversTotals(scopeData.crossovers);
      totals.crossovers = { total: calcs.grandTotal, description: `${scopeData.crossovers.crossovers.length} crossovers` };
    }

    return totals;
  }, [selectedScopes, scopeData]);

  // Combined total from all selected scopes
  const combinedTotal = useMemo(() => {
    return Array.from(selectedScopes).reduce((sum, scope) => sum + scopeTotals[scope].total, 0);
  }, [selectedScopes, scopeTotals]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  useEffect(() => {
    if (open) {
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
          markupPercent: "15",
        });
        setEstimateType(editEstimate.estimate_type || "driveway");
        setFormStep("calculator");
        setVisitedTabs(new Set(tabOrder));
        
        // Restore saved scope data if available
        if (editEstimate.scope_data) {
          setScopeData({ ...initialScopeData, ...editEstimate.scope_data });
        }
        if (editEstimate.selected_scopes && Array.isArray(editEstimate.selected_scopes)) {
          setSelectedScopes(new Set(editEstimate.selected_scopes as ScopeType[]));
          setVisitedScopes(new Set(editEstimate.selected_scopes as ScopeType[]));
        }
      } else {
        // Reset everything for new estimate
        setFormStep("type_selection");
        setEstimateType(null);
        setFormData(initialFormData);
        setSelectedInclusions(new Set(DEFAULT_INCLUSIONS.slice(0, 6).map(i => i.id)));
        setSelectedExclusions(new Set(DEFAULT_EXCLUSIONS.slice(0, 4).map(e => e.id)));
        setSelectedScopes(new Set());
        setScopeData(initialScopeData);
        setActiveScopeTab(null);
        setVisitedScopes(new Set());
        setVisitedTabs(new Set(["details"]));
        setActiveTab("details");
      }
    }
  }, [editEstimate, open]);

  const handleTabChange = (newTab: TabId) => {
    // Block navigation to inclusions/summary if not all scopes are visited
    if ((newTab === "inclusions" || newTab === "summary") && !allScopesVisited && selectedScopes.size > 0) {
      toast({ 
        title: "Complete all scopes first", 
        description: "Please review each scope calculator before continuing.",
        variant: "destructive" 
      });
      setActiveTab("scopes");
      return;
    }
    setActiveTab(newTab);
  };

  const goToNextTab = () => {
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex < tabOrder.length - 1) {
      const nextTab = tabOrder[currentIndex + 1];
      handleTabChange(nextTab);
    }
  };

  const getScopeLabel = (scope: ScopeType) => {
    return SCOPE_OPTIONS.find(s => s.id === scope)?.label || scope;
  };

  // Save Draft mutation - minimal validation, saves current progress
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

      // Build description from scopes (if any)
      const scopeDescriptions = Array.from(selectedScopes).map((scope) => {
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
        scope_data: scopeData as unknown as Json,
        selected_scopes: Array.from(selectedScopes) as unknown as Json,
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
          .insert([{ ...estimateData, created_by: user.id }]);
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

  const handleSaveDraft = () => {
    saveDraftMutation.mutate();
  };

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

      // Build description from scopes
      const descriptionParts = Array.from(selectedScopes).map(scope => {
        const label = getScopeLabel(scope);
        const { description } = scopeTotals[scope];
        return `${label}: ${description}`;
      });
      
      if (formData.description) {
        descriptionParts.push(formData.description);
      }

      // Build inclusions text for the quote
      const inclusionsList = DEFAULT_INCLUSIONS
        .filter(i => selectedInclusions.has(i.id))
        .map(i => i.label);
      const exclusionsList = DEFAULT_EXCLUSIONS
        .filter(e => selectedExclusions.has(e.id))
        .map(e => e.label);

      // Build full notes with inclusions/exclusions
      let fullNotes = formData.notes || "";
      if (inclusionsList.length > 0) {
        fullNotes += (fullNotes ? "\n\n" : "") + "INCLUSIONS:\n• " + inclusionsList.join("\n• ");
      }
      if (exclusionsList.length > 0) {
        fullNotes += (fullNotes ? "\n\n" : "") + "EXCLUSIONS:\n• " + exclusionsList.join("\n• ");
      }

      // Build scope breakdown for notes (this will be shown on PDF)
      let scopeBreakdown = "SCOPE BREAKDOWN:\n";
      Array.from(selectedScopes).forEach(scope => {
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
        scope_data: JSON.parse(JSON.stringify(scopeData)) as Json,
        selected_scopes: Array.from(selectedScopes) as unknown as Json,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_name || !formData.site_address) {
      toast({ title: "Please fill in client name and site address", variant: "destructive" });
      setActiveTab("details");
      return;
    }
    if (selectedScopes.size === 0) {
      toast({ title: "Please select at least one scope of work", variant: "destructive" });
      setActiveTab("details");
      return;
    }
    if (!allTabsVisited) {
      toast({ title: "Please complete all tabs before creating the estimate", variant: "destructive" });
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

  const getTabIcon = (tab: TabId) => {
    if (visitedTabs.has(tab) && tab !== activeTab) {
      return <Check className="w-4 h-4 text-green-500" />;
    }
    return null;
  };

  const getEstimateTypeLabel = (type: EstimateType) => {
    switch (type) {
      case "driveway": return "Driveway";
      case "house_slab": return "House Slab";
      case "commercial_slab": return "Commercial Slab";
      default: return "";
    }
  };

  const updateScopeData = <K extends ScopeType>(scope: K, data: ScopeCalculatorData[K]) => {
    setScopeData(prev => ({ ...prev, [scope]: data }));
  };

  const renderScopeCalculator = (scope: ScopeType) => {
    switch (scope) {
      case "piers":
        return (
          <PiersCalculator
            data={scopeData.piers}
            onChange={(data) => updateScopeData("piers", data)}
          />
        );
      case "retaining_wall_footings":
        return (
          <RetainingWallCalculator
            data={scopeData.retaining_wall_footings}
            onChange={(data) => updateScopeData("retaining_wall_footings", data)}
          />
        );
      case "strip_footings":
        return (
          <StripFootingsCalculator
            data={scopeData.strip_footings}
            onChange={(data) => updateScopeData("strip_footings", data)}
          />
        );
      case "standard_slab":
        return (
          <StandardSlabCalculator
            data={scopeData.standard_slab}
            onChange={(data) => updateScopeData("standard_slab", data)}
          />
        );
      case "raft_slab":
        return (
          <RaftSlabCalculator
            data={scopeData.raft_slab}
            onChange={(data) => updateScopeData("raft_slab", data)}
          />
        );
      case "waffle_pod":
        return (
          <WafflePodCalculator
            data={scopeData.waffle_pod}
            onChange={(data) => updateScopeData("waffle_pod", data)}
          />
        );
      case "suspended_slab":
        return (
          <SuspendedSlabCalculator
            data={scopeData.suspended_slab}
            onChange={(data) => updateScopeData("suspended_slab", data)}
          />
        );
      case "driveway":
        return (
          <StandardSlabCalculator
            data={scopeData.driveway}
            onChange={(data) => updateScopeData("driveway", data)}
          />
        );
      case "paths_surrounds":
        return (
          <PathsSurroundsCalculator
            data={scopeData.paths_surrounds}
            onChange={(data) => updateScopeData("paths_surrounds", data)}
          />
        );
      case "crossovers":
        return (
          <CrossoversCalculator
            data={scopeData.crossovers}
            onChange={(data) => updateScopeData("crossovers", data)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            {editEstimate ? "Edit Estimate" : "New Estimate"}
            {formStep === "calculator" && estimateType && (
              <Badge variant="secondary" className="ml-2">
                {getEstimateTypeLabel(estimateType)}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Type Selection */}
        {formStep === "type_selection" && (
          <div className="flex-1 overflow-y-auto py-4">
            <EstimateTypeSelector
              selectedType={estimateType}
              onSelect={setEstimateType}
              onContinue={() => setFormStep("calculator")}
            />
          </div>
        )}

        {/* Step 2: Calculator */}
        {formStep === "calculator" && (
        <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as TabId)} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details" className="gap-1">
              {getTabIcon("details")}
              <FileText className="w-4 h-4 hidden sm:inline" />
              <span className="hidden sm:inline">Details</span>
              <span className="sm:hidden">1</span>
            </TabsTrigger>
            <TabsTrigger value="scopes" className="gap-1">
              {getTabIcon("scopes")}
              <span className="hidden sm:inline">Scopes</span>
              <span className="sm:hidden">2</span>
            </TabsTrigger>
            <TabsTrigger value="inclusions" className="gap-1">
              {getTabIcon("inclusions")}
              <ListChecks className="w-4 h-4 hidden sm:inline" />
              <span className="hidden sm:inline">Inclusions</span>
              <span className="sm:hidden">3</span>
            </TabsTrigger>
            <TabsTrigger value="review" className="gap-1">
              {getTabIcon("review")}
              <ClipboardCheck className="w-4 h-4 hidden sm:inline" />
              <span className="hidden sm:inline">Review</span>
              <span className="sm:hidden">4</span>
            </TabsTrigger>
            <TabsTrigger value="summary" className="gap-1">
              {getTabIcon("summary")}
              <span className="hidden sm:inline">Summary</span>
              <span className="sm:hidden">5</span>
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto mt-4">
            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4 m-0">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name">Client Name *</Label>
                  <Input
                    id="client_name"
                    name="client_name"
                    value={formData.client_name}
                    onChange={handleChange}
                    placeholder="e.g., John Smith"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    placeholder="e.g., Smith Builders (leave blank for private jobs)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="site_address">Site Address *</Label>
                  <Input
                    id="site_address"
                    name="site_address"
                    value={formData.site_address}
                    onChange={handleChange}
                    placeholder="123 Main Street, Sydney NSW"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Additional Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="e.g., Any additional notes about the project"
                    rows={2}
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

              {/* Scope Selection */}
              <div className="pt-4 border-t">
                <ScopeSelector
                  selectedScopes={selectedScopes}
                  onScopesChange={setSelectedScopes}
                  estimateType={estimateType}
                />
              </div>

              <div className="flex justify-between pt-4">
                <div className="flex gap-2">
                  {!editEstimate && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => setFormStep("type_selection")}
                      className="gap-2"
                    >
                      ← Change Type
                    </Button>
                  )}
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleSaveDraft}
                    disabled={saveDraftMutation.isPending}
                  >
                    {saveDraftMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Draft
                  </Button>
                </div>
                <Button 
                  type="button" 
                  onClick={goToNextTab} 
                  className="gap-2"
                  disabled={selectedScopes.size === 0}
                >
                  Next: Configure Scopes <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>

            {/* Scopes Tab - Dynamic calculators */}
            <TabsContent value="scopes" className="space-y-4 m-0">
              {selectedScopes.size === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No scopes selected. Go back to Details to select scope of works.</p>
                </Card>
              ) : (
                <>
                  {/* Progress bar and scope navigation */}
                  <div className="bg-muted/30 rounded-lg p-3 space-y-3">
                    {/* Progress indicator */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        Scope {Array.from(selectedScopes).indexOf(activeScopeTab!) + 1} of {selectedScopes.size}
                      </span>
                      <span className="text-muted-foreground">
                        {visitedScopes.size}/{selectedScopes.size} completed
                      </span>
                    </div>
                    
                    {/* Scope pills */}
                    <div className="flex flex-wrap gap-2">
                      {Array.from(selectedScopes).map((scope, index) => {
                        const isActive = activeScopeTab === scope;
                        const isVisited = visitedScopes.has(scope);
                        return (
                          <Button
                            key={scope}
                            type="button"
                            variant={isActive ? "default" : isVisited ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => setActiveScopeTab(scope)}
                            className="gap-1.5 text-xs"
                          >
                            <span className="w-5 h-5 rounded-full bg-background/20 flex items-center justify-center text-[10px] font-bold">
                              {isVisited && !isActive ? <Check className="w-3 h-3" /> : index + 1}
                            </span>
                            {getScopeLabel(scope)}
                            {scopeTotals[scope].total > 0 && (
                              <Badge variant={isActive ? "outline" : "secondary"} className="ml-1 text-[10px]">
                                {formatCurrency(scopeTotals[scope].total)}
                              </Badge>
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active scope calculator */}
                  <div className="min-h-[400px]">
                    {activeScopeTab && renderScopeCalculator(activeScopeTab)}
                  </div>

                  {/* Navigation within scopes */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleSaveDraft}
                      disabled={saveDraftMutation.isPending}
                    >
                      {saveDraftMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Save Draft
                    </Button>
                    
                    <div className="flex gap-2">
                      {/* Previous scope button */}
                      {activeScopeTab && Array.from(selectedScopes).indexOf(activeScopeTab) > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const scopesArr = Array.from(selectedScopes);
                            const currentIdx = scopesArr.indexOf(activeScopeTab);
                            setActiveScopeTab(scopesArr[currentIdx - 1]);
                          }}
                        >
                          ← Previous Scope
                        </Button>
                      )}
                      
                      {/* Next scope or continue button */}
                      {activeScopeTab && Array.from(selectedScopes).indexOf(activeScopeTab) < selectedScopes.size - 1 ? (
                        <Button
                          type="button"
                          onClick={() => {
                            const scopesArr = Array.from(selectedScopes);
                            const currentIdx = scopesArr.indexOf(activeScopeTab);
                            setActiveScopeTab(scopesArr[currentIdx + 1]);
                          }}
                          className="gap-2"
                        >
                          Next Scope <ChevronRight className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button 
                          type="button" 
                          onClick={goToNextTab} 
                          className="gap-2"
                          disabled={!allScopesVisited}
                        >
                          {allScopesVisited ? (
                            <>Continue to Inclusions <ChevronRight className="w-4 h-4" /></>
                          ) : (
                            <>Review Remaining Scopes ({visitedScopes.size}/{selectedScopes.size})</>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Inclusions Tab */}
            <TabsContent value="inclusions" className="space-y-6 m-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Inclusions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {DEFAULT_INCLUSIONS.map((item) => (
                      <label key={item.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-muted/50">
                        <input
                          type="checkbox"
                          checked={selectedInclusions.has(item.id)}
                          onChange={(e) => {
                            const newSet = new Set(selectedInclusions);
                            if (e.target.checked) {
                              newSet.add(item.id);
                            } else {
                              newSet.delete(item.id);
                            }
                            setSelectedInclusions(newSet);
                          }}
                          className="h-4 w-4 rounded border-border"
                        />
                        <span className="text-sm">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-orange-500" />
                    Exclusions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {DEFAULT_EXCLUSIONS.map((item) => (
                      <label key={item.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-muted/50">
                        <input
                          type="checkbox"
                          checked={selectedExclusions.has(item.id)}
                          onChange={(e) => {
                            const newSet = new Set(selectedExclusions);
                            if (e.target.checked) {
                              newSet.add(item.id);
                            } else {
                              newSet.delete(item.id);
                            }
                            setSelectedExclusions(newSet);
                          }}
                          className="h-4 w-4 rounded border-border"
                        />
                        <span className="text-sm">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleSaveDraft}
                  disabled={saveDraftMutation.isPending}
                >
                  {saveDraftMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Draft
                </Button>
                <Button type="button" onClick={goToNextTab} className="gap-2">
                  Next: Review <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>

            {/* Review Tab */}
            <TabsContent value="review" className="space-y-4 m-0">
              <EstimateReviewTab
                selectedScopes={selectedScopes}
                scopeData={scopeData}
                onScopeDataChange={updateScopeData}
                scopeTotals={scopeTotals}
                formatCurrency={formatCurrency}
              />

              <div className="flex justify-between pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleSaveDraft}
                  disabled={saveDraftMutation.isPending}
                >
                  {saveDraftMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Draft
                </Button>
                <Button type="button" onClick={goToNextTab} className="gap-2">
                  Next: Summary <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>

            {/* Summary Tab */}
            <TabsContent value="summary" className="space-y-4 m-0">
              {/* Internal costs notice */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-start gap-2">
                <Eye className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  <strong>Your cost breakdown (internal)</strong> — The client will see the scope breakdown and total amount.
                </p>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Scope Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Scope breakdown */}
                  <div className="space-y-2">
                    {Array.from(selectedScopes).map((scope) => (
                      <div key={scope} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {getScopeLabel(scope)} ({scopeTotals[scope].description})
                        </span>
                        <span className="font-medium">{formatCurrency(scopeTotals[scope].total)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total (ex GST)</span>
                      <span className="text-primary">{formatCurrency(combinedTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>GST (10%)</span>
                      <span>{formatCurrency(combinedTotal * 0.1)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t">
                      <span>Total (inc GST)</span>
                      <span className="text-primary">{formatCurrency(combinedTotal * 1.1)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes / Terms (shown on quote)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Payment terms, conditions..."
                  rows={2}
                />
              </div>

              {/* Inclusions/Exclusions Preview */}
              {(selectedInclusions.size > 0 || selectedExclusions.size > 0) && (
                <Card className="bg-muted/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Shown on Quote</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {selectedInclusions.size > 0 && (
                      <div>
                        <p className="font-medium text-green-600 dark:text-green-400 mb-1">Inclusions ({selectedInclusions.size})</p>
                        <ul className="text-muted-foreground space-y-0.5">
                          {DEFAULT_INCLUSIONS.filter(i => selectedInclusions.has(i.id)).map(i => (
                            <li key={i.id}>• {i.label}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selectedExclusions.size > 0 && (
                      <div>
                        <p className="font-medium text-orange-600 dark:text-orange-400 mb-1">Exclusions ({selectedExclusions.size})</p>
                        <ul className="text-muted-foreground space-y-0.5">
                          {DEFAULT_EXCLUSIONS.filter(e => selectedExclusions.has(e.id)).map(e => (
                            <li key={e.id}>• {e.label}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Footer */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleSaveDraft}
                  disabled={saveDraftMutation.isPending}
                >
                  {saveDraftMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Draft
                </Button>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={mutation.isPending || !allTabsVisited || selectedScopes.size === 0}
                >
                  {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editEstimate ? "Update" : "Create"} Estimate
                  {combinedTotal > 0 && ` (${formatCurrency(combinedTotal * 1.1)})`}
                </Button>
              </div>

              {!allTabsVisited && (
                <p className="text-xs text-muted-foreground text-center">
                  Complete all tabs to enable estimate creation
                </p>
              )}
            </TabsContent>
          </form>
        </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
