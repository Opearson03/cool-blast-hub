import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, ShieldCheck, CreditCard, HardHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/ui/Logo";
import { usePublicDirectoryProfile } from "@/hooks/usePublicDirectory";

export default function SubcontractorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: profile, isLoading } = usePublicDirectoryProfile(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Profile not found.</p>
        <Button asChild variant="outline">
          <Link to="/directory">Back to Directory</Link>
        </Button>
      </div>
    );
  }

  const initials = `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase();
  const isAvailable = profile.availability_status === "available";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Logo size="md" />
          <span className="font-semibold text-lg">Subcontractor Directory</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link to="/directory">
            <ArrowLeft className="h-4 w-4" /> Back to Directory
          </Link>
        </Button>

        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Photo */}
              <div className="shrink-0 h-32 w-32 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                {profile.profile_photo_url ? (
                  <img
                    src={profile.profile_photo_url}
                    alt={profile.first_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-muted-foreground">{initials}</span>
                )}
              </div>

              <div className="space-y-3 flex-1">
                {/* Name + availability */}
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">
                    {profile.first_name} {profile.last_name}
                  </h1>
                  <Badge variant={isAvailable ? "default" : "secondary"}>
                    {isAvailable ? "Available" : "Unavailable"}
                  </Badge>
                </div>

                {profile.legal_name && (
                  <p className="text-muted-foreground text-sm">{profile.legal_name}</p>
                )}

                {/* Trades */}
                <div className="flex flex-wrap gap-1.5">
                  {profile.trade_types?.map((t) => (
                    <Badge key={t} variant="secondary">{t}</Badge>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                  {profile.years_experience != null && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {profile.years_experience} year{profile.years_experience !== 1 ? "s" : ""} experience
                    </span>
                  )}
                  {profile.base_postcode && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {profile.base_postcode}
                      {profile.service_radius_km ? ` · ${profile.service_radius_km}km radius` : ""}
                    </span>
                  )}
                </div>

                {/* Verification badges */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {profile.abn_verified && (
                    <Badge variant="outline" className="gap-1 border-[hsl(var(--success))]/30 text-[hsl(var(--success))]">
                      <ShieldCheck className="h-3.5 w-3.5" /> ABN Verified
                    </Badge>
                  )}
                  {profile.has_white_card && (
                    <Badge variant="outline" className="gap-1 border-[hsl(var(--warning))]/30 text-[hsl(var(--warning))]">
                      <HardHat className="h-3.5 w-3.5" /> White Card
                    </Badge>
                  )}
                  {profile.gst_registered && (
                    <Badge variant="outline" className="gap-1">
                      <CreditCard className="h-3.5 w-3.5" /> GST Registered
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mt-6 pt-6 border-t">
                <h2 className="font-semibold mb-2">About</h2>
                <p className="text-muted-foreground whitespace-pre-line">{profile.bio}</p>
              </div>
            )}

            {/* CTA */}
            <div className="mt-6 pt-6 border-t">
              <Button asChild>
                <Link to="/sub-contractors">Contact via PourHub</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
