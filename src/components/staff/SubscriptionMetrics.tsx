import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface SubscriptionStats {
  total_businesses: number;
  total_users: number;
  active_subscriptions: number;
  trial_subscriptions: number;
  demo_accounts: number;
  paid_100_plan: number;
  trial_100_plan: number;
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
  // Single tier at $100/month
  const paidPrice = 100;
  const paidCount = stats?.paid_100_plan ?? 0;
  const trialCount = stats?.trial_100_plan ?? 0;
  const demoCount = stats?.demo_accounts ?? 0;
  const totalBusinesses = stats?.total_businesses ?? 0;
  
  // Calculate MRR (Monthly Recurring Revenue) - only from paid, not trials
  const mrr = paidCount * paidPrice;

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
        <CardDescription>Active subscriptions by plan</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* MRR Card */}
        <div className="rounded-lg bg-primary/10 p-4">
          <div className="text-sm font-medium text-muted-foreground">Monthly Recurring Revenue</div>
          <div className="text-3xl font-bold text-primary">${mrr.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Based on {paidCount} paid subscription{paidCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Plan breakdown */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">$100 per month plan (paid)</span>
              <span className="font-medium">{paidCount}</span>
            </div>
            <Progress 
              value={totalBusinesses > 0 ? (paidCount / totalBusinesses) * 100 : 0} 
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-blue-600">$100 per month plan (trial)</span>
              <span className="font-medium">{trialCount}</span>
            </div>
            <Progress 
              value={totalBusinesses > 0 ? (trialCount / totalBusinesses) * 100 : 0} 
              className="h-2 [&>div]:bg-blue-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Demo accounts (exempt)</span>
              <span className="font-medium">{demoCount}</span>
            </div>
            <Progress 
              value={totalBusinesses > 0 ? (demoCount / totalBusinesses) * 100 : 0} 
              className="h-2 [&>div]:bg-amber-500"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="pt-4 border-t text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Total businesses</span>
            <span className="font-medium">{totalBusinesses}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
