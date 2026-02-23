import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  useSubcontractorProfile,
  useUpdateSubcontractorProfile,
  calculateProfileCompletion,
} from "@/hooks/useSubcontractorProfile";
import { Logo } from "@/components/ui/Logo";
import {
  Loader2,
  LogOut,
  ShieldCheck,
  MapPin,
  Briefcase,
  Phone,
  Mail,
  Building2,
  CheckCircle2,
} from "lucide-react";

export default function SubcontractorDashboardPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: profile, isLoading } = useSubcontractorProfile();
  const updateProfile = useUpdateSubcontractorProfile();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/sub-contractors");
  };

  const handleAvailabilityToggle = (checked: boolean) => {
    updateProfile.mutate(
      { availability_status: checked ? "available" : "busy" } as any,
      {
        onSuccess: () => {
          toast({
            title: checked ? "Status: Available" : "Status: Busy",
            description: "Your availability has been updated.",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const completion = calculateProfileCompletion(profile);
  const isAvailable = profile?.availability_status === "available";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="text-sm text-muted-foreground font-medium">Dashboard</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        {/* Profile Completion */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Profile Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Progress value={completion} className="flex-1" />
              <span className="text-sm font-bold text-foreground">{completion}%</span>
            </div>
            {completion < 100 && (
              <p className="text-sm text-muted-foreground mt-2">
                Complete your profile to be fully visible in the directory.
              </p>
            )}
          </CardContent>
        </Card>

        {/* ABN & Business Info */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Business Details
              </CardTitle>
              {profile?.abn_verified && (
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  ABN Verified
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Legal Name</p>
                <p className="font-medium text-foreground">{profile?.legal_name || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">ABN</p>
                <p className="font-medium text-foreground">{profile?.abn || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Entity Type</p>
                <p className="font-medium text-foreground">{profile?.entity_type || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">GST Registered</p>
                <p className="font-medium text-foreground">
                  {profile?.gst_registered ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Availability Toggle */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Availability</h3>
                <p className="text-sm text-muted-foreground">
                  {isAvailable
                    ? "You're visible as available in the directory"
                    : "You're marked as busy — hidden from searches"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={isAvailable ? "default" : "secondary"}>
                  {isAvailable ? "Available" : "Busy"}
                </Badge>
                <Switch
                  checked={isAvailable}
                  onCheckedChange={handleAvailabilityToggle}
                  disabled={updateProfile.isPending}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact & Trade Info */}
        <div className="grid sm:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{profile?.email || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{profile?.phone || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  {profile?.base_postcode
                    ? `${profile.base_postcode} (${profile.service_radius_km || "?"}km radius)`
                    : "—"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Trade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {profile?.trade_types?.length ? (
                  profile.trade_types.map((t) => (
                    <Badge key={t} variant="outline">
                      {t}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No trades selected</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>
                  {profile?.years_experience
                    ? `${profile.years_experience} years experience`
                    : "—"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bio */}
        {profile?.bio && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{profile.bio}</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
