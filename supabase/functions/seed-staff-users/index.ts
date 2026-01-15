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

    const staffUsers = [
      { email: "oliver@pourhub.com.au", password: "Concrete123!" },
      { email: "jay@pourhub.com.au", password: "Concrete123!" },
    ];

    const results = [];

    for (const user of staffUsers) {
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === user.email.toLowerCase());

      let userId: string;

      if (existingUser) {
        userId = existingUser.id;
        // Update password
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: user.password,
        });
        results.push({ email: user.email, status: "updated", userId });
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
        });

        if (createError) {
          results.push({ email: user.email, status: "error", error: createError.message });
          continue;
        }

        userId = newUser.user.id;
        results.push({ email: user.email, status: "created", userId });
      }

      // Check if role already exists
      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", "pourhub_staff")
        .single();

      if (!existingRole) {
        // Add pourhub_staff role
        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: userId, role: "pourhub_staff" });

        if (roleError) {
          results.push({ email: user.email, roleStatus: "error", error: roleError.message });
        } else {
          results[results.length - 1].roleStatus = "assigned";
        }
      } else {
        results[results.length - 1].roleStatus = "already assigned";
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
