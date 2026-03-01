import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Validate staff JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: isStaff } = await serviceClient.rpc("is_pourhub_staff", {
      _user_id: userId,
    });

    if (!isStaff) {
      return new Response(JSON.stringify({ error: "Access denied: pourhub_staff role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, fullName, businessName, tier, referralCount } = await req.json();

    if (!email || !tier) {
      return new Response(JSON.stringify({ error: "email and tier are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Free months: 1 base + 1 per referral
    const freeMonths = 1 + (referralCount ?? 0);

    const origin = Deno.env.get("APP_URL") || "https://cool-blast-hub.lovable.app";

    // Build a pre-filled signup URL instead of a Stripe checkout session
    const params = new URLSearchParams({
      tier,
      email,
      ...(fullName ? { name: fullName } : {}),
      ...(businessName ? { business: businessName } : {}),
      freeMonths: String(freeMonths),
    });

    const signupUrl = `${origin}/signup?${params.toString()}`;

    return new Response(
      JSON.stringify({
        url: signupUrl,
        freeMonths,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[staff-create-checkout] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
