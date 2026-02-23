import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { abn } = await req.json();

    if (!abn || typeof abn !== "string") {
      return new Response(
        JSON.stringify({ error: "ABN is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Strip spaces and validate 11 digits
    const cleanAbn = abn.replace(/\s/g, "");
    if (!/^\d{11}$/.test(cleanAbn)) {
      return new Response(
        JSON.stringify({
          valid: false,
          error_message: "ABN must be exactly 11 digits.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const guid = Deno.env.get("ABR_API_GUID");
    if (!guid) {
      return new Response(
        JSON.stringify({ error: "ABR API not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call ABR API
    const abrUrl = `https://abr.business.gov.au/json/AbnDetails.aspx?abn=${cleanAbn}&guid=${guid}`;
    const abrResponse = await fetch(abrUrl);
    const abrText = await abrResponse.text();

    // ABR returns JSONP: callback({...}) -- strip the callback wrapper
    const jsonMatch = abrText.match(/callback\(([\s\S]*)\)/);
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ valid: false, error_message: "Unable to verify ABN. Please try again." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const abrData = JSON.parse(jsonMatch[1]);

    // Check for ABR-level errors
    if (abrData.Message && abrData.Message !== "") {
      return new Response(
        JSON.stringify({ valid: false, error_message: abrData.Message }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine entity name
    let legalName = "";
    if (abrData.EntityName && abrData.EntityName !== "") {
      legalName = abrData.EntityName;
    } else if (abrData.BusinessName && abrData.BusinessName.length > 0) {
      legalName = abrData.BusinessName[0];
    }

    // Check ABN status
    const abnStatus = abrData.AbnStatus || "";
    const isActive = abnStatus.toLowerCase() === "active";

    // GST registration
    const gstRegistered = abrData.Gst
      ? new Date(abrData.Gst) <= new Date()
      : false;

    // Entity type
    const entityType = abrData.EntityTypeName || abrData.EntityTypeCode || "";

    if (!isActive) {
      return new Response(
        JSON.stringify({
          valid: false,
          abn_status: abnStatus,
          error_message:
            "Your ABN is not active. Please check your details or register for an ABN before joining PourHub.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        valid: true,
        legal_name: legalName,
        gst_registered: gstRegistered,
        entity_type: entityType,
        abn_status: abnStatus,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("verify-abn error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
