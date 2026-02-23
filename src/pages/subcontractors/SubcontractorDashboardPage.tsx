import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import { useSubcontractorInvites } from "@/hooks/useSubcontractorInvites";
import { SubcontractorLayout } from "@/components/layout/SubcontractorLayout";
import {
  Loader2,
  ShieldCheck,
  MapPin,
  Briefcase,
  Phone,
  Mail,
  Building2,
  Calendar,
  ArrowRight,
  Clock,
  Star,
} from "lucide-react";
import { useOwnReviews } from "@/hooks/useSubcontractorReviews";
import { StarRating } from "@/components/directory/StarRating";
import { ReviewsList } from "@/components/directory/ReviewsList";
import { format, isAfter, addDays } from "date-fns";

export default function SubcontractorDashboardPage() {
  const { toast } = useToast();
  const { data: profile, isLoading } = useSubcontractorProfile();
  const { data: invites } = useSubcontractorInvites();
  const { data: ownReviews = [] } = useOwnReviews();
  const updateProfile = useUpdateSubcontractorProfile();

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
      <SubcontractorLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SubcontractorLayout>
    );
  }

  const completion = calculateProfileCompletion(profile);
  const isAvailable = profile?.availability_status === "available";

  // Pending invites count
  const pendingInvites = invites?.filter(
    (i) => i.status === "sent" || i.status === "drafted" || i.status === "viewed"
  ) || [];

  // Upcoming accepted work (next 7 days)
  const today = new Date();
  const nextWeek = addDays(today, 7);
  const upcomingWork = invites
    ?.filter((i) => i.status === "accepted" && i.pour_date)
    .filter((i) => {
      const d = new Date(i.pour_date!);
      return d >= today && d <= nextWeek;
    })
    .sort((a, b) => new Date(a.pour_date!).getTime() - new Date(b.pour_date!).getTime())
    .slice(0, 3) || [];

  return (
    <SubcontractorLayout>
      <div className="max-w-3xl mx-auto space-y-6">
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
                Complete your profile to be fully visible in the directory.{" "}
                <Link to="/sub-contractors/settings" className="text-primary underline">
                  Go to Settings
                </Link>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Pending Invites + Upcoming Work */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Link to="/sub-contractors/work">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Invites</p>
                    <p className="text-3xl font-bold text-foreground">{pendingInvites.length}</p>
                  </div>
                  <div className="p-3 rounded-full bg-primary/10">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  View & respond <ArrowRight className="h-3 w-3" />
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/sub-contractors/schedule">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Upcoming (7 days)</p>
                    <p className="text-3xl font-bold text-foreground">{upcomingWork.length}</p>
                  </div>
                  <div className="p-3 rounded-full bg-primary/10">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  View schedule <ArrowRight className="h-3 w-3" />
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Upcoming Work List */}
        {upcomingWork.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Upcoming Work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingWork.map((inv) => (
                <div key={inv.id} className="p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-medium text-sm">{inv.pour_name}</span>
                    <Badge variant="outline" className="text-xs">{inv.role}</Badge>
                  </div>
                  <div className="space-y-0.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(inv.pour_date!), "EEE, MMM d")}</span>
                    </div>
                    {(inv.start_time || inv.scheduled_time) && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        <span>{inv.start_time || inv.scheduled_time}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3 w-3" />
                      <span>{inv.business_name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* My Reviews */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-[hsl(var(--warning))]" />
              My Reviews
              {ownReviews.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({ownReviews.length})
                </span>
              )}
            </CardTitle>
            {ownReviews.length > 0 && (
              <div className="mt-1">
                <StarRating
                  rating={ownReviews.reduce((sum, r) => sum + r.rating, 0) / ownReviews.length}
                  size="md"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {(ownReviews.reduce((sum, r) => sum + r.rating, 0) / ownReviews.length).toFixed(1)} average from {ownReviews.length} review{ownReviews.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <ReviewsList
              reviews={ownReviews.slice(0, 3)}
              emptyMessage="No reviews yet. Reviews from businesses you've worked with will appear here."
            />
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
      </div>
    </SubcontractorLayout>
  );
}
