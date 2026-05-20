// Scrapes a supplier brand's website with Firecrawl for branch contacts / sales reps.
// Writes results to supplier_reps_staging for staff review.
// Also populates the brand's logo_url + primary_color from the homepage branding.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FIRECRAWL_V2 = "https://api.firecrawl.dev/v2";

interface ScrapedRep {
  name?: string;
  role?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  branch_name?: string;
  branch_address?: string;
  state?: string;
  region?: string;
  postcode?: string;
  postcodes?: string[];
}

const repSchema = {
  type: "object",
  properties: {
    contacts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Sales rep or contact person name. Empty string if only a branch is listed." },
          role: { type: "string", description: "Job title, e.g. 'Sales Representative', 'Branch Manager', 'Area Manager'." },
          email: { type: "string" },
          phone: { type: "string", description: "Landline / branch phone." },
          mobile: { type: "string" },
          branch_name: { type: "string" },
          branch_address: { type: "string", description: "Full street address of the branch, including suburb, state and 4-digit Australian postcode." },
          postcode: { type: "string", description: "4-digit Australian postcode of this branch. Extract from the branch address." },
          state: { type: "string", description: "Australian state code: NSW, VIC, QLD, WA, SA, TAS, NT, ACT." },
          region: { type: "string", description: "Area or city, e.g. 'Sydney Metro', 'Western Sydney'." },
        },
      },
    },
  },
  required: ["contacts"],
};

async function fcMap(apiKey: string, url: string, search: string) {
  const res = await fetch(`${FIRECRAWL_V2}/map`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, search, limit: 40, includeSubdomains: false }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Firecrawl map failed [${res.status}]: ${JSON.stringify(data)}`);
  const links: string[] = data.links ?? data.data?.links ?? [];
  return links;
}

async function fcScrape(apiKey: string, url: string, formats: unknown[]) {
  const res = await fetch(`${FIRECRAWL_V2}/scrape`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, formats, onlyMainContent: true }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Firecrawl scrape failed [${res.status}]: ${JSON.stringify(data)}`);
  return data.data ?? data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

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
      { global: { headers: { Authorization: authHeader } } },
    );
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub;

    // Staff-only
    const { data: roles } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const isStaff = (roles ?? []).some((r) => r.role === "pourhub_staff" || r.role === "admin" || r.role === "staff");
    if (!isStaff) {
      return new Response(JSON.stringify({ error: "Forbidden — staff only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const brandSlug = body.brand_slug as string | undefined;
    if (!brandSlug) throw new Error("brand_slug is required");

    const { data: brand, error: brandErr } = await serviceClient
      .from("supplier_brands")
      .select("*")
      .eq("slug", brandSlug)
      .maybeSingle();
    if (brandErr || !brand) throw new Error(`Brand not found: ${brandSlug}`);
    if (!brand.website) throw new Error(`Brand ${brandSlug} has no website`);

    console.log(`Scraping ${brand.name} from ${brand.website}`);

    // 1. Branding — logo + primary colour
    let logoUrl: string | null = brand.logo_url;
    let primaryColor: string | null = brand.primary_color;
    try {
      const brandingResp = await fcScrape(FIRECRAWL_API_KEY, brand.website, ["branding"]);
      const branding = brandingResp.branding ?? brandingResp;
      const remoteLogo: string | undefined = branding?.logo || branding?.images?.logo;
      const remotePrimary: string | undefined = branding?.colors?.primary;
      if (remotePrimary) primaryColor = remotePrimary;

      if (remoteLogo && !logoUrl) {
        // Download & upload to supplier-logos bucket
        const logoRes = await fetch(remoteLogo);
        if (logoRes.ok) {
          const bytes = new Uint8Array(await logoRes.arrayBuffer());
          const ext = remoteLogo.split(".").pop()?.split("?")[0]?.toLowerCase() || "png";
          const path = `${brandSlug}/logo.${ext}`;
          const contentType = logoRes.headers.get("content-type") || `image/${ext}`;
          const { error: upErr } = await serviceClient.storage
            .from("supplier-logos")
            .upload(path, bytes, { contentType, upsert: true });
          if (!upErr) {
            const { data: pub } = serviceClient.storage.from("supplier-logos").getPublicUrl(path);
            logoUrl = pub.publicUrl;
          } else {
            console.warn("Logo upload error", upErr.message);
          }
        }
      }
    } catch (e) {
      console.warn("Branding scrape failed:", (e as Error).message);
    }

    if (logoUrl !== brand.logo_url || primaryColor !== brand.primary_color) {
      await serviceClient
        .from("supplier_brands")
        .update({ logo_url: logoUrl, primary_color: primaryColor })
        .eq("id", brand.id);
    }

    // 2. Map for contact / branch pages
    let contactPages: string[] = [];
    try {
      const mapped = await fcMap(FIRECRAWL_API_KEY, brand.website, "contact branch sales office");
      contactPages = mapped
        .filter((u) => /contact|branch|location|office|sales|find-us|near-you/i.test(u))
        .slice(0, 15);
    } catch (e) {
      console.warn("Map failed:", (e as Error).message);
    }

    // Ensure at least the homepage /contact-us fallback
    if (contactPages.length === 0) {
      contactPages = [new URL("/contact-us", brand.website).toString()];
    }

    console.log(`Found ${contactPages.length} candidate pages`);

    // 3. Scrape each candidate with JSON extraction
    let inserted = 0;
    for (const pageUrl of contactPages) {
      try {
        const scraped = await fcScrape(FIRECRAWL_API_KEY, pageUrl, [
          { type: "json", schema: repSchema, prompt: "Extract every concrete supply branch contact, office, and named sales representative on this page." },
        ]);
        const contacts: ScrapedRep[] = scraped?.json?.contacts ?? [];
        if (!contacts.length) continue;

        const rows = contacts
          .filter((c) => c.email || c.phone || c.mobile || c.branch_name)
          .map((c) => ({
            brand_id: brand.id,
            name: c.name || c.branch_name || null,
            role: c.role || null,
            email: c.email || null,
            phone: c.phone || null,
            mobile: c.mobile || null,
            region: c.region || null,
            state: c.state || null,
            postcode: c.postcode || null,
            postcodes: c.postcodes ?? [],
            branch_name: c.branch_name || null,
            branch_address: c.branch_address || null,
            source_url: pageUrl,
            raw: c as unknown as Record<string, unknown>,
            status: "pending",
          }));

        if (rows.length) {
          const { error: insErr } = await serviceClient
            .from("supplier_reps_staging")
            .insert(rows);
          if (insErr) console.warn("Insert error", insErr.message);
          else inserted += rows.length;
        }
      } catch (e) {
        console.warn(`Scrape failed for ${pageUrl}:`, (e as Error).message);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        brand: brand.name,
        pages_scanned: contactPages.length,
        staged: inserted,
        logo_url: logoUrl,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("scrape-supplier-reps error:", msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
