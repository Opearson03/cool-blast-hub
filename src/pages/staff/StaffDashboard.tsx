import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LogOut, Users, Building2, CreditCard, TrendingUp, Mail, CalendarDays, Handshake, Globe, Calculator, Truck } from "lucide-react";
import { toast } from "sonner";
import Logo from "@/components/ui/Logo";
import { SubscriptionMetrics } from "@/components/staff/SubscriptionMetrics";
import { SignupTrends } from "@/components/staff/SignupTrends";
import { ChurnMetrics } from "@/components/staff/ChurnMetrics";
import { CrmTab } from "@/components/staff/crm/CrmTab";
import { CustomersTab } from "@/components/staff/CustomersTab";
import { PartnersTab } from "@/components/staff/PartnersTab";
import { EnterpriseRedirectsTab } from "@/components/staff/EnterpriseRedirectsTab";
import { QuotingTab } from "@/components/staff/quotes/QuotingTab";
import { SupplierDirectoryTab } from "@/components/staff/SupplierDirectoryTab";

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
    staleTime: 60000,
  });

  const { data: upcomingBookingsCount } = useQuery({
    queryKey: ["staff-upcoming-bookings-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .gte("booking_time", new Date().toISOString())
        .eq("status", "confirmed");
      if (error) throw error;
      return count || 0;
    },
    enabled: !isCheckingAuth,
    staleTime: 60000,
  });

  const handleRealtimeUpdate = useCallback(() => {
    refetchStats();
    queryClient.invalidateQueries({ queryKey: ["staff-subscribers"] });
    queryClient.invalidateQueries({ queryKey: ["staff-signup-trends"] });
    queryClient.invalidateQueries({ queryKey: ["staff-all-users"] });
    queryClient.invalidateQueries({ queryKey: ["staff-churn-stats"] });
  }, [refetchStats, queryClient]);

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
        { event: '*', schema: 'public', table: 'crm_leads' },
        () => handleRealtimeUpdate()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crm_inbox' },
        () => handleRealtimeUpdate()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          handleRealtimeUpdate();
          queryClient.invalidateQueries({ queryKey: ["staff-bookings"] });
          queryClient.invalidateQueries({ queryKey: ["staff-upcoming-bookings-count"] });
        }
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
            onClick={() => setActiveTab("crm")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Upcoming Bookings
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {upcomingBookingsCount ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Confirmed calls scheduled
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer transition-colors hover:bg-accent/50"
            onClick={() => setActiveTab("customers")}
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
            onClick={() => setActiveTab("customers")}
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
            <TabsTrigger value="overview">
              <TrendingUp className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="customers">
              <Users className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Customers</span>
            </TabsTrigger>
            <TabsTrigger value="crm">
              <Mail className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">CRM</span>
            </TabsTrigger>
            <TabsTrigger value="quoting">
              <Calculator className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Quoting</span>
            </TabsTrigger>
            <TabsTrigger value="partners">
              <Handshake className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Partners</span>
            </TabsTrigger>
            <TabsTrigger value="enterprise">
              <Globe className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Enterprise</span>
            </TabsTrigger>
            <TabsTrigger value="suppliers">
              <Truck className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Suppliers</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SignupTrends />
              <SubscriptionMetrics stats={stats} isLoading={statsLoading} />
              <ChurnMetrics />
            </div>
          </TabsContent>

          <TabsContent value="customers">
            <CustomersTab />
          </TabsContent>

          <TabsContent value="crm">
            <CrmTab />
          </TabsContent>

          <TabsContent value="quoting">
            <QuotingTab />
          </TabsContent>

          <TabsContent value="partners">
            <PartnersTab />
          </TabsContent>

          <TabsContent value="enterprise">
            <EnterpriseRedirectsTab />
          </TabsContent>

          <TabsContent value="suppliers">
            <SupplierDirectoryTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
