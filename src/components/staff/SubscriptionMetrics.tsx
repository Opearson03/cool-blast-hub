import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

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

interface SubscriptionMetricsProps {
  stats: SubscriptionStats | undefined;
  isLoading: boolean;
  fullWidth?: boolean;
}

export function SubscriptionMetrics({ stats, isLoading, fullWidth }: SubscriptionMetricsProps) {
  const estimatingPaid = stats?.estimating_paid ?? 0;
  const estimatingTrial = stats?.estimating_trial ?? 0;
  const proPaid = stats?.pro_paid ?? 0;
  const proTrial = stats?.pro_trial ?? 0;
  const legacyPaid = stats?.legacy_paid ?? 0;
  const demoCount = stats?.demo_accounts ?? 0;
  const totalBusinesses = stats?.total_businesses ?? 0;

  const mrr = (estimatingPaid * 99) + (proPaid * 199) + (legacyPaid * 100);

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

  const tiers = [
    { label: "Pro $199/mo (paid)", count: proPaid, color: "" },
    { label: "Pro $199/mo (trial)", count: proTrial, color: "[&>div]:bg-blue-500", textColor: "text-blue-600", showIfZero: false },
    { label: "Estimating $99/mo (paid)", count: estimatingPaid, color: "" },
    { label: "Estimating $99/mo (trial)", count: estimatingTrial, color: "[&>div]:bg-blue-500", textColor: "text-blue-600", showIfZero: false },
    { label: "Legacy $100/mo", count: legacyPaid, color: "[&>div]:bg-orange-500", textColor: "text-orange-600", showIfZero: false },
    { label: "Demo accounts (exempt)", count: demoCount, color: "[&>div]:bg-amber-500", textColor: "text-muted-foreground", showIfZero: true },
  ];

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
            Based on {estimatingPaid + proPaid + legacyPaid} paid subscription{(estimatingPaid + proPaid + legacyPaid) !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Plan breakdown */}
        <div className="space-y-4">
          {tiers.map((tier) => {
            if (!tier.showIfZero && tier.count === 0) return null;
            return (
              <div key={tier.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className={`font-medium ${tier.textColor ?? ''}`}>{tier.label}</span>
                  <span className="font-medium">{tier.count}</span>
                </div>
                <Progress
                  value={totalBusinesses > 0 ? (tier.count / totalBusinesses) * 100 : 0}
                  className={`h-2 ${tier.color}`}
                />
              </div>
            );
          })}
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
