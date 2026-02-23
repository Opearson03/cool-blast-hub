import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays } from "date-fns";
import { Download, Mail, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Subscriber {
  id: string;
  business_name: string;
  email: string | null;
  created_at: string;
  subscription_exempt: boolean;
  status: string | null;
  plan_tier: string | null;
  stripe_customer_id: string | null;
  current_period_end: string | null;
}

export function SubscribersTable() {
  const { data: subscribers, isLoading } = useQuery({
    queryKey: ["staff-subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select(`
          id,
          name,
          email,
          created_at,
          subscription_exempt,
          business_subscriptions (
            status,
            plan_tier,
            stripe_customer_id,
            current_period_end
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((b) => ({
        id: b.id,
        business_name: b.name,
        email: b.email,
        created_at: b.created_at,
        subscription_exempt: b.subscription_exempt ?? false,
        status: b.business_subscriptions?.status ?? null,
        plan_tier: b.business_subscriptions?.plan_tier ?? null,
        stripe_customer_id: b.business_subscriptions?.stripe_customer_id ?? null,
        current_period_end: b.business_subscriptions?.current_period_end ?? null,
      })) as Subscriber[];
    },
    staleTime: 60000, // Consider data fresh for 1 minute
    // No refetchInterval - using realtime from parent component
  });

  const getSubscriptionStatus = (subscriber: Subscriber) => {
    if (subscriber.subscription_exempt) {
      return { label: "Demo", variant: "secondary" as const };
    }
    
    const daysSinceCreation = differenceInDays(new Date(), new Date(subscriber.created_at));
    
    if (subscriber.status === "active" || subscriber.status === "trialing") {
      if (daysSinceCreation < 30) {
        return { label: "Trial", variant: "default" as const };
      }
      return { label: "Paid", variant: "default" as const };
    }
    
    if (subscriber.status === "canceled" || subscriber.status === "past_due") {
      return { label: subscriber.status === "canceled" ? "Cancelled" : "Past Due", variant: "destructive" as const };
    }
    
    // No subscription record
    if (daysSinceCreation < 30) {
      return { label: "Trial", variant: "outline" as const };
    }
    return { label: "Inactive", variant: "outline" as const };
  };

  const exportToCsv = () => {
    if (!subscribers?.length) return;

    const headers = ["Business Name", "Email", "Status", "Plan", "Signed Up", "Subscription End", "Stripe Customer ID"];
    const rows = subscribers.map((sub) => {
      const status = getSubscriptionStatus(sub);
      return [
        sub.business_name,
        sub.email || "",
        status.label,
        sub.plan_tier || "-",
        format(new Date(sub.created_at), "yyyy-MM-dd HH:mm"),
        sub.current_period_end ? format(new Date(sub.current_period_end), "yyyy-MM-dd") : "-",
        sub.stripe_customer_id || "-",
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `subscribers-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <CardTitle>All Subscribers</CardTitle>
          <CardDescription>
            {subscribers?.length ?? 0} businesses registered
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={exportToCsv} disabled={!subscribers?.length}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : subscribers?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No subscribers yet
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                   <TableHead className="hidden md:table-cell">Email</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead>Signed Up</TableHead>
                   <TableHead className="hidden md:table-cell">Subscription End</TableHead>
                   <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers?.map((subscriber) => {
                  const status = getSubscriptionStatus(subscriber);
                  return (
                    <TableRow key={subscriber.id}>
                      <TableCell className="font-medium">{subscriber.business_name}</TableCell>
                      <TableCell className="hidden md:table-cell">{subscriber.email || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(subscriber.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {subscriber.current_period_end
                          ? format(new Date(subscriber.current_period_end), "MMM d, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {subscriber.email && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(`mailto:${subscriber.email}`, "_blank")}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                          {subscriber.stripe_customer_id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                window.open(
                                  `https://dashboard.stripe.com/customers/${subscriber.stripe_customer_id}`,
                                  "_blank"
                                )
                              }
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
