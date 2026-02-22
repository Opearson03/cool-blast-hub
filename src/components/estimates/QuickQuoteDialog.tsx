import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Plus, Trash2, Loader2, Send, Save, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatCurrency, roundToCents } from "@/lib/format-currency";
import { ClientAutocomplete } from "@/components/contacts/ClientAutocomplete";
import type { Client } from "@/hooks/useClients";

interface QuickQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedJobId?: string;
  preselectedJobName?: string;
  defaultClientName?: string;
  defaultClientEmail?: string;
  defaultClientPhone?: string;
  defaultSiteAddress?: string;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

const emptyItem = (): LineItem => ({
  id: crypto.randomUUID(),
  description: "",
  quantity: 1,
  unit: "ea",
  unitPrice: 0,
  total: 0,
});

export function QuickQuoteDialog({ open, onOpenChange, preselectedJobId, preselectedJobName, defaultClientName, defaultClientEmail, defaultClientPhone, defaultSiteAddress }: QuickQuoteDialogProps) {
  const queryClient = useQueryClient();
  const isPreselectedVariation = !!preselectedJobId;

  // Client details
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [siteAddress, setSiteAddress] = useState("");

  // Quote purpose
  const [quotePurpose, setQuotePurpose] = useState<"new_job" | "variation">("new_job");
  const [targetJobId, setTargetJobId] = useState("");

  // Variation-specific fields
  const [variationReason, setVariationReason] = useState("");
  const [daysExtension, setDaysExtension] = useState(0);

  // Initialize from props when dialog opens
  const [initialized, setInitialized] = useState(false);
  if (open && !initialized) {
    if (isPreselectedVariation) {
      setQuotePurpose("variation");
      setTargetJobId(preselectedJobId);
    }
    if (defaultClientName) setClientName(defaultClientName);
    if (defaultClientEmail) setClientEmail(defaultClientEmail);
    if (defaultClientPhone) setClientPhone(defaultClientPhone);
    if (defaultSiteAddress) setSiteAddress(defaultSiteAddress);
    setInitialized(true);
  }
  if (!open && initialized) {
    setInitialized(false);
  }

  // Line items
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);

  // Options
  const [notes, setNotes] = useState("");
  const [includeGST, setIncludeGST] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch active jobs for variation selector
  const { data: activeJobs = [] } = useQuery({
    queryKey: ["active-jobs-for-variation"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();
      if (!profile?.business_id) return [];
      const { data } = await supabase
        .from("jobs")
        .select("id, name, job_number, site_address, builder_client")
        .eq("business_id", profile.business_id)
        .in("status", ["scheduled", "in_progress"])
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: open && quotePurpose === "variation",
  });

  const subtotal = roundToCents(items.reduce((sum, item) => sum + (item.total || 0), 0));
  const gstAmount = includeGST ? roundToCents(subtotal * 0.1) : 0;
  const totalAmount = roundToCents(subtotal + gstAmount);

  const handleAddItem = () => {
    setItems([...items, emptyItem()]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "unitPrice") {
          updated.total = roundToCents(
            (Number(updated.quantity) || 0) * (Number(updated.unitPrice) || 0)
          );
        }
        return updated;
      })
    );
  };

  const handleClose = () => {
    setClientName("");
    setClientEmail("");
    setClientPhone("");
    setCompanyName("");
    setSiteAddress("");
    setQuotePurpose("new_job");
    setTargetJobId("");
    setVariationReason("");
    setDaysExtension(0);
    setItems([emptyItem()]);
    setNotes("");
    setIncludeGST(true);
    onOpenChange(false);
    setItems([emptyItem()]);
    setNotes("");
    setIncludeGST(true);
    onOpenChange(false);
  };

  const handleSave = async (sendEmail: boolean) => {
    if (!clientName.trim()) {
      toast.error("Client name is required");
      return;
    }
    if (!siteAddress.trim()) {
      toast.error("Site address is required");
      return;
    }
    const validItems = items.filter((i) => i.description.trim() && i.total > 0);
    if (validItems.length === 0) {
      toast.error("Add at least one line item with a description and price");
      return;
    }
    if (sendEmail && !clientEmail.trim()) {
      toast.error("Client email is required to send the quote");
      return;
    }
    if (quotePurpose === "variation" && !targetJobId) {
      toast.error("Please select a job for this variation");
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!profile?.business_id) throw new Error("No business found");

      // Generate next estimate number
      const { data: maxEstimate } = await supabase
        .from("estimates")
        .select("estimate_number")
        .eq("business_id", profile.business_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      let nextNumber = "QQ-0001";
      if (maxEstimate?.estimate_number) {
        const match = maxEstimate.estimate_number.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10) + 1;
          nextNumber = `QQ-${String(num).padStart(4, "0")}`;
        }
      }

      // Build description from line items
      const description = validItems
        .map((i) => `${i.description} (${i.quantity} ${i.unit})`)
        .join(", ");

      // Insert estimate
      const { data: estimate, error: estError } = await supabase
        .from("estimates")
        .insert({
          business_id: profile.business_id,
          created_by: user.id,
          estimate_number: nextNumber,
          estimate_type: "driveway", // Use default type for quick quotes
          client_name: clientName.trim(),
          client_email: clientEmail.trim() || null,
          client_phone: clientPhone.trim() || null,
          company_name: companyName.trim() || null,
          site_address: siteAddress.trim(),
          description,
          notes: notes.trim() || null,
          total_amount: totalAmount,
          status: "pending" as any,
          payment_terms_type: "full_payment",
          deposit_percentage: 100,
          quote_validity_days: 14,
          valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          scope_data: {
            quote_purpose: quotePurpose,
            target_job_id: quotePurpose === "variation" ? targetJobId : null,
            variation_reason: quotePurpose === "variation" ? variationReason || null : null,
            days_extension: quotePurpose === "variation" ? daysExtension : null,
          } as any,
        })
        .select()
        .single();

      if (estError) throw estError;

      // Insert line items
      const itemInserts = validItems.map((item, index) => ({
        estimate_id: estimate.id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unitPrice,
        total: item.total,
        sort_order: index,
      }));

      // Add GST line if applicable
      if (includeGST && gstAmount > 0) {
        itemInserts.push({
          estimate_id: estimate.id,
          description: "GST (10%)",
          quantity: 1,
          unit: "ea",
          unit_price: gstAmount,
          total: gstAmount,
          sort_order: validItems.length,
        });
      }

      const { error: itemsError } = await supabase
        .from("estimate_items")
        .insert(itemInserts);

      if (itemsError) throw itemsError;

      // If sending email, generate PDF and send
      if (sendEmail && clientEmail.trim()) {
        toast.info("Generating PDF...");

        // Fetch business details for branding
        const { data: business } = await supabase
          .from("businesses")
          .select("name, logo_url, address, phone, email, abn, quote_template, quote_primary_color, quote_secondary_color, quote_font, inbound_email_alias")
          .eq("id", profile.business_id)
          .single();

        const { generateQuotePDF } = await import("@/lib/generate-quote-pdf");
        const pdfBase64 = await generateQuotePDF({
          estimate: {
            estimate_number: nextNumber,
            client_name: clientName.trim(),
            company_name: companyName.trim() || null,
            client_email: clientEmail.trim(),
            client_phone: clientPhone.trim() || null,
            site_address: siteAddress.trim(),
            description,
            total_amount: totalAmount,
            valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
            notes: notes.trim() || null,
            created_at: new Date().toISOString(),
            payment_terms_type: "full_payment",
            deposit_percentage: 100,
            quote_validity_days: 14,
          },
          business: business
            ? {
                name: business.name,
                logo_url: business.logo_url,
                address: business.address,
                phone: business.phone,
                email: business.email,
                abn: business.abn,
                quote_template: business.quote_template,
                quote_primary_color: business.quote_primary_color,
                quote_secondary_color: business.quote_secondary_color,
                quote_font: business.quote_font,
              }
            : null,
        });

        toast.info("Sending email...");

        const { error: sendError } = await supabase.functions.invoke(
          "send-estimate-email",
          {
            body: {
              estimateId: estimate.id,
              clientEmail: clientEmail.trim(),
              clientName: clientName.trim(),
              estimateNumber: nextNumber,
              businessName: business?.name || "PourHub",
              businessEmailAlias: business?.inbound_email_alias || null,
              totalAmount: formatCurrency(totalAmount),
              siteAddress: siteAddress.trim(),
              pdfBase64,
            },
          }
        );

        if (sendError) throw sendError;

        // Update status to sent
        await supabase
          .from("estimates")
          .update({ status: "sent" as any })
          .eq("id", estimate.id);

        toast.success("Quick quote sent!");
      } else {
        toast.success("Quick quote saved!");
      }

      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      handleClose();
    } catch (error: any) {
      console.error("Error saving quick quote:", error);
      toast.error(error.message || "Failed to save quick quote");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{isPreselectedVariation ? "Quote Variation" : "Quick Quote"}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          <div className="space-y-4 pb-4">
            {/* Client Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="qq-client">Client Name *</Label>
                <ClientAutocomplete
                  value={clientName}
                  onChange={setClientName}
                  onSelect={(client: Client) => {
                    setClientName(client.name);
                    if (client.email) setClientEmail(client.email);
                    if (client.phone) setClientPhone(client.phone);
                    if (client.company_name) setCompanyName(client.company_name);
                    if (client.address) setSiteAddress(client.address);
                  }}
                  placeholder="Start typing to search clients..."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qq-company">Company</Label>
                <Input
                  id="qq-company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qq-email">Email</Label>
                <Input
                  id="qq-email"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qq-phone">Phone</Label>
                <Input
                  id="qq-phone"
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="04xx xxx xxx"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="qq-address">Site Address *</Label>
              <Input
                id="qq-address"
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
                placeholder="e.g., 123 Main St, Sydney NSW"
              />
            </div>

            {/* Quote Purpose */}
            <div className="space-y-3 border-t pt-4">
              <Label className="text-sm font-medium">Quote Type</Label>
              {isPreselectedVariation ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Variation</Badge>
                    <span className="text-sm text-muted-foreground">for</span>
                    <Badge variant="outline">{preselectedJobName || "Selected Job"}</Badge>
                  </div>

                  {/* Reason */}
                  <div className="space-y-1.5">
                    <Label>Reason</Label>
                    <Select value={variationReason} onValueChange={setVariationReason}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client_request">Client Request</SelectItem>
                        <SelectItem value="site_condition">Site Condition</SelectItem>
                        <SelectItem value="design_change">Design Change</SelectItem>
                        <SelectItem value="regulatory">Regulatory</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Days Extension */}
                  <div className="space-y-1.5">
                    <Label>Days Extension</Label>
                    <Input
                      type="number"
                      value={daysExtension || ""}
                      onChange={(e) => setDaysExtension(e.target.value === "" ? 0 : Number(e.target.value))}
                      placeholder="0"
                      min={0}
                      className="w-32"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <RadioGroup
                    value={quotePurpose}
                    onValueChange={(v) => {
                      setQuotePurpose(v as "new_job" | "variation");
                      if (v === "new_job") setTargetJobId("");
                    }}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="new_job" id="qq-new-job" />
                      <Label htmlFor="qq-new-job" className="text-sm cursor-pointer">New Job</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="variation" id="qq-variation" />
                      <Label htmlFor="qq-variation" className="text-sm cursor-pointer">Variation</Label>
                    </div>
                  </RadioGroup>

                  {quotePurpose === "variation" && (
                    <div className="space-y-1.5">
                      <Label>Select Job *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between font-normal"
                          >
                            {targetJobId
                              ? (() => {
                                  const job = activeJobs.find((j) => j.id === targetJobId);
                                  return job
                                    ? `${job.job_number ? `${job.job_number} - ` : ""}${job.name}`
                                    : "Choose an existing job...";
                                })()
                              : "Choose an existing job..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search jobs..." />
                            <CommandList>
                              <CommandEmpty>No jobs found.</CommandEmpty>
                              <CommandGroup>
                                {activeJobs.map((job) => {
                                  const label = `${job.job_number ? `${job.job_number} - ` : ""}${job.name}`;
                                  return (
                                    <CommandItem
                                      key={job.id}
                                      value={`${job.job_number || ""} ${job.name} ${job.site_address || ""} ${job.builder_client || ""}`}
                                      onSelect={() => setTargetJobId(job.id)}
                                    >
                                      <Check className={cn("mr-2 h-4 w-4", targetJobId === job.id ? "opacity-100" : "opacity-0")} />
                                      <div className="flex flex-col">
                                        <span className="text-sm">{label}</span>
                                        {job.site_address && (
                                          <span className="text-xs text-muted-foreground">{job.site_address}</span>
                                        )}
                                      </div>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Line Items */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">Line Items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Item
                </Button>
              </div>

              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 bg-muted/30 p-3 rounded-lg"
                  >
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) =>
                        handleUpdateItem(item.id, "description", e.target.value)
                      }
                      className="h-8 text-sm"
                    />
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="Qty"
                          value={item.quantity ?? ""}
                          onChange={(e) =>
                            handleUpdateItem(
                              item.id,
                              "quantity",
                              e.target.value === "" ? 0 : Number(e.target.value)
                            )
                          }
                          className="h-8 text-sm text-center"
                          min={0}
                          step="any"
                        />
                      </div>
                      <div className="w-16">
                        <Input
                          placeholder="Unit"
                          value={item.unit}
                          onChange={(e) =>
                            handleUpdateItem(item.id, "unit", e.target.value)
                          }
                          className="h-8 text-sm text-center"
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="Price"
                          value={item.unitPrice ?? ""}
                          onChange={(e) =>
                            handleUpdateItem(
                              item.id,
                              "unitPrice",
                              e.target.value === "" ? 0 : Number(e.target.value)
                            )
                          }
                          className="h-8 text-sm text-center"
                          min={0}
                          step="0.01"
                        />
                      </div>
                      <span className="text-sm font-medium w-20 text-right shrink-0">
                        {formatCurrency(item.total)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={items.length <= 1}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="qq-notes">Notes</Label>
              <Textarea
                id="qq-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes for the quote..."
                rows={2}
              />
            </div>

            {/* GST Toggle & Totals */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Include GST (10%)</Label>
                <Switch checked={includeGST} onCheckedChange={setIncludeGST} />
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {includeGST && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST (10%)</span>
                    <span>{formatCurrency(gstAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-base pt-1 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => handleSave(false)}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Only
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={() => handleSave(true)}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Save & Send
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
