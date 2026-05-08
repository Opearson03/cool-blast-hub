import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Verify caller
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = userData.user.id;

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Caller must be admin and have a business
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: callerId,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: callerProfile } = await admin
      .from("profiles")
      .select("business_id")
      .eq("id", callerId)
      .maybeSingle();

    const businessId = callerProfile?.business_id;
    if (!businessId) {
      return new Response(JSON.stringify({ error: "No business found for caller" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const fullName = String(body.full_name ?? "").trim();
    const email = String(body.email ?? "").toLowerCase().trim();
    const password = String(body.password ?? "");
    const role = body.role === "admin" ? "admin" : "staff";
    const position = body.position ? String(body.position) : null;
    const phone = body.phone ? String(body.phone) : null;
    const hourlyRate =
      typeof body.hourly_rate === "number" ? body.hourly_rate : null;

    if (!fullName || !email || password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Full name, email, and password (>=6 chars) are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Employee limit check (skip for admin role since they replace existing seats)
    const { data: limit } = await admin.rpc("check_employee_limit", {
      _business_id: businessId,
    }).maybeSingle?.() ?? { data: null };
    // Fallback: count manually
    const { count: empCount } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId);
    const { data: sub } = await admin
      .from("business_subscriptions")
      .select("employee_limit")
      .eq("business_id", businessId)
      .maybeSingle();
    const empLimit = sub?.employee_limit ?? 5;
    if ((empCount ?? 0) >= empLimit) {
      return new Response(
        JSON.stringify({ error: `Employee limit reached (${empCount}/${empLimit}). Upgrade to add more.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Check duplicate email
    const { data: existing } = await admin.auth.admin.listUsers();
    const dup = existing?.users?.find((u) => u.email?.toLowerCase() === email);
    if (dup) {
      return new Response(
        JSON.stringify({ error: "A user with this email already exists." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Create auth user
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (createErr || !created.user) {
      return new Response(JSON.stringify({ error: createErr?.message ?? "Failed to create user" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const newUserId = created.user.id;

    // Upsert profile
    await admin.from("profiles").upsert({
      id: newUserId,
      full_name: fullName,
      business_id: businessId,
      phone,
      position,
      hourly_rate: hourlyRate ?? 0,
    });

    // Assign role
    await admin.from("user_roles").insert({ user_id: newUserId, role });

    return new Response(
      JSON.stringify({ success: true, user_id: newUserId, email, temp_password: password }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
