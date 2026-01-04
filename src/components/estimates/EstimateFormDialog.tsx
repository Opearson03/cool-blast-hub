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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Calculator, FileText, Check, ChevronRight, Eye, EyeOff, ListChecks } from "lucide-react";

import { EstimateTypeSelector, EstimateType } from "./EstimateTypeSelector";
import { HouseSlabCalculator, HouseSlabData, initialHouseSlabData, calculateHouseSlabTotals } from "./calculators/HouseSlabCalculator";
import { CommercialSlabCalculator, CommercialSlabData, initialCommercialSlabData, calculateCommercialSlabTotals } from "./calculators/CommercialSlabCalculator";

interface Estimate {
  id: string;
  estimate_number: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  site_address: string;
  description: string | null;
  total_amount: number;
  status: string;
  valid_until: string | null;
  notes: string | null;
  estimate_type?: EstimateType;
}

interface EstimateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editEstimate?: Estimate | null;
}

interface SlabDimensions {
  shape: "rectangular" | "circular";
  length: string;
  width: string;
  diameter: string;
  thickness: string;
}

interface ConcreteDetails {
  pricePerM3: string;
  supplier: string;
  mpaStrength: string;
  slump: string;
  wastagePercent: string;
}

// Australian standard reo mesh sizes (all 6m x 2.4m = 14.4m² coverage)
const REO_MESH_TYPES = [
  { id: "SL62", label: "SL62 (6.0mm wire)", size: "6m x 2.4m", area: 14.4, defaultPrice: 45 },
  { id: "SL72", label: "SL72 (7.0mm wire)", size: "6m x 2.4m", area: 14.4, defaultPrice: 55 },
  { id: "SL82", label: "SL82 (8.0mm wire)", size: "6m x 2.4m", area: 14.4, defaultPrice: 70 },
  { id: "SL92", label: "SL92 (9.0mm wire)", size: "6m x 2.4m", area: 14.4, defaultPrice: 90 },
  { id: "SL102", label: "SL102 (10.0mm wire)", size: "6m x 2.4m", area: 14.4, defaultPrice: 110 },
  { id: "RL718", label: "RL718 (7mm x 200)", size: "6m x 2.4m", area: 14.4, defaultPrice: 48 },
  { id: "RL818", label: "RL818 (8mm x 200)", size: "6m x 2.4m", area: 14.4, defaultPrice: 62 },
  { id: "RL918", label: "RL918 (9mm x 200)", size: "6m x 2.4m", area: 14.4, defaultPrice: 78 },
  { id: "RL1018", label: "RL1018 (10mm x 200)", size: "6m x 2.4m", area: 14.4, defaultPrice: 95 },
  { id: "F62", label: "F62 Trench Mesh", size: "6m x 0.2m", area: 1.2, defaultPrice: 12 },
  { id: "F72", label: "F72 Trench Mesh", size: "6m x 0.3m", area: 1.8, defaultPrice: 18 },
  { id: "F82", label: "F82 Trench Mesh", size: "6m x 0.4m", area: 2.4, defaultPrice: 24 },
];

interface ReoDetails {
  meshType: string;
  pricePerSheet: string;
  overlapPercent: string;
  includeBarChairs: boolean;
  barChairsPerM2: string;
  barChairPrice: string;
}

interface FinishingDetails {
  perimeter: string;
  // Area-based items ($ per m²)
  includeCuring: boolean;
  curingPricePerM2: string;
  includeSealing: boolean;
  sealingPricePerM2: string;
  includeRetarder: boolean;
  retarderPricePerM2: string;
  // Linear items ($ per m)
  includeStickyBack: boolean;
  stickyBackPricePerM: string;
  includeSawCuts: boolean;
  sawCutMeters: string;
  sawCutPricePerM: string;
  includeJointSealer: boolean;
  jointSealerMeters: string;
  jointSealerPricePerM: string;
}

interface LabourItem {
  id: string;
  description: string;
  hours: string;
  hourlyRate: string;
}

interface MaterialItem {
  id: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
}

interface FormData {
  client_name: string;
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
  client_email: "",
  client_phone: "",
  site_address: "",
  description: "",
  valid_until: "",
  notes: "",
  markupPercent: "15",
};

const initialSlabDimensions: SlabDimensions = {
  shape: "rectangular",
  length: "",
  width: "",
  diameter: "",
  thickness: "100",
};

const initialConcreteDetails: ConcreteDetails = {
  pricePerM3: "280",
  supplier: "",
  mpaStrength: "32",
  slump: "100",
  wastagePercent: "5",
};

const initialReoDetails: ReoDetails = {
  meshType: "SL82",
  pricePerSheet: "70",
  overlapPercent: "10",
  includeBarChairs: true,
  barChairsPerM2: "4",
  barChairPrice: "0.50",
};

