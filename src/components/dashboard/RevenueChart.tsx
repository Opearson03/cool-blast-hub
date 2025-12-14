import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export const RevenueChart = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      // Fetch completed jobs with revenue
      const { data: jobs } = await supabase
        .from("jobs")
        .select("completion_date, quoted_amount, status")
        .not("completion_date", "is", null)
        .gte("completion_date", new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
        .order("completion_date", { ascending: true });

      // Group by month
      const monthlyData: { [key: string]: { completed: number; quoted: number } } = {};

      jobs?.forEach((job) => {
        if (job.completion_date) {
          const month = new Date(job.completion_date).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });
          if (!monthlyData[month]) {
            monthlyData[month] = { completed: 0, quoted: 0 };
          }
          if (job.status === "completed" || job.status === "invoiced") {
            monthlyData[month].completed += Number(job.quoted_amount) || 0;
          }
        }
      });

      // Fetch scheduled jobs for expected revenue
      const { data: scheduledJobs } = await supabase
        .from("jobs")
        .select("scheduled_date, quoted_amount, status")
        .not("scheduled_date", "is", null)
        .in("status", ["quoted", "scheduled"])
        .order("scheduled_date", { ascending: true });

      scheduledJobs?.forEach((job) => {
        if (job.scheduled_date) {
          const month = new Date(job.scheduled_date).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });
          if (!monthlyData[month]) {
            monthlyData[month] = { completed: 0, quoted: 0 };
          }
          monthlyData[month].quoted += Number(job.quoted_amount) || 0;
        }
      });

      const chartData = Object.entries(monthlyData).map(([month, values]) => ({
        month,
        completed: values.completed,
        expected: values.quoted,
      }));

      setData(chartData);
    } catch (error) {
      console.error("Error fetching revenue data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
          <CardDescription>Monthly revenue and projections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full animate-pulse bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    completed: {
      label: "Completed Revenue",
      color: "hsl(var(--primary))",
    },
    expected: {
      label: "Expected Revenue",
      color: "hsl(var(--secondary))",
    },
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
        <CardDescription>Monthly revenue from completed jobs and expected revenue from scheduled jobs</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="completed" fill="var(--color-completed)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expected" fill="var(--color-expected)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
