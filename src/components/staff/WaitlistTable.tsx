import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Mail, Phone, Filter } from "lucide-react";
import { format } from "date-fns";
import { OnboardWaitlistModal } from "./OnboardWaitlistModal";

interface WaitlistEntry {
  id: string;
  email: string;
  full_name: string | null;
  business_name: string | null;
  phone: string | null;
  created_at: string;
  referral_count: number;
  outreach_status: string;
  invited_at: string | null;
  checkout_url: string | null;
  checkout_tier: string | null;
  staff_notes: string | null;
}

type StatusFilter = "all" | "pending" | "invited" | "converted";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "Pending", variant: "outline" },
  invited: { label: "Invited", variant: "secondary" },
  converted: { label: "Converted", variant: "default" },
};

function OutreachBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { label: status, variant: "outline" as const };
  return (
    <Badge variant={config.variant} className={
      status === "converted" ? "bg-primary/15 text-primary border-primary/30" :
      status === "invited" ? "bg-muted text-muted-foreground" :
      "border-border text-muted-foreground"
    }>
      {config.label}
    </Badge>
  );
}

export function WaitlistTable() {
  const queryClient = useQueryClient();
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data: entries, isLoading } = useQuery({
    queryKey: ["staff-waitlist-entries"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_waiting_list_entries");
      if (error) throw error;
      return data as WaitlistEntry[];
    },
    staleTime: 60000,
  });

  const filtered = entries?.filter((e) => {
    if (statusFilter === "all") return true;
    return (e.outreach_status ?? "pending") === statusFilter;
  });

  const counts = {
    all: entries?.length ?? 0,
    pending: entries?.filter((e) => (e.outreach_status ?? "pending") === "pending").length ?? 0,
    invited: entries?.filter((e) => e.outreach_status === "invited").length ?? 0,
    converted: entries?.filter((e) => e.outreach_status === "converted").length ?? 0,
  };

  const exportToCsv = () => {
    if (!entries?.length) return;

    const headers = ["Email", "Full Name", "Business Name", "Phone", "Referrals", "Status", "Invited At", "Joined Date", "Notes"];
    const rows = entries.map((entry) => [
      entry.email,
      entry.full_name || "",
      entry.business_name || "",
      entry.phone || "",
      String(entry.referral_count),
      entry.outreach_status ?? "pending",
      entry.invited_at ? format(new Date(entry.invited_at), "yyyy-MM-dd HH:mm") : "",
      format(new Date(entry.created_at), "yyyy-MM-dd HH:mm"),
      entry.staff_notes || "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `waitlist-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const handleOnboard = (entry: WaitlistEntry) => {
    setSelectedEntry(entry);
    setModalOpen(true);
  };

  const handleStatusChange = () => {
    queryClient.invalidateQueries({ queryKey: ["staff-waitlist-entries"] });
  };

  const filterButtons: { key: StatusFilter; label: string }[] = [
    { key: "all", label: `All (${counts.all})` },
    { key: "pending", label: `Pending (${counts.pending})` },
    { key: "invited", label: `Invited (${counts.invited})` },
    { key: "converted", label: `Converted (${counts.converted})` },
  ];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <CardTitle>Waiting List</CardTitle>
            <CardDescription>
              {entries?.length ?? 0} people waiting · sorted by priority (most referrals first)
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportToCsv} disabled={!entries?.length}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filter bar */}
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex gap-1 flex-wrap">
              {filterButtons.map(({ key, label }) => (
                <Button
                  key={key}
                  variant={statusFilter === key ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs px-3"
                  onClick={() => setStatusFilter(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {statusFilter === "all"
                ? "No entries on the waiting list yet"
                : `No ${statusFilter} entries`}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead className="hidden md:table-cell">Business Name</TableHead>
                    <TableHead className="hidden md:table-cell">Phone</TableHead>
                    <TableHead className="hidden md:table-cell">Referrals</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Joined</TableHead>
                    <TableHead className="w-[120px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered?.map((entry) => (
                    <TableRow key={entry.id} className={entry.outreach_status === "converted" ? "opacity-60" : ""}>
                      <TableCell className="font-medium">{entry.email}</TableCell>
                      <TableCell className="hidden sm:table-cell">{entry.full_name || "-"}</TableCell>
                      <TableCell className="hidden md:table-cell">{entry.business_name || "-"}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {entry.phone ? (
                          <a href={`tel:${entry.phone}`} className="text-primary hover:underline">
                            {entry.phone}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {entry.referral_count > 0 ? (
                          <span className="text-primary font-medium">{entry.referral_count}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <OutreachBadge status={entry.outreach_status ?? "pending"} />
                        {entry.invited_at && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(entry.invited_at), "MMM d")}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {format(new Date(entry.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleOnboard(entry)}
                            className="h-7 text-xs px-2"
                            disabled={entry.outreach_status === "converted"}
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Onboard
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => window.open(`mailto:${entry.email}`, "_blank")}
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <OnboardWaitlistModal
        entry={selectedEntry}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onStatusChange={handleStatusChange}
      />
    </>
  );
}
