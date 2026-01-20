import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Parse request body for dynamic parameters
    const body = await req.json().catch(() => ({}));
    const email = body.email || "mitch@newgenconcrete.com.au";
    const password = body.password || "Demo123";
    const fullName = body.ownerName || "Mitch Wilson";
    const businessName = body.businessName || "Newgen Concrete";
    const phone = body.phone || "";

    // Check if user already exists with this email
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "User already exists with this email", userId: existingUser.id, email }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    const userId = authData.user.id;

    // Create the business (subscription exempt for demo)
    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .insert({
        name: businessName,
        owner_id: userId,
        phone,
        email,
        subscription_exempt: true,
        onboarding_completed: true
      })
      .select()
      .single();

    if (businessError) {
      throw new Error(`Failed to create business: ${businessError.message}`);
    }

    // Create the profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: userId,
        full_name: fullName,
        phone,
        business_id: business.id
      });

    if (profileError) {
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    // Assign admin role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: userId,
        role: "admin"
      });

    if (roleError) {
      throw new Error(`Failed to assign role: ${roleError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Demo account created successfully",
        userId,
        businessId: business.id,
        email,
        businessName
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
