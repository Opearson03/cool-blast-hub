import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, FileText, Clock, TrendingUp } from "lucide-react";
import { StaffLayout } from "@/components/staff/StaffLayout";

export default function StaffDashboard() {
  const [stats, setStats] = useState({
    upcomingShifts: 0,
    pendingSWMS: 0,
    recentHours: 0,
    thisMonthHours: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const userId = session.user.id;
    const today = new Date().toISOString().split("T")[0];
    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0];

    // Upcoming shifts
    const { data: shiftsData } = await supabase
      .from("job_assignments")
      .select("id, jobs!inner(scheduled_date)")
      .eq("staff_id", userId)
      .gte("jobs.scheduled_date", today);

    // Pending SWMS
    const { data: swmsData } = await supabase
      .from("swms_documents")
      .select(`
        id,
        job_assignments!inner(staff_id)
      `)
      .eq("job_assignments.staff_id", userId)
      .eq("status", "approved");

    let pendingCount = 0;
    if (swmsData) {
      const checks = await Promise.all(
        swmsData.map(async (swms) => {
          const { data: signoff } = await supabase
            .from("swms_signoffs")
            .select("id")
            .eq("swms_id", swms.id)
            .eq("staff_id", userId)
            .single();
          return !signoff;
        })
      );
      pendingCount = checks.filter(Boolean).length;
    }

    // This month hours
    const { data: timesheetsData } = await supabase
      .from("timesheets")
      .select("total_hours")
      .eq("staff_id", userId)
      .gte("date", firstOfMonth);

    const monthHours = timesheetsData?.reduce((sum, t) => sum + (t.total_hours || 0), 0) || 0;

    // Recent week hours
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const { data: recentData } = await supabase
      .from("timesheets")
      .select("total_hours")
      .eq("staff_id", userId)
      .gte("date", lastWeek.toISOString().split("T")[0]);

    const weekHours = recentData?.reduce((sum, t) => sum + (t.total_hours || 0), 0) || 0;

    setStats({
      upcomingShifts: shiftsData?.length || 0,
      pendingSWMS: pendingCount,
      recentHours: Math.round(weekHours * 10) / 10,
      thisMonthHours: Math.round(monthHours * 10) / 10,
    });
    setLoading(false);
  };

  if (loading) {
    return (
      <StaffLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's your overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Shifts</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingShifts}</div>
              <p className="text-xs text-muted-foreground">Scheduled jobs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SWMS to Sign</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingSWMS}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingSWMS > 0 ? "Requires attention" : "All signed"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentHours}h</div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.thisMonthHours}h</div>
              <p className="text-xs text-muted-foreground">Total hours</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link to="/staff/shifts">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <Calendar className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>View My Shifts</CardTitle>
                  <CardDescription>See your upcoming job assignments</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            {stats.pendingSWMS > 0 && (
              <Link to="/staff/swms">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-destructive">
                  <CardHeader>
                    <FileText className="h-8 w-8 mb-2 text-destructive" />
                    <CardTitle>Sign SWMS</CardTitle>
                    <CardDescription>
                      {stats.pendingSWMS} document{stats.pendingSWMS !== 1 ? "s" : ""} need your signature
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )}

            <Link to="/staff/timesheets">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <Clock className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>Manage Timesheets</CardTitle>
                  <CardDescription>Log hours and track submissions</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
