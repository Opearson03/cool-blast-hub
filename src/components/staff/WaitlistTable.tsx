import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Mail } from "lucide-react";
import { format } from "date-fns";

interface WaitlistEntry {
  id: string;
  email: string;
  full_name: string | null;
  business_name: string | null;
  created_at: string;
}

export function WaitlistTable() {
  const { data: entries, isLoading } = useQuery({
    queryKey: ["staff-waitlist-entries"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_waiting_list_entries");
      if (error) throw error;
      return data as WaitlistEntry[];
    },
    staleTime: 60000, // Consider data fresh for 1 minute
    // No refetchInterval - using realtime from parent component
  });

  const exportToCsv = () => {
    if (!entries?.length) return;

    const headers = ["Email", "Full Name", "Business Name", "Joined Date"];
    const rows = entries.map((entry) => [
      entry.email,
      entry.full_name || "",
      entry.business_name || "",
      format(new Date(entry.created_at), "yyyy-MM-dd HH:mm"),
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Waiting List</CardTitle>
          <CardDescription>
            {entries?.length ?? 0} people waiting for access
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={exportToCsv} disabled={!entries?.length}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : entries?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No entries on the waiting list yet
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries?.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.email}</TableCell>
                    <TableCell>{entry.full_name || "-"}</TableCell>
                    <TableCell>{entry.business_name || "-"}</TableCell>
                    <TableCell>
                      {format(new Date(entry.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(`mailto:${entry.email}`, "_blank")}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
