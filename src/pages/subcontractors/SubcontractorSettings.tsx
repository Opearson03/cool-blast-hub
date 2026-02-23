import { useState } from "react";
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

          <SettingsAccordionItem value="documents" icon={FileText} title="Documents" description="Insurance, profile photo">
            <div className="space-y-4 text-sm text-muted-foreground">
              <div>
                <Label className="text-xs">Insurance Certificate</Label>
                {profile?.insurance_certificate_url ? (
                  <a href={profile.insurance_certificate_url} target="_blank" rel="noopener noreferrer" className="text-primary underline block mt-1">
                    View Certificate
                  </a>
                ) : (
                  <p className="mt-1">Not uploaded</p>
                )}
              </div>
              <div>
                <Label className="text-xs">Profile Photo</Label>
                {profile?.profile_photo_url ? (
                  <img src={profile.profile_photo_url} alt="Profile" className="w-16 h-16 rounded-full object-cover mt-1" />
                ) : (
                  <p className="mt-1">Not uploaded</p>
                )}
              </div>
              <p className="text-xs">Document upload coming soon.</p>
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
