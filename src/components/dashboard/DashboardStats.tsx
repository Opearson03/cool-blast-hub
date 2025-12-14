import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Briefcase, Users, FileCheck, TrendingUp, Clock } from "lucide-react";

export const DashboardStats = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    expectedRevenue: 0,
    activeJobs: 0,
    pipelineJobs: 0,
    staffCount: 0,
    swmsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Fetch jobs data
      const { data: jobs } = await supabase
        .from("jobs")
        .select("status, quoted_amount, scheduled_date");

      // Fetch invoices for month-to-date revenue (only paid invoices from this month)
      const { data: invoices } = await supabase
        .from("invoices")
        .select("total, status, paid_date")
        .eq("status", "paid")
        .gte("paid_date", firstDayOfMonth.toISOString().split("T")[0]);

      const monthToDateRevenue = invoices?.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0) || 0;
      const activeJobs = jobs?.filter(j => j.status === "in_progress").length || 0;
      const pipelineJobs = jobs?.filter(j => ["quoted", "scheduled"].includes(j.status)).length || 0;
      
      // Expected revenue from jobs scheduled in next 30 days
      const expectedRevenue = jobs
        ?.filter(j => {
          if (!j.scheduled_date || !["quoted", "scheduled"].includes(j.status)) return false;
          const scheduledDate = new Date(j.scheduled_date);
          return scheduledDate >= now && scheduledDate <= thirtyDaysFromNow;
        })
        .reduce((sum, job) => sum + (Number(job.quoted_amount) || 0), 0) || 0;

      setStats({
        totalRevenue: monthToDateRevenue,
        expectedRevenue,
        activeJobs,
        pipelineJobs,
        staffCount: 0,
        swmsCount: 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Month to Date Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: "From paid invoices this month",
      trend: "+12%",
    },
    {
      title: "Expected Revenue (30 Days)",
      value: `$${stats.expectedRevenue.toLocaleString()}`,
      icon: TrendingUp,
      description: "From jobs scheduled in next 30 days",
      trend: "+8%",
    },
    {
      title: "Active Jobs",
      value: stats.activeJobs,
      icon: Briefcase,
      description: "Currently in progress",
    },
    {
      title: "Pipeline Jobs",
      value: stats.pipelineJobs,
      icon: Clock,
      description: "Quoted & scheduled",
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-32 mb-2"></div>
              <div className="h-3 bg-muted rounded w-40"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {statCards.map((stat, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">{stat.description}</p>
              {stat.trend && (
                <span className="text-xs font-medium text-green-600">{stat.trend}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
