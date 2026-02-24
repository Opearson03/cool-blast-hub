import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, Users, Briefcase, CheckCircle, CheckCircle2, XCircle, ArrowRight, ArrowLeft, Palette, Upload, FileText, DollarSign, Search } from "lucide-react";
import { useAbnVerification } from "@/hooks/useAbnVerification";
import { OnboardingPriceList } from "./OnboardingPriceList";
import { LivePDFPreview } from "@/components/settings/LivePDFPreview";
import { DEFAULT_PRICE_LIST } from "@/lib/price-list-defaults";

const FONT_OPTIONS = [
  { value: "Arial", label: "Arial" },
  { value: "Helvetica", label: "Helvetica" },
  { value: "Georgia", label: "Georgia" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Verdana", label: "Verdana" },
  { value: "Trebuchet MS", label: "Trebuchet MS" },
  { value: "Tahoma", label: "Tahoma" },
];

interface OnboardingWizardProps {
  businessId: string;
  onComplete: () => void;
}

interface PriceOverride {
  category: string;
  item_code: string;
  custom_price: number;
}

export function OnboardingWizard({ businessId, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abnVerification = useAbnVerification();

  // Business details
  const [businessName, setBusinessName] = useState("");
  const [abn, setAbn] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [abnVerified, setAbnVerified] = useState(false);
  const [abnData, setAbnData] = useState<{
    legal_name?: string;
    entity_type?: string;
    gst_registered?: boolean;
    abn_status?: string;
    error_message?: string;
    valid: boolean;
  } | null>(null);

  // Branding
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [quoteTemplate, setQuoteTemplate] = useState("minimal");
  const [quotePrimaryColor, setQuotePrimaryColor] = useState("#f97316");
  const [quoteSecondaryColor, setQuoteSecondaryColor] = useState("#1f2937");
  const [quoteFont, setQuoteFont] = useState("Arial");
  const [uploading, setUploading] = useState(false);

  // Price list overrides
  const [priceOverrides, setPriceOverrides] = useState<PriceOverride[]>([]);

  // Invite employee
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");

  // HIDDEN: Employee management is currently disabled
  // const totalSteps = 5;
  const totalSteps = 4;

  const handleSaveBusinessDetails = async () => {
    setLoading(true);
    try {
      const updateData: Record<string, any> = {
        abn,
        address,
        phone,
        onboarding_step: 2,
      };
      if (abnVerified && abnData?.legal_name) {
        updateData.name = abnData.legal_name;
      }
      const { error } = await supabase
        .from("businesses")
        .update(updateData)
        .eq("id", businessId);

      if (error) throw error;
      setStep(2);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${businessId}/logo.${fileExt}`;

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
        .eq("id", businessId);

      toast({ title: "Logo uploaded successfully" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveBranding = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("businesses")
        .update({
          quote_template: quoteTemplate,
          quote_primary_color: quotePrimaryColor,
          quote_secondary_color: quoteSecondaryColor,
          quote_font: quoteFont,
          onboarding_step: 3,
        })
        .eq("id", businessId);

      if (error) throw error;
      setStep(3);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePriceList = async () => {
    setLoading(true);
    try {
      // Build the full price list payload (defaults + any overrides)
      const itemsToInsert = DEFAULT_PRICE_LIST.map(item => {
        const override = priceOverrides.find(
          o => o.category === item.category && o.item_code === item.item_code
        );
        return {
          business_id: businessId,
          category: item.category,
          item_code: item.item_code,
          item_name: item.item_name,
          unit: item.unit,
          default_price: item.default_price,
          custom_price: override?.custom_price ?? null,
          notes: null,
        };
      });

      // If onboarding is restarted, the price list may already exist — clear it first
      const { error: deleteError } = await supabase
        .from('price_list_items')
        .delete()
        .eq('business_id', businessId);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from('price_list_items')
        .insert(itemsToInsert);

      if (insertError) throw insertError;

      await supabase
        .from("businesses")
        // HIDDEN: Skip to step 4 (Complete) since employee invite is disabled
        .update({ onboarding_step: 4 })
        .eq("id", businessId);

      // HIDDEN: Skip step 4 (Invite Employee) - go directly to Complete
      setStep(4);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteEmployee = async () => {
    if (!inviteEmail || !inviteName) {
      setStep(5);
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("pending_invites").insert({
        email: inviteEmail,
        full_name: inviteName,
        role: "staff",
        invited_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Invite sent!",
        description: `${inviteName} can now sign up at your app URL.`,
      });

      await supabase
        .from("businesses")
        .update({ onboarding_step: 5 })
        .eq("id", businessId);

      setStep(5);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await supabase
        .from("businesses")
        .update({
          onboarding_completed: true,
          onboarding_step: 5,
        })
        .eq("id", businessId);

      toast({
        title: "Welcome to PourHub!",
        description: "Your business is set up and ready to go.",
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const skipStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  return (
    <>
    <Dialog open onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg [&>button]:hidden max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Getting Started</DialogTitle>
            <span className="text-sm text-muted-foreground">
              Step {step} of {totalSteps}
            </span>
          </div>
        </DialogHeader>

        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2 mb-4">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step 1: Business Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Business Details</h3>
                <p className="text-sm text-muted-foreground">Add some basic info about your business</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="abn">ABN (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="abn"
                    value={abn}
                    onChange={(e) => {
                      setAbn(e.target.value);
                      setAbnVerified(false);
                      setAbnData(null);
                    }}
                    placeholder="XX XXX XXX XXX"
                    disabled={loading || abnVerification.isPending}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    disabled={!abn.replace(/\s/g, "").length || abnVerification.isPending || loading}
                    onClick={async () => {
                      try {
                        const result = await abnVerification.mutateAsync(abn);
                        setAbnData(result);
                        setAbnVerified(result.valid);
                        if (result.valid && result.legal_name) {
                          setBusinessName(result.legal_name);
                        }
                      } catch (err: any) {
                        setAbnData({ valid: false, error_message: err.message || "Verification failed" });
                        setAbnVerified(false);
                      }
                    }}
                  >
                    {abnVerification.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-1" />
                        Verify
                      </>
                    )}
                  </Button>
                </div>
                {/* ABN Verification Result */}
                {abnData && abnData.valid && (
                  <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800 p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-300">{abnData.legal_name}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pl-6">
                      {abnData.entity_type && <span>{abnData.entity_type}</span>}
                      <span>GST: {abnData.gst_registered ? "Registered" : "Not registered"}</span>
                      <span>Status: {abnData.abn_status}</span>
                    </div>
                  </div>
                )}
                {abnData && !abnData.valid && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-destructive" />
                      <span className="text-sm text-destructive">{abnData.error_message || "ABN could not be verified"}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Business Address (Optional)</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St, Sydney NSW"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="04XX XXX XXX"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="ghost" onClick={skipStep} disabled={loading}>
                Skip for now
              </Button>
              <Button onClick={handleSaveBusinessDetails} disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Branding */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Palette className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Brand Your Quotes</h3>
                <p className="text-sm text-muted-foreground">Customise how your estimates look</p>
              </div>
            </div>

            {/* Logo Upload */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Business Logo</Label>
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Business logo"
                    className="h-12 w-12 object-contain border rounded-lg bg-white"
                  />
                ) : (
                  <div className="h-12 w-12 border rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
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
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {logoUrl ? "Change" : "Upload Logo"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Quote Template Selection */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Template</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "minimal", name: "Simple", recommended: true },
                  { id: "classic", name: "Classic", recommended: false },
                ].map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setQuoteTemplate(template.id)}
                    className={`p-3 border rounded-lg text-center transition-all relative ${
                      quoteTemplate === template.id
                        ? "border-primary bg-primary/10 ring-2 ring-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {template.recommended && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-medium">
                        Recommended
                      </span>
                    )}
                    <FileText className="w-4 h-4 mx-auto mb-1" />
                    <span className="font-medium text-sm">{template.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Selection */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Font</Label>
              <Select value={quoteFont} onValueChange={setQuoteFont}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      <span style={{ fontFamily: font.value }}>{font.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Brand Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primaryColor" className="text-sm font-medium mb-2 block">
                  Primary Color
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="primaryColor"
                    value={quotePrimaryColor}
                    onChange={(e) => setQuotePrimaryColor(e.target.value)}
                    className="w-10 h-8 rounded border cursor-pointer"
                  />
                  <Input
                    value={quotePrimaryColor}
                    onChange={(e) => setQuotePrimaryColor(e.target.value)}
                    placeholder="#f97316"
                    className="font-mono text-sm flex-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="secondaryColor" className="text-sm font-medium mb-2 block">
                  Secondary Color
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="secondaryColor"
                    value={quoteSecondaryColor}
                    onChange={(e) => setQuoteSecondaryColor(e.target.value)}
                    className="w-10 h-8 rounded border cursor-pointer"
                  />
                  <Input
                    value={quoteSecondaryColor}
                    onChange={(e) => setQuoteSecondaryColor(e.target.value)}
                    placeholder="#1f2937"
                    className="font-mono text-sm flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Live PDF Preview */}
            <LivePDFPreview
              quoteTemplate={quoteTemplate}
              quotePrimaryColor={quotePrimaryColor}
              quoteSecondaryColor={quoteSecondaryColor}
              quoteFont={quoteFont}
              logoUrl={logoUrl}
              businessName={businessName || "Your Business"}
              businessAddress={address}
              businessPhone={phone}
            />

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back
              </Button>
              <Button variant="ghost" onClick={skipStep} disabled={loading}>
                Skip
              </Button>
              <Button onClick={handleSaveBranding} disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: My Price List */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">My Price List</h3>
                <p className="text-sm text-muted-foreground">Set your rates for estimates</p>
              </div>
            </div>

            <OnboardingPriceList
              priceOverrides={priceOverrides}
              onPriceOverridesChange={setPriceOverrides}
            />

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(2)} disabled={loading}>
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back
              </Button>
              <Button variant="ghost" onClick={skipStep} disabled={loading}>
                Skip
              </Button>
              <Button onClick={handleSavePriceList} disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* HIDDEN: Step 4 (Invite Employee) - Employee management is currently disabled
        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Invite Your First Employee</h3>
                <p className="text-sm text-muted-foreground">Get your team on board (optional)</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="inviteName">Employee Name</Label>
                <Input
                  id="inviteName"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="John Smith"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Employee Email</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="john@example.com"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(3)} disabled={loading}>
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back
              </Button>
              <Button variant="ghost" onClick={skipStep} disabled={loading}>
                Skip
              </Button>
              <Button onClick={handleInviteEmployee} disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {inviteEmail ? "Send Invite" : "Continue"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
        */}

        {/* Step 4: Complete (was Step 5 before employee invite was hidden) */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">You're Ready!</h3>
                <p className="text-sm text-muted-foreground">Here's what you can do next</p>
              </div>
            </div>
            <div className="space-y-3">
              <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => { handleComplete(); navigate("/admin/jobs"); }}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Create your first job</p>
                    <p className="text-sm text-muted-foreground">Add a job with scheduling and compliance docs</p>
                  </div>
                </CardContent>
              </Card>
              {/* HIDDEN: Employee management is currently disabled
              <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => { handleComplete(); navigate("/admin/employees"); }}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Add more employees</p>
                    <p className="text-sm text-muted-foreground">Invite your crew to join PourHub</p>
                  </div>
                </CardContent>
              </Card>
              */}
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(3)} disabled={loading}>
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back
              </Button>
              <Button onClick={handleComplete} disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Go to Dashboard
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    </>
  );
}
