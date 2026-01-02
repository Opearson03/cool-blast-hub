import { EmployeeLayout } from "@/components/layout/EmployeeLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { ChevronLeft, ChevronRight, MapPin, Clock, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Pour = {
  id: string;
  pour_name: string;
  pour_date: string | null;
  scheduled_time: string | null;
  visit_type: string | null;
  status: string | null;
  job: {
    id: string;
    name: string;
    site_address: string;
    builder_client: string | null;
  };
};

const visitTypeLabels: Record<string, string> = {
  pour: "Pour",
  earthworks: "Earthworks",
  formwork_place: "Formwork Place",
  formwork_strip: "Formwork Strip",
  cure: "Cure",
  seal: "Seal",
  other: "Other",
};

const visitTypeColors: Record<string, string> = {
  pour: "bg-primary text-primary-foreground",
  earthworks: "bg-amber-600 text-white",
  formwork_place: "bg-blue-600 text-white",
  formwork_strip: "bg-purple-600 text-white",
  cure: "bg-green-600 text-white",
  seal: "bg-cyan-600 text-white",
  other: "bg-muted text-muted-foreground",
};

export default function EmployeeSchedule() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const queryClient = useQueryClient();

  const { data: pours, isLoading } = useQuery({
    queryKey: ["employee-schedule", weekStart.toISOString()],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const weekEnd = addDays(weekStart, 6);

      const { data, error } = await supabase
        .from("pour_employees")
        .select(`
          pour_id,
          job_pours!inner (
            id,
            pour_name,
            pour_date,
            scheduled_time,
            visit_type,
            status,
            jobs!inner (
              id,
              name,
              site_address,
              builder_client
            )
          )
        `)
        .eq("employee_id", user.id)
        .gte("job_pours.pour_date", format(weekStart, "yyyy-MM-dd"))
        .lte("job_pours.pour_date", format(weekEnd, "yyyy-MM-dd"));

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.job_pours.id,
        pour_name: item.job_pours.pour_name,
        pour_date: item.job_pours.pour_date,
        scheduled_time: item.job_pours.scheduled_time,
        visit_type: item.job_pours.visit_type,
        status: item.job_pours.status,
        job: {
          id: item.job_pours.jobs.id,
          name: item.job_pours.jobs.name,
          site_address: item.job_pours.jobs.site_address,
          builder_client: item.job_pours.jobs.builder_client,
        },
      })) as Pour[];
    },
  });

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const poursByDate = useMemo(() => {
    const map: Record<string, Pour[]> = {};
    days.forEach((day) => {
      map[format(day, "yyyy-MM-dd")] = [];
    });
    pours?.forEach((pour) => {
      if (pour.pour_date) {
        const key = pour.pour_date;
        if (map[key]) {
          map[key].push(pour);
        }
      }
    });
    return map;
  }, [pours, days]);

  const navigatePrev = () => setWeekStart((prev) => addDays(prev, -7));
  const navigateNext = () => setWeekStart((prev) => addDays(prev, 7));
  const goToToday = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["employee-schedule"] });
  }, [queryClient]);

  return (
    <EmployeeLayout>
      <PullToRefresh onRefresh={handleRefresh} className="pb-20">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">My Schedule</h1>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={navigatePrev}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="font-medium text-sm">
            {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")}
          </span>
          <Button variant="ghost" size="icon" onClick={navigateNext}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Schedule Grid */}
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))
          ) : (
            days.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayPours = poursByDate[dateKey] || [];
              const isToday = isSameDay(day, new Date());

              return (
                <Card key={dateKey} className={isToday ? "border-primary" : ""}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <span className={isToday ? "text-primary font-bold" : "text-muted-foreground"}>
                        {format(day, "EEEE")}
                      </span>
                      <span className={isToday ? "text-primary" : ""}>
                        {format(day, "MMM d")}
                      </span>
                      {isToday && (
                        <Badge variant="default" className="text-xs">Today</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {dayPours.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">No scheduled work</p>
                    ) : (
                      <div className="space-y-2">
                        {dayPours.map((pour) => (
                          <div
                            key={pour.id}
                            className="p-3 rounded-lg bg-muted/50 border border-border"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="font-medium text-sm">{pour.pour_name}</div>
                              <Badge className={visitTypeColors[pour.visit_type || "other"]}>
                                {visitTypeLabels[pour.visit_type || "other"]}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5" />
                                <span>{pour.job.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5" />
                                <span>{pour.job.site_address}</span>
                              </div>
                              {pour.scheduled_time && (
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>{pour.scheduled_time}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </PullToRefresh>
    </EmployeeLayout>
  );
}
