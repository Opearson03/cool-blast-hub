import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface MonthlyTrendItem {
  month: string;
  new_count: number;
  canceled_count: number;
}

interface ChurnStats {
  canceled_30d: number;
  canceled_7d: number;
  new_30d: number;
  net_growth_30d: number;
  churn_rate_pct: number;
  monthly_trend: MonthlyTrendItem[];
}

export function ChurnMetrics() {
  const { data, isLoading } = useQuery({
    queryKey: ["staff-churn-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_churn_stats");
      if (error) throw error;
      return data as unknown as ChurnStats;
    },
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
          <Skeleton className="h-[240px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const churnRate = data?.churn_rate_pct ?? 0;
  const netGrowth = data?.net_growth_30d ?? 0;

  const churnColor =
    churnRate === 0
      ? "text-muted-foreground"
      : churnRate < 5
      ? "text-green-600"
      : churnRate < 10
      ? "text-yellow-600"
      : "text-destructive";

  const NetIcon =
    netGrowth > 0 ? TrendingUp : netGrowth < 0 ? TrendingDown : Minus;
  const netColor =
    netGrowth > 0
      ? "text-green-600"
      : netGrowth < 0
      ? "text-destructive"
      : "text-muted-foreground";

  const chartData = (data?.monthly_trend ?? []).map((item) => ({
    month: item.month,
    New: item.new_count,
    Canceled: item.canceled_count,
  }));

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Churn & Growth</CardTitle>
        <CardDescription>
          Subscription cancellations and net growth over time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key metrics row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Monthly Churn Rate
            </p>
            <p className={`text-2xl font-bold ${churnColor}`}>
              {churnRate}%
            </p>
            <p className="text-xs text-muted-foreground">
              this calendar month
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Net Growth (30d)
            </p>
            <div className={`flex items-center gap-1 ${netColor}`}>
              <NetIcon className="h-5 w-5" />
              <p className="text-2xl font-bold">
                {netGrowth > 0 ? "+" : ""}
                {netGrowth}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              new minus canceled
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Canceled (30d)
            </p>
            <p className="text-2xl font-bold">
              {data?.canceled_30d ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">
              {data?.canceled_7d ?? 0} in last 7 days
            </p>
          </div>
        </div>

        {/* Bar chart */}
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend />
              <Bar
                dataKey="New"
                fill="hsl(var(--primary))"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="Canceled"
                fill="hsl(var(--destructive))"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
