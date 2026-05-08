import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { FREE_TEAM_SEATS, TEAM_SEAT_PRICE_CENTS } from "../_shared/seat-sync.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: userData } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("business_id")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (!profile?.business_id) {
      return new Response(JSON.stringify({ error: "No business" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [{ count: empCount }, { data: biz }, { data: sub }] = await Promise.all([
      admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("business_id", profile.business_id),
      admin
        .from("businesses")
        .select("subscription_exempt")
        .eq("id", profile.business_id)
        .maybeSingle(),
      admin
        .from("business_subscriptions")
        .select("status")
        .eq("business_id", profile.business_id)
        .maybeSingle(),
    ]);

    const employeeCount = empCount ?? 0;
    const currentPaidSeats = Math.max(0, employeeCount - FREE_TEAM_SEATS);
    const nextSeatCharged = employeeCount >= FREE_TEAM_SEATS;
    const isExempt = !!biz?.subscription_exempt;
    const hasActiveSub = !!sub && (sub.status === "active" || sub.status === "trialing");

    return new Response(
      JSON.stringify({
        employeeCount,
        freeSeats: FREE_TEAM_SEATS,
        currentPaidSeats,
        currentMonthlyExtraCents: currentPaidSeats * TEAM_SEAT_PRICE_CENTS,
        perSeatPriceCents: TEAM_SEAT_PRICE_CENTS,
        nextSeatCharged,
        nextMonthlyExtraCents: (currentPaidSeats + 1) * TEAM_SEAT_PRICE_CENTS,
        isExempt,
        hasActiveSubscription: hasActiveSub,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
