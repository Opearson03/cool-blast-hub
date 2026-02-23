import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Clock, ShieldCheck, CreditCard, HardHat, Star, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { usePublicDirectoryProfile } from "@/hooks/usePublicDirectory";
import { useSubcontractorReviews, useMyReviewForProfile } from "@/hooks/useSubcontractorReviews";
import { StarRating } from "@/components/directory/StarRating";
import { ReviewsList } from "@/components/directory/ReviewsList";
import { WriteReviewDialog } from "@/components/directory/WriteReviewDialog";
import { ScheduleSubbieDialog } from "@/components/schedule/ScheduleSubbieDialog";
import { useDirectoryContactInfo } from "@/hooks/useDirectoryContactInfo";
import type { PastSubbie } from "@/hooks/useBusinessSubbies";

export default function SubcontractorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: profile, isLoading } = usePublicDirectoryProfile(id);
  const { data: reviews = [] } = useSubcontractorReviews(id);
  const { data: myReview } = useMyReviewForProfile(id);
  const { data: contactInfo } = useDirectoryContactInfo(id);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const { data: hasWorkedWith = false } = useQuery({
    queryKey: ["has-worked-with", id],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;
      const { data, error } = await supabase.rpc("has_worked_with_subcontractor" as any, {
        _user_id: session.user.id,
        _profile_id: id,
      });
      if (error) return false;
      return !!data;
    },
    enabled: !!id,
  });

  const preselectedSubbie: PastSubbie | undefined = profile && contactInfo ? {
    recipient_name: `${profile.first_name} ${profile.last_name}`,
    recipient_phone: contactInfo.phone,
    recipient_email: contactInfo.email,
    role: profile.trade_types?.[0] ?? "Concreter",
    lastUsed: new Date().toISOString(),
  } : undefined;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!profile) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-muted-foreground">Profile not found.</p>
          <Button asChild variant="outline">
            <Link to="/admin/directory">Back to Directory</Link>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const initials = `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase();
  const isAvailable = profile.availability_status === "available";

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link to="/admin/directory">
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

                <div className="flex flex-wrap gap-1.5">
                  {profile.trade_types?.map((t) => (
                    <Badge key={t} variant="secondary">{t}</Badge>
                  ))}
                </div>

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

            {profile.bio && (
              <div className="mt-6 pt-6 border-t">
                <h2 className="font-semibold mb-2">About</h2>
                <p className="text-muted-foreground whitespace-pre-line">{profile.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reviews Section */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-[hsl(var(--warning))]" />
                Reviews
                {profile.review_count > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {profile.avg_rating} avg · {profile.review_count} review{profile.review_count !== 1 ? "s" : ""}
                  </span>
                )}
              </CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setInviteDialogOpen(true)}>
                  <UserPlus className="h-3.5 w-3.5" /> Invite to Job
                </Button>
                {hasWorkedWith ? (
                  <Button size="sm" onClick={() => setReviewDialogOpen(true)}>
                    {myReview ? "Edit Review" : "Write a Review"}
                  </Button>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button size="sm" disabled>
                            Write a Review
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>You can leave a review after a completed pour with this subcontractor</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
            {profile.review_count > 0 && (
              <div className="mt-2">
                <StarRating rating={profile.avg_rating} size="md" />
              </div>
            )}
          </CardHeader>
          <CardContent>
            <ReviewsList reviews={reviews} />
          </CardContent>
        </Card>

        <WriteReviewDialog
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          subcontractorProfileId={id!}
          existingReview={myReview}
        />

        {preselectedSubbie && (
          <ScheduleSubbieDialog
            open={inviteDialogOpen}
            onOpenChange={setInviteDialogOpen}
            preselectedSubbie={preselectedSubbie}
          />
        )}
      </div>
    </AdminLayout>
  );
}
