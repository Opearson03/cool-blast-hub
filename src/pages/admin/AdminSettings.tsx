import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, Save, Plus, X, Upload, CreditCard, ExternalLink, Lock, Palette, FileText, Eye, DollarSign, MessageSquare, Truck, Mail } from "lucide-react";
import { QuoteTemplatePreview } from "@/components/onboarding/QuoteTemplatePreview";
import { FeedbackDialog } from "@/components/feedback/FeedbackDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PriceListSection } from "@/components/settings/PriceListSection";
import { TestResultEmailSection } from "@/components/settings/TestResultEmailSection";
import { SettingsAccordionItem } from "@/components/settings/SettingsAccordionItem";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { ChevronDown } from "lucide-react";
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
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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
      
      const { data: ownedBusiness } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", userData.user?.id)
        .maybeSingle();

      if (ownedBusiness) return ownedBusiness as Business;

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

        await supabase
          .from("profiles")
          .update({ business_id: data.id })
          .eq("id", userData.user?.id);

        return data;
      } else {
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
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your business information</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ACCOUNT GROUP */}
          <SettingsGroup title="Account">
            {/* Subscription */}
            <SettingsAccordionItem
              value="subscription"
              icon={CreditCard}
              title="Subscription"
              description="Manage your PourHub subscription"
            >
              <div className="space-y-4 pt-2">
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
              </div>
            </SettingsAccordionItem>

            {/* Account Security */}
            <SettingsAccordionItem
              value="security"
              icon={Lock}
              title="Account Security"
              description="Change your password"
            >
              <div className="space-y-4 pt-2">
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
              </div>
            </SettingsAccordionItem>
          </SettingsGroup>

          {/* BUSINESS GROUP */}
          <SettingsGroup title="Business">
            {/* Business Details */}
            <SettingsAccordionItem
              value="business-details"
              icon={Building2}
              title="Business Details"
              description="Your company information for documents and invoices"
            >
              <div className="space-y-4 pt-2">
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
              </div>
            </SettingsAccordionItem>

            {/* Preferred Suppliers */}
            <SettingsAccordionItem
              value="suppliers"
              icon={Truck}
              title="Preferred Suppliers"
              description="Your go-to concrete and material suppliers"
            >
              <div className="space-y-4 pt-2">
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
              </div>
            </SettingsAccordionItem>
          </SettingsGroup>

          {/* DOCUMENTS GROUP */}
          <SettingsGroup title="Documents">
            {/* Branding & Quote Templates */}
            <SettingsAccordionItem
              value="branding"
              icon={Palette}
              title="Branding & Quote Templates"
              description="Customize your logo, colors, and quote template style"
            >
              <div className="space-y-6 pt-2">
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
                  <QuoteTemplatePreview
                    template={quoteTemplate}
                    primaryColor={quotePrimaryColor}
                    secondaryColor={quoteSecondaryColor}
                    font={quoteFont}
                    logoUrl={logoUrl}
                    businessName={name || "Your Business"}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    This is a preview. Your actual quotes will include full details and line items.
                  </p>
                </div>
              </div>
            </SettingsAccordionItem>

            {/* My Price List */}
            <SettingsAccordionItem
              value="price-list"
              icon={DollarSign}
              title="My Price List"
              description="Set your custom prices for materials and labour"
            >
              <div className="pt-2">
                <PriceListSection />
              </div>
            </SettingsAccordionItem>

            {/* Business Inbox Email */}
            {business && (
              <SettingsAccordionItem
                value="inbox-email"
                icon={Mail}
                title="Business Inbox Email"
                description="Receive plans, test results & dockets automatically"
              >
                <BusinessInboxEmailInline 
                  businessId={business.id} 
                  currentAlias={(business as any).inbound_email_alias || null}
                />
              </SettingsAccordionItem>
            )}
          </SettingsGroup>

          {/* SUPPORT GROUP */}
          <SettingsGroup title="Support">
            {/* Feedback */}
            <SettingsAccordionItem
              value="feedback"
              icon={MessageSquare}
              title="Feedback"
              description="Help us improve PourHub"
            >
              <div className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  We'd love to hear your thoughts, suggestions, or any issues you've encountered.
                </p>
                <FeedbackDialog 
                  trigger={
                    <Button variant="outline" className="touch-target">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Send Feedback
                    </Button>
                  }
                />
              </div>
            </SettingsAccordionItem>

            {/* Legal */}
            <SettingsAccordionItem
              value="legal"
              icon={FileText}
              title="Legal"
              description="Privacy policy and terms of service"
            >
              <div className="space-y-2 pt-2">
                <Button variant="link" className="p-0 h-auto" asChild>
                  <Link to="/privacy">Privacy Policy</Link>
                </Button>
                <br />
                <Button variant="link" className="p-0 h-auto" asChild>
                  <Link to="/terms">Terms and Conditions</Link>
                </Button>
              </div>
            </SettingsAccordionItem>
          </SettingsGroup>

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

          {/* Hidden Danger Zone */}
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

// Inline version for business inbox email
function BusinessInboxEmailInline({ businessId, currentAlias }: { businessId: string; currentAlias: string | null }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const emailAddress = currentAlias ? `${currentAlias}@pourhub.au` : null;

  const handleCopy = async () => {
    if (!emailAddress) return;
    
    try {
      await navigator.clipboard.writeText(emailAddress);
      setCopied(true);
      toast({ title: "Email copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <CardDescription>
        Share this email address with clients, testing labs, and suppliers. All documents are automatically sorted and processed by AI.
      </CardDescription>

      {emailAddress ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <div className="flex-1 font-mono text-sm break-all">
              {emailAddress}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <span className="text-success">✓</span>
              ) : (
                <span>📋</span>
              )}
            </Button>
          </div>
          
          <Badge variant="secondary" className="text-xs">
            <Mail className="w-3 h-3 mr-1" />
            AI-powered document sorting
          </Badge>
        </div>
      ) : (
        <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          Email address will be generated automatically.
        </div>
      )}

      <div className="pt-2 border-t">
        <h4 className="text-sm font-medium mb-2">What you can receive:</h4>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li><strong>Building Plans</strong> - Clients can email plans for quoting</li>
          <li><strong>Test Results</strong> - Labs send concrete test reports</li>
          <li><strong>Delivery Dockets</strong> - Suppliers send docket PDFs</li>
        </ul>
      </div>

      <div className="pt-2 border-t">
        <h4 className="text-sm font-medium mb-2">How it works:</h4>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Share your email with clients, labs, and suppliers</li>
          <li>They email PDFs to your address</li>
          <li>AI categorizes and extracts key information</li>
          <li>Review items in your Inbox on the dashboard</li>
        </ol>
      </div>
    </div>
  );
}
