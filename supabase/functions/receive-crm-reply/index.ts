import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    console.log("Received inbound email webhook:", JSON.stringify(payload));

    // Resend inbound webhook payload structure
    const fromEmail = payload.from || payload.envelope?.from || "";
    const fromName = payload.from_name || "";
    const subject = payload.subject || "(no subject)";
    const bodyText = payload.text || payload.stripped_text || "";
    const bodyHtml = payload.html || payload.stripped_html || "";

    // Try to match to a campaign by sender email
    let campaignId: string | null = null;
    const { data: recipientMatch } = await supabase
      .from("crm_email_recipients")
      .select("campaign_id")
      .eq("email", fromEmail)
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recipientMatch) {
      campaignId = recipientMatch.campaign_id;
    }

    const { error } = await supabase.from("crm_inbox").insert({
      from_email: fromEmail,
      from_name: fromName,
      subject,
      body_text: bodyText,
      body_html: bodyHtml,
      in_reply_to_campaign_id: campaignId,
      is_read: false,
    });

    if (error) {
      console.error("Error storing inbound email:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in receive-crm-reply:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
