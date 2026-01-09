import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, MapPin, ChevronRight } from "lucide-react";
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

interface DailyScheduleWidgetProps {
  businessId: string;
}

export function DailyScheduleWidget({ businessId }: DailyScheduleWidgetProps) {
  const [pours, setPours] = useState<Pour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTodaysPours = async () => {
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
      }
      setLoading(false);
    };

    if (businessId) {
      fetchTodaysPours();
    }
  }, [businessId]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Today's Schedule
          </CardTitle>
          <Link 
            to="/admin/schedule" 
            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
          >
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : pours.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No tasks scheduled for today</p>
          </div>
        ) : (
          pours.map((pour) => (
            <Link
              key={pour.id}
              to={`/admin/jobs/${pour.job?.id}`}
              className="block p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
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
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={`shrink-0 ${statusColors[pour.status || "scheduled"]}`}
                >
                  {pour.status || "scheduled"}
                </Badge>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
