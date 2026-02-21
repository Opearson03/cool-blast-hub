import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, Upload, Plus, Mail } from "lucide-react";
import { CsvImportDialog } from "./CsvImportDialog";
import { AddLeadDialog } from "./AddLeadDialog";

interface CrmContact {
  contact_type: string;
  contact_id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  source_detail: string | null;
  created_at: string;
}

interface CrmContactsTableProps {
  onEmailSelected: (contacts: CrmContact[]) => void;
}

const FILTERS = [
  { value: "all", label: "All" },
  { value: "leads", label: "Leads" },
  { value: "waitlist", label: "Waitlist" },
  { value: "users", label: "Users" },
] as const;

export function CrmContactsTable({ onEmailSelected }: CrmContactsTableProps) {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [csvOpen, setCsvOpen] = useState(false);
  const [addLeadOpen, setAddLeadOpen] = useState(false);

  const { data: contacts, isLoading, refetch } = useQuery({
    queryKey: ["staff-crm-contacts", filter],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_crm_contacts", { _filter: filter });
      if (error) throw error;
      return (data as unknown as CrmContact[]) || [];
    },
  });

  const filtered = (contacts || []).filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.email?.toLowerCase().includes(q) ||
      c.full_name?.toLowerCase().includes(q) ||
      c.company_name?.toLowerCase().includes(q)
    );
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.contact_id)));
    }
  };

  const handleEmailSelected = () => {
    const selected = filtered.filter((c) => selectedIds.has(c.contact_id));
    onEmailSelected(selected);
  };

  const typeBadgeVariant = (type: string) => {
    switch (type) {
      case "lead": return "default";
      case "waitlist": return "secondary";
      case "user": return "outline";
      default: return "default";
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? "default" : "outline"}
              size="sm"
              onClick={() => { setFilter(f.value); setSelectedIds(new Set()); }}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setAddLeadOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Lead
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCsvOpen(true)}>
            <Upload className="h-4 w-4 mr-1" /> Import CSV
          </Button>
          {selectedIds.size > 0 && (
            <Button size="sm" onClick={handleEmailSelected}>
              <Mail className="h-4 w-4 mr-1" /> Email {selectedIds.size} Selected
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Source / Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No contacts found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow key={`${c.contact_type}-${c.contact_id}`}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(c.contact_id)}
                        onCheckedChange={() => toggleSelect(c.contact_id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant={typeBadgeVariant(c.contact_type)}>{c.contact_type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{c.full_name || "—"}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>{c.company_name || "—"}</TableCell>
                    <TableCell>{c.phone || "—"}</TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{c.source_detail || "—"}</span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {filtered.length} contact{filtered.length !== 1 ? "s" : ""} shown
      </p>

      <CsvImportDialog open={csvOpen} onOpenChange={setCsvOpen} onImportComplete={refetch} />
      <AddLeadDialog open={addLeadOpen} onOpenChange={setAddLeadOpen} onLeadAdded={refetch} />
    </div>
  );
}
