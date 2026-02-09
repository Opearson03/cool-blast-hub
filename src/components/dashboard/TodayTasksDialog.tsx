import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, MapPin, Users, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Pour {
  id: string;
  pour_name: string;
  scheduled_time: string | null;
  status: string | null;
  visit_type: string | null;
  job: {
    id: string;
    name: string;
    site_address: string;
    job_number: string | null;
  } | null;
}

interface SubbieStats {
  total: number;
  confirmed: number;
}

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  in_progress: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
  cancelled: "bg-muted text-muted-foreground border-muted",
};

const visitTypeLabels: Record<string, string> = {
  pour: "Pour",
  earthworks: "Earthworks",
  formwork_place: "Formwork Place",
  formwork_strip: "Formwork Strip",
  cure: "Cure",
  seal: "Seal",
  site_visit: "Site Visit",
};

interface TodayTasksDialogProps {
  businessId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TodayTasksDialog({ businessId, open, onOpenChange }: TodayTasksDialogProps) {
  const navigate = useNavigate();
  const [pours, setPours] = useState<Pour[]>([]);
  const [subbieStats, setSubbieStats] = useState<Record<string, SubbieStats>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !businessId) return;

    const fetchTodaysPours = async () => {
      setLoading(true);
      const today = format(new Date(), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("job_pours")
        .select(`
          id,
          pour_name,
          scheduled_time,
          status,
          visit_type,
          job:jobs!inner(id, name, site_address, job_number, business_id)
        `)
        .eq("pour_date", today)
        .eq("job.business_id", businessId)
        .order("scheduled_time", { ascending: true });

      if (error) {
        console.error("Error fetching today's pours:", error);
      } else {
        setPours(data || []);

        if (data && data.length > 0) {
          const pourIds = data.map((p) => p.id);
          const { data: invites } = await supabase
            .from("external_invites")
            .select("job_pour_id, status")
            .in("job_pour_id", pourIds)
            .eq("invite_type", "sub_trade");

          if (invites) {
            const stats: Record<string, SubbieStats> = {};
            for (const invite of invites) {
              if (!stats[invite.job_pour_id]) {
                stats[invite.job_pour_id] = { total: 0, confirmed: 0 };
              }
              stats[invite.job_pour_id].total++;
              if (invite.status === "accepted") {
                stats[invite.job_pour_id].confirmed++;
              }
            }
            setSubbieStats(stats);
          }
        }
      }
      setLoading(false);
    };

    fetchTodaysPours();
  }, [open, businessId]);

  const handlePourClick = (jobId: string) => {
    onOpenChange(false);
    navigate(`/admin/jobs/${jobId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Today's Tasks
          </DialogTitle>
          <DialogDescription>
            Scheduled pours and visits for today
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto space-y-2 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : pours.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No tasks scheduled for today</p>
            </div>
          ) : (
            pours.map((pour) => (
              <div
                key={pour.id}
                onClick={() => pour.job?.id && handlePourClick(pour.job.id)}
                className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{pour.pour_name}</span>
                      {pour.visit_type && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          {visitTypeLabels[pour.visit_type] || pour.visit_type}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {pour.job?.name}
                      {pour.job?.job_number && ` • ${pour.job.job_number}`}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {pour.scheduled_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {pour.scheduled_time}
                        </span>
                      )}
                      {pour.job?.site_address && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{pour.job.site_address}</span>
                        </span>
                      )}
                      {subbieStats[pour.id] && subbieStats[pour.id].total > 0 && (
                        <span
                          className={`flex items-center gap-1 ${
                            subbieStats[pour.id].confirmed === subbieStats[pour.id].total
                              ? "text-green-500"
                              : ""
                          }`}
                        >
                          {subbieStats[pour.id].confirmed === subbieStats[pour.id].total ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <Users className="h-3 w-3" />
                          )}
                          {subbieStats[pour.id].confirmed}/{subbieStats[pour.id].total}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`shrink-0 ${statusColors[pour.status || "scheduled"]}`}
                  >
                    {pour.status || "scheduled"}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
