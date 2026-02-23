import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, phone } = await req.json();

    if (!email && !phone) {
      return new Response(JSON.stringify({ invites: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build filter conditions
    let query = supabaseAdmin
      .from("external_invites")
      .select(`
        id, status, role, start_time, notes, recipient_name, created_at,
        job_pours!inner (pour_name, pour_date, scheduled_time),
        jobs!inner (name, site_address),
        businesses!inner (name)
      `)
      .eq("invite_type", "sub_trade")
      .order("created_at", { ascending: false });

    if (email && phone) {
      query = query.or(`recipient_email.eq.${email},recipient_phone.eq.${phone}`);
    } else if (email) {
      query = query.eq("recipient_email", email);
    } else {
      query = query.eq("recipient_phone", phone);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching invites:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const invites = (data || []).map((row: any) => ({
      id: row.id,
      status: row.status,
      role: row.role,
      start_time: row.start_time,
      notes: row.notes,
      recipient_name: row.recipient_name,
      created_at: row.created_at,
      pour_name: row.job_pours?.pour_name || "",
      pour_date: row.job_pours?.pour_date || null,
      scheduled_time: row.job_pours?.scheduled_time || null,
      job_name: row.jobs?.name || "",
      site_address: row.jobs?.site_address || "",
      business_name: row.businesses?.name || "",
    }));

    return new Response(JSON.stringify({ invites }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
