import { useState, useRef } from "react";
import { SubcontractorLayout } from "@/components/layout/SubcontractorLayout";
import {
  useSubcontractorProfile,
  useUpdateSubcontractorProfile,
} from "@/hooks/useSubcontractorProfile";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { SettingsAccordionItem } from "@/components/settings/SettingsAccordionItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Building2,
  Briefcase,
  FileText,
  Settings as SettingsIcon,
  LogOut,
  Loader2,
  ShieldCheck,
  Save,
  Upload,
  Eye,
  ImageIcon,
} from "lucide-react";

const TRADE_OPTIONS = [
  "Concrete Finishing",
  "Formwork",
  "Steel Fixing",
  "Earthworks",
  "Pump Operator",
  "Bobcat Operator",
  "Laser Operator",
  "General Labour",
];

export default function SubcontractorSettings() {
  const { data: profile, isLoading } = useSubcontractorProfile();
  const updateProfile = useUpdateSubcontractorProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Form state
  const [personalForm, setPersonalForm] = useState<Record<string, string>>({});
  const [tradeForm, setTradeForm] = useState<Record<string, any>>({});

  // Document upload state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingInsurance, setUploadingInsurance] = useState(false);
  const [uploadingWhiteCard, setUploadingWhiteCard] = useState(false);
  const [whiteCardEnabled, setWhiteCardEnabled] = useState<boolean | null>(null);
  const [whiteCardNumber, setWhiteCardNumber] = useState("");
  const [whiteCardFile, setWhiteCardFile] = useState<File | null>(null);
  const [savingWhiteCard, setSavingWhiteCard] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const insuranceInputRef = useRef<HTMLInputElement>(null);

  // Derived white card state
  const isWhiteCardOn = whiteCardEnabled ?? profile?.has_white_card ?? false;
  const currentWhiteCardNumber = whiteCardNumber || profile?.white_card_number || "";

  const handleSavePersonal = () => {
    if (Object.keys(personalForm).length === 0) return;
    updateProfile.mutate(personalForm as any, {
      onSuccess: () => {
        toast({ title: "Personal details updated" });
        setPersonalForm({});
      },
    });
  };

  const handleSaveTrade = () => {
    if (Object.keys(tradeForm).length === 0) return;
    updateProfile.mutate(tradeForm as any, {
      onSuccess: () => {
        toast({ title: "Trade profile updated" });
        setTradeForm({});
      },
    });
  };

  const handleTradeToggle = (trade: string) => {
    const current = tradeForm.trade_types ?? profile?.trade_types ?? [];
    const updated = current.includes(trade)
      ? current.filter((t: string) => t !== trade)
      : [...current, trade];
    setTradeForm((prev) => ({ ...prev, trade_types: updated }));
  };

  const handleUploadPhoto = async (file: File) => {
    if (!profile) return;
    setUploadingPhoto(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.user_id}/photo.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("subcontractor-photos")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage
        .from("subcontractor-photos")
        .getPublicUrl(path);
      updateProfile.mutate({ profile_photo_url: publicUrlData.publicUrl } as any, {
        onSuccess: () => toast({ title: "Profile photo updated" }),
      });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleUploadInsurance = async (file: File) => {
    if (!profile) return;
    setUploadingInsurance(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.user_id}/insurance.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("subcontractor-documents")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      updateProfile.mutate({ insurance_certificate_url: path } as any, {
        onSuccess: () => toast({ title: "Insurance certificate updated" }),
      });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploadingInsurance(false);
    }
  };

  const handleViewInsurance = async () => {
    if (!profile?.insurance_certificate_url) return;
    const { data, error } = await supabase.storage
      .from("subcontractor-documents")
      .createSignedUrl(profile.insurance_certificate_url, 3600);
    if (error || !data?.signedUrl) {
      toast({ title: "Could not open document", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const handleSaveWhiteCard = async () => {
    if (!profile) return;
    setSavingWhiteCard(true);
    try {
      let whiteCardDocUrl = profile.white_card_document_url;

      if (isWhiteCardOn && whiteCardFile) {
        const ext = whiteCardFile.name.split(".").pop();
        const path = `${profile.user_id}/whitecard.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("subcontractor-documents")
          .upload(path, whiteCardFile, { upsert: true });
        if (uploadError) throw uploadError;
        whiteCardDocUrl = path;
      }

      updateProfile.mutate(
        {
          has_white_card: isWhiteCardOn,
          white_card_number: isWhiteCardOn ? currentWhiteCardNumber || null : null,
          white_card_document_url: isWhiteCardOn ? whiteCardDocUrl : null,
        } as any,
        {
          onSuccess: () => {
            toast({ title: "White card details updated" });
            setWhiteCardFile(null);
            setWhiteCardEnabled(null);
            setWhiteCardNumber("");
          },
        }
      );
    } catch (error: any) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } finally {
      setSavingWhiteCard(false);
    }
  };

  const handleViewWhiteCard = async () => {
    if (!profile?.white_card_document_url) return;
    const { data, error } = await supabase.storage
      .from("subcontractor-documents")
      .createSignedUrl(profile.white_card_document_url, 3600);
    if (error || !data?.signedUrl) {
      toast({ title: "Could not open document", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const handleLogout = async () => {
    queryClient.clear();
    await supabase.auth.signOut();
    navigate("/sub-contractors");
  };

  const handleChangePassword = async () => {
    if (!profile?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password reset email sent", description: "Check your email for a reset link." });
    }
  };

  if (isLoading) {
    return (
      <SubcontractorLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SubcontractorLayout>
    );
  }

  const currentTrades = tradeForm.trade_types ?? profile?.trade_types ?? [];

  return (
    <SubcontractorLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <SettingsGroup title="Profile">
          <SettingsAccordionItem value="personal" icon={User} title="Personal Details" description="Name, phone, email">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>First Name</Label>
                  <Input
                    defaultValue={profile?.first_name || ""}
                    onChange={(e) => setPersonalForm((p) => ({ ...p, first_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Last Name</Label>
                  <Input
                    defaultValue={profile?.last_name || ""}
                    onChange={(e) => setPersonalForm((p) => ({ ...p, last_name: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  defaultValue={profile?.phone || ""}
                  onChange={(e) => setPersonalForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input defaultValue={profile?.email || ""} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
              </div>
              <Button onClick={handleSavePersonal} disabled={updateProfile.isPending || Object.keys(personalForm).length === 0} size="sm">
                {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Save
              </Button>
            </div>
          </SettingsAccordionItem>

          <SettingsAccordionItem value="business" icon={Building2} title="Business Details" description="ABN and legal name (read-only)">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">ABN</Label>
                  <p className="font-medium">{profile?.abn || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Legal Name</Label>
                  <p className="font-medium">{profile?.legal_name || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Entity Type</Label>
                  <p className="font-medium">{profile?.entity_type || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">GST Registered</Label>
                  <p className="font-medium">{profile?.gst_registered ? "Yes" : "No"}</p>
                </div>
              </div>
              {profile?.abn_verified && (
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <ShieldCheck className="h-3 w-3 mr-1" /> ABN Verified
                </Badge>
              )}
            </div>
          </SettingsAccordionItem>
        </SettingsGroup>

        <SettingsGroup title="Work">
          <SettingsAccordionItem value="trade" icon={Briefcase} title="Trade Profile" description="Trades, experience, service area">
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Trade Types</Label>
                <div className="flex flex-wrap gap-2">
                  {TRADE_OPTIONS.map((trade) => (
                    <Badge
                      key={trade}
                      variant={currentTrades.includes(trade) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleTradeToggle(trade)}
                    >
                      {trade}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Years Experience</Label>
                  <Input
                    type="number"
                    defaultValue={profile?.years_experience || ""}
                    onChange={(e) => setTradeForm((p: any) => ({ ...p, years_experience: parseInt(e.target.value) || null }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Service Radius (km)</Label>
                  <Input
                    type="number"
                    defaultValue={profile?.service_radius_km || ""}
                    onChange={(e) => setTradeForm((p: any) => ({ ...p, service_radius_km: parseInt(e.target.value) || null }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Base Postcode</Label>
                <Input
                  defaultValue={profile?.base_postcode || ""}
                  onChange={(e) => setTradeForm((p: any) => ({ ...p, base_postcode: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Bio</Label>
                <Textarea
                  defaultValue={profile?.bio || ""}
                  placeholder="Brief description of your experience and services..."
                  onChange={(e) => setTradeForm((p: any) => ({ ...p, bio: e.target.value }))}
                />
              </div>
              <Button onClick={handleSaveTrade} disabled={updateProfile.isPending || Object.keys(tradeForm).length === 0} size="sm">
                {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Save
              </Button>
            </div>
          </SettingsAccordionItem>

          <SettingsAccordionItem value="documents" icon={FileText} title="Documents" description="Insurance, profile photo, white card">
            <div className="space-y-6">
              {/* Profile Photo */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Profile Photo</Label>
                <div className="flex items-center gap-4">
                  {profile?.profile_photo_url ? (
                    <img src={profile.profile_photo_url} alt="Profile" className="w-16 h-16 rounded-full object-cover border" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUploadPhoto(f);
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={uploadingPhoto}
                    >
                      {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                      {profile?.profile_photo_url ? "Replace" : "Upload"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Insurance Certificate */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Insurance Certificate</Label>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-muted-foreground">
                    {profile?.insurance_certificate_url ? "Uploaded" : "Not uploaded"}
                  </p>
                  {profile?.insurance_certificate_url && (
                    <Button variant="ghost" size="sm" onClick={handleViewInsurance}>
                      <Eye className="h-4 w-4 mr-1" /> View
                    </Button>
                  )}
                </div>
                <div>
                  <input
                    ref={insuranceInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadInsurance(f);
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => insuranceInputRef.current?.click()}
                    disabled={uploadingInsurance}
                  >
                    {uploadingInsurance ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                    {profile?.insurance_certificate_url ? "Replace" : "Upload"}
                  </Button>
                </div>
              </div>

              {/* White Card */}
              <div className="space-y-4 border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Construction White Card</Label>
                    <p className="text-xs text-muted-foreground">Do you hold a Construction White Card?</p>
                  </div>
                  <Switch
                    checked={isWhiteCardOn}
                    onCheckedChange={(checked) => setWhiteCardEnabled(checked)}
                  />
                </div>

                {isWhiteCardOn && (
                  <div className="space-y-4 pt-2 border-t">
                    <div className="space-y-1.5">
                      <Label>White Card Number</Label>
                      <Input
                        value={currentWhiteCardNumber}
                        onChange={(e) => setWhiteCardNumber(e.target.value)}
                        placeholder="Enter your white card number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>White Card Photo or USI Transcript</Label>
                      {profile?.white_card_document_url && (
                        <Button variant="ghost" size="sm" onClick={handleViewWhiteCard}>
                          <Eye className="h-4 w-4 mr-1" /> View current document
                        </Button>
                      )}
                      <div className="border-2 border-dashed rounded-lg p-4 text-center">
                        {whiteCardFile ? (
                          <div className="flex items-center justify-center gap-2 text-primary">
                            <ShieldCheck className="h-5 w-5" />
                            <span className="text-sm font-medium">{whiteCardFile.name}</span>
                          </div>
                        ) : (
                          <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                        )}
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          className="mt-2"
                          onChange={(e) => setWhiteCardFile(e.target.files?.[0] || null)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Upload one of: White Card photo or USI Transcript</p>
                      </div>
                    </div>
                    <Button onClick={handleSaveWhiteCard} disabled={savingWhiteCard} size="sm">
                      {savingWhiteCard ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                      Save White Card
                    </Button>
                  </div>
                )}

                {!isWhiteCardOn && profile?.has_white_card && (
                  <Button onClick={handleSaveWhiteCard} disabled={savingWhiteCard} size="sm" variant="outline">
                    {savingWhiteCard ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                    Save (remove white card)
                  </Button>
                )}
              </div>
            </div>
          </SettingsAccordionItem>
        </SettingsGroup>

        <SettingsGroup title="Privacy">
          <SettingsAccordionItem value="privacy" icon={Eye} title="Directory Visibility" description="Control what builders see">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Show my availability on the directory</Label>
                  <p className="text-xs text-muted-foreground">When enabled, builders can see if you're available or busy. No schedule details are shared.</p>
                </div>
                <Switch
                  checked={profile?.show_availability_in_directory ?? false}
                  onCheckedChange={(checked) => {
                    updateProfile.mutate({ show_availability_in_directory: checked } as any, {
                      onSuccess: () => toast({ title: checked ? "Availability visible on directory" : "Availability hidden from directory" }),
                    });
                  }}
                />
              </div>
            </div>
          </SettingsAccordionItem>
        </SettingsGroup>

        <SettingsGroup title="Account">
          <SettingsAccordionItem value="account" icon={SettingsIcon} title="Account" description="Password, sign out">
            <div className="space-y-4">
              <Button variant="outline" size="sm" onClick={handleChangePassword}>
                Change Password
              </Button>
              <Button variant="destructive" size="sm" onClick={handleLogout} className="ml-2">
                <LogOut className="h-4 w-4 mr-1" />
                Sign Out
              </Button>
            </div>
          </SettingsAccordionItem>
        </SettingsGroup>
      </div>
    </SubcontractorLayout>
  );
}
