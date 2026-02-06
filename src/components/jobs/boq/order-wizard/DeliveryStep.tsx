import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, MapPin, UserCircle, FileText, Upload, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { InternalContact, JobPlan } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DeliveryStepProps {
  deliveryAddress: string;
  onDeliveryAddressChange: (address: string) => void;
  deliveryDate: Date | undefined;
  onDeliveryDateChange: (date: Date | undefined) => void;
  siteContactId: string;
  onSiteContactIdChange: (id: string) => void;
  manualSiteContact: { name: string; phone: string };
  onManualSiteContactChange: (contact: { name: string; phone: string }) => void;
  internalContacts: InternalContact[];
  notes: string;
  onNotesChange: (notes: string) => void;
  isQuote: boolean;
  // Plans for RFQ
  jobId?: string;
  includePlans?: boolean;
  onIncludePlansChange?: (include: boolean) => void;
  selectedPlanIds?: string[];
  onSelectedPlanIdsChange?: (ids: string[]) => void;
  jobPlans?: JobPlan[];
  onPlansUploaded?: () => void;
}

export function DeliveryStep({
  deliveryAddress,
  onDeliveryAddressChange,
  deliveryDate,
  onDeliveryDateChange,
  siteContactId,
  onSiteContactIdChange,
  manualSiteContact,
  onManualSiteContactChange,
  internalContacts,
  notes,
  onNotesChange,
  isQuote,
  // Plans
  jobId,
  includePlans = false,
  onIncludePlansChange,
  selectedPlanIds = [],
  onSelectedPlanIdsChange,
  jobPlans = [],
  onPlansUploaded,
}: DeliveryStepProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
      <h3 className="font-medium text-lg">Delivery Details</h3>

      {/* Delivery Address */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4" />
          Delivery Address
        </Label>
        <Textarea
          value={deliveryAddress}
          onChange={(e) => onDeliveryAddressChange(e.target.value)}
          placeholder="Enter delivery address..."
          rows={2}
        />
      </div>

      {/* Delivery Date */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <CalendarIcon className="w-4 h-4" />
          Delivery Date
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !deliveryDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {deliveryDate ? format(deliveryDate, "PPP") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={deliveryDate}
              onSelect={onDeliveryDateChange}
              initialFocus
              disabled={(date) => date < new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Site Contact - Internal contacts only */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <UserCircle className="w-4 h-4" />
          Site Contact
        </Label>
        <Select
          value={siteContactId || "__manual__"}
          onValueChange={(v) => {
            if (v === "__manual__") {
              onSiteContactIdChange("");
            } else {
              onSiteContactIdChange(v);
              onManualSiteContactChange({ name: "", phone: "" });
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select site contact..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__manual__">-- Enter manually --</SelectItem>
            {internalContacts.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} {c.role && `(${c.role})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!siteContactId && (
          <div className="grid grid-cols-2 gap-3 p-3 border rounded-lg bg-muted/30">
            <div>
              <Label className="text-xs">Contact Name</Label>
              <Input
                value={manualSiteContact.name}
                onChange={(e) => onManualSiteContactChange({ ...manualSiteContact, name: e.target.value })}
                placeholder="Site supervisor"
              />
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input
                type="tel"
                value={manualSiteContact.phone}
                onChange={(e) => onManualSiteContactChange({ ...manualSiteContact, phone: e.target.value })}
                placeholder="0400 000 000"
              />
            </div>
          </div>
        )}
      </div>

      {/* Building Plans - Only for Quote Requests */}
      {isQuote && onIncludePlansChange && (
        <div className="space-y-3">
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
            <div className="p-3 border rounded-lg bg-muted/30 space-y-3">
              <p className="text-sm text-muted-foreground">
                Some items require suppliers to see the plans for accurate pricing.
              </p>

              {jobPlans.length > 0 ? (
                <div className="space-y-2">
                  {jobPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="flex items-center gap-2 p-2 rounded border bg-background"
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
                  No plans uploaded yet for this job.
                </p>
              )}

              {/* Upload button */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
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
                  {isUploading ? "Uploading..." : "Upload additional plan"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2 pb-4">
        <Label>{isQuote ? "Message (optional)" : "Notes (optional)"}</Label>
        <Textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder={isQuote
            ? "Any requirements or questions for the supplier..."
            : "Delivery instructions, special requirements..."
          }
          rows={3}
        />
      </div>
    </div>
  );
}
