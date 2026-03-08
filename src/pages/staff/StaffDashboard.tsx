import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LogOut, Users, Building2, CreditCard, TrendingUp, List, UserCheck, Truck, Mail, HardHat, Megaphone, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import Logo from "@/components/ui/Logo";
import { WaitlistTable } from "@/components/staff/WaitlistTable";
import { SubscriptionMetrics } from "@/components/staff/SubscriptionMetrics";
import { SignupTrends } from "@/components/staff/SignupTrends";
import { SubscribersTable } from "@/components/staff/SubscribersTable";
import { UsersTable } from "@/components/staff/UsersTable";
import { SupplierRegistrationsTable } from "@/components/staff/SupplierRegistrationsTable";
import { ChurnMetrics } from "@/components/staff/ChurnMetrics";
import { CrmTab } from "@/components/staff/crm/CrmTab";
import { SubcontractorAdminTable } from "@/components/subcontractors/SubcontractorAdminTable";
import { AffiliatesTab } from "@/components/staff/AffiliatesTab";
import { BookingsTab } from "@/components/staff/BookingsTab";

interface SubscriptionStats {
  total_businesses: number;
  total_users: number;
  active_subscriptions: number;
  trial_subscriptions: number;
  demo_accounts: number;
  estimating_paid: number;
  estimating_trial: number;
  pro_paid: number;
  pro_trial: number;
  legacy_paid: number;
  waiting_list_count: number;
  recent_signups_7d: number;
  recent_signups_30d: number;
  active_today: number;
}

export default function StaffDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/staff");
        return;
      }

      const { data: isStaff } = await supabase.rpc("is_pourhub_staff", {
        _user_id: session.user.id,
      });

      if (!isStaff) {
        toast.error("Access denied");
        await supabase.auth.signOut();
        navigate("/staff");
        return;
      }

      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [navigate]);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ["staff-subscription-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_subscription_stats");
      if (error) throw error;
      return data as unknown as SubscriptionStats;
    },
    enabled: !isCheckingAuth,
    staleTime: 60000, // Consider data fresh for 1 minute
    // No refetchInterval - using realtime instead
  });

  // Refetch function for realtime updates
  const handleRealtimeUpdate = useCallback(() => {
    refetchStats();
    queryClient.invalidateQueries({ queryKey: ["staff-subscribers"] });
    queryClient.invalidateQueries({ queryKey: ["staff-waitlist-entries"] });
    queryClient.invalidateQueries({ queryKey: ["staff-signup-trends"] });
    queryClient.invalidateQueries({ queryKey: ["staff-all-users"] });
    queryClient.invalidateQueries({ queryKey: ["staff-churn-stats"] });
  }, [refetchStats, queryClient]);

  // Subscribe to realtime changes on relevant tables
  useEffect(() => {
    if (isCheckingAuth) return;

    const channel = supabase
      .channel('staff-dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'businesses' },
        () => handleRealtimeUpdate()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'business_subscriptions' },
        () => handleRealtimeUpdate()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'waiting_list' },
        () => handleRealtimeUpdate()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crm_leads' },
        () => handleRealtimeUpdate()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crm_inbox' },
        () => handleRealtimeUpdate()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isCheckingAuth, handleRealtimeUpdate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/staff");
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo className="h-8" />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Staff Dashboard
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card 
            className="cursor-pointer transition-colors hover:bg-accent/50"
            onClick={() => setActiveTab("waitlist")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Waiting List
              </CardTitle>
              <List className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {statsLoading ? "..." : stats?.waiting_list_count ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                People waiting for access
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer transition-colors hover:bg-accent/50"
            onClick={() => setActiveTab("subscriptions")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Businesses
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {statsLoading ? "..." : stats?.total_businesses ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                +{stats?.recent_signups_7d ?? 0} this week • {stats?.demo_accounts ?? 0} demo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Subscribers
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {statsLoading ? "..." : stats?.active_subscriptions ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.trial_subscriptions ?? 0} in trial
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer transition-colors hover:bg-accent/50"
            onClick={() => setActiveTab("users")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {statsLoading ? "..." : stats?.total_users ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.active_today ?? 0} active today
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
            <TabsTrigger value="overview">
              <TrendingUp className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users">
              <UserCheck className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="waitlist">
              <List className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Waiting List</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions">
              <CreditCard className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Subscriptions</span>
            </TabsTrigger>
            <TabsTrigger value="suppliers">
              <Truck className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Suppliers</span>
            </TabsTrigger>
            <TabsTrigger value="crm">
              <Mail className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">CRM</span>
            </TabsTrigger>
            <TabsTrigger value="subcontractors">
              <HardHat className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Subcontractors</span>
            </TabsTrigger>
            <TabsTrigger value="affiliates">
              <Megaphone className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Affiliates</span>
            </TabsTrigger>
            <TabsTrigger value="bookings">
              <CalendarDays className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Bookings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SignupTrends />
              <SubscriptionMetrics stats={stats} isLoading={statsLoading} />
              <ChurnMetrics />
            </div>
          </TabsContent>

          <TabsContent value="users">
            <UsersTable />
          </TabsContent>

          <TabsContent value="waitlist">
            <WaitlistTable />
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-4">
            <SubscriptionMetrics stats={stats} isLoading={statsLoading} fullWidth />
            <SubscribersTable />
          </TabsContent>

          <TabsContent value="suppliers">
            <SupplierRegistrationsTable />
          </TabsContent>

          <TabsContent value="crm">
            <CrmTab />
          </TabsContent>

          <TabsContent value="subcontractors">
            <SubcontractorAdminTable />
          </TabsContent>

          <TabsContent value="affiliates">
            <AffiliatesTab />
          </TabsContent>

          <TabsContent value="bookings">
            <BookingsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}