import { supabase } from "@/integrations/supabase/client";

/**
 * Upserts a client record from estimate data.
 * If a client with the same name + business already exists, updates their details.
 * Runs silently — errors are logged but don't block estimate creation.
 */
export async function saveEstimateClient({
  businessId,
  clientName,
  clientEmail,
  clientPhone,
  companyName,
  siteAddress,
}: {
  businessId: string;
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  companyName?: string | null;
  siteAddress?: string | null;
}) {
  // Don't save placeholder / empty names
  if (!clientName || clientName === "Draft Estimate") return;

  try {
    // Check if client already exists by name (case-insensitive) within this business
    const { data: existing } = await supabase
      .from("clients")
      .select("id, email, phone, company_name, address")
      .eq("business_id", businessId)
      .ilike("name", clientName.trim())
      .maybeSingle();

    if (existing) {
      // Update with any new info (only fill in blanks, don't overwrite existing data)
      const updates: Record<string, string> = {};
      if (!existing.email && clientEmail) updates.email = clientEmail;
      if (!existing.phone && clientPhone) updates.phone = clientPhone;
      if (!existing.company_name && companyName) updates.company_name = companyName;
      if (!existing.address && siteAddress) updates.address = siteAddress;

      if (Object.keys(updates).length > 0) {
        await supabase.from("clients").update(updates).eq("id", existing.id);
      }
    } else {
      // Create new client
      await supabase.from("clients").insert({
        business_id: businessId,
        name: clientName.trim(),
        email: clientEmail || null,
        phone: clientPhone || null,
        company_name: companyName || null,
        address: siteAddress || null,
      });
    }
  } catch (err) {
    console.error("Failed to save client from estimate:", err);
  }
}
