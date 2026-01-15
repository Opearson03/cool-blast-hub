import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";

export function VisitorAnalytics() {
  const startDate = format(subDays(new Date(), 30), "yyyy-MM-dd");
  const endDate = format(new Date(), "yyyy-MM-dd");

  // Note: This would typically come from an edge function that calls the Lovable analytics API
  // For now, we'll show a placeholder with the ability to integrate later
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["staff-visitor-analytics", startDate, endDate],
    queryFn: async () => {
      // Placeholder data - in production this would call an edge function
      // that fetches from Lovable's analytics API
      const mockData = [];
      for (let i = 30; i >= 0; i--) {
        const date = subDays(new Date(), i);
        mockData.push({
          date: format(date, "MMM d"),
          pageViews: Math.floor(Math.random() * 100) + 50,
          uniqueVisitors: Math.floor(Math.random() * 50) + 20,
        });
      }
      return mockData;
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  const totalPageViews = analytics?.reduce((sum, day) => sum + day.pageViews, 0) ?? 0;
  const totalVisitors = analytics?.reduce((sum, day) => sum + day.uniqueVisitors, 0) ?? 0;
  const avgDailyViews = Math.round(totalPageViews / (analytics?.length ?? 1));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Page Views (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPageViews.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unique Visitors (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVisitors.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Daily Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgDailyViews}</div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Visitor Trends</CardTitle>
          <CardDescription>Page views and unique visitors over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Area
                  type="monotone"
                  dataKey="pageViews"
                  name="Page Views"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.2)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="uniqueVisitors"
                  name="Unique Visitors"
                  stroke="hsl(var(--chart-2))"
                  fill="hsl(var(--chart-2) / 0.2)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
