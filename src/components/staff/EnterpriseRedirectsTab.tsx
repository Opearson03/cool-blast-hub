import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface EnterpriseRedirect {
  id: string;
  email: string;
  subdomain: string;
  business_name: string | null;
  notes: string | null;
  created_at: string;
}

export function EnterpriseRedirectsTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EnterpriseRedirect | null>(null);
  const [form, setForm] = useState({ email: "", subdomain: "", business_name: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const { data: redirects, isLoading } = useQuery({
    queryKey: ["enterprise-redirects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enterprise_redirects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EnterpriseRedirect[];
    },
  });

  const openNew = () => {
    setEditing(null);
    setForm({ email: "", subdomain: "", business_name: "", notes: "" });
    setDialogOpen(true);
  };

  const openEdit = (row: EnterpriseRedirect) => {
    setEditing(row);
    setForm({
      email: row.email,
      subdomain: row.subdomain,
      business_name: row.business_name ?? "",
      notes: row.notes ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const email = form.email.trim().toLowerCase();
    const subdomain = form.subdomain.trim().toLowerCase();
    if (!email || !subdomain) {
      toast.error("Email and subdomain are required");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      toast.error("Subdomain may only contain lowercase letters, numbers and hyphens");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        email,
        subdomain,
        business_name: form.business_name.trim() || null,
        notes: form.notes.trim() || null,
      };

      if (editing) {
        const { error } = await supabase
          .from("enterprise_redirects")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Mapping updated");
      } else {
        const { error } = await supabase.from("enterprise_redirects").insert(payload);
        if (error) throw error;
        toast.success("Mapping added");
      }

      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["enterprise-redirects"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to save mapping");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: EnterpriseRedirect) => {
    if (!confirm(`Remove enterprise redirect for ${row.email}?`)) return;
    const { error } = await supabase.from("enterprise_redirects").delete().eq("id", row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Mapping removed");
    queryClient.invalidateQueries({ queryKey: ["enterprise-redirects"] });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Enterprise Redirects</CardTitle>
          <CardDescription>
            Map an enterprise client's email to their dedicated subdomain. After login on
            pourhub.com.au, matching users are redirected to{" "}
            <code className="text-xs">{`{subdomain}.pourhub.com.au`}</code>.
          </CardDescription>
          <p className="text-xs text-muted-foreground mt-2">
            ⚠️ After adding a mapping here, configure DNS for the subdomain and connect it inside
            the enterprise project's Lovable settings.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} size="sm">
              <Plus className="h-4 w-4 mr-2" /> Add mapping
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit mapping" : "Add enterprise mapping"}</DialogTitle>
              <DialogDescription>
                The user with this email will be redirected to their subdomain after signing in.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="owner@acme.com.au"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="subdomain"
                    value={form.subdomain}
                    onChange={(e) => setForm({ ...form, subdomain: e.target.value })}
                    placeholder="acme"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    .pourhub.com.au
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_name">Business name (optional)</Label>
                <Input
                  id="business_name"
                  value={form.business_name}
                  onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                  placeholder="Acme Concreting"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editing ? "Save changes" : "Add mapping"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !redirects?.length ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No enterprise mappings yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Subdomain</TableHead>
                <TableHead>Business</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {redirects.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">{row.email}</TableCell>
                  <TableCell>
                    <a
                      href={`https://${row.subdomain}.pourhub.com.au`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      {row.subdomain}.pourhub.com.au
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </TableCell>
                  <TableCell>{row.business_name ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(row)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(row)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
