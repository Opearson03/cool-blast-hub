import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Check, X, Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website: string | null;
  primary_color: string | null;
  is_active: boolean;
}

interface StagingRow {
  id: string;
  brand_id: string;
  name: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  region: string | null;
  state: string | null;
  postcode: string | null;
  postcodes: string[];
  branch_name: string | null;
  branch_address: string | null;
  source_url: string | null;
  status: string;
  service_radius_km?: number | null;
}

export function SupplierDirectoryTab() {
  const qc = useQueryClient();
  const [scrapingSlug, setScrapingSlug] = useState<string | null>(null);
  const [editing, setEditing] = useState<StagingRow | null>(null);

  const { data: brands = [] } = useQuery({
    queryKey: ["supplier-brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_brands")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Brand[];
    },
  });

  const { data: staged = [] } = useQuery({
    queryKey: ["supplier-staging"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_reps_staging")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as StagingRow[];
    },
  });

  const { data: approved = [] } = useQuery({
    queryKey: ["supplier-reps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_reps")
        .select("id, brand_id, name, role, email, phone, state, region, is_active")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const scrape = useMutation({
    mutationFn: async (slug: string) => {
      setScrapingSlug(slug);
      const { data, error } = await supabase.functions.invoke("scrape-supplier-reps", {
        body: { brand_slug: slug },
      });
      if (error) throw error;
      if (!(data as { success?: boolean })?.success) {
        throw new Error((data as { error?: string })?.error || "Scrape failed");
      }
      return data;
    },
    onSuccess: (data: unknown) => {
      const d = data as { brand: string; staged: number; pages_scanned: number };
      toast.success(`Scraped ${d.brand}: ${d.staged} contacts staged from ${d.pages_scanned} pages`);
      qc.invalidateQueries({ queryKey: ["supplier-staging"] });
      qc.invalidateQueries({ queryKey: ["supplier-brands"] });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setScrapingSlug(null),
  });

  const approve = useMutation({
    mutationFn: async (row: StagingRow) => {
      const { error: insErr } = await supabase.from("supplier_reps").insert({
        brand_id: row.brand_id,
        name: row.name || row.branch_name || "Unnamed contact",
        role: row.role,
        email: row.email,
        phone: row.phone,
        mobile: row.mobile,
        region: row.region,
        state: row.state,
        postcodes: row.postcodes ?? [],
        branch_name: row.branch_name,
        branch_address: row.branch_address,
        source_url: row.source_url,
        last_verified_at: new Date().toISOString(),
      });
      if (insErr) throw insErr;
      const { error: updErr } = await supabase
        .from("supplier_reps_staging")
        .update({ status: "approved", reviewed_at: new Date().toISOString() })
        .eq("id", row.id);
      if (updErr) throw updErr;
    },
    onSuccess: () => {
      toast.success("Approved");
      qc.invalidateQueries({ queryKey: ["supplier-staging"] });
      qc.invalidateQueries({ queryKey: ["supplier-reps"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("supplier_reps_staging")
        .update({ status: "rejected", reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Rejected");
      qc.invalidateQueries({ queryKey: ["supplier-staging"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeRep = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("supplier_reps").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: ["supplier-reps"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const brandById = (id: string) => brands.find((b) => b.id === id);

  return (
    <div className="space-y-6">
      {/* Brands */}
      <Card>
        <CardHeader>
          <CardTitle>Supplier Brands</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {brands.map((b) => (
            <div key={b.id} className="flex items-center gap-3 p-3 border rounded-md">
              {b.logo_url ? (
                <img src={b.logo_url} alt={b.name} className="w-10 h-10 rounded object-contain bg-muted p-1" />
              ) : (
                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                  {b.name[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium">{b.name}</p>
                <p className="text-xs text-muted-foreground truncate">{b.website}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => scrape.mutate(b.slug)}
                disabled={scrapingSlug === b.slug}
              >
                {scrapingSlug === b.slug ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-1" />
                )}
                Re-run scrape
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Pending review */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Review ({staged.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {staged.length === 0 && (
            <p className="text-sm text-muted-foreground">Nothing pending. Run a scrape on a brand above.</p>
          )}
          {staged.map((row) => {
            const brand = brandById(row.brand_id);
            return (
              <div key={row.id} className="flex items-start gap-3 p-3 border rounded-md">
                {brand?.logo_url && (
                  <img src={brand.logo_url} alt={brand.name} className="w-8 h-8 rounded object-contain bg-muted p-1 mt-1" />
                )}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{row.name || row.branch_name || "Unnamed"}</span>
                    {row.role && <Badge variant="secondary">{row.role}</Badge>}
                    {row.state && <Badge variant="outline">{row.state}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {[row.email, row.phone, row.mobile].filter(Boolean).join(" · ") || "No contact info"}
                  </p>
                  {row.branch_address && (
                    <p className="text-xs text-muted-foreground">{row.branch_name && `${row.branch_name} — `}{row.branch_address}</p>
                  )}
                  {row.source_url && (
                    <a href={row.source_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline truncate block">
                      {row.source_url}
                    </a>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(row)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => approve.mutate(row)}>
                    <Check className="w-4 h-4 text-green-600" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => reject.mutate(row.id)}>
                    <X className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Approved reps */}
      <Card>
        <CardHeader>
          <CardTitle>Active Reps ({approved.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {approved.length === 0 && (
            <p className="text-sm text-muted-foreground">No approved reps yet.</p>
          )}
          {approved.map((r) => {
            const brand = brandById(r.brand_id);
            return (
              <div key={r.id} className="flex items-center gap-3 p-2 border rounded-md">
                {brand?.logo_url && (
                  <img src={brand.logo_url} alt={brand.name} className="w-6 h-6 rounded object-contain bg-muted p-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {r.name}{r.role && <span className="text-muted-foreground ml-1">— {r.role}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {[r.email, r.phone, r.region || r.state].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => removeRep.mutate(r.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <EditStagingDialog
        row={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          qc.invalidateQueries({ queryKey: ["supplier-staging"] });
        }}
      />
    </div>
  );
}

function EditStagingDialog({
  row, onClose, onSaved,
}: {
  row: StagingRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<StagingRow>>({});
  const open = !!row;

  // Reset form when row changes
  if (row && form.id !== row.id) {
    setForm(row);
  }

  const save = async () => {
    if (!row) return;
    const { error } = await supabase
      .from("supplier_reps_staging")
      .update({
        name: form.name,
        role: form.role,
        email: form.email,
        phone: form.phone,
        mobile: form.mobile,
        region: form.region,
        state: form.state,
        postcodes: form.postcodes,
        branch_name: form.branch_name,
        branch_address: form.branch_address,
      })
      .eq("id", row.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Updated");
      onSaved();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit staged contact</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Name" value={form.name || ""} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Role" value={form.role || ""} onChange={(v) => setForm({ ...form, role: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email" value={form.email || ""} onChange={(v) => setForm({ ...form, email: v })} />
            <Field label="Phone" value={form.phone || ""} onChange={(v) => setForm({ ...form, phone: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mobile" value={form.mobile || ""} onChange={(v) => setForm({ ...form, mobile: v })} />
            <Field label="State" value={form.state || ""} onChange={(v) => setForm({ ...form, state: v })} />
          </div>
          <Field label="Region" value={form.region || ""} onChange={(v) => setForm({ ...form, region: v })} />
          <Field label="Branch name" value={form.branch_name || ""} onChange={(v) => setForm({ ...form, branch_name: v })} />
          <Field label="Branch address" value={form.branch_address || ""} onChange={(v) => setForm({ ...form, branch_address: v })} />
          <Field
            label="Postcodes (comma-separated)"
            value={(form.postcodes ?? []).join(", ")}
            onChange={(v) => setForm({ ...form, postcodes: v.split(",").map((s) => s.trim()).filter(Boolean) })}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
