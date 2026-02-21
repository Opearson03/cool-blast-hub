import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Recipient {
  email: string;
  name: string;
  contactType: string;
  contactId: string;
  company?: string;
}

interface SendCrmEmailRequest {
  subject: string;
  htmlBody: string;
  recipients: Recipient[];
  filterType?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify staff auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check staff role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: isStaff } = await supabase.rpc("is_pourhub_staff", { _user_id: user.id });
    if (!isStaff) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subject, htmlBody, recipients, filterType }: SendCrmEmailRequest = await req.json();

    if (!subject || !htmlBody || !recipients?.length) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create campaign record
    const { data: campaign, error: campaignError } = await supabase
      .from("crm_email_campaigns")
      .insert({
        subject,
        html_body: htmlBody,
        sent_by: user.id,
        recipient_count: recipients.length,
        filter_type: filterType || "selected",
      })
      .select("id")
      .single();

    if (campaignError) throw campaignError;

    const resend = new Resend(resendApiKey);
    let successCount = 0;
    let failCount = 0;

    for (const recipient of recipients) {
      try {
        const personalizedHtml = htmlBody
          .replace(/{name}/g, recipient.name || "")
          .replace(/{email}/g, recipient.email)
          .replace(/{company}/g, recipient.company || "");

        const emailResult = await resend.emails.send({
          from: "PourHub <hello@pourhub.au>",
          replyTo: "info@pourhub.com.au",
          to: [recipient.email],
          subject,
          html: personalizedHtml,
        });

        await supabase.from("crm_email_recipients").insert({
          campaign_id: campaign.id,
          contact_type: recipient.contactType,
          contact_id: recipient.contactId,
          email: recipient.email,
          status: "sent",
          resend_email_id: emailResult.data?.id || null,
        });

        successCount++;
      } catch (err) {
        console.error(`Failed to send to ${recipient.email}:`, err);

        await supabase.from("crm_email_recipients").insert({
          campaign_id: campaign.id,
          contact_type: recipient.contactType,
          contact_id: recipient.contactId,
          email: recipient.email,
          status: "failed",
        });

        failCount++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, campaignId: campaign.id, sent: successCount, failed: failCount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-crm-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
