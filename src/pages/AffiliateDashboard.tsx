import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, DollarSign, Users, Clock, ArrowLeft, LogOut } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { SEOHead } from "@/components/seo/SEOHead";

export default function AffiliateDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [affiliateId, setAffiliateId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [navigate]);

  // Fetch affiliate profile
  const { data: affiliate, isLoading: affiliateLoading } = useQuery({
    queryKey: ["affiliate-profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliates")
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !isLoading,
  });

  // Fetch referrals
  const { data: referrals } = useQuery({
    queryKey: ["affiliate-referrals", affiliate?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_referrals")
        .select("*")
        .eq("affiliate_id", affiliate!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!affiliate?.id,
  });

  // Fetch commissions
  const { data: commissions } = useQuery({
    queryKey: ["affiliate-commissions", affiliate?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_commissions")
        .select("*")
        .eq("affiliate_id", affiliate!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!affiliate?.id,
  });

  const totalEarned = commissions?.reduce((sum, c) => sum + c.amount_cents, 0) ?? 0;
  const pendingPayout = commissions?.filter(c => c.status === "pending").reduce((sum, c) => sum + c.amount_cents, 0) ?? 0;
  const totalReferrals = referrals?.length ?? 0;
  const activeReferrals = referrals?.filter(r => r.status === "active").length ?? 0;

  const affiliateLink = affiliate?.affiliate_code
    ? `${window.location.origin}/signup?aff=${affiliate.affiliate_code}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(affiliateLink);
    toast({ title: "Copied!", description: "Affiliate link copied to clipboard." });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (isLoading || affiliateLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>No Affiliate Account Found</CardTitle>
            <CardDescription>
              Your account is not linked to an affiliate profile. Apply first at the affiliate registration page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/affiliates">
              <Button>Apply Now</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Affiliate Dashboard | PourHub" description="Track your PourHub affiliate earnings and referrals." />
      
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo className="h-8" />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Affiliate Dashboard
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Status Banner */}
        {affiliate.status === "pending" && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
            <p className="text-sm font-medium text-yellow-500">
              ⏳ Your application is under review. We'll notify you once approved.
            </p>
          </div>
        )}

        {affiliate.status === "suspended" && (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-center">
            <p className="text-sm font-medium text-destructive">
              Your affiliate account has been suspended. Please contact support.
            </p>
          </div>
        )}

        {/* Affiliate Link */}
        {affiliate.status === "approved" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Affiliate Link</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-muted rounded-md text-sm break-all">
                  {affiliateLink}
                </code>
                <Button size="sm" onClick={copyLink}>
                  <Copy className="h-4 w-4 mr-1" /> Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Share this link. New signups get 50% off for 2 months, and you earn 10% for 10 months.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Referrals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalReferrals}</div>
              <p className="text-xs text-muted-foreground">{activeReferrals} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Earned</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${(totalEarned / 100).toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payout</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">${(pendingPayout / 100).toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Code</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-mono font-bold">{affiliate.affiliate_code}</div>
            </CardContent>
          </Card>
        </div>

        {/* Referrals Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            {referrals && referrals.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Monthly</TableHead>
                    <TableHead>Months Left</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((ref) => (
                    <TableRow key={ref.id}>
                      <TableCell className="font-medium">{ref.customer_email}</TableCell>
                      <TableCell className="capitalize">{ref.subscription_tier || "—"}</TableCell>
                      <TableCell>${(ref.monthly_amount / 100).toFixed(2)}</TableCell>
                      <TableCell>{ref.months_remaining}/10</TableCell>
                      <TableCell>
                        <Badge variant={ref.status === "active" ? "default" : ref.status === "completed" ? "secondary" : "destructive"}>
                          {ref.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">
                No referrals yet. Share your link to start earning!
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
