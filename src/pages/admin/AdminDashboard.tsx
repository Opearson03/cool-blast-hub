import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { useBusinessData } from "@/hooks/useBusinessData";
import { DailyScheduleWidget } from "@/components/dashboard/DailyScheduleWidget";
import { SubbieContactListWidget } from "@/components/dashboard/SubbieContactListWidget";
import { UnassignedDocketsWidget } from "@/components/dashboard/UnassignedDocketsWidget";

export default function AdminDashboard() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const businessData = useBusinessData();

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

        const { data: profile } = await supabase
          .from("profiles")
          .select("business_id")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile?.business_id) return;

        setBusinessId(profile.business_id);

        const { data: business } = await supabase
          .from("businesses")
          .select("onboarding_completed")
          .eq("id", profile.business_id)
          .maybeSingle();

        if (business && !business.onboarding_completed) {
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error("Error checking onboarding:", error);
      } finally {
        setLoading(false);
      }
    };

    checkOnboarding();
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {showOnboarding && businessId && (
        <OnboardingWizard businessId={businessId} onComplete={handleOnboardingComplete} />
      )}
      
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Pours Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {businessData.isLoading ? "..." : businessData.todayPoursCount}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" /> This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {businessData.isLoading ? "..." : businessData.weekPoursCount}
              </p>
            </CardContent>
          </Card>
        </div>

        {businessId && (
          <>
            <UnassignedDocketsWidget businessId={businessId} />
            <DailyScheduleWidget businessId={businessId} />
            <SubbieContactListWidget />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
