import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  List,
  Grid3X3
} from "lucide-react";
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isToday,
  parseISO
} from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { DraggableJob } from "@/components/schedule/DraggableJob";
import { DroppableDay } from "@/components/schedule/DroppableDay";
import { cn } from "@/lib/utils";

type Job = {
  id: string;
  job_number: string | null;
  name: string;
  site_address: string;
  scheduled_date: string | null;
  pour_time: string | null;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  crew_id: string | null;
};

type Crew = {
  id: string;
  name: string;
};

type ViewMode = "week" | "month";

export default function AdminSchedule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, job_number, name, site_address, scheduled_date, pour_time, status, crew_id")
        .neq("status", "cancelled")
        .order("pour_time", { ascending: true });
      if (error) throw error;
      return data as Job[];
    },
  });

  const { data: crews = [] } = useQuery({
    queryKey: ["crews"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crews").select("id, name");
      if (error) throw error;
      return data as Crew[];
    },
  });

  const updateJobDate = useMutation({
    mutationFn: async ({ jobId, newDate }: { jobId: string; newDate: string }) => {
      const { error } = await supabase
        .from("jobs")
        .update({ scheduled_date: newDate })
        .eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast({ title: "Job rescheduled" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const days = useMemo(() => {
    if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const monthStart = startOfWeek(start, { weekStartsOn: 1 });
      const monthEnd = endOfWeek(end, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: monthStart, end: monthEnd });
    }
  }, [currentDate, viewMode]);

  const jobsByDate = useMemo(() => {
    const map = new Map<string, Job[]>();
    jobs.forEach((job) => {
      if (job.scheduled_date) {
        const dateKey = job.scheduled_date;
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(job);
      }
    });
    return map;
  }, [jobs]);

  const unscheduledJobs = useMemo(() => {
    return jobs.filter((job) => !job.scheduled_date);
  }, [jobs]);

  const getCrewName = (crewId: string | null) => {
    if (!crewId) return null;
    return crews.find((c) => c.id === crewId)?.name;
  };

  const navigatePrev = () => {
    if (viewMode === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDragStart = (event: DragStartEvent) => {
    const job = jobs.find((j) => j.id === event.active.id);
    if (job) setActiveJob(job);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveJob(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const jobId = active.id as string;
      const newDate = over.id as string;

      // Validate it's a date string
      if (newDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        updateJobDate.mutate({ jobId, newDate });
      }
    }
  };

  return (
    <AdminLayout>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold">Schedule</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === "week" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("week")}
                  className="rounded-none"
                >
                  <List className="w-4 h-4 mr-1" />
                  Week
                </Button>
                <Button
                  variant={viewMode === "month" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("month")}
                  className="rounded-none"
                >
                  <Grid3X3 className="w-4 h-4 mr-1" />
                  Month
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={navigatePrev}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold">
              {viewMode === "week"
                ? `${format(days[0], "d MMM")} - ${format(days[6], "d MMM yyyy")}`
                : format(currentDate, "MMMM yyyy")}
            </h2>
            <Button variant="ghost" size="icon" onClick={navigateNext}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Unscheduled Jobs */}
          {unscheduledJobs.length > 0 && (
            <Card className="p-3">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Unscheduled ({unscheduledJobs.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {unscheduledJobs.map((job) => (
                  <DraggableJob key={job.id} job={job} getCrewName={getCrewName} compact />
                ))}
              </div>
            </Card>
          )}

          {/* Calendar Grid */}
          {viewMode === "week" ? (
            <div className="space-y-2">
              {days.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayJobs = jobsByDate.get(dateKey) || [];
                
                return (
                  <DroppableDay
                    key={dateKey}
                    date={day}
                    dateKey={dateKey}
                    jobs={dayJobs}
                    getCrewName={getCrewName}
                    isWeekView
                  />
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
              
              {/* Days */}
              {days.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayJobs = jobsByDate.get(dateKey) || [];
                const isCurrentMonth = isSameMonth(day, currentDate);
                
                return (
                  <DroppableDay
                    key={dateKey}
                    date={day}
                    dateKey={dateKey}
                    jobs={dayJobs}
                    getCrewName={getCrewName}
                    isCurrentMonth={isCurrentMonth}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeJob ? (
            <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-lg">
              <p className="text-sm font-medium">{activeJob.name}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </AdminLayout>
  );
}
