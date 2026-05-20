import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Plus, Check, MapPin } from "lucide-react";

interface LocalRep {
  brand_id: string;
  brand_name: string;
  brand_logo_url: string | null;
  rep_id: string;
  rep_name: string;
  rep_role: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  branch_name: string | null;
  branch_address: string | null;
  postcode: string | null;
  state: string | null;
  region: string | null;
  distance_km: number | null;
}

interface PreferredRepsBlockProps {
  siteAddress?: string;
  isQuote: boolean;
  selectedKeys: string[]; // selected rep ids (prefixed "rep:<id>")
  onPick: (rep: LocalRep) => void;
}

function extractPostcode(addr: string): string | null {
  const m = addr.match(/\b(\d{4})\b/);
  return m ? m[1] : null;
}

export function PreferredRepsBlock({
  siteAddress = "",
  isQuote,
  selectedKeys,
  onPick,
}: PreferredRepsBlockProps) {
  // 1. Resolve postcode: site address first, fall back to the user's business postcode
  const { data: postcode } = useQuery({
    queryKey: ["preferred-reps-postcode", siteAddress],
    queryFn: async () => {
      const fromSite = extractPostcode(siteAddress);
      if (fromSite) return fromSite;

      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (!profile?.business_id) return null;
      const { data: biz } = await supabase
        .from("businesses")
        .select("postcode")
        .eq("id", profile.business_id)
        .maybeSingle();
      return biz?.postcode ?? null;
    },
  });

  const { data: reps = [], isLoading } = useQuery({
    queryKey: ["local-supplier-reps", postcode],
    enabled: !!postcode,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_local_supplier_reps", {
        _postcode: postcode!,
      });
      if (error) throw error;
      return (data ?? []) as LocalRep[];
    },
  });

  if (!postcode || isLoading || reps.length === 0) return null;

  const isSelected = (id: string) => selectedKeys.includes(`rep:${id}`);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Sparkles className="w-4 h-4 text-primary" />
        Your local reps
        <span className="text-xs text-muted-foreground font-normal">
          near {postcode}
        </span>
      </div>
      <div className="grid gap-2">
        {reps.map((rep) => {
          const selected = isSelected(rep.rep_id);
          return (
            <div
              key={rep.rep_id}
              className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-accent/30 transition-colors"
            >
              {rep.brand_logo_url ? (
                <img
                  src={rep.brand_logo_url}
                  alt={rep.brand_name}
                  className="w-10 h-10 rounded object-contain bg-muted p-1 flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {rep.brand_name[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{rep.rep_name}</span>
                  <Badge variant="outline" className="text-xs h-5">
                    {rep.brand_name}
                  </Badge>
                  {rep.rep_role && (
                    <span className="text-xs text-muted-foreground">{rep.rep_role}</span>
                  )}
                  {rep.distance_km !== null && (
                    <span className="text-xs text-muted-foreground inline-flex items-center gap-0.5">
                      <MapPin className="w-3 h-3" />
                      {rep.distance_km}km
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {[rep.email, rep.phone || rep.mobile, rep.branch_name || rep.region || rep.state]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <Button
                size="sm"
                variant={selected ? "secondary" : "outline"}
                onClick={() => onPick(rep)}
                disabled={selected && !isQuote}
              >
                {selected ? (
                  <>
                    <Check className="w-3 h-3 mr-1" /> Added
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3 mr-1" /> {isQuote ? "Add to RFQ" : "Select"}
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
