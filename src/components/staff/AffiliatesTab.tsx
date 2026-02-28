import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function AffiliatesTab() {
  const queryClient = useQueryClient();

  const { data: affiliates, isLoading } = useQuery({
    queryKey: ["staff-affiliates"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_all_affiliates");
      if (error) throw error;
      return data as any[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("affiliates")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-affiliates"] });
      toast.success("Affiliate status updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Fetch all commissions for staff view
  const { data: allCommissions } = useQuery({
    queryKey: ["staff-all-commissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_commissions")
        .select("*, affiliates(full_name, email)")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const markPaid = useMutation({
    mutationFn: async (commissionId: string) => {
      const { error } = await supabase
        .from("affiliate_commissions")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", commissionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-all-commissions"] });
      queryClient.invalidateQueries({ queryKey: ["staff-affiliates"] });
      toast.success("Commission marked as paid");
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Affiliates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Affiliates</CardTitle>
        </CardHeader>
        <CardContent>
          {affiliates && affiliates.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Instagram</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Referrals</TableHead>
                    <TableHead>Total Earned</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliates.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.full_name}</TableCell>
                      <TableCell>{a.email}</TableCell>
                      <TableCell>{a.instagram_handle || "—"}</TableCell>
                      <TableCell className="font-mono text-sm">{a.affiliate_code}</TableCell>
                      <TableCell>{a.referral_count}</TableCell>
                      <TableCell>${((a.total_earned || 0) / 100).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={a.status === "approved" ? "default" : a.status === "pending" ? "secondary" : "destructive"}>
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {a.status !== "approved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus.mutate({ id: a.id, status: "approved" })}
                              disabled={updateStatus.isPending}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" /> Approve
                            </Button>
                          )}
                          {a.status !== "suspended" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus.mutate({ id: a.id, status: "suspended" })}
                              disabled={updateStatus.isPending}
                            >
                              <XCircle className="h-3 w-3 mr-1" /> Suspend
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-6">No affiliates yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Pending Commissions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pending Payouts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allCommissions && allCommissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Month #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allCommissions.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell>{(c.affiliates as any)?.full_name || "—"}</TableCell>
                    <TableCell className="font-medium">${(c.amount_cents / 100).toFixed(2)}</TableCell>
                    <TableCell>{c.month_number}/10</TableCell>
                    <TableCell>{format(new Date(c.created_at), "dd MMM yyyy")}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => markPaid.mutate(c.id)}
                        disabled={markPaid.isPending}
                      >
                        Mark Paid
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-6">No pending payouts.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
