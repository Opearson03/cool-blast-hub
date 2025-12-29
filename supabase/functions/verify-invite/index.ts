import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerifyInviteRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: VerifyInviteRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ valid: false, error: "Email is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[VERIFY-INVITE] Checking invite for: ${normalizedEmail}`);

    // Create Supabase client with service role to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check for pending invite
    const { data: invite, error } = await supabase
      .from("pending_invites")
      .select("id, full_name, role")
      .ilike("email", normalizedEmail)
      .is("accepted_at", null)
      .maybeSingle();

    if (error) {
      console.error("[VERIFY-INVITE] Database error:", error);
      throw error;
    }

    if (!invite) {
      console.log(`[VERIFY-INVITE] No invite found for: ${normalizedEmail}`);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "No pending invitation found for this email address." 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`[VERIFY-INVITE] Found invite for: ${normalizedEmail}, name: ${invite.full_name}`);
    return new Response(
      JSON.stringify({ 
        valid: true, 
        fullName: invite.full_name,
        role: invite.role
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("[VERIFY-INVITE] Error:", error);
    return new Response(
      JSON.stringify({ valid: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
