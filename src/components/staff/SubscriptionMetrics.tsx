import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface SubscriptionStats {
  total_businesses: number;
  total_users: number;
  active_subscriptions: number;
  trial_subscriptions: number;
  starter_count: number;
  professional_count: number;
  enterprise_count: number;
  waiting_list_count: number;
  recent_signups_7d: number;
  recent_signups_30d: number;
}

interface SubscriptionMetricsProps {
  stats: SubscriptionStats | undefined;
  isLoading: boolean;
  fullWidth?: boolean;
}

export function SubscriptionMetrics({ stats, isLoading, fullWidth }: SubscriptionMetricsProps) {
  const totalPaid = (stats?.starter_count ?? 0) + (stats?.professional_count ?? 0) + (stats?.enterprise_count ?? 0);

  // Calculate MRR (Monthly Recurring Revenue)
  const starterPrice = 49;
  const professionalPrice = 99;
  const enterprisePrice = 199;
  
  const mrr = 
    (stats?.starter_count ?? 0) * starterPrice +
    (stats?.professional_count ?? 0) * professionalPrice +
    (stats?.enterprise_count ?? 0) * enterprisePrice;

  if (isLoading) {
    return (
      <Card className={fullWidth ? "col-span-full" : ""}>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={fullWidth ? "col-span-full" : ""}>
      <CardHeader>
        <CardTitle>Subscription Breakdown</CardTitle>
        <CardDescription>Active subscriptions by plan tier</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* MRR Card */}
        <div className="rounded-lg bg-primary/10 p-4">
          <div className="text-sm font-medium text-muted-foreground">Monthly Recurring Revenue</div>
          <div className="text-3xl font-bold text-primary">${mrr.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Based on {totalPaid} paid subscriptions
          </div>
        </div>

        {/* Plan breakdown */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Starter (${starterPrice}/mo)</span>
              <span className="font-medium">{stats?.starter_count ?? 0}</span>
            </div>
            <Progress 
              value={totalPaid > 0 ? ((stats?.starter_count ?? 0) / totalPaid) * 100 : 0} 
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Professional (${professionalPrice}/mo)</span>
              <span className="font-medium">{stats?.professional_count ?? 0}</span>
            </div>
            <Progress 
              value={totalPaid > 0 ? ((stats?.professional_count ?? 0) / totalPaid) * 100 : 0} 
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Enterprise (${enterprisePrice}/mo)</span>
              <span className="font-medium">{stats?.enterprise_count ?? 0}</span>
            </div>
            <Progress 
              value={totalPaid > 0 ? ((stats?.enterprise_count ?? 0) / totalPaid) * 100 : 0} 
              className="h-2"
            />
          </div>
        </div>

        {/* Trial info */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Active Trials</span>
            <span className="font-medium">{stats?.trial_subscriptions ?? 0}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
