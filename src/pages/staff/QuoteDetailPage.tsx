import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, LogOut, Loader2, Mail, Phone, MapPin, Users } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { format } from "date-fns";

export default function QuoteDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/staff");
  };

  const { data: quote, isLoading } = useQuery({
    queryKey: ["enterprise-quote", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enterprise_quotes")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const fmt = (n: number | null | undefined) =>
    `$${Math.round(Number(n ?? 0)).toLocaleString()}`;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo className="h-8" />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Quote Summary
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/staff/dashboard")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            {isLoading ? (
              <h1 className="text-2xl font-bold text-foreground">Loading…</h1>
            ) : quote ? (
              <>
                <h1 className="text-2xl font-bold text-foreground">
                  {quote.client_name}
                  {quote.business_name && (
                    <span className="text-muted-foreground font-normal text-lg ml-2">
                      · {quote.business_name}
                    </span>
                  )}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {quote.quote_number} · Created{" "}
                  {format(new Date(quote.created_at), "d MMM yyyy 'at' h:mma")}
                </p>
              </>
            ) : (
              <h1 className="text-2xl font-bold text-foreground">Quote not found</h1>
            )}
          </div>
          <Button onClick={() => navigate("/staff/quotes/new")}>New Quote</Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : quote ? (
          <div className="space-y-4">
            {/* Headline pricing */}
            <Card className="bg-gradient-to-br from-primary/10 via-card to-card border-primary/20">
              <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Estimate Range
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    {fmt(quote.estimate_low)} – {fmt(quote.estimate_high)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Recommended Quote
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {fmt(quote.recommended_quote)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Monthly Support
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    {Number(quote.monthly_support) > 0
                      ? `${fmt(quote.monthly_support)}/mo`
                      : "—"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Client info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Client</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {quote.client_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{quote.client_email}</span>
                  </div>
                )}
                {quote.client_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{quote.client_phone}</span>
                  </div>
                )}
                {quote.region && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{quote.region}</span>
                  </div>
                )}
                {(quote.team_size || quote.crew_count || quote.concurrent_jobs) && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {quote.team_size ? `${quote.team_size} staff` : ""}
                      {quote.crew_count ? ` · ${quote.crew_count} crews` : ""}
                      {quote.concurrent_jobs
                        ? ` · ${quote.concurrent_jobs} concurrent jobs`
                        : ""}
                    </span>
                  </div>
                )}
                {quote.meeting_notes && (
                  <div className="sm:col-span-2 mt-2 p-3 rounded-md bg-muted/50 text-muted-foreground whitespace-pre-wrap">
                    {quote.meeting_notes}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pricing Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row
                  label="Base tier"
                  value={`${fmt(quote.base_subtotal_low)} – ${fmt(quote.base_subtotal_high)}`}
                />
                <Row label="Modules subtotal" value={fmt(quote.modules_subtotal)} />
                <Row
                  label="Integrations subtotal"
                  value={fmt(quote.integrations_subtotal)}
                />
                <Row
                  label="Strategic fees"
                  value={fmt(quote.strategic_fees_total)}
                />
                <Row
                  label="Complexity multiplier"
                  value={`×${Number(quote.complexity_multiplier).toFixed(2)}`}
                />
                <Row
                  label="Urgency multiplier"
                  value={`×${Number(quote.urgency_multiplier).toFixed(2)}`}
                />
              </CardContent>
            </Card>

            {/* Internal */}
            {(quote.internal_notes ||
              quote.profit_margin_pct ||
              quote.estimated_hours ||
              quote.confidence_rating) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Internal Only</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {quote.confidence_rating && (
                    <Row
                      label="Confidence"
                      value={
                        quote.confidence_rating.charAt(0).toUpperCase() +
                        quote.confidence_rating.slice(1)
                      }
                    />
                  )}
                  {quote.profit_margin_pct != null && (
                    <Row
                      label="Profit margin"
                      value={`${Number(quote.profit_margin_pct)}%`}
                    />
                  )}
                  {quote.estimated_hours != null && (
                    <Row
                      label="Estimated dev hours"
                      value={`${Number(quote.estimated_hours)}h`}
                    />
                  )}
                  {quote.internal_notes && (
                    <div className="mt-3 p-3 rounded-md bg-muted/50 whitespace-pre-wrap">
                      {quote.internal_notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">Quote not found.</p>
        )}
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border last:border-0 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
