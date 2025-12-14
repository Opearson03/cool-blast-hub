import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const testUsers = [
  {
    email: "admin@pourhub.com.au",
    password: "Concrete123!",
    full_name: "Oliver Pearson",
    phone: "0412 880 991",
    position: "System Administrator",
    role: "admin",
    is_owner: true,
  },
  {
    email: "jake.thompson@pourhub.com.au",
    password: "Concrete123!",
    full_name: "Jake Thompson",
    phone: "0431 552 884",
    position: "Concreter (Field Staff)",
    role: "staff",
    is_owner: false,
  },
  {
    email: "liam.orourke@pourhub.com.au",
    password: "Concrete123!",
    full_name: "Liam O'Rourke",
    phone: "0450 337 129",
    position: "Crew Leader",
    role: "staff",
    is_owner: false,
  },
  {
    email: "matt.reid@pourhub.com.au",
    password: "Concrete123!",
    full_name: "Matt \"Macca\" Reid",
    phone: "0423 991 560",
    position: "Steel Fixer / Labourer",
    role: "staff",
    is_owner: false,
  },
  {
    email: "daniel.fraser@pourhub.com.au",
    password: "Concrete123!",
    full_name: "Daniel Fraser",
    phone: "0466 204 755",
    position: "Machine Operator (Trowel / Pump)",
    role: "staff",
    is_owner: false,
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Check for a simple secret key for security (not production-grade but prevents random calls)
  const url = new URL(req.url);
  const secretKey = url.searchParams.get("key");
  if (secretKey !== "pourhub-seed-2024") {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Step 1: Get all existing auth users and delete them
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    
    for (const user of existingUsers?.users || []) {
      // Delete related data first
      await supabaseAdmin.from("pour_employees").delete().eq("employee_id", user.id);
      await supabaseAdmin.from("crew_members").delete().eq("employee_id", user.id);
      await supabaseAdmin.from("employee_tickets").delete().eq("employee_id", user.id);
      await supabaseAdmin.from("swms_signoffs").delete().eq("employee_id", user.id);
      await supabaseAdmin.from("job_itps").delete().eq("assigned_to", user.id);
      await supabaseAdmin.from("user_roles").delete().eq("user_id", user.id);
      await supabaseAdmin.from("profiles").delete().eq("id", user.id);
      
      // Delete auth user
      await supabaseAdmin.auth.admin.deleteUser(user.id);
    }

    // Step 2: Delete pending invites
    await supabaseAdmin.from("pending_invites").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Step 3: Create business first (for admin)
    const { data: business, error: bizError } = await supabaseAdmin
      .from("businesses")
      .insert({
        name: "PourHub Demo Business",
        owner_id: "00000000-0000-0000-0000-000000000000", // Temporary, will update
      })
      .select()
      .single();

    if (bizError) {
      console.error("Business creation error:", bizError);
      throw bizError;
    }

    const businessId = business.id;
    const createdUsers: any[] = [];

    // Step 4: Create users
    for (const userData of testUsers) {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name,
        },
      });

      if (authError) {
        console.error(`Error creating user ${userData.email}:`, authError);
        continue;
      }

      const userId = authData.user.id;

      // Update business owner if this is the admin
      if (userData.is_owner) {
        await supabaseAdmin
          .from("businesses")
          .update({ owner_id: userId })
          .eq("id", businessId);
      }

      // Create profile
      const { error: profileError } = await supabaseAdmin.from("profiles").insert({
        id: userId,
        full_name: userData.full_name,
        phone: userData.phone,
        position: userData.position,
        business_id: businessId,
      });

      if (profileError) {
        console.error(`Error creating profile for ${userData.email}:`, profileError);
      }

      // Create user role
      const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
        user_id: userId,
        role: userData.role,
      });

      if (roleError) {
        console.error(`Error creating role for ${userData.email}:`, roleError);
      }

      createdUsers.push({
        email: userData.email,
        name: userData.full_name,
        role: userData.role,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Created ${createdUsers.length} test users`,
        users: createdUsers,
        businessId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error seeding users:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
