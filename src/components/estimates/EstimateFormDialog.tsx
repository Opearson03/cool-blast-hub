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
import { Loader2, Plus, Trash2, Calculator, FileText } from "lucide-react";

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

export function EstimateFormDialog({ open, onOpenChange, editEstimate }: EstimateFormDialogProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [slab, setSlab] = useState<SlabDimensions>(initialSlabDimensions);
  const [concrete, setConcrete] = useState<ConcreteDetails>(initialConcreteDetails);
  const [labourItems, setLabourItems] = useState<LabourItem[]>([
    { id: "1", description: "Concreting labour", hours: "", hourlyRate: "85" },
  ]);
  const [materialItems, setMaterialItems] = useState<MaterialItem[]>([]);
  const [activeTab, setActiveTab] = useState("details");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Subtotal
  const subtotal = useMemo(() => {
    return concreteCost + labourCost + materialsCost;
  }, [concreteCost, labourCost, materialsCost]);

  // Markup amount
  const markupAmount = useMemo(() => {
    const markupPercent = parseFloat(formData.markupPercent) || 0;
    return subtotal * (markupPercent / 100);
  }, [subtotal, formData.markupPercent]);

  // Total
  const totalAmount = useMemo(() => {
    return subtotal + markupAmount;
  }, [subtotal, markupAmount]);

  useEffect(() => {
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
    } else {
      setFormData(initialFormData);
      setSlab(initialSlabDimensions);
      setConcrete(initialConcreteDetails);
      setLabourItems([{ id: "1", description: "Concreting labour", hours: "", hourlyRate: "85" }]);
      setMaterialItems([]);
    }
  }, [editEstimate, open]);

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

      // Build description from calculator
      const descriptionParts = [];
      if (slabArea > 0) {
        descriptionParts.push(`Slab: ${slabArea.toFixed(1)}m² x ${slab.thickness}mm`);
      }
      if (volumeWithWastage > 0) {
        descriptionParts.push(`Concrete: ${volumeWithWastage.toFixed(2)}m³ @ ${concrete.mpaStrength}MPa`);
      }
      if (formData.description) {
        descriptionParts.push(formData.description);
      }

      const estimateData = {
        business_id: profile.business_id,
        client_name: formData.client_name,
        client_email: formData.client_email || null,
        client_phone: formData.client_phone || null,
        site_address: formData.site_address,
        description: descriptionParts.join(" | ") || null,
        total_amount: totalAmount,
        valid_until: formData.valid_until || null,
        notes: formData.notes || null,
        created_by: user.id,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            {editEstimate ? "Edit Estimate" : "New Estimate"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">
              <FileText className="w-4 h-4 mr-2 hidden sm:inline" />
              Details
            </TabsTrigger>
            <TabsTrigger value="slab">
              <span className="hidden sm:inline">Slab &</span> Concrete
            </TabsTrigger>
            <TabsTrigger value="labour">Labour</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
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
            </TabsContent>

            {/* Slab & Concrete Tab */}
            <TabsContent value="slab" className="space-y-6 m-0">
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
                  <CardTitle className="text-base">Concrete Details</CardTitle>
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
            </TabsContent>

            {/* Labour & Materials Tab */}
            <TabsContent value="labour" className="space-y-6 m-0">
              {/* Labour */}
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
                      No additional items. Click Add to include reo, pump hire, etc.
                    </p>
                  ) : (
                    materialItems.map((item, index) => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-4 space-y-1">
                          {index === 0 && <Label className="text-xs">Item</Label>}
                          <Input
                            value={item.description}
                            onChange={(e) => updateMaterialItem(item.id, "description", e.target.value)}
                            placeholder="e.g., Reo mesh"
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
            </TabsContent>

            {/* Summary Tab */}
            <TabsContent value="summary" className="space-y-4 m-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Quote Summary</CardTitle>
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
                <Label htmlFor="notes">Notes / Terms</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Payment terms, conditions, exclusions..."
                  rows={3}
                />
              </div>
            </TabsContent>

            {/* Footer */}
            <div className="flex gap-3 pt-6 border-t border-border mt-6">
              <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editEstimate ? "Update" : "Create"} Estimate
                {totalAmount > 0 && ` (${formatCurrency(totalAmount)})`}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