const initialFinishingDetails: FinishingDetails = {
  perimeter: "",
  includeCuring: false,
  curingPricePerM2: "3.50",
  includeSealing: false,
  sealingPricePerM2: "8.00",
  includeRetarder: false,
  retarderPricePerM2: "12.00",
  includeStickyBack: false,
  stickyBackPricePerM: "2.50",
  includeSawCuts: false,
  sawCutMeters: "",
  sawCutPricePerM: "4.00",
  includeJointSealer: false,
  jointSealerMeters: "",
  jointSealerPricePerM: "6.00",
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

type TabId = "details" | "slab" | "labour" | "inclusions" | "summary";
type FormStep = "type_selection" | "calculator";

export function EstimateFormDialog({ open, onOpenChange, editEstimate }: EstimateFormDialogProps) {
  const [formStep, setFormStep] = useState<FormStep>("type_selection");
  const [estimateType, setEstimateType] = useState<EstimateType | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [slab, setSlab] = useState<SlabDimensions>(initialSlabDimensions);
  const [concrete, setConcrete] = useState<ConcreteDetails>(initialConcreteDetails);
  const [reo, setReo] = useState<ReoDetails>(initialReoDetails);
  const [finishing, setFinishing] = useState<FinishingDetails>(initialFinishingDetails);
  const [labourItems, setLabourItems] = useState<LabourItem[]>([
    { id: "1", description: "Concreting labour", hours: "", hourlyRate: "85" },
  ]);
  const [materialItems, setMaterialItems] = useState<MaterialItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("details");
  const [visitedTabs, setVisitedTabs] = useState<Set<TabId>>(new Set(["details"]));
  const [selectedInclusions, setSelectedInclusions] = useState<Set<string>>(new Set(DEFAULT_INCLUSIONS.slice(0, 6).map(i => i.id)));
  const [selectedExclusions, setSelectedExclusions] = useState<Set<string>>(new Set(DEFAULT_EXCLUSIONS.slice(0, 4).map(e => e.id)));
  const [houseSlabData, setHouseSlabData] = useState<HouseSlabData>(initialHouseSlabData);
  const [commercialSlabData, setCommercialSlabData] = useState<CommercialSlabData>(initialCommercialSlabData);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const tabOrder: TabId[] = ["details", "slab", "labour", "inclusions", "summary"];

  // Track visited tabs
  useEffect(() => {
    setVisitedTabs(prev => new Set([...prev, activeTab]));
  }, [activeTab]);

  // Check if all tabs have been visited
  const allTabsVisited = useMemo(() => {
    return tabOrder.every(tab => visitedTabs.has(tab));
  }, [visitedTabs]);

  // Get selected mesh type details
  const selectedMesh = useMemo(() => {
    return REO_MESH_TYPES.find(m => m.id === reo.meshType) || REO_MESH_TYPES[2];
  }, [reo.meshType]);

  // Calculate slab area in m²
  const slabArea = useMemo(() => {
    if (slab.shape === "rectangular") {
      const length = parseFloat(slab.length) || 0;
      const width = parseFloat(slab.width) || 0;
      return length * width;
    } else {
      const diameter = parseFloat(slab.diameter) || 0;
      const radius = diameter / 2;
      return Math.PI * radius * radius;
    }
  }, [slab]);

  // Calculate volume in m³
  const concreteVolume = useMemo(() => {
    const thicknessM = (parseFloat(slab.thickness) || 0) / 1000; // mm to m
    return slabArea * thicknessM;
  }, [slabArea, slab.thickness]);

  // Volume with wastage
  const volumeWithWastage = useMemo(() => {
    const wastage = (parseFloat(concrete.wastagePercent) || 0) / 100;
    return concreteVolume * (1 + wastage);
  }, [concreteVolume, concrete.wastagePercent]);

  // Concrete cost
  const concreteCost = useMemo(() => {
    const pricePerM3 = parseFloat(concrete.pricePerM3) || 0;
    return volumeWithWastage * pricePerM3;
  }, [volumeWithWastage, concrete.pricePerM3]);

  // Reo calculations
  const reoCalculations = useMemo(() => {
    if (slabArea <= 0) return { sheets: 0, cost: 0, barChairs: 0, barChairCost: 0 };
    
    const overlapFactor = 1 + (parseFloat(reo.overlapPercent) || 0) / 100;
    const areaWithOverlap = slabArea * overlapFactor;
    const sheetsNeeded = Math.ceil(areaWithOverlap / selectedMesh.area);
    const pricePerSheet = parseFloat(reo.pricePerSheet) || 0;
    const reoCost = sheetsNeeded * pricePerSheet;
    
    // Bar chairs
    const barChairsPerM2 = parseFloat(reo.barChairsPerM2) || 0;
    const barChairPrice = parseFloat(reo.barChairPrice) || 0;
    const totalBarChairs = reo.includeBarChairs ? Math.ceil(slabArea * barChairsPerM2) : 0;
    const barChairCost = totalBarChairs * barChairPrice;
    
    return { 
      sheets: sheetsNeeded, 
      cost: reoCost, 
      barChairs: totalBarChairs,
      barChairCost 
    };
  }, [slabArea, reo, selectedMesh]);

  // Total reo cost
  const totalReoCost = useMemo(() => {
    return reoCalculations.cost + reoCalculations.barChairCost;
  }, [reoCalculations]);

  // Finishing calculations
  const finishingCalculations = useMemo(() => {
    const perimeter = parseFloat(finishing.perimeter) || 0;
    
    // Area-based costs
    const curingCost = finishing.includeCuring 
      ? slabArea * (parseFloat(finishing.curingPricePerM2) || 0) 
      : 0;
    const sealingCost = finishing.includeSealing 
      ? slabArea * (parseFloat(finishing.sealingPricePerM2) || 0) 
      : 0;
    const retarderCost = finishing.includeRetarder 
      ? slabArea * (parseFloat(finishing.retarderPricePerM2) || 0) 
      : 0;
    
    // Linear costs
    const stickyBackCost = finishing.includeStickyBack 
      ? perimeter * (parseFloat(finishing.stickyBackPricePerM) || 0) 
      : 0;
    const sawCutMeters = parseFloat(finishing.sawCutMeters) || 0;
    const sawCutCost = finishing.includeSawCuts 
      ? sawCutMeters * (parseFloat(finishing.sawCutPricePerM) || 0) 
      : 0;
    const jointSealerMeters = parseFloat(finishing.jointSealerMeters) || 0;
    const jointSealerCost = finishing.includeJointSealer 
      ? jointSealerMeters * (parseFloat(finishing.jointSealerPricePerM) || 0) 
      : 0;
    
    const total = curingCost + sealingCost + retarderCost + stickyBackCost + sawCutCost + jointSealerCost;
    
    return {
      curingCost,
      sealingCost,
      retarderCost,
      stickyBackCost,
      sawCutMeters,
      sawCutCost,
      jointSealerMeters,
      jointSealerCost,
      total,
    };
  }, [slabArea, finishing]);

  // Labour cost
  const labourCost = useMemo(() => {
    return labourItems.reduce((total, item) => {
      const hours = parseFloat(item.hours) || 0;
      const rate = parseFloat(item.hourlyRate) || 0;
      return total + (hours * rate);
    }, 0);
  }, [labourItems]);

  // Materials cost
  const materialsCost = useMemo(() => {
    return materialItems.reduce((total, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      return total + (qty * price);
    }, 0);
  }, [materialItems]);

  // Subtotal (includes finishing costs)
  const subtotal = useMemo(() => {
    return concreteCost + totalReoCost + finishingCalculations.total + labourCost + materialsCost;
  }, [concreteCost, totalReoCost, finishingCalculations.total, labourCost, materialsCost]);

  // House slab calculations
  const houseSlabCalcs = useMemo(() => {
    if (estimateType !== "house_slab") return null;
    return calculateHouseSlabTotals(houseSlabData);
  }, [estimateType, houseSlabData]);

  // Commercial slab calculations
  const commercialSlabCalcs = useMemo(() => {
    if (estimateType !== "commercial_slab") return null;
    return calculateCommercialSlabTotals(commercialSlabData);
  }, [estimateType, commercialSlabData]);

  // Combined subtotal based on estimate type
  const combinedSubtotal = useMemo(() => {
    if (estimateType === "house_slab" && houseSlabCalcs) {
      return houseSlabCalcs.subtotal + labourCost + materialsCost + finishingCalculations.total;
    }
    if (estimateType === "commercial_slab" && commercialSlabCalcs) {
      return commercialSlabCalcs.subtotal + labourCost + materialsCost + finishingCalculations.total;
    }
    return subtotal;
  }, [estimateType, houseSlabCalcs, commercialSlabCalcs, subtotal, labourCost, materialsCost, finishingCalculations.total]);

  // Markup amount
  const markupAmount = useMemo(() => {
    const markupPercent = parseFloat(formData.markupPercent) || 0;
    return combinedSubtotal * (markupPercent / 100);
  }, [combinedSubtotal, formData.markupPercent]);

  // Total
  const totalAmount = useMemo(() => {
    return combinedSubtotal + markupAmount;
  }, [combinedSubtotal, markupAmount]);

  useEffect(() => {
    if (open) {
      if (editEstimate) {
        setFormData({
          client_name: editEstimate.client_name,
          client_email: editEstimate.client_email || "",
          client_phone: editEstimate.client_phone || "",
          site_address: editEstimate.site_address,
          description: editEstimate.description || "",
          valid_until: editEstimate.valid_until || "",
          notes: editEstimate.notes || "",
          markupPercent: "15",
        });
        // For edit mode, skip type selection and allow immediate creation
        setEstimateType(editEstimate.estimate_type || "driveway");
        setFormStep("calculator");
        setVisitedTabs(new Set(tabOrder));
      } else {
        // Reset everything for new estimate
        setFormStep("type_selection");
        setEstimateType(null);
        setFormData(initialFormData);
        setSlab(initialSlabDimensions);
        setConcrete(initialConcreteDetails);
        setReo(initialReoDetails);
        setFinishing(initialFinishingDetails);
        setLabourItems([{ id: "1", description: "Concreting labour", hours: "", hourlyRate: "85" }]);
        setMaterialItems([]);
        setSelectedInclusions(new Set(DEFAULT_INCLUSIONS.slice(0, 6).map(i => i.id)));
        setSelectedExclusions(new Set(DEFAULT_EXCLUSIONS.slice(0, 4).map(e => e.id)));
        setHouseSlabData(initialHouseSlabData);
        setCommercialSlabData(initialCommercialSlabData);
        setVisitedTabs(new Set(["details"]));
        setActiveTab("details");
      }
    }
  }, [editEstimate, open]);

  // Update reo price when mesh type changes
  useEffect(() => {
    const mesh = REO_MESH_TYPES.find(m => m.id === reo.meshType);
    if (mesh) {
      setReo(prev => ({ ...prev, pricePerSheet: mesh.defaultPrice.toString() }));
    }
  }, [reo.meshType]);

  const goToNextTab = () => {
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex < tabOrder.length - 1) {
      setActiveTab(tabOrder[currentIndex + 1]);
    }
  };

  const addLabourItem = () => {
    setLabourItems([...labourItems, { 
      id: Date.now().toString(), 
      description: "", 
      hours: "", 
      hourlyRate: "85" 
    }]);
  };

  const removeLabourItem = (id: string) => {
    setLabourItems(labourItems.filter(item => item.id !== id));
  };

  const updateLabourItem = (id: string, field: keyof LabourItem, value: string) => {
    setLabourItems(labourItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const addMaterialItem = () => {
    setMaterialItems([...materialItems, { 
      id: Date.now().toString(), 
      description: "", 
      quantity: "1", 
      unit: "ea",
      unitPrice: "" 
    }]);
  };

  const removeMaterialItem = (id: string) => {
    setMaterialItems(materialItems.filter(item => item.id !== id));
  };

  const updateMaterialItem = (id: string, field: keyof MaterialItem, value: string) => {
    setMaterialItems(materialItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 2,
    }).format(amount);
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

      // Build description from calculator (shown on quote)
      const descriptionParts = [];
      
      if (estimateType === "house_slab" && houseSlabCalcs) {
        // House slab description
        descriptionParts.push(`House Slab: ${houseSlabCalcs.totalSlabArea.toFixed(1)}m²`);
        descriptionParts.push(`Concrete: ${houseSlabCalcs.volumeWithWastage.toFixed(2)}m³ @ ${houseSlabCalcs.mpaStrength}MPa`);
        if (houseSlabCalcs.reoSheets > 0) {
          descriptionParts.push(`Reo: ${houseSlabCalcs.reoSheets} sheets ${houseSlabCalcs.meshType}`);
        }
        if (houseSlabData.vapourBarrier.include) {
          descriptionParts.push("Vapour barrier included");
        }
        if (houseSlabData.pump.include) {
          descriptionParts.push("Concrete pump included");
        }
      } else if (estimateType === "commercial_slab" && commercialSlabCalcs) {
        // Commercial slab description
        descriptionParts.push(`Commercial Slab: ${commercialSlabCalcs.totalSlabArea.toFixed(1)}m²`);
        descriptionParts.push(`Concrete: ${commercialSlabCalcs.volumeWithWastage.toFixed(2)}m³ @ ${commercialSlabCalcs.mpaStrength}MPa`);
        if (commercialSlabCalcs.hasFootings) {
          descriptionParts.push("Strip footings included");
        }
        if (commercialSlabCalcs.hasPiers) {
          descriptionParts.push("Pier holes included");
        }
        if (commercialSlabCalcs.hasBeams) {
          descriptionParts.push("Ground beams included");
        }
        if (commercialSlabCalcs.totalRebarCost > 0) {
          descriptionParts.push("Detailed rebar schedule");
        }
      } else {
        // Driveway description (original logic)
        if (slabArea > 0) {
          descriptionParts.push(`Slab: ${slabArea.toFixed(1)}m² x ${slab.thickness}mm`);
        }
        if (volumeWithWastage > 0) {
          descriptionParts.push(`Concrete: ${volumeWithWastage.toFixed(2)}m³ @ ${concrete.mpaStrength}MPa`);
        }
        if (reoCalculations.sheets > 0) {
          descriptionParts.push(`Reo: ${reoCalculations.sheets} sheets ${selectedMesh.id}`);
        }
      }
      
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

      // Build full notes with inclusions/exclusions (shown on quote)
      let fullNotes = formData.notes || "";
      if (inclusionsList.length > 0) {
        fullNotes += (fullNotes ? "\n\n" : "") + "INCLUSIONS:\n• " + inclusionsList.join("\n• ");
      }
      if (exclusionsList.length > 0) {
        fullNotes += (fullNotes ? "\n\n" : "") + "EXCLUSIONS:\n• " + exclusionsList.join("\n• ");
      }

      const estimateData = {
        business_id: profile.business_id,
        client_name: formData.client_name,
        client_email: formData.client_email || null,
        client_phone: formData.client_phone || null,
        site_address: formData.site_address,
        description: descriptionParts.join(" | ") || null,
        total_amount: totalAmount, // Only total amount shown to client - no cost breakdown
        valid_until: formData.valid_until || null,
        notes: fullNotes || null, // Includes terms + inclusions/exclusions
        created_by: user.id,
        estimate_type: estimateType || "driveway",
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
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details" className="gap-1">
              {getTabIcon("details")}
              <FileText className="w-4 h-4 hidden sm:inline" />
              <span className="hidden sm:inline">Details</span>
              <span className="sm:hidden">1</span>
            </TabsTrigger>
            <TabsTrigger value="slab" className="gap-1">
              {getTabIcon("slab")}
              <span className="hidden sm:inline">Slab & Reo</span>
              <span className="sm:hidden">2</span>
            </TabsTrigger>
            <TabsTrigger value="labour" className="gap-1">
              {getTabIcon("labour")}
              <span className="hidden sm:inline">Labour</span>
              <span className="sm:hidden">3</span>
            </TabsTrigger>
            <TabsTrigger value="inclusions" className="gap-1">
              {getTabIcon("inclusions")}
              <ListChecks className="w-4 h-4 hidden sm:inline" />
              <span className="hidden sm:inline">Inclusions</span>
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
                    placeholder="e.g., Smith Builders"
                    required
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
                  <Label htmlFor="description">Job Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="e.g., Residential driveway pour"
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

              <div className="flex justify-between pt-4">
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
                {editEstimate && <div />}
                <Button type="button" onClick={goToNextTab} className="gap-2">
                  Next: Slab & Reo <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>

            {/* Slab & Concrete Tab */}
            <TabsContent value="slab" className="space-y-6 m-0">
              {/* House Slab Calculator */}
              {estimateType === "house_slab" ? (
                <>
                  <HouseSlabCalculator data={houseSlabData} onChange={setHouseSlabData} />
                  <div className="flex justify-end pt-4">
                    <Button type="button" onClick={goToNextTab} className="gap-2">
                      Next: Labour <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              ) : estimateType === "commercial_slab" ? (
                <>
                  <CommercialSlabCalculator data={commercialSlabData} onChange={setCommercialSlabData} />
                  <div className="flex justify-end pt-4">
                    <Button type="button" onClick={goToNextTab} className="gap-2">
                      Next: Labour <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              ) : (
              <>
              {/* Internal cost notice */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
                <EyeOff className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  <strong>Internal costs only</strong> — These prices are for your calculation. The client will only see the final quoted amount.
                </p>
              </div>

              {/* Slab Dimensions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Slab Dimensions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Slab Shape</Label>
                    <Select
                      value={slab.shape}
                      onValueChange={(value: "rectangular" | "circular") => 
                        setSlab(prev => ({ ...prev, shape: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rectangular">Rectangular</SelectItem>
                        <SelectItem value="circular">Circular</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {slab.shape === "rectangular" ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Length (m)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={slab.length}
                          onChange={(e) => setSlab(prev => ({ ...prev, length: e.target.value }))}
                          placeholder="e.g., 10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Width (m)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={slab.width}
                          onChange={(e) => setSlab(prev => ({ ...prev, width: e.target.value }))}
                          placeholder="e.g., 5"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Diameter (m)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={slab.diameter}
                        onChange={(e) => setSlab(prev => ({ ...prev, diameter: e.target.value }))}
                        placeholder="e.g., 3"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Thickness (mm)</Label>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      value={slab.thickness}
                      onChange={(e) => setSlab(prev => ({ ...prev, thickness: e.target.value }))}
                      placeholder="e.g., 100"
                    />
                  </div>

                  {slabArea > 0 && (
                    <div className="flex gap-4 pt-2 text-sm">
                      <Badge variant="secondary">Area: {slabArea.toFixed(2)} m²</Badge>
                      <Badge variant="secondary">Volume: {concreteVolume.toFixed(2)} m³</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Concrete Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Concrete</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>MPa Strength</Label>
                      <Select
                        value={concrete.mpaStrength}
                        onValueChange={(value) => setConcrete(prev => ({ ...prev, mpaStrength: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="20">N20</SelectItem>
                          <SelectItem value="25">N25</SelectItem>
                          <SelectItem value="32">N32</SelectItem>
                          <SelectItem value="40">N40</SelectItem>
                          <SelectItem value="50">N50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Slump (mm)</Label>
                      <Select
                        value={concrete.slump}
                        onValueChange={(value) => setConcrete(prev => ({ ...prev, slump: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="80">80mm</SelectItem>
                          <SelectItem value="100">100mm</SelectItem>
                          <SelectItem value="120">120mm</SelectItem>
                          <SelectItem value="140">140mm</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price per m³ ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={concrete.pricePerM3}
                        onChange={(e) => setConcrete(prev => ({ ...prev, pricePerM3: e.target.value }))}
                        placeholder="e.g., 280"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Wastage (%)</Label>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        max="50"
                        value={concrete.wastagePercent}
                        onChange={(e) => setConcrete(prev => ({ ...prev, wastagePercent: e.target.value }))}
                        placeholder="e.g., 5"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Supplier</Label>
                    <Input
                      value={concrete.supplier}
                      onChange={(e) => setConcrete(prev => ({ ...prev, supplier: e.target.value }))}
                      placeholder="e.g., Boral, Hanson"
                    />
                  </div>

                  {volumeWithWastage > 0 && (
                    <div className="flex gap-4 pt-2 text-sm">
                      <Badge variant="secondary">With wastage: {volumeWithWastage.toFixed(2)} m³</Badge>
                      <Badge variant="default">Cost: {formatCurrency(concreteCost)}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Reo Calculator */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Reinforcement (Reo)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Mesh Type</Label>
                      <Select
                        value={reo.meshType}
                        onValueChange={(value) => setReo(prev => ({ ...prev, meshType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {REO_MESH_TYPES.map(mesh => (
                            <SelectItem key={mesh.id} value={mesh.id}>
                              {mesh.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Sheet size: {selectedMesh.size} ({selectedMesh.area}m² coverage)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Price per Sheet ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={reo.pricePerSheet}
                        onChange={(e) => setReo(prev => ({ ...prev, pricePerSheet: e.target.value }))}
                        placeholder="e.g., 70"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Overlap Allowance (%)</Label>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      max="30"
                      value={reo.overlapPercent}
                      onChange={(e) => setReo(prev => ({ ...prev, overlapPercent: e.target.value }))}
                      placeholder="e.g., 10"
                    />
                    <p className="text-xs text-muted-foreground">
                      Accounts for overlaps between sheets (typically 10-15%)
                    </p>
                  </div>

                  <div className="border-t border-border pt-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="includeBarChairs"
                        checked={reo.includeBarChairs}
                        onChange={(e) => setReo(prev => ({ ...prev, includeBarChairs: e.target.checked }))}
                        className="h-4 w-4 rounded border-border"
                      />
                      <Label htmlFor="includeBarChairs" className="cursor-pointer">Include bar chairs</Label>
                    </div>

                    {reo.includeBarChairs && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Chairs per m²</Label>
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            value={reo.barChairsPerM2}
                            onChange={(e) => setReo(prev => ({ ...prev, barChairsPerM2: e.target.value }))}
                            placeholder="e.g., 4"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Price each ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={reo.barChairPrice}
                            onChange={(e) => setReo(prev => ({ ...prev, barChairPrice: e.target.value }))}
                            placeholder="e.g., 0.50"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {slabArea > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 text-sm">
                      <Badge variant="secondary">{reoCalculations.sheets} sheets needed</Badge>
                      <Badge variant="secondary">Reo: {formatCurrency(reoCalculations.cost)}</Badge>
                      {reo.includeBarChairs && reoCalculations.barChairs > 0 && (
                        <Badge variant="secondary">{reoCalculations.barChairs} chairs: {formatCurrency(reoCalculations.barChairCost)}</Badge>
                      )}
                      <Badge variant="default">Total: {formatCurrency(totalReoCost)}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Finishing & Treatments */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Finishing & Treatments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Perimeter for linear calculations */}
                  <div className="space-y-2">
                    <Label>Slab Perimeter (m) — for edge treatments</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={finishing.perimeter}
                      onChange={(e) => setFinishing(prev => ({ ...prev, perimeter: e.target.value }))}
                      placeholder={slab.shape === "rectangular" && slab.length && slab.width 
                        ? `Approx: ${((parseFloat(slab.length) || 0) * 2 + (parseFloat(slab.width) || 0) * 2).toFixed(1)}m`
                        : "e.g., 24"}
                    />
                    {slab.shape === "rectangular" && slab.length && slab.width && (
                      <p className="text-xs text-muted-foreground">
                        Calculated perimeter: {((parseFloat(slab.length) || 0) * 2 + (parseFloat(slab.width) || 0) * 2).toFixed(1)}m
                      </p>
                    )}
                  </div>

                  <div className="border-t border-border pt-4 space-y-4">
                    <p className="text-sm font-medium text-muted-foreground">Area-based treatments ($ per m²)</p>
                    
                    {/* Curing */}
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        id="includeCuring"
                        checked={finishing.includeCuring}
                        onChange={(e) => setFinishing(prev => ({ ...prev, includeCuring: e.target.checked }))}
                        className="h-4 w-4 rounded border-border"
                      />
                      <Label htmlFor="includeCuring" className="cursor-pointer flex-1">Curing compound</Label>
                      <div className="w-24">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={finishing.curingPricePerM2}
                          onChange={(e) => setFinishing(prev => ({ ...prev, curingPricePerM2: e.target.value }))}
                          placeholder="$/m²"
                          disabled={!finishing.includeCuring}
                          className="h-8"
                        />
                      </div>
                      {finishing.includeCuring && slabArea > 0 && (
                        <span className="text-sm w-20 text-right">{formatCurrency(finishingCalculations.curingCost)}</span>
                      )}
                    </div>

                    {/* Sealing */}
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        id="includeSealing"
                        checked={finishing.includeSealing}
                        onChange={(e) => setFinishing(prev => ({ ...prev, includeSealing: e.target.checked }))}
                        className="h-4 w-4 rounded border-border"
                      />
                      <Label htmlFor="includeSealing" className="cursor-pointer flex-1">Sealing</Label>
                      <div className="w-24">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={finishing.sealingPricePerM2}
                          onChange={(e) => setFinishing(prev => ({ ...prev, sealingPricePerM2: e.target.value }))}
                          placeholder="$/m²"
                          disabled={!finishing.includeSealing}
                          className="h-8"
                        />
                      </div>
                      {finishing.includeSealing && slabArea > 0 && (
                        <span className="text-sm w-20 text-right">{formatCurrency(finishingCalculations.sealingCost)}</span>
                      )}
                    </div>

                    {/* Retarder (Exposed Aggregate) */}
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        id="includeRetarder"
                        checked={finishing.includeRetarder}
                        onChange={(e) => setFinishing(prev => ({ ...prev, includeRetarder: e.target.checked }))}
                        className="h-4 w-4 rounded border-border"
                      />
                      <Label htmlFor="includeRetarder" className="cursor-pointer flex-1">Retarder (exposed agg)</Label>
                      <div className="w-24">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={finishing.retarderPricePerM2}
                          onChange={(e) => setFinishing(prev => ({ ...prev, retarderPricePerM2: e.target.value }))}
                          placeholder="$/m²"
                          disabled={!finishing.includeRetarder}
                          className="h-8"
                        />
                      </div>
                      {finishing.includeRetarder && slabArea > 0 && (
                        <span className="text-sm w-20 text-right">{formatCurrency(finishingCalculations.retarderCost)}</span>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 space-y-4">
                    <p className="text-sm font-medium text-muted-foreground">Linear treatments ($ per m)</p>
                    
                    {/* Sticky Back */}
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        id="includeStickyBack"
                        checked={finishing.includeStickyBack}
                        onChange={(e) => setFinishing(prev => ({ ...prev, includeStickyBack: e.target.checked }))}
                        className="h-4 w-4 rounded border-border"
                      />
                      <Label htmlFor="includeStickyBack" className="cursor-pointer flex-1">Sticky back (perimeter)</Label>
                      <div className="w-24">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={finishing.stickyBackPricePerM}
                          onChange={(e) => setFinishing(prev => ({ ...prev, stickyBackPricePerM: e.target.value }))}
                          placeholder="$/m"
                          disabled={!finishing.includeStickyBack}
                          className="h-8"
                        />
                      </div>
                      {finishing.includeStickyBack && parseFloat(finishing.perimeter) > 0 && (
                        <span className="text-sm w-20 text-right">{formatCurrency(finishingCalculations.stickyBackCost)}</span>
                      )}
                    </div>

                    {/* Saw Cuts */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          id="includeSawCuts"
                          checked={finishing.includeSawCuts}
                          onChange={(e) => setFinishing(prev => ({ ...prev, includeSawCuts: e.target.checked }))}
                          className="h-4 w-4 rounded border-border"
                        />
                        <Label htmlFor="includeSawCuts" className="cursor-pointer flex-1">Saw cuts</Label>
                        <div className="w-24">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={finishing.sawCutPricePerM}
                            onChange={(e) => setFinishing(prev => ({ ...prev, sawCutPricePerM: e.target.value }))}
                            placeholder="$/m"
                            disabled={!finishing.includeSawCuts}
                            className="h-8"
                          />
                        </div>
                        {finishing.includeSawCuts && finishingCalculations.sawCutMeters > 0 && (
                          <span className="text-sm w-20 text-right">{formatCurrency(finishingCalculations.sawCutCost)}</span>
                        )}
                      </div>
                      {finishing.includeSawCuts && (
                        <div className="ml-8">
                          <Label className="text-xs">Total cut length (m)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            value={finishing.sawCutMeters}
                            onChange={(e) => setFinishing(prev => ({ ...prev, sawCutMeters: e.target.value }))}
                            placeholder="e.g., 15"
                            className="w-32 h-8"
                          />
                        </div>
                      )}
                    </div>

                    {/* Joint Sealer */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          id="includeJointSealer"
                          checked={finishing.includeJointSealer}
                          onChange={(e) => setFinishing(prev => ({ ...prev, includeJointSealer: e.target.checked }))}
                          className="h-4 w-4 rounded border-border"
                        />
                        <Label htmlFor="includeJointSealer" className="cursor-pointer flex-1">Joint sealer</Label>
                        <div className="w-24">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={finishing.jointSealerPricePerM}
                            onChange={(e) => setFinishing(prev => ({ ...prev, jointSealerPricePerM: e.target.value }))}
                            placeholder="$/m"
                            disabled={!finishing.includeJointSealer}
                            className="h-8"
                          />
                        </div>
                        {finishing.includeJointSealer && finishingCalculations.jointSealerMeters > 0 && (
                          <span className="text-sm w-20 text-right">{formatCurrency(finishingCalculations.jointSealerCost)}</span>
                        )}
                      </div>
                      {finishing.includeJointSealer && (
                        <div className="ml-8">
                          <Label className="text-xs">Total joint length (m)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            value={finishing.jointSealerMeters}
                            onChange={(e) => setFinishing(prev => ({ ...prev, jointSealerMeters: e.target.value }))}
                            placeholder="e.g., 15"
                            className="w-32 h-8"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {finishingCalculations.total > 0 && (
                    <div className="pt-2 text-right border-t border-border">
                      <Badge variant="default">Finishing Total: {formatCurrency(finishingCalculations.total)}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end pt-4">
                <Button type="button" onClick={goToNextTab} className="gap-2">
                  Next: Labour <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              </>
              )}
            </TabsContent>

            {/* Labour & Materials Tab */}
            <TabsContent value="labour" className="space-y-6 m-0">
              {/* Internal cost notice */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
                <EyeOff className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  <strong>Internal costs only</strong> — Hourly rates and cost breakdowns are not shown to the client.
                </p>
              </div>

              {/* Commercial Slab - Guided Labour Questionnaire */}
              {estimateType === "commercial_slab" ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Labour Estimation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Mode Toggle */}
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium">Use guided questionnaire?</span>
                      <Select 
                        value={commercialSlabData.labour.useGuided ? "guided" : "manual"} 
                        onValueChange={(v) => setCommercialSlabData({ 
                          ...commercialSlabData, 
                          labour: { ...commercialSlabData.labour, useGuided: v === "guided" } 
                        })}
                      >
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="guided">Guided</SelectItem>
                          <SelectItem value="manual">Manual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Hourly Rate */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Hourly Rate ($/hr per person)</Label>
                        <Input 
                          type="number" 
                          value={commercialSlabData.labour.hourlyRate} 
                          onChange={(e) => setCommercialSlabData({ ...commercialSlabData, labour: { ...commercialSlabData.labour, hourlyRate: e.target.value } })} 
                        />
                      </div>
                    </div>

                    {commercialSlabData.labour.useGuided ? (
                      <div className="space-y-4">
                        {/* Calculate pier count */}
                        {(() => {
                          const totalPierCount = commercialSlabData.pierHoles.reduce((sum, p) => sum + (parseFloat(p.quantity) || 0), 0);
                          const pierLabel = totalPierCount > 0 ? `${totalPierCount}` : "X";
                          return (
                            <>
                              {/* Setout */}
                              <div className="space-y-3 p-4 border rounded-lg">
                                <Label className="font-medium">How many hours to set out the {pierLabel} piers?</Label>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs">No. of men</Label>
                                    <Input type="number" value={commercialSlabData.labour.setoutMen} onChange={(e) => setCommercialSlabData({ ...commercialSlabData, labour: { ...commercialSlabData.labour, setoutMen: e.target.value } })} />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Hours</Label>
                                    <Input type="number" value={commercialSlabData.labour.setoutHours} onChange={(e) => setCommercialSlabData({ ...commercialSlabData, labour: { ...commercialSlabData.labour, setoutHours: e.target.value } })} />
                                  </div>
                                </div>
                              </div>

                              {/* Excavation */}
                              <div className="space-y-3 p-4 border rounded-lg">
                                <Label className="font-medium">How many hours to excavate the {pierLabel} piers?</Label>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs">No. of men</Label>
                                    <Input type="number" value={commercialSlabData.labour.excavationMen} onChange={(e) => setCommercialSlabData({ ...commercialSlabData, labour: { ...commercialSlabData.labour, excavationMen: e.target.value } })} />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Hours</Label>
                                    <Input type="number" value={commercialSlabData.labour.excavationHours} onChange={(e) => setCommercialSlabData({ ...commercialSlabData, labour: { ...commercialSlabData.labour, excavationHours: e.target.value } })} />
                                  </div>
                                </div>

                                {/* Spotter */}
                                <div className="flex items-center gap-3 pt-2 flex-wrap">
                                  <Label className="text-sm">Spotter required while excavating?</Label>
                                  <Select value={commercialSlabData.labour.spotterRequired ? "yes" : "no"} onValueChange={(v) => setCommercialSlabData({ ...commercialSlabData, labour: { ...commercialSlabData.labour, spotterRequired: v === "yes" } })}>
                                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="no">No</SelectItem>
                                      <SelectItem value="yes">Yes</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {commercialSlabData.labour.spotterRequired && (
                                    <div className="flex items-center gap-1">
                                      <Input type="number" className="w-20" placeholder="Hours" value={commercialSlabData.labour.spotterHours} onChange={(e) => setCommercialSlabData({ ...commercialSlabData, labour: { ...commercialSlabData.labour, spotterHours: e.target.value } })} />
                                      <span className="text-xs text-muted-foreground">hrs</span>
                                    </div>
                                  )}
                                </div>

                                {/* Spoil removal */}
                                <div className="flex items-center gap-3 pt-2 flex-wrap">
                                  <Label className="text-sm">Removing spoil from site?</Label>
                                  <Select value={commercialSlabData.labour.removeSpoil ? "yes" : "no"} onValueChange={(v) => setCommercialSlabData({ ...commercialSlabData, labour: { ...commercialSlabData.labour, removeSpoil: v === "yes" } })}>
                                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="yes">Yes</SelectItem>
                                      <SelectItem value="no">No</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {!commercialSlabData.labour.removeSpoil && (
                                    <span className="text-xs text-amber-600 dark:text-amber-400">→ Will be added to exclusions</span>
                                  )}
                                </div>
                              </div>

                              {/* Pier Formwork */}
                              <div className="space-y-3 p-4 border rounded-lg">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <Label className="font-medium">Formwork required for the {pierLabel} piers?</Label>
                                  <Select value={commercialSlabData.labour.pierFormwork ? "yes" : "no"} onValueChange={(v) => setCommercialSlabData({ ...commercialSlabData, labour: { ...commercialSlabData.labour, pierFormwork: v === "yes" } })}>
                                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="no">No</SelectItem>
                                      <SelectItem value="yes">Yes</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                {commercialSlabData.labour.pierFormwork && (
                                  <div className="grid grid-cols-3 gap-3 pl-4 border-l-2 border-muted">
                                    <div className="space-y-1">
                                      <Label className="text-xs">Material Cost ($)</Label>
                                      <Input type="number" value={commercialSlabData.labour.pierFormworkCost} onChange={(e) => setCommercialSlabData({ ...commercialSlabData, labour: { ...commercialSlabData.labour, pierFormworkCost: e.target.value } })} />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">No. of men</Label>
                                      <Input type="number" value={commercialSlabData.labour.pierFormworkMen} onChange={(e) => setCommercialSlabData({ ...commercialSlabData, labour: { ...commercialSlabData.labour, pierFormworkMen: e.target.value } })} />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Hours to install</Label>
                                      <Input type="number" value={commercialSlabData.labour.pierFormworkHours} onChange={(e) => setCommercialSlabData({ ...commercialSlabData, labour: { ...commercialSlabData.labour, pierFormworkHours: e.target.value } })} />
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Reinforcement Cages */}
                              <div className="space-y-3 p-4 border rounded-lg">
                                <Label className="font-medium">How many men to tie reinforcement cages? How many hours?</Label>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs">No. of men</Label>
                                    <Input type="number" value={commercialSlabData.labour.reoCageMen} onChange={(e) => setCommercialSlabData({ ...commercialSlabData, labour: { ...commercialSlabData.labour, reoCageMen: e.target.value } })} />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Hours</Label>
                                    <Input type="number" value={commercialSlabData.labour.reoCageHours} onChange={(e) => setCommercialSlabData({ ...commercialSlabData, labour: { ...commercialSlabData.labour, reoCageHours: e.target.value } })} />
                                  </div>
                                </div>
                              </div>

                              {/* Concrete Placement */}
                              <div className="space-y-3 p-4 border rounded-lg">
                                <Label className="font-medium">How many men to place the concrete? How many hours?</Label>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs">No. of men</Label>
                                    <Input type="number" value={commercialSlabData.labour.concretePlacementMen} onChange={(e) => setCommercialSlabData({ ...commercialSlabData, labour: { ...commercialSlabData.labour, concretePlacementMen: e.target.value } })} />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Hours</Label>
                                    <Input type="number" value={commercialSlabData.labour.concretePlacementHours} onChange={(e) => setCommercialSlabData({ ...commercialSlabData, labour: { ...commercialSlabData.labour, concretePlacementHours: e.target.value } })} />
                                  </div>
                                </div>

                                <div className="space-y-1 pt-2">
                                  <Label className="text-xs">How many hours do you expect the pump to be onsite?</Label>
                                  <div className="flex items-center gap-2">
                                    <Input type="number" className="w-24" value={commercialSlabData.labour.pumpHours} onChange={(e) => setCommercialSlabData({ ...commercialSlabData, labour: { ...commercialSlabData.labour, pumpHours: e.target.value } })} />
                                    <span className="text-xs text-muted-foreground">hours</span>
                                  </div>
                                </div>

                                <div className="space-y-1 pt-2">
                                  <Label className="text-xs">Expected waiting time on concrete delivery?</Label>
                                  <div className="flex items-center gap-2">
                                    <Input type="number" className="w-24" value={commercialSlabData.labour.waitingMinutes} onChange={(e) => setCommercialSlabData({ ...commercialSlabData, labour: { ...commercialSlabData.labour, waitingMinutes: e.target.value } })} />
                                    <span className="text-xs text-muted-foreground">minutes</span>
                                  </div>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      /* Manual Entry */
                      <div className="space-y-3 p-4 border rounded-lg">
                        <Label className="font-medium">Enter total labour directly</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">No. of men</Label>
                            <Input type="number" value={commercialSlabData.labour.manualMen} onChange={(e) => setCommercialSlabData({ ...commercialSlabData, labour: { ...commercialSlabData.labour, manualMen: e.target.value } })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Total Hours</Label>
                            <Input type="number" value={commercialSlabData.labour.manualHours} onChange={(e) => setCommercialSlabData({ ...commercialSlabData, labour: { ...commercialSlabData.labour, manualHours: e.target.value } })} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Labour Summary */}
                    {commercialSlabCalcs && commercialSlabCalcs.labourTotalManHours > 0 && (
                      <div className="pt-2 text-right border-t">
                        <Badge variant="default">
                          {commercialSlabCalcs.labourTotalManHours.toFixed(1)} man-hours = {formatCurrency(commercialSlabCalcs.labourCost)}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : estimateType === "house_slab" ? (
                /* House Slab - Guided Labour Questionnaire */
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Labour Estimation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Mode Toggle */}
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium">Use guided questionnaire?</span>
                      <Select 
                        value={houseSlabData.labour.useGuided ? "guided" : "manual"} 
                        onValueChange={(v) => setHouseSlabData({ 
                          ...houseSlabData, 
                          labour: { ...houseSlabData.labour, useGuided: v === "guided" } 
                        })}
                      >
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="guided">Guided</SelectItem>
                          <SelectItem value="manual">Manual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Hourly Rate */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Hourly Rate ($/hr per person)</Label>
                        <Input 
                          type="number" 
                          value={houseSlabData.labour.hourlyRate} 
                          onChange={(e) => setHouseSlabData({ ...houseSlabData, labour: { ...houseSlabData.labour, hourlyRate: e.target.value } })} 
                        />
                      </div>
                    </div>

                    {houseSlabData.labour.useGuided ? (
                      <div className="space-y-4">
                        {/* Edge Formwork */}
                        <div className="space-y-3 p-4 border rounded-lg">
                          <Label className="font-medium">How many hours to install edge formwork?</Label>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">No. of men</Label>
                              <Input type="number" value={houseSlabData.labour.edgeFormworkMen} onChange={(e) => setHouseSlabData({ ...houseSlabData, labour: { ...houseSlabData.labour, edgeFormworkMen: e.target.value } })} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Hours</Label>
                              <Input type="number" value={houseSlabData.labour.edgeFormworkHours} onChange={(e) => setHouseSlabData({ ...houseSlabData, labour: { ...houseSlabData.labour, edgeFormworkHours: e.target.value } })} />
                            </div>
                          </div>
                        </div>

                        {/* Slab Prep */}
                        <div className="space-y-3 p-4 border rounded-lg">
                          <Label className="font-medium">How many hours for slab prep (vapour barrier, sand blinding)?</Label>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">No. of men</Label>
                              <Input type="number" value={houseSlabData.labour.slabPrepMen} onChange={(e) => setHouseSlabData({ ...houseSlabData, labour: { ...houseSlabData.labour, slabPrepMen: e.target.value } })} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Hours</Label>
                              <Input type="number" value={houseSlabData.labour.slabPrepHours} onChange={(e) => setHouseSlabData({ ...houseSlabData, labour: { ...houseSlabData.labour, slabPrepHours: e.target.value } })} />
                            </div>
                          </div>
                        </div>

                        {/* Mesh Laying */}
                        <div className="space-y-3 p-4 border rounded-lg">
                          <Label className="font-medium">How many hours to lay and tie mesh?</Label>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">No. of men</Label>
                              <Input type="number" value={houseSlabData.labour.meshLayingMen} onChange={(e) => setHouseSlabData({ ...houseSlabData, labour: { ...houseSlabData.labour, meshLayingMen: e.target.value } })} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Hours</Label>
                              <Input type="number" value={houseSlabData.labour.meshLayingHours} onChange={(e) => setHouseSlabData({ ...houseSlabData, labour: { ...houseSlabData.labour, meshLayingHours: e.target.value } })} />
                            </div>
                          </div>
                        </div>

                        {/* Concrete Placement */}
                        <div className="space-y-3 p-4 border rounded-lg">
                          <Label className="font-medium">How many men to place and finish the concrete?</Label>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">No. of men</Label>
                              <Input type="number" value={houseSlabData.labour.concretePlacementMen} onChange={(e) => setHouseSlabData({ ...houseSlabData, labour: { ...houseSlabData.labour, concretePlacementMen: e.target.value } })} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Hours</Label>
                              <Input type="number" value={houseSlabData.labour.concretePlacementHours} onChange={(e) => setHouseSlabData({ ...houseSlabData, labour: { ...houseSlabData.labour, concretePlacementHours: e.target.value } })} />
                            </div>
                          </div>

                          <div className="space-y-1 pt-2">
                            <Label className="text-xs">How many hours do you expect the pump to be onsite?</Label>
                            <div className="flex items-center gap-2">
                              <Input type="number" className="w-24" value={houseSlabData.labour.pumpHours} onChange={(e) => setHouseSlabData({ ...houseSlabData, labour: { ...houseSlabData.labour, pumpHours: e.target.value } })} />
                              <span className="text-xs text-muted-foreground">hours</span>
                            </div>
                          </div>
                        </div>

                        {/* Waiting Time */}
                        <div className="space-y-3 p-4 border rounded-lg">
                          <Label className="font-medium">Expected waiting time on concrete delivery?</Label>
                          <div className="flex items-center gap-2">
                            <Input type="number" className="w-24" value={houseSlabData.labour.concreteWaitingMinutes} onChange={(e) => setHouseSlabData({ ...houseSlabData, labour: { ...houseSlabData.labour, concreteWaitingMinutes: e.target.value } })} placeholder="0" />
                            <span className="text-xs text-muted-foreground">minutes</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Manual Entry */
                      <div className="space-y-3 p-4 border rounded-lg">
                        <Label className="font-medium">Manual Labour Entry</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Total Men</Label>
                            <Input type="number" value={houseSlabData.labour.manualMen} onChange={(e) => setHouseSlabData({ ...houseSlabData, labour: { ...houseSlabData.labour, manualMen: e.target.value } })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Total Hours</Label>
                            <Input type="number" value={houseSlabData.labour.manualHours} onChange={(e) => setHouseSlabData({ ...houseSlabData, labour: { ...houseSlabData.labour, manualHours: e.target.value } })} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Labour Summary */}
                    {houseSlabCalcs && houseSlabCalcs.labourTotalManHours > 0 && (
                      <div className="pt-2 text-right border-t">
                        <Badge variant="default">
                          {houseSlabCalcs.labourTotalManHours.toFixed(1)} man-hours = {formatCurrency(houseSlabCalcs.labourCost)}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                /* Standard Labour (Driveway) */
                <Card>
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Labour</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={addLabourItem}>
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {labourItems.map((item, index) => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-5 space-y-1">
                          {index === 0 && <Label className="text-xs">Description</Label>}
                          <Input
                            value={item.description}
                            onChange={(e) => updateLabourItem(item.id, "description", e.target.value)}
                            placeholder="Labour type"
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          {index === 0 && <Label className="text-xs">Hours</Label>}
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            value={item.hours}
                            onChange={(e) => updateLabourItem(item.id, "hours", e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          {index === 0 && <Label className="text-xs">$/hr</Label>}
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.hourlyRate}
                            onChange={(e) => updateLabourItem(item.id, "hourlyRate", e.target.value)}
                            placeholder="85"
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          {index === 0 && <Label className="text-xs">Total</Label>}
                          <div className="h-10 flex items-center text-sm font-medium">
                            {formatCurrency((parseFloat(item.hours) || 0) * (parseFloat(item.hourlyRate) || 0))}
                          </div>
                        </div>
                        <div className="col-span-1">
                          {labourItems.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10"
                              onClick={() => removeLabourItem(item.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {labourCost > 0 && (
                      <div className="pt-2 text-right">
                        <Badge variant="default">Labour Total: {formatCurrency(labourCost)}</Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Additional Materials */}
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Additional Materials & Costs</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addMaterialItem}>
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {materialItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No additional items. Click Add to include pump hire, edge forms, etc.
                    </p>
                  ) : (
                    materialItems.map((item, index) => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-4 space-y-1">
                          {index === 0 && <Label className="text-xs">Item</Label>}
                          <Input
                            value={item.description}
                            onChange={(e) => updateMaterialItem(item.id, "description", e.target.value)}
                            placeholder="e.g., Pump hire"
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          {index === 0 && <Label className="text-xs">Qty</Label>}
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.quantity}
                            onChange={(e) => updateMaterialItem(item.id, "quantity", e.target.value)}
                            placeholder="1"
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          {index === 0 && <Label className="text-xs">Unit</Label>}
                          <Select
                            value={item.unit}
                            onValueChange={(value) => updateMaterialItem(item.id, "unit", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ea">ea</SelectItem>
                              <SelectItem value="m²">m²</SelectItem>
                              <SelectItem value="m">m</SelectItem>
                              <SelectItem value="kg">kg</SelectItem>
                              <SelectItem value="hr">hr</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 space-y-1">
                          {index === 0 && <Label className="text-xs">$/unit</Label>}
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => updateMaterialItem(item.id, "unitPrice", e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <div className="col-span-1 space-y-1">
                          {index === 0 && <Label className="text-xs opacity-0">X</Label>}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10"
                            onClick={() => removeMaterialItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                  {materialsCost > 0 && (
                    <div className="pt-2 text-right">
                      <Badge variant="default">Materials Total: {formatCurrency(materialsCost)}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end pt-4">
                <Button type="button" onClick={goToNextTab} className="gap-2">
                  Next: Inclusions <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>

            {/* Inclusions & Exclusions Tab */}
            <TabsContent value="inclusions" className="space-y-6 m-0">
              <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                <p>Select what is included and excluded in your quote. These will appear on the client's quote document.</p>
              </div>

              {/* Inclusions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Inclusions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {DEFAULT_INCLUSIONS.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={item.id}
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
                      <Label htmlFor={item.id} className="cursor-pointer text-sm font-normal">
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Exclusions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-orange-500" />
                    Exclusions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {DEFAULT_EXCLUSIONS.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={item.id}
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
                      <Label htmlFor={item.id} className="cursor-pointer text-sm font-normal">
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="flex justify-end pt-4">
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
                  <strong>Your cost breakdown (internal)</strong> — The client will only see the total amount, job description, and inclusions/exclusions.
                </p>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Your Cost Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Breakdown */}
                  <div className="space-y-2">
                    {slabArea > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Slab ({slabArea.toFixed(1)}m² x {slab.thickness}mm)
                        </span>
                        <span>{concreteVolume.toFixed(2)} m³</span>
                      </div>
                    )}
                    {volumeWithWastage > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Concrete ({volumeWithWastage.toFixed(2)}m³ @ {formatCurrency(parseFloat(concrete.pricePerM3) || 0)}/m³)
                        </span>
                        <span>{formatCurrency(concreteCost)}</span>
                      </div>
                    )}
                    {reoCalculations.sheets > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Reo ({reoCalculations.sheets} x {selectedMesh.id} sheets)
                        </span>
                        <span>{formatCurrency(reoCalculations.cost)}</span>
                      </div>
                    )}
                    {reo.includeBarChairs && reoCalculations.barChairs > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Bar chairs ({reoCalculations.barChairs} @ {formatCurrency(parseFloat(reo.barChairPrice) || 0)} ea)
                        </span>
                        <span>{formatCurrency(reoCalculations.barChairCost)}</span>
                      </div>
                    )}
                    {finishingCalculations.total > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Finishing & Treatments</span>
                        <span>{formatCurrency(finishingCalculations.total)}</span>
                      </div>
                    )}
                    {labourCost > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Labour</span>
                        <span>{formatCurrency(labourCost)}</span>
                      </div>
                    )}
                    {materialsCost > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Materials & Other</span>
                        <span>{formatCurrency(materialsCost)}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="markup" className="text-sm text-muted-foreground whitespace-nowrap">
                          Markup
                        </Label>
                        <Input
                          id="markup"
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          value={formData.markupPercent}
                          onChange={(e) => setFormData(prev => ({ ...prev, markupPercent: e.target.value }))}
                          className="w-20 h-8"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                      <span className="text-sm">{formatCurrency(markupAmount)}</span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">{formatCurrency(totalAmount)}</span>
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
                <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={mutation.isPending || !allTabsVisited}
                >
                  {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editEstimate ? "Update" : "Create"} Estimate
                  {totalAmount > 0 && ` (${formatCurrency(totalAmount)})`}
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
