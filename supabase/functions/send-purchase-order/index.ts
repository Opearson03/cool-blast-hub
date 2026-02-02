import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BOQItem {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalPrice?: number;
  notes?: string;
}

interface RequestBody {
  jobId: string;
  boqId: string;
  items: BOQItem[];
  supplierContactId: string | null;
  supplierName: string;
  supplierEmail: string | null;
  supplierPhone: string | null;
  deliveryAddress: string;
  notes: string;
  sendMethod: "email" | "sms" | "both";
  orderType: "quote" | "po";
  saveNewSupplier: {
    name: string;
    email: string;
    phone: string;
  } | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: RequestBody = await req.json();
    const {
      jobId,
      boqId,
      items,
      supplierContactId,
      supplierName,
      supplierEmail,
      supplierPhone,
      deliveryAddress,
      notes,
      sendMethod,
      orderType = "po", // default to PO for backward compatibility
      saveNewSupplier,
    } = body;

    const isQuoteRequest = orderType === "quote";

    // Validate required fields - delivery address only required for PO
    if (!jobId || !boqId || !items.length || !supplierName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isQuoteRequest && !deliveryAddress) {
      return new Response(JSON.stringify({ error: "Delivery address required for purchase orders" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's business and profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("business_id, full_name")
      .eq("id", user.id)
      .single();

    if (!profile?.business_id) {
      return new Response(JSON.stringify({ error: "No business found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get business details for branding
    const { data: business } = await supabase
      .from("businesses")
      .select("name, logo_url, quote_primary_color, email, phone")
      .eq("id", profile.business_id)
      .single();

    // Get job details
    const { data: job } = await supabase
      .from("jobs")
      .select("name, job_number")
      .eq("id", jobId)
      .single();

    // Generate PO/RFQ number
    const { count } = await supabase
      .from("purchase_orders")
      .select("*", { count: "exact", head: true })
      .eq("business_id", profile.business_id);

    const prefix = isQuoteRequest ? "RFQ" : "PO";
    const poNumber = `${prefix}-${String((count || 0) + 1).padStart(4, "0")}`;

    // Save new supplier if requested
    let finalSupplierContactId = supplierContactId;
    if (saveNewSupplier && !supplierContactId) {
      const { data: newSupplier, error: supplierError } = await supabase
        .from("supplier_contacts")
        .insert({
          business_id: profile.business_id,
          name: saveNewSupplier.name,
          email: saveNewSupplier.email || null,
          phone: saveNewSupplier.phone || null,
          category: "general",
        })
        .select("id")
        .single();

      if (!supplierError && newSupplier) {
        finalSupplierContactId = newSupplier.id;
      }
    }

    // Create purchase order record (also used for quote requests)
    const { data: purchaseOrder, error: poError } = await supabase
      .from("purchase_orders")
      .insert({
        business_id: profile.business_id,
        job_id: jobId,
        boq_id: boqId,
        po_number: poNumber,
        supplier_contact_id: finalSupplierContactId,
        supplier_name: supplierName,
        supplier_email: supplierEmail,
        supplier_phone: supplierPhone,
        delivery_address: deliveryAddress || "",
        items: items,
        notes: notes || null,
        sent_via: sendMethod,
        sent_at: new Date().toISOString(),
        status: isQuoteRequest ? "quote_requested" : "sent",
        created_by: user.id,
      })
      .select()
      .single();

    if (poError) {
      console.error("Error creating PO:", poError);
      return new Response(JSON.stringify({ error: "Failed to create purchase order" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build items table HTML for email
    const itemsTableRows = items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.description}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.unit}</td>
      </tr>
    `).join("");

    const primaryColor = business?.quote_primary_color || "#2563eb";
    const businessName = business?.name || "Our Company";
    const jobReference = job?.job_number ? `Job #${job.job_number}` : job?.name || "Job";

    // Send email if required
    if ((sendMethod === "email" || sendMethod === "both") && supplierEmail) {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        console.error("RESEND_API_KEY not configured");
      } else {
        const resend = new Resend(resendApiKey);

        const emailTitle = isQuoteRequest ? "Request for Quote" : "Purchase Order";
        const emailSubjectPrefix = isQuoteRequest ? "Quote Request" : "Purchase Order";
        
        const emailHtml = isQuoteRequest ? `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Quote Request ${poNumber}</title>
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            ${business?.logo_url ? `<img src="${business.logo_url}" alt="${businessName}" style="max-height: 60px; margin-bottom: 20px;">` : ""}
            
            <h1 style="color: ${primaryColor}; margin-bottom: 5px;">Request for Quote</h1>
            <p style="color: #666; margin-top: 0;">${poNumber} • ${new Date().toLocaleDateString("en-AU")}</p>
            
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px;"><strong>Attention:</strong> ${supplierName}</p>
              <p style="margin: 0;"><strong>Reference:</strong> ${jobReference}</p>
            </div>
            
            <p style="color: #333; margin-bottom: 20px;">
              We are requesting a quote for the following items. Please provide pricing and availability at your earliest convenience.
            </p>
            
            <h3 style="color: #333;">Items</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: ${primaryColor}; color: white;">
                  <th style="padding: 10px; text-align: left;">Description</th>
                  <th style="padding: 10px; text-align: right;">Qty</th>
                  <th style="padding: 10px; text-align: left;">Unit</th>
                </tr>
              </thead>
              <tbody>
                ${itemsTableRows}
              </tbody>
            </table>
            
            ${notes ? `
              <div style="margin-top: 20px;">
                <h3 style="color: #333;">Additional Information</h3>
                <p style="color: #666;">${notes.replace(/\n/g, "<br>")}</p>
              </div>
            ` : ""}
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
              <p style="margin: 0 0 5px;"><strong>${businessName}</strong></p>
              ${business?.phone ? `<p style="margin: 0 0 5px;">Phone: ${business.phone}</p>` : ""}
              ${business?.email ? `<p style="margin: 0;">Email: ${business.email}</p>` : ""}
            </div>
          </body>
          </html>
        ` : `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Purchase Order ${poNumber}</title>
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            ${business?.logo_url ? `<img src="${business.logo_url}" alt="${businessName}" style="max-height: 60px; margin-bottom: 20px;">` : ""}
            
            <h1 style="color: ${primaryColor}; margin-bottom: 5px;">Purchase Order</h1>
            <p style="color: #666; margin-top: 0;">${poNumber} • ${new Date().toLocaleDateString("en-AU")}</p>
            
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px;"><strong>Attention:</strong> ${supplierName}</p>
              <p style="margin: 0 0 10px;"><strong>Reference:</strong> ${jobReference}</p>
              <p style="margin: 0;"><strong>Deliver to:</strong><br>${deliveryAddress.replace(/\n/g, "<br>")}</p>
            </div>
            
            <h3 style="color: #333;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: ${primaryColor}; color: white;">
                  <th style="padding: 10px; text-align: left;">Description</th>
                  <th style="padding: 10px; text-align: right;">Qty</th>
                  <th style="padding: 10px; text-align: left;">Unit</th>
                </tr>
              </thead>
              <tbody>
                ${itemsTableRows}
              </tbody>
            </table>
            
            ${notes ? `
              <div style="margin-top: 20px;">
                <h3 style="color: #333;">Notes</h3>
                <p style="color: #666;">${notes.replace(/\n/g, "<br>")}</p>
              </div>
            ` : ""}
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
              <p style="margin: 0 0 5px;"><strong>${businessName}</strong></p>
              ${business?.phone ? `<p style="margin: 0 0 5px;">Phone: ${business.phone}</p>` : ""}
              ${business?.email ? `<p style="margin: 0;">Email: ${business.email}</p>` : ""}
            </div>
          </body>
          </html>
        `;

        try {
          await resend.emails.send({
            from: `${businessName} via Pourhub <Hello@pourhub.au>`,
            to: [supplierEmail],
            subject: `${emailSubjectPrefix} ${poNumber} - ${jobReference}`,
            html: emailHtml,
          });
          console.log(`Email sent to ${supplierEmail}`);
        } catch (emailError) {
          console.error("Error sending email:", emailError);
        }
      }
    }

    // Send SMS if required
    if ((sendMethod === "sms" || sendMethod === "both") && supplierPhone) {
      const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

      if (!twilioSid || !twilioToken || !twilioPhone) {
        console.error("Twilio not configured");
      } else {
        // Format phone for Australia
        let formattedPhone = supplierPhone.replace(/\s/g, "");
        if (formattedPhone.startsWith("0")) {
          formattedPhone = "+61" + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith("+")) {
          formattedPhone = "+61" + formattedPhone;
        }

        const itemCount = items.length;
        const smsBody = isQuoteRequest
          ? `Quote Request ${poNumber} from ${businessName}\n\n${itemCount} item${itemCount > 1 ? "s" : ""} - please provide pricing.\n\nReply or call to discuss.`
          : `${poNumber} from ${businessName}\n\nDeliver to: ${deliveryAddress.split("\n")[0]}\n\nItems: ${itemCount} item${itemCount > 1 ? "s" : ""}\n\nReply to confirm.`;

        try {
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
          const response = await fetch(twilioUrl, {
            method: "POST",
            headers: {
              "Authorization": "Basic " + btoa(`${twilioSid}:${twilioToken}`),
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              To: formattedPhone,
              From: twilioPhone,
              Body: smsBody,
            }),
          });

          if (response.ok) {
            console.log(`SMS sent to ${formattedPhone}`);
          } else {
            const errorData = await response.text();
            console.error("Twilio error:", errorData);
          }
        } catch (smsError) {
          console.error("Error sending SMS:", smsError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        poNumber,
        purchaseOrderId: purchaseOrder.id,
        orderType,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-purchase-order:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
