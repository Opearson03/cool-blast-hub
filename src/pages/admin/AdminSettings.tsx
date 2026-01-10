import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, Save, Plus, X, Upload, Image, CreditCard, ExternalLink, Lock, ChevronDown, Palette, FileText, Eye, DollarSign } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PriceListSection } from "@/components/settings/PriceListSection";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useSubscription } from "@/hooks/useSubscription";
import type { Tables } from "@/integrations/supabase/types";

type Business = Tables<"businesses">;

export default function AdminSettings() {
  const [name, setName] = useState("");
  const [abn, setAbn] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [quoteTemplate, setQuoteTemplate] = useState("classic");
  const [quotePrimaryColor, setQuotePrimaryColor] = useState("#f97316");
  const [quoteSecondaryColor, setQuoteSecondaryColor] = useState("#1f2937");
  const [quoteFont, setQuoteFont] = useState("Arial");
  const [newSupplier, setNewSupplier] = useState("");
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const subscription = useSubscription();

  const { data: business, isLoading } = useQuery({
    queryKey: ["business"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      
      // First check if user owns a business
      const { data: ownedBusiness } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", userData.user?.id)
        .maybeSingle();

      if (ownedBusiness) return ownedBusiness as Business;

      // Otherwise check their profile's business
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", userData.user?.id)
        .single();

      if (!profile?.business_id) return null;

      const { data } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", profile.business_id)
        .single();

      return data as Business;
    },
  });

  useEffect(() => {
    if (business) {
      setName(business.name || "");
      setAbn(business.abn || "");
      setAddress(business.address || "");
      setPhone(business.phone || "");
      setEmail(business.email || "");
      setLogoUrl(business.logo_url || null);
      setQuoteTemplate((business as any).quote_template || "classic");
      setQuotePrimaryColor((business as any).quote_primary_color || "#f97316");
      setQuoteSecondaryColor((business as any).quote_secondary_color || "#1f2937");
      setQuoteFont((business as any).quote_font || "Arial");
      setSuppliers((business.preferred_suppliers as string[]) || []);
    }
  }, [business]);

  const handleLogoUpload = async (file: File) => {
    if (!business) {
      toast({ title: "Please save business details first", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${business.id}/logo.${fileExt}`;

      // Delete old logo if exists
      if (logoUrl) {
        const oldPath = logoUrl.split("/").pop();
        if (oldPath) {
          await supabase.storage.from("business-logos").remove([`${business.id}/${oldPath}`]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from("business-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("business-logos")
        .getPublicUrl(filePath);

      const newLogoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      setLogoUrl(newLogoUrl);

      // Update business record
      await supabase
        .from("businesses")
        .update({ logo_url: newLogoUrl })
        .eq("id", business.id);

      queryClient.invalidateQueries({ queryKey: ["business"] });
      toast({ title: "Logo uploaded successfully" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!business) {
        // Create new business
        const { data: userData } = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from("businesses")
          .insert({
            name,
            abn: abn || null,
            address: address || null,
            phone: phone || null,
            email: email || null,
            preferred_suppliers: suppliers,
            owner_id: userData.user?.id,
          })
          .select()
          .single();
        
        if (error) throw error;

        // Link business to profile
        await supabase
          .from("profiles")
          .update({ business_id: data.id })
          .eq("id", userData.user?.id);

        return data;
      } else {
        // Update existing business
        const { error } = await supabase
          .from("businesses")
          .update({
            name,
            abn: abn || null,
            address: address || null,
            phone: phone || null,
            email: email || null,
            preferred_suppliers: suppliers,
            quote_template: quoteTemplate,
            quote_primary_color: quotePrimaryColor,
            quote_secondary_color: quoteSecondaryColor,
            quote_font: quoteFont,
          })
          .eq("id", business.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business"] });
      toast({ title: "Settings saved" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Please enter a business name", variant: "destructive" });
      return;
    }
    updateMutation.mutate();
  };

  const addSupplier = () => {
    if (newSupplier.trim() && !suppliers.includes(newSupplier.trim())) {
      setSuppliers([...suppliers, newSupplier.trim()]);
      setNewSupplier("");
    }
  };

  const removeSupplier = (supplier: string) => {
    setSuppliers(suppliers.filter((s) => s !== supplier));
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Password updated successfully" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold">Business Settings</h1>
          <p className="text-muted-foreground">Manage your business information</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Subscription Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Subscription
              </CardTitle>
              <CardDescription>Manage your PourHub subscription</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription.isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : subscription.isSubscribed ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Plan:</span>
                    <Badge variant="secondary" className="bg-primary/20 text-primary">
                      {business?.subscription_exempt ? "Demo Account" : (subscription.tierConfig?.name || subscription.tier)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Employee Limit:</span>
                    <span className="text-sm font-medium">
                      {subscription.employeeLimit === 999 ? "Unlimited" : subscription.employeeLimit}
                    </span>
                  </div>
                  {subscription.subscriptionEnd && !business?.subscription_exempt && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Renews:</span>
                      <span className="text-sm">
                        {new Date(subscription.subscriptionEnd).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {business?.subscription_exempt ? (
                    <p className="text-sm text-muted-foreground">
                      This is a demo account. Subscription management is not available.
                    </p>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => subscription.openCustomerPortal()}
                      className="touch-target"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Manage Subscription
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    No active subscription found.
                  </p>
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => window.location.href = "/pricing"}
                    className="touch-target"
                  >
                    View Plans
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Branding & Quote Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Branding & Quote Templates
              </CardTitle>
              <CardDescription>
                Customize your logo, colors, and quote template style
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Business Logo</Label>
                <div className="flex items-center gap-4">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Business logo"
                      className="h-20 w-20 object-contain border rounded-lg bg-white"
                    />
                  ) : (
                    <div className="h-20 w-20 border rounded-lg bg-muted flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading || !business}
                      className="touch-target"
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      {logoUrl ? "Change Logo" : "Upload Logo"}
                    </Button>
                    {!business && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Save business details first to upload logo
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Quote Template Selection */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Quote Template</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "classic", name: "Classic", desc: "Traditional professional layout" },
                    { id: "modern", name: "Modern", desc: "Clean, bold design" },
                    { id: "minimal", name: "Minimal", desc: "Simple and elegant" },
                  ].map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setQuoteTemplate(template.id)}
                      className={`p-3 border rounded-lg text-left transition-all ${
                        quoteTemplate === template.id
                          ? "border-primary bg-primary/10 ring-2 ring-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4" />
                        <span className="font-medium text-sm">{template.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{template.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Brand Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primaryColor" className="text-sm font-medium mb-2 block">
                    Primary Color (Highlights)
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="primaryColor"
                      value={quotePrimaryColor}
                      onChange={(e) => setQuotePrimaryColor(e.target.value)}
                      className="w-12 h-10 rounded border cursor-pointer"
                    />
                    <Input
                      value={quotePrimaryColor}
                      onChange={(e) => setQuotePrimaryColor(e.target.value)}
                      placeholder="#f97316"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondaryColor" className="text-sm font-medium mb-2 block">
                    Secondary Color (Headers)
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="secondaryColor"
                      value={quoteSecondaryColor}
                      onChange={(e) => setQuoteSecondaryColor(e.target.value)}
                      className="w-12 h-10 rounded border cursor-pointer"
                    />
                    <Input
                      value={quoteSecondaryColor}
                      onChange={(e) => setQuoteSecondaryColor(e.target.value)}
                      placeholder="#1f2937"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Font Selection */}
              <div>
                <Label htmlFor="quoteFont" className="text-sm font-medium mb-2 block">
                  Quote Font
                </Label>
                <Select value={quoteFont} onValueChange={setQuoteFont}>
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Select a font" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial">Arial (Default)</SelectItem>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                    <SelectItem value="Georgia">Georgia</SelectItem>
                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                    <SelectItem value="Verdana">Verdana</SelectItem>
                    <SelectItem value="Trebuchet MS">Trebuchet MS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Live Preview */}
              <div>
                <Label className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Live Preview
                </Label>
                <div 
                  className="border rounded-lg overflow-hidden bg-white"
                  style={{ transform: "scale(1)", transformOrigin: "top left" }}
                >
                  <div 
                    className="p-4"
                    style={{ 
                      fontFamily: `${quoteFont}, sans-serif`,
                      fontSize: "10px",
                      lineHeight: "1.4"
                    }}
                  >
                    {quoteTemplate === "modern" ? (
                      // Modern Template Preview
                      <div>
                        <div style={{ backgroundColor: quoteSecondaryColor, padding: "12px", marginBottom: "12px", borderRadius: "4px" }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="h-6 w-6 object-contain bg-white rounded p-0.5" />
                              ) : (
                                <div className="h-6 w-6 bg-white/20 rounded flex items-center justify-center">
                                  <Building2 className="w-3 h-3 text-white/60" />
                                </div>
                              )}
                              <span className="text-white font-bold text-xs">{name || "Company Name"}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-white font-black text-sm">QUOTE</span>
                              <p className="text-[8px]" style={{ color: quotePrimaryColor }}>#EST-001</p>
                            </div>
                          </div>
                        </div>
                        <div style={{ borderBottom: `2px solid ${quotePrimaryColor}`, marginBottom: "8px", paddingBottom: "4px" }} className="flex justify-between text-[8px] text-gray-500">
                          <span>📞 {phone || "0400 000 000"}</span>
                          <span>Date: 10 Jan 2026</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div style={{ backgroundColor: "#f9fafb", padding: "6px", borderRadius: "4px", borderLeft: `2px solid ${quotePrimaryColor}` }}>
                            <p className="text-[7px] uppercase font-bold" style={{ color: quotePrimaryColor }}>Client</p>
                            <p className="font-bold text-gray-800">John Smith</p>
                          </div>
                          <div style={{ backgroundColor: "#f9fafb", padding: "6px", borderRadius: "4px", borderLeft: `2px solid ${quoteSecondaryColor}` }}>
                            <p className="text-[7px] uppercase font-bold" style={{ color: quoteSecondaryColor }}>Site</p>
                            <p className="text-gray-800">123 Example St</p>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <div style={{ backgroundColor: "#f9fafb", padding: "8px", borderRadius: "4px" }} className="w-1/2">
                            <div className="flex justify-between text-[8px] text-gray-500 mb-1">
                              <span>Subtotal</span><span>$4,545.45</span>
                            </div>
                            <div className="flex justify-between text-[8px] text-gray-500 mb-1">
                              <span>GST</span><span>$454.55</span>
                            </div>
                            <div className="flex justify-between pt-1" style={{ borderTop: `1px solid ${quotePrimaryColor}` }}>
                              <span className="font-bold text-gray-800">Total</span>
                              <span className="font-black" style={{ color: quotePrimaryColor }}>$5,000.00</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : quoteTemplate === "minimal" ? (
                      // Minimal Template Preview
                      <div className="px-2">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            {logoUrl ? (
                              <img src={logoUrl} alt="Logo" className="h-5 object-contain mb-1" />
                            ) : null}
                            <p className="font-medium text-gray-800 text-[9px]">{name || "Company Name"}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[7px] uppercase tracking-widest text-gray-400">Quote</p>
                            <p className="text-sm font-light" style={{ color: quotePrimaryColor }}>#EST-001</p>
                          </div>
                        </div>
                        <div style={{ borderBottom: `1px solid ${quotePrimaryColor}` }} className="mb-3"></div>
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-[7px] uppercase tracking-wider text-gray-400 mb-1">To</p>
                            <p className="font-medium text-gray-800">John Smith</p>
                          </div>
                          <div>
                            <p className="text-[7px] uppercase tracking-wider text-gray-400 mb-1">Site</p>
                            <p className="text-gray-800">123 Example St</p>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <div className="w-1/2">
                            <div className="flex justify-between text-[8px] text-gray-500 mb-1">
                              <span>Subtotal</span><span>$4,545.45</span>
                            </div>
                            <div className="flex justify-between text-[8px] text-gray-500 mb-1">
                              <span>GST</span><span>$454.55</span>
                            </div>
                            <div className="flex justify-between pt-1" style={{ borderTop: `1px solid ${quotePrimaryColor}` }}>
                              <span className="font-medium text-gray-800">Total</span>
                              <span className="font-light text-sm" style={{ color: quotePrimaryColor }}>$5,000.00</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Classic Template Preview
                      <div>
                        <div className="flex items-start justify-between pb-2 mb-3" style={{ borderBottom: `2px solid ${quoteSecondaryColor}` }}>
                          <div className="flex items-start gap-2">
                            {logoUrl ? (
                              <img src={logoUrl} alt="Logo" className="h-8 w-8 object-contain" />
                            ) : (
                              <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-gray-800 text-xs">{name || "Company Name"}</p>
                              <p className="text-[8px] text-gray-500">{address || "123 Business St"}</p>
                              <p className="text-[8px] text-gray-500">Ph: {phone || "0400 000 000"}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-800 text-sm">ESTIMATE</p>
                            <p className="font-semibold" style={{ color: quotePrimaryColor }}>#EST-001</p>
                            <p className="text-[8px] text-gray-500 mt-1">Date: 10 Jan 2026</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-[7px] uppercase font-semibold text-gray-400 mb-1">Bill To</p>
                            <p className="font-semibold text-gray-800">John Smith</p>
                            <p className="text-[8px] text-gray-500">john@example.com</p>
                          </div>
                          <div>
                            <p className="text-[7px] uppercase font-semibold text-gray-400 mb-1">Site Address</p>
                            <p className="text-gray-800">123 Example Street</p>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <div className="w-1/2" style={{ borderTop: `2px solid ${quoteSecondaryColor}`, paddingTop: "6px" }}>
                            <div className="flex justify-between text-[8px] text-gray-500 mb-1">
                              <span>Subtotal (ex GST)</span><span>$4,545.45</span>
                            </div>
                            <div className="flex justify-between text-[8px] text-gray-500 mb-1">
                              <span>GST (10%)</span><span>$454.55</span>
                            </div>
                            <div className="flex justify-between pt-1" style={{ borderTop: "1px solid #d1d5db" }}>
                              <span className="font-bold text-gray-800">Total (inc GST)</span>
                              <span className="font-bold text-sm" style={{ color: quotePrimaryColor }}>$5,000.00</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  This is a preview. Your actual quotes will include full details and line items.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Business Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Business Details
              </CardTitle>
              <CardDescription>Your company information for documents and invoices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Business Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Smith Concreting Pty Ltd"
                  className="touch-target"
                />
              </div>

              <div>
                <Label htmlFor="abn">ABN</Label>
                <Input
                  id="abn"
                  value={abn}
                  onChange={(e) => setAbn(e.target.value)}
                  placeholder="e.g., 12 345 678 901"
                  className="touch-target"
                />
              </div>

              <div>
                <Label htmlFor="address">Business Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g., 123 Main St, Sydney NSW 2000"
                  className="touch-target"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g., 0412 345 678"
                    className="touch-target"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., admin@company.com"
                    className="touch-target"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferred Suppliers */}
          <Card>
            <CardHeader>
              <CardTitle>Preferred Suppliers</CardTitle>
              <CardDescription>
                Your go-to concrete and material suppliers for quick selection on jobs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newSupplier}
                  onChange={(e) => setNewSupplier(e.target.value)}
                  placeholder="Add a supplier..."
                  className="touch-target"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSupplier();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addSupplier} className="touch-target">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {suppliers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {suppliers.map((supplier) => (
                    <Badge key={supplier} variant="secondary" className="gap-1 py-1 px-3">
                      {supplier}
                      <button
                        type="button"
                        onClick={() => removeSupplier(supplier)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No suppliers added yet</p>
              )}
            </CardContent>
          </Card>

          {/* My Price List - Collapsible */}
          <Collapsible defaultOpen={false}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <DollarSign className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>My Price List</CardTitle>
                        <CardDescription>
                          Set your custom prices for materials and labour
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <PriceListSection />
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Account Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Account Security
              </CardTitle>
              <CardDescription>Change your password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="touch-target"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="touch-target"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleChangePassword}
                disabled={changingPassword || !newPassword || !confirmPassword}
                className="touch-target"
              >
                {changingPassword ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4 mr-2" />
                )}
                Change Password
              </Button>
            </CardContent>
          </Card>

          {/* Legal */}
          <Card>
            <CardHeader>
              <CardTitle>Legal</CardTitle>
              <CardDescription>Privacy policy and terms of service</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="link" className="p-0 h-auto" asChild>
                <Link to="/privacy">Privacy Policy</Link>
              </Button>
              <br />
              <Button variant="link" className="p-0 h-auto" asChild>
                <Link to="/terms">Terms and Conditions</Link>
              </Button>
            </CardContent>
          </Card>

          <Separator />

          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="w-full sm:w-auto touch-target"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Settings
          </Button>

          {/* Hidden Danger Zone - Collapsible at the very bottom */}
          {subscription.isSubscribed && !business?.subscription_exempt && (
            <div className="mt-16 pt-8">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                    <ChevronDown className="w-3 h-3" />
                    <span>Advanced options</span>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <Card className="border-destructive/20">
                    <CardHeader>
                      <CardTitle className="text-sm text-muted-foreground">Danger Zone</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive/60 hover:text-destructive hover:bg-destructive/10">
                            Cancel Subscription
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will cancel your PourHub subscription. You'll lose access to premium features at the end of your current billing period. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => subscription.openCustomerPortal()}
                            >
                              Proceed to Cancel
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
        </form>
      </div>
    </AdminLayout>
  );
}
