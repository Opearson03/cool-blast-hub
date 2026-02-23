import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ShieldCheck, Search } from "lucide-react";
import { useState, useMemo } from "react";
import type { SubcontractorProfile } from "@/hooks/useSubcontractorProfile";

const TRADE_OPTIONS = [
  "Concreter", "Steel Fixer", "Formworker", "Pump Operator", "Excavation", "Labourer",
];

export function SubcontractorAdminTable() {
  const [search, setSearch] = useState("");
  const [gstFilter, setGstFilter] = useState<string>("all");
  const [tradeFilter, setTradeFilter] = useState<string>("all");

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["admin-subcontractor-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_all_subcontractor_profiles" as any);
      if (error) throw error;
      return data as unknown as SubcontractorProfile[];
    },
  });

  const filtered = useMemo(() => {
    if (!profiles) return [];
    return profiles.filter((p) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        p.legal_name?.toLowerCase().includes(searchLower) ||
        p.first_name?.toLowerCase().includes(searchLower) ||
        p.last_name?.toLowerCase().includes(searchLower) ||
        p.abn?.includes(search) ||
        p.base_postcode?.includes(search);

      const matchesGst =
        gstFilter === "all" ||
        (gstFilter === "yes" && p.gst_registered) ||
        (gstFilter === "no" && !p.gst_registered);

      const matchesTrade =
        tradeFilter === "all" || p.trade_types?.includes(tradeFilter);

      return matchesSearch && matchesGst && matchesTrade;
    });
  }, [profiles, search, gstFilter, tradeFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subcontractor Directory ({profiles?.length || 0})</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, ABN, postcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={gstFilter} onValueChange={setGstFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="GST Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All GST</SelectItem>
              <SelectItem value="yes">GST Registered</SelectItem>
              <SelectItem value="no">Not GST</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tradeFilter} onValueChange={setTradeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Trade Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trades</SelectItem>
              {TRADE_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>ABN</TableHead>
                <TableHead>Legal Name</TableHead>
                <TableHead>GST</TableHead>
                <TableHead>Trades</TableHead>
                <TableHead>Postcode</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No subcontractors found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {p.first_name} {p.last_name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {p.abn_verified && <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
                        <span className="text-sm">{p.abn || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{p.legal_name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={p.gst_registered ? "default" : "secondary"} className="text-xs">
                        {p.gst_registered ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {p.trade_types?.map((t) => (
                          <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{p.base_postcode || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={p.availability_status === "available" ? "default" : "secondary"} className="text-xs">
                        {p.availability_status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
