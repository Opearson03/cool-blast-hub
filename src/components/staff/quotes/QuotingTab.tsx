import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Calculator, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function QuotingTab() {
  const navigate = useNavigate();

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["enterprise-quotes-recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enterprise_quotes")
        .select("id, quote_number, client_name, business_name, recommended_quote, status, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-primary/10 via-card to-card border-primary/20">
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Calculator className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Enterprise Quoting Tool
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Build live, custom quotes during sales meetings. Modular pricing,
                instant totals.
              </p>
            </div>
          </div>
          <Button onClick={() => navigate("/staff/quotes/new")} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            New Quote
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Quotes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No quotes yet. Create your first one to get started.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {quotes.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => navigate(`/staff/quotes/${q.id}`)}
                  className="w-full flex items-center justify-between gap-4 py-3 px-2 hover:bg-muted/50 rounded-md transition-colors text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">
                        {q.client_name}
                      </span>
                      {q.business_name && (
                        <span className="text-xs text-muted-foreground">
                          · {q.business_name}
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                        {q.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {q.quote_number} ·{" "}
                      {formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Recommended</p>
                      <p className="text-sm font-semibold text-primary">
                        ${Math.round(Number(q.recommended_quote)).toLocaleString()}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
