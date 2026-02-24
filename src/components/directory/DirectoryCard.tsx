import { Link } from "react-router-dom";
import { MapPin, Clock, ShieldCheck, CreditCard, HardHat } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "./StarRating";
import type { DirectoryProfile } from "@/hooks/usePublicDirectory";

function getInitials(first: string, last: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
}

export function DirectoryCard({ profile }: { profile: DirectoryProfile }) {
  const displayName = `${profile.first_name} ${profile.last_name?.[0] ?? ""}.`;
  const isAvailable = profile.availability_status === "available";

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        {/* Photo / Avatar */}
        <div className="h-40 bg-muted flex items-center justify-center">
          {profile.profile_photo_url ? (
            <img
              src={profile.profile_photo_url}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-3xl font-bold text-muted-foreground">
              {getInitials(profile.first_name, profile.last_name)}
            </span>
          )}
        </div>

        <div className="p-4 space-y-3">
          {/* Name + availability */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg leading-tight">{displayName}</h3>
            {profile.show_availability_in_directory && (
              <span
                className={`shrink-0 inline-block h-2.5 w-2.5 rounded-full mt-1.5 ${
                  isAvailable ? "bg-[hsl(var(--success))]" : "bg-muted-foreground/40"
                }`}
                title={isAvailable ? "Available" : "Unavailable"}
              />
            )}
          </div>

          {/* Trades */}
          <div className="flex flex-wrap gap-1.5">
            {profile.trade_types?.map((t) => (
              <Badge key={t} variant="secondary" className="text-xs">
                {t}
              </Badge>
            ))}
          </div>

          {/* Stats */}
          <div className="text-sm text-muted-foreground space-y-1">
            {profile.years_experience != null && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {profile.years_experience} year{profile.years_experience !== 1 ? "s" : ""} experience
              </div>
            )}
            {profile.base_postcode && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {profile.base_postcode}
                {profile.service_radius_km ? ` · ${profile.service_radius_km}km radius` : ""}
              </div>
            )}
          </div>

          {/* Rating */}
          {profile.review_count > 0 && (
            <div className="flex items-center gap-1.5">
              <StarRating rating={profile.avg_rating} size="sm" />
              <span className="text-xs text-muted-foreground">
                {profile.avg_rating} ({profile.review_count})
              </span>
            </div>
          )}

          {/* Verification badges */}
          <div className="flex flex-wrap gap-1.5">
            {profile.abn_verified && (
              <Badge variant="outline" className="text-xs gap-1 border-[hsl(var(--success))]/30 text-[hsl(var(--success))]">
                <ShieldCheck className="h-3 w-3" /> ABN Verified
              </Badge>
            )}
            {profile.has_white_card && (
              <Badge variant="outline" className="text-xs gap-1 border-[hsl(var(--warning))]/30 text-[hsl(var(--warning))]">
                <HardHat className="h-3 w-3" /> White Card
              </Badge>
            )}
            {profile.gst_registered && (
              <Badge variant="outline" className="text-xs gap-1">
                <CreditCard className="h-3 w-3" /> GST
              </Badge>
            )}
          </div>

          <Button asChild className="w-full mt-1" size="sm">
            <Link to={`/admin/directory/${profile.id}`}>View Profile</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
