import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export const JobsOverview = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobsData();
  }, []);

  const fetchJobsData = async () => {
    try {
      const { data: jobs } = await supabase.from("jobs").select("status");

      const statusCounts: { [key: string]: number } = {};
      jobs?.forEach((job) => {
        statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
      });

      const chartData = Object.entries(statusCounts).map(([status, count]) => ({
        name: status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        value: count,
        status,
      }));

      setData(chartData);
    } catch (error) {
      console.error("Error fetching jobs data:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = {
    quoted: "hsl(var(--chart-1))",
    scheduled: "hsl(var(--chart-2))",
    in_progress: "hsl(var(--chart-3))",
    completed: "hsl(var(--chart-4))",
    invoiced: "hsl(var(--chart-5))",
    cancelled: "hsl(var(--muted))",
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Jobs by Status</CardTitle>
          <CardDescription>Distribution of jobs across different stages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full animate-pulse bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = data.reduce((config, item) => {
    config[item.status] = {
      label: item.name,
      color: COLORS[item.status as keyof typeof COLORS] || "hsl(var(--muted))",
    };
    return config;
  }, {} as any);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Jobs by Status</CardTitle>
        <CardDescription>Distribution of jobs across different stages</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.status as keyof typeof COLORS] || "#ccc"} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
