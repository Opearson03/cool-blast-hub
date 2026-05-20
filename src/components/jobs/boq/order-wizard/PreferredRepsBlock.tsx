import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Plus, Check } from "lucide-react";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

interface Rep {
  id: string;
  brand_id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  region: string | null;
  state: string | null;
  postcodes: string[];
  branch_name: string | null;
}

interface PreferredRepsBlockProps {
  siteAddress?: string;
  isQuote: boolean;
  selectedKeys: string[]; // selected rep ids (prefixed "rep:<id>")
  onPick: (rep: Rep, brand: Brand | undefined) => void;
}

// Australian state from address (rough heuristic)
function extractState(addr: string): string | null {
  const m = addr.match(/\b(NSW|VIC|QLD|WA|SA|TAS|NT|ACT)\b/i);
  return m ? m[1].toUpperCase() : null;
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
  const state = extractState(siteAddress);
  const postcode = extractPostcode(siteAddress);

  const { data: brands = [] } = useQuery({
    queryKey: ["supplier-brands-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_brands")
        .select("id, name, slug, logo_url")
        .eq("is_active", true);
      if (error) throw error;
      return data as Brand[];
    },
  });

  const { data: reps = [], isLoading } = useQuery({
    queryKey: ["preferred-reps", state, postcode],
    queryFn: async () => {
      // Try postcode-exact match first, fall back to state, fall back to all active
      let q = supabase
        .from("supplier_reps")
        .select("id, brand_id, name, role, email, phone, mobile, region, state, postcodes, branch_name")
        .eq("is_active", true)
        .order("name");

      if (postcode) q = q.contains("postcodes", [postcode]);
      const { data, error } = await q;
      if (error) throw error;
      if ((data ?? []).length > 0) return data as Rep[];

      // Fallback: same state
      if (state) {
        const { data: byState } = await supabase
          .from("supplier_reps")
          .select("id, brand_id, name, role, email, phone, mobile, region, state, postcodes, branch_name")
          .eq("is_active", true)
          .eq("state", state)
          .order("name")
          .limit(10);
        if ((byState ?? []).length > 0) return byState as Rep[];
      }

      // Final fallback: any active rep (limit 6)
      const { data: any } = await supabase
        .from("supplier_reps")
        .select("id, brand_id, name, role, email, phone, mobile, region, state, postcodes, branch_name")
        .eq("is_active", true)
        .order("name")
        .limit(6);
      return (any ?? []) as Rep[];
    },
  });

  if (isLoading || reps.length === 0) return null;

  const brandById = (id: string) => brands.find((b) => b.id === id);
  const isSelected = (id: string) => selectedKeys.includes(`rep:${id}`);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Sparkles className="w-4 h-4 text-primary" />
        Preferred suppliers
        {postcode && (
          <span className="text-xs text-muted-foreground font-normal">
            near {postcode}{state ? ` · ${state}` : ""}
          </span>
        )}
      </div>
      <div className="grid gap-2">
        {reps.map((rep) => {
          const brand = brandById(rep.brand_id);
          const selected = isSelected(rep.id);
          return (
            <div
              key={rep.id}
              className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-accent/30 transition-colors"
            >
              {brand?.logo_url ? (
                <img
                  src={brand.logo_url}
                  alt={brand.name}
                  className="w-8 h-8 rounded object-contain bg-muted p-1 flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs flex-shrink-0">
                  {brand?.name?.[0] ?? "?"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{rep.name}</span>
                  {brand && (
                    <Badge variant="outline" className="text-xs h-5">
                      {brand.name}
                    </Badge>
                  )}
                  {rep.role && (
                    <span className="text-xs text-muted-foreground">{rep.role}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {[rep.email, rep.phone || rep.mobile, rep.region || rep.state]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <Button
                size="sm"
                variant={selected ? "secondary" : "outline"}
                onClick={() => onPick(rep, brand)}
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
