import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Users, Calendar, AlertTriangle, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { useBusinessData } from "@/hooks/useBusinessData";

export default function AdminDashboard() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const businessData = useBusinessData();

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

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
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                <Users className="w-4 h-4" /> Active Crews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {businessData.isLoading ? "..." : businessData.activeCrewsCount}
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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${businessData.alertsCount > 0 ? "text-amber-500" : ""}`}>
                {businessData.isLoading ? "..." : businessData.alertsCount}
              </p>
            </CardContent>
          </Card>
        </div>

        {businessData.pendingLeaveCount > 0 && (
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-amber-500" />
                Pending Leave Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-2">
                You have {businessData.pendingLeaveCount} leave request{businessData.pendingLeaveCount > 1 ? "s" : ""} awaiting approval.
              </p>
              <Link to="/admin/leave" className="text-primary hover:underline text-sm">
                Review leave requests →
              </Link>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Welcome to PourHub! Start by setting up your business, adding employees, and creating your first job.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
