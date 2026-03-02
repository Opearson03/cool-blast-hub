import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateParam = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    // Determine the app URL for redirects
    const appUrl = Deno.env.get("APP_URL") || "https://cool-blast-hub.lovable.app";

    if (error) {
      console.error("Xero auth error:", error, "description:", errorDescription);
      const params = new URLSearchParams({
        xero: "error",
        reason: error,
      });
      if (errorDescription) {
        params.set("details", errorDescription);
      }
      return Response.redirect(`${appUrl}/admin/settings?${params.toString()}`, 302);
    }

    if (!code || !stateParam) {
      return Response.redirect(`${appUrl}/admin/settings?xero=error&reason=missing_params`, 302);
    }

    let state: { business_id: string; user_id: string };
    try {
      state = JSON.parse(atob(stateParam));
    } catch {
      return Response.redirect(`${appUrl}/admin/settings?xero=error&reason=invalid_state`, 302);
    }

    const clientId = Deno.env.get("XERO_CLIENT_ID")!;
    const clientSecret = Deno.env.get("XERO_CLIENT_SECRET")!;
    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/xero-auth-callback`;

    // Exchange code for tokens
    const tokenRes = await fetch("https://identity.xero.com/connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Token exchange failed:", errText);
      return Response.redirect(`${appUrl}/admin/settings?xero=error&reason=token_exchange_failed&details=${encodeURIComponent(errText.slice(0, 200))}`, 302);
    }

    const tokens = await tokenRes.json();

    // Fetch connected tenants
    const connectionsRes = await fetch("https://api.xero.com/connections", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!connectionsRes.ok) {
      console.error("Failed to fetch tenants");
      return Response.redirect(`${appUrl}/admin/settings?xero=error&reason=tenant_fetch_failed`, 302);
    }

    const connections = await connectionsRes.json();
    const tenant = connections[0]; // Use the first connected org

    if (!tenant) {
      return Response.redirect(`${appUrl}/admin/settings?xero=error&reason=no_tenant`, 302);
    }

    // Upsert into xero_connections using service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const { error: upsertErr } = await supabaseAdmin
      .from("xero_connections")
      .upsert(
        {
          business_id: state.business_id,
          xero_tenant_id: tenant.tenantId,
          xero_org_name: tenant.tenantName,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: expiresAt,
          scope: tokens.scope || "",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "business_id" }
      );

    if (upsertErr) {
      console.error("Upsert failed:", upsertErr);
      return Response.redirect(`${appUrl}/admin/settings?xero=error&reason=save_failed`, 302);
    }

    return Response.redirect(`${appUrl}/admin/settings?xero=connected`, 302);
  } catch (err) {
    console.error("xero-auth-callback error:", err);
    const appUrl = Deno.env.get("APP_URL") || "https://cool-blast-hub.lovable.app";
    return Response.redirect(`${appUrl}/admin/settings?xero=error&reason=internal_error`, 302);
  }
});
