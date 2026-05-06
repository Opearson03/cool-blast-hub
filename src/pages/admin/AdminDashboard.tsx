import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { DailyScheduleWidget } from "@/components/dashboard/DailyScheduleWidget";
import { PendingSubbieInvitesWidget } from "@/components/dashboard/PendingSubbieInvitesWidget";
import { TomorrowPreviewWidget } from "@/components/dashboard/TomorrowPreviewWidget";
import { InboxWidget } from "@/components/dashboard/InboxWidget";
import { ActionsRequiredDialog } from "@/components/dashboard/ActionsRequiredDialog";
import { TodayTasksDialog } from "@/components/dashboard/TodayTasksDialog";
import { PendingResponsesDialog } from "@/components/dashboard/PendingResponsesDialog";
import { useDashboardData } from "@/hooks/useDashboardData";
import { PageHeader } from "@/components/layout/PageHeader";

export default function AdminDashboard() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionsDialogOpen, setActionsDialogOpen] = useState(false);
  const [todayTasksDialogOpen, setTodayTasksDialogOpen] = useState(false);
  const [pendingResponsesDialogOpen, setPendingResponsesDialogOpen] = useState(false);
  const dashboardData = useDashboardData(businessId);

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
      
      <div className="space-y-8">
        <PageHeader eyebrow="Operations" title="Dashboard" description="Today at a glance — tasks, subbie responses, and items needing your attention." />
        
        {/* Summary Cards */}
        <SummaryCards
          todayTasksCount={dashboardData.todayTasksCount}
          pendingInvitesCount={dashboardData.pendingInvitesCount}
          actionsRequiredCount={dashboardData.actionsRequiredCount}
          isLoading={dashboardData.isLoading}
          onTodayTasksClick={() => setTodayTasksDialogOpen(true)}
          onPendingResponsesClick={() => setPendingResponsesDialogOpen(true)}
          onActionRequiredClick={() => setActionsDialogOpen(true)}
        />

        {businessId && (
          <>
            <ActionsRequiredDialog
              businessId={businessId}
              open={actionsDialogOpen}
              onOpenChange={setActionsDialogOpen}
            />
            <TodayTasksDialog
              businessId={businessId}
              open={todayTasksDialogOpen}
              onOpenChange={setTodayTasksDialogOpen}
            />
            <PendingResponsesDialog
              businessId={businessId}
              open={pendingResponsesDialogOpen}
              onOpenChange={setPendingResponsesDialogOpen}
            />
          </>
        )}

        {businessId && (
          <>
            {/* Today's Schedule */}
            <DailyScheduleWidget businessId={businessId} />
            
            {/* Pending Subbie Invites */}
            <PendingSubbieInvitesWidget businessId={businessId} />
            
            {/* Tomorrow's Preview */}
            <TomorrowPreviewWidget businessId={businessId} />
            
            {/* Inbox */}
            <InboxWidget businessId={businessId} />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
