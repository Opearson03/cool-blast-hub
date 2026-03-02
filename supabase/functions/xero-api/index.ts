import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function refreshTokenIfNeeded(
  supabaseAdmin: ReturnType<typeof createClient>,
  connection: any
) {
  const expiresAt = new Date(connection.token_expires_at).getTime();
  const now = Date.now();

  // Refresh if expires in less than 5 minutes
  if (expiresAt - now > 5 * 60 * 1000) {
    return connection.access_token;
  }

  const clientId = Deno.env.get("XERO_CLIENT_ID")!;
  const clientSecret = Deno.env.get("XERO_CLIENT_SECRET")!;

  const res = await fetch("https://identity.xero.com/connect/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: connection.refresh_token,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Token refresh failed:", errText);
    throw new Error("Token refresh failed");
  }

  const tokens = await res.json();
  const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await supabaseAdmin
    .from("xero_connections")
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", connection.id);

  return tokens.access_token as string;
}

async function xeroRequest(
  method: string,
  path: string,
  accessToken: string,
  tenantId: string,
  body?: unknown
) {
  const res = await fetch(`https://api.xero.com/api.xro/2.0${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "xero-tenant-id": tenantId,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Xero API error:", JSON.stringify(data));
    throw new Error(data.Message || data.Detail || "Xero API error");
  }
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const userId = claimsData.claims.sub;

    // Get business_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("business_id")
      .eq("id", userId)
      .single();

    if (!profile?.business_id) {
      return jsonResponse({ error: "No business found" }, 400);
    }

    const businessId = profile.business_id;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, ...params } = await req.json();

    // Get connection
    const { data: connection, error: connErr } = await supabaseAdmin
      .from("xero_connections")
      .select("*")
      .eq("business_id", businessId)
      .single();

    if (action === "disconnect") {
      if (connection) {
        // Try to revoke the token (best effort)
        try {
          await fetch("https://identity.xero.com/connect/revocation", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ token: connection.refresh_token }),
          });
        } catch {}

        await supabaseAdmin
          .from("xero_connections")
          .delete()
          .eq("id", connection.id);
      }
      return jsonResponse({ success: true });
    }

    if (connErr || !connection) {
      return jsonResponse({ error: "Xero not connected" }, 400);
    }

    const accessToken = await refreshTokenIfNeeded(supabaseAdmin, connection);
    const tenantId = connection.xero_tenant_id;

    if (action === "create_contact") {
      const { name, email, phone } = params;

      // Try to find existing contact by email
      if (email) {
        const existing = await xeroRequest(
          "GET",
          `/Contacts?where=EmailAddress=="${encodeURIComponent(email)}"`,
          accessToken,
          tenantId
        );
        if (existing.Contacts?.length > 0) {
          const contact = existing.Contacts[0];
          // Log the sync
          await supabaseAdmin.from("xero_sync_log").upsert(
            {
              business_id: businessId,
              source_type: "contact",
              source_id: params.source_id || "00000000-0000-0000-0000-000000000000",
              xero_contact_id: contact.ContactID,
              last_synced_at: new Date().toISOString(),
            },
            { onConflict: "business_id,source_type,source_id", ignoreDuplicates: false }
          );
          return jsonResponse({ contact_id: contact.ContactID, name: contact.Name });
        }
      }

      // Create new contact
      const result = await xeroRequest("POST", "/Contacts", accessToken, tenantId, {
        Contacts: [
          {
            Name: name,
            EmailAddress: email || undefined,
            Phones: phone
              ? [{ PhoneType: "DEFAULT", PhoneNumber: phone }]
              : undefined,
          },
        ],
      });

      const newContact = result.Contacts[0];
      return jsonResponse({
        contact_id: newContact.ContactID,
        name: newContact.Name,
      });
    }

    if (action === "create_invoice") {
      const { contact_id, line_items, reference, due_days = 30, source_type, source_id } = params;

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + due_days);

      const result = await xeroRequest("POST", "/Invoices", accessToken, tenantId, {
        Invoices: [
          {
            Type: "ACCREC",
            Contact: { ContactID: contact_id },
            LineItems: line_items.map((item: any) => ({
              Description: item.description,
              Quantity: item.quantity,
              UnitAmount: item.unit_price,
              AccountCode: "200", // Default sales account
              TaxType: "OUTPUT", // GST on Income
            })),
            Date: new Date().toISOString().split("T")[0],
            DueDate: dueDate.toISOString().split("T")[0],
            Reference: reference || undefined,
            Status: "DRAFT",
            LineAmountTypes: "Exclusive",
          },
        ],
      });

      const invoice = result.Invoices[0];

      // Log sync
      await supabaseAdmin.from("xero_sync_log").upsert(
        {
          business_id: businessId,
          source_type: source_type || "estimate",
          source_id,
          xero_invoice_id: invoice.InvoiceID,
          xero_invoice_number: invoice.InvoiceNumber,
          xero_contact_id: contact_id,
          xero_status: invoice.Status,
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: "business_id,source_type,source_id", ignoreDuplicates: false }
      );

      return jsonResponse({
        invoice_id: invoice.InvoiceID,
        invoice_number: invoice.InvoiceNumber,
        status: invoice.Status,
      });
    }

    if (action === "get_invoice_status") {
      const { invoice_id } = params;
      const result = await xeroRequest(
        "GET",
        `/Invoices/${invoice_id}`,
        accessToken,
        tenantId
      );

      const invoice = result.Invoices[0];

      // Update sync log
      await supabaseAdmin
        .from("xero_sync_log")
        .update({
          xero_status: invoice.Status,
          last_synced_at: new Date().toISOString(),
        })
        .eq("xero_invoice_id", invoice_id)
        .eq("business_id", businessId);

      return jsonResponse({
        status: invoice.Status,
        amount_due: invoice.AmountDue,
        amount_paid: invoice.AmountPaid,
      });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (err: any) {
    console.error("xero-api error:", err);
    return jsonResponse({ error: err.message || "Internal server error" }, 500);
  }
});
