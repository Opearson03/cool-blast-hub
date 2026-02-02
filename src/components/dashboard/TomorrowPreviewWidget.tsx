import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronRight, Clock, MapPin, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays } from "date-fns";

interface TomorrowTask {
  id: string;
  pour_name: string;
  scheduled_time: string | null;
  visit_type: string | null;
  job: {
    id: string;
    name: string;
    site_address: string;
  } | null;
  pendingSubbies: number;
}

interface TomorrowPreviewWidgetProps {
  businessId: string;
}

const visitTypeLabels: Record<string, string> = {
  pour: "Pour",
  earthworks: "Earthworks",
  formwork_place: "Formwork Place",
  formwork_strip: "Formwork Strip",
  cure: "Cure",
  seal: "Seal",
  site_visit: "Site Visit",
};

export function TomorrowPreviewWidget({ businessId }: TomorrowPreviewWidgetProps) {
  const [tasks, setTasks] = useState<TomorrowTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTomorrowTasks = async () => {
      const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("job_pours")
        .select(`
          id,
          pour_name,
          scheduled_time,
          visit_type,
          job:jobs!inner(id, name, site_address, business_id)
        `)
        .eq("pour_date", tomorrow)
        .eq("job.business_id", businessId)
        .order("scheduled_time", { ascending: true });

      if (error) {
        console.error("Error fetching tomorrow's tasks:", error);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        // Fetch pending subbie counts for all pours
        const pourIds = data.map((p) => p.id);
        const { data: invites } = await supabase
          .from("external_invites")
          .select("job_pour_id, status")
          .in("job_pour_id", pourIds)
          .in("status", ["sent", "viewed", "drafted"]);

        const pendingCounts: Record<string, number> = {};
        invites?.forEach((invite) => {
          pendingCounts[invite.job_pour_id] = (pendingCounts[invite.job_pour_id] || 0) + 1;
        });

        const tasksWithPending = data.map((task: any) => ({
          id: task.id,
          pour_name: task.pour_name,
          scheduled_time: task.scheduled_time,
          visit_type: task.visit_type,
          job: task.job,
          pendingSubbies: pendingCounts[task.id] || 0,
        }));

        setTasks(tasksWithPending);
      } else {
        setTasks([]);
      }

      setLoading(false);
    };

    if (businessId) {
      fetchTomorrowTasks();
    }
  }, [businessId]);

  const tomorrowDate = format(addDays(new Date(), 1), "EEEE, MMMM d");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Tomorrow's Preview
          </CardTitle>
          <Link
            to="/admin/schedule"
            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
          >
            View schedule <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">{tomorrowDate}</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No tasks scheduled for tomorrow</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary">{tasks.length} task{tasks.length !== 1 ? "s" : ""}</Badge>
              {tasks.some((t) => t.pendingSubbies > 0) && (
                <Badge variant="secondary">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {tasks.reduce((sum, t) => sum + t.pendingSubbies, 0)} pending responses
                </Badge>
              )}
            </div>
            {tasks.map((task) => (
              <Link
                key={task.id}
                to={`/admin/jobs/${task.job?.id}`}
                className="block p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{task.pour_name}</span>
                      {task.visit_type && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          {visitTypeLabels[task.visit_type] || task.visit_type}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {task.scheduled_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {task.scheduled_time}
                        </span>
                      )}
                      {task.job?.site_address && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{task.job.site_address}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  {task.pendingSubbies > 0 && (
                    <Badge variant="secondary" className="shrink-0">
                      {task.pendingSubbies} pending
                    </Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
