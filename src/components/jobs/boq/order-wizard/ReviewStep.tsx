import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Mail, Package, MapPin, CalendarIcon, User, AlertCircle, FileText, Upload, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { BOQItem } from "../BOQTypes";
import { OrderType, SupplierContact, SiteContactOption, JobPlan } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReviewStepProps {
  orderType: OrderType;
  selectedItems: BOQItem[];
  // Supplier info
  supplierId: string;
  selectedSupplierIds: string[];
  suppliers: SupplierContact[];
  manualSupplier: { name: string; email: string; phone: string };
  // Delivery info
  deliveryAddress: string;
  deliveryDate: Date | undefined;
  siteContactId: string;
  siteContactOptions: SiteContactOption[];
  manualSiteContact: { name: string; phone: string };
  notes: string;
  // Validation
  validationErrors: string[];
  // Plan attachments
  jobId?: string;
  includePlans?: boolean;
  onIncludePlansChange?: (include: boolean) => void;
  selectedPlanIds?: string[];
  onSelectedPlanIdsChange?: (ids: string[]) => void;
  jobPlans?: JobPlan[];
  onPlansUploaded?: () => void;
}

export function ReviewStep({
  orderType,
  selectedItems,
  supplierId,
  selectedSupplierIds,
  suppliers,
  manualSupplier,
  deliveryAddress,
  deliveryDate,
  siteContactId,
  siteContactOptions,
  manualSiteContact,
  notes,
  validationErrors,
  jobId,
  includePlans = false,
  onIncludePlansChange,
  selectedPlanIds = [],
  onSelectedPlanIdsChange,
  jobPlans = [],
  onPlansUploaded,
}: ReviewStepProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const isQuote = orderType === "quote";
  const selectedSuppliers = suppliers.filter(s => selectedSupplierIds.includes(s.id));
  const singleSupplier = suppliers.find(s => s.id === supplierId);
  const selectedSiteContact = siteContactOptions.find(c => c.id === siteContactId);
  
  // Filter to only show PDF files for plan attachments
  const pdfPlans = jobPlans.filter(p => 
    p.file_type === 'application/pdf' || 
    p.file_name.toLowerCase().endsWith('.pdf')
  );

  const getSupplierDisplay = () => {
    if (isQuote) {
      if (selectedSuppliers.length > 0) {
        return selectedSuppliers.map(s => s.name).join(", ");
      }
      return manualSupplier.name || "Not specified";
    }
    return singleSupplier?.name || manualSupplier.name || "Not specified";
  };

  const getSiteContactDisplay = () => {
    if (selectedSiteContact) {
      return selectedSiteContact.name;
    }
    return manualSiteContact.name || "Not specified";
  };

  const handlePlanToggle = (planId: string, checked: boolean) => {
    if (!onSelectedPlanIdsChange) return;
    if (checked) {
      onSelectedPlanIdsChange([...selectedPlanIds, planId]);
    } else {
      onSelectedPlanIdsChange(selectedPlanIds.filter(id => id !== planId));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !jobId) return;

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!profile?.business_id) throw new Error("No business found");

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${profile.business_id}/${jobId}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("documents")
          .getPublicUrl(filePath);

        const { error: docError } = await supabase
          .from("documents")
          .insert({
            business_id: profile.business_id,
            category: "job",
            reference_id: jobId,
            file_name: file.name,
            file_url: publicUrl,
            file_type: file.type || null,
            uploaded_by: user.id,
          });

        if (docError) throw docError;
      }

      toast({
        title: "Plans uploaded",
        description: `${files.length} file(s) uploaded successfully`,
      });

      onPlansUploaded?.();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-5">
      <h3 className="font-medium text-lg">Review & Send</h3>

      {validationErrors.length > 0 && (
        <Card className="border-destructive">
          <CardContent className="p-3 space-y-1">
            {validationErrors.map((error, i) => (
              <p key={i} className="text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Order Type */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Type</span>
            <Badge variant={isQuote ? "secondary" : "default"}>
              {isQuote ? "Quote Request" : "Purchase Order"}
            </Badge>
          </div>

          <Separator />

          {/* Items */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Items ({selectedItems.length})</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1 pl-6">
              {selectedItems.slice(0, 3).map(item => (
                <p key={item.id} className="truncate">
                  • {item.quantity} {item.unit} - {item.description}
                </p>
              ))}
              {selectedItems.length > 3 && (
                <p className="text-xs">+ {selectedItems.length - 3} more items</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Supplier */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Supplier</span>
            </div>
            <span className="text-sm text-right max-w-[60%] truncate">
              {getSupplierDisplay()}
              {isQuote && selectedSuppliers.length > 1 && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {selectedSuppliers.length} suppliers
                </Badge>
              )}
            </span>
          </div>

          <Separator />

          {/* Delivery Address */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Delivery</span>
            </div>
            <span className="text-sm text-right text-muted-foreground max-w-[60%]">
              {deliveryAddress || "Not specified"}
            </span>
          </div>

          {/* Delivery Date */}
          {deliveryDate && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Date</span>
              </div>
              <span className="text-sm">{format(deliveryDate, "PPP")}</span>
            </div>
          )}

          {/* Site Contact */}
          {(siteContactId || manualSiteContact.name) && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Site Contact</span>
                <span className="text-sm">{getSiteContactDisplay()}</span>
              </div>
            </>
          )}

          {/* Notes */}
          {notes && (
            <>
              <Separator />
              <div>
                <span className="text-sm font-medium block mb-1">Notes</span>
                <p className="text-sm text-muted-foreground">{notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Building Plans - Only for Quote Requests */}
      {isQuote && onIncludePlansChange && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                Include building plans
              </Label>
              <Switch
                checked={includePlans}
                onCheckedChange={onIncludePlansChange}
              />
            </div>

            {includePlans && (
              <div className="space-y-3 pt-2">
                <p className="text-sm text-muted-foreground">
                  Some items require suppliers to see the plans for accurate pricing.
                </p>

                {pdfPlans.length > 0 ? (
                  <div className="space-y-2">
                    {pdfPlans.map((plan) => (
                      <div
                        key={plan.id}
                        className="flex items-center gap-2 p-2 rounded border bg-muted/30"
                      >
                        <Checkbox
                          id={`plan-${plan.id}`}
                          checked={selectedPlanIds.includes(plan.id)}
                          onCheckedChange={(checked) =>
                            handlePlanToggle(plan.id, checked === true)
                          }
                        />
                        <label
                          htmlFor={`plan-${plan.id}`}
                          className="flex-1 text-sm truncate cursor-pointer"
                        >
                          {plan.file_name}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No PDF plans uploaded yet for this job.
                  </p>
                )}

                {/* Upload button - PDF only */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {isUploading ? "Uploading..." : "Upload PDF"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Send Method - Email only */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground pb-4">
        <Mail className="w-4 h-4" />
        <span>Will be sent via email</span>
      </div>
    </div>
  );
}
