import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { SubTradeStatusBadge } from "@/components/jobs/SubTradeStatusBadge";
import type { SubTradeInvite } from "@/hooks/useSubTradeInvites";

interface JobSubbiesTabProps {
  jobId: string;
}

interface PourWithJob {
  id: string;
  pour_name: string;
  pour_date: string | null;
  scheduled_time: string | null;
}

export function JobSubbiesTab({ jobId }: JobSubbiesTabProps) {
  // Fetch all invites for this job
  const { data: invites = [], isLoading: loadingInvites } = useQuery({
    queryKey: ["sub-trade-invites-job", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("external_invites")
        .select("*")
        .eq("job_id", jobId)
        .eq("invite_type", "sub_trade")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SubTradeInvite[];
    },
  });

  // Fetch pours for this job to show context
  const { data: pours = [] } = useQuery({
    queryKey: ["job-pours", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_pours")
        .select("id, pour_name, pour_date, scheduled_time")
        .eq("job_id", jobId)
        .order("pour_date", { ascending: true });
      if (error) throw error;
      return data as PourWithJob[];
    },
  });

  if (loadingInvites) {
    return (
      <div className="text-center py-8 text-muted-foreground">Loading subbies...</div>
    );
  }

  // Group invites by pour
  const invitesByPour = pours.map((pour) => ({
    pour,
    invites: invites.filter((inv) => inv.job_pour_id === pour.id),
  }));

  const totalInvites = invites.length;
  const confirmedCount = invites.filter((i) => i.status === "accepted").length;
  const pendingCount = invites.filter((i) => ["sent", "viewed"].includes(i.status)).length;
  const declinedCount = invites.filter((i) => i.status === "declined").length;

  if (totalInvites === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No Subbies Invited</h3>
          <p className="text-muted-foreground">
            Go to the Pours tab to invite subcontractors to specific pours
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold">{totalInvites}</div>
            <p className="text-xs text-muted-foreground">Total Invited</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-success">{confirmedCount}</div>
            <p className="text-xs text-muted-foreground">Confirmed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-warning">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-destructive">{declinedCount}</div>
            <p className="text-xs text-muted-foreground">Declined</p>
          </CardContent>
        </Card>
      </div>

      {/* Invites by Pour */}
      <div className="space-y-3">
        {invitesByPour.map(({ pour, invites: pourInvites }) => {
          if (pourInvites.length === 0) return null;
          
          return (
            <Card key={pour.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{pour.pour_name}</span>
                  {pour.pour_date && (
                    <span className="text-sm text-muted-foreground">
                      — {format(new Date(pour.pour_date), "EEE, d MMM")}
                      {pour.scheduled_time && ` @ ${pour.scheduled_time.slice(0, 5)}`}
                    </span>
                  )}
                </div>
                
                <div className="space-y-2">
                  {pourInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium text-sm">{invite.recipient_name}</div>
                          <div className="text-xs text-muted-foreground">{invite.role}</div>
                        </div>
                      </div>
                      <SubTradeStatusBadge status={invite.status as any} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
