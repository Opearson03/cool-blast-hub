import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  List,
  Grid3X3,
  Palmtree
} from "lucide-react";
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isToday
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
import { DraggablePour } from "@/components/schedule/DraggablePour";
import { DroppablePourDay } from "@/components/schedule/DroppablePourDay";
import { PourDetailSheet } from "@/components/schedule/PourDetailSheet";
import { useEmployeesOnLeave, getEmployeesOnLeaveForDate } from "@/hooks/useEmployeesOnLeave";

type Pour = {
  id: string;
  pour_name: string;
  pour_date: string | null;
  scheduled_time: string | null;
  status: string | null;
  visit_type: string | null;
  job_id: string;
  job?: {
    id: string;
    name: string;
    site_address: string;
    job_number: string | null;
  };
};

type ViewMode = "week" | "month";

export default function AdminSchedule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [activePour, setActivePour] = useState<Pour | null>(null);
  const [selectedPour, setSelectedPour] = useState<Pour | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadBusinessId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();
      if (profile?.business_id) setBusinessId(profile.business_id);
    };
    loadBusinessId();
  }, []);

  const { data: employeesOnLeave = [] } = useEmployeesOnLeave(businessId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: pours = [] } = useQuery({
    queryKey: ["schedule-pours"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_pours")
        .select(`
          id, 
          pour_name, 
          pour_date, 
          scheduled_time, 
          status,
          visit_type,
          job_id,
          job:jobs(id, name, site_address, job_number)
        `)
        .neq("status", "cancelled")
        .order("scheduled_time", { ascending: true });
      if (error) throw error;
      return data as Pour[];
    },
  });

  const updatePourDate = useMutation({
    mutationFn: async ({ pourId, newDate }: { pourId: string; newDate: string }) => {
      const { error } = await supabase
        .from("job_pours")
        .update({ pour_date: newDate })
        .eq("id", pourId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-pours"] });
      toast({ title: "Pour rescheduled" });
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

  const poursByDate = useMemo(() => {
    const map = new Map<string, Pour[]>();
    pours.forEach((pour) => {
      if (pour.pour_date) {
        const dateKey = pour.pour_date;
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(pour);
      }
    });
    return map;
  }, [pours]);

  const unscheduledPours = useMemo(() => {
    return pours.filter((pour) => !pour.pour_date);
  }, [pours]);

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
    const pour = pours.find((p) => p.id === event.active.id);
    if (pour) setActivePour(pour);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActivePour(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const pourId = active.id as string;
      const newDate = over.id as string;

      if (newDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        updatePourDate.mutate({ pourId, newDate });
      }
    }
  };

  const handlePourClick = (pour: Pour) => {
    setSelectedPour(pour);
    setDetailSheetOpen(true);
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

          {/* Unscheduled Pours */}
          {unscheduledPours.length > 0 && (
            <Card className="p-3">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Unscheduled ({unscheduledPours.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {unscheduledPours.map((pour) => (
                  <DraggablePour key={pour.id} pour={pour} compact onClick={handlePourClick} />
                ))}
              </div>
            </Card>
          )}

          {/* Calendar Grid */}
          {viewMode === "week" ? (
            <div className="space-y-2">
              {days.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayPours = poursByDate.get(dateKey) || [];
                const onLeave = getEmployeesOnLeaveForDate(dateKey, employeesOnLeave);
                
                return (
                  <DroppablePourDay
                    key={dateKey}
                    date={day}
                    dateKey={dateKey}
                    pours={dayPours}
                    isWeekView
                    onPourClick={handlePourClick}
                    employeesOnLeave={onLeave}
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
                const dayPours = poursByDate.get(dateKey) || [];
                const isCurrentMonth = isSameMonth(day, currentDate);
                const onLeave = getEmployeesOnLeaveForDate(dateKey, employeesOnLeave);
                
                return (
                  <DroppablePourDay
                    key={dateKey}
                    date={day}
                    dateKey={dateKey}
                    pours={dayPours}
                    isCurrentMonth={isCurrentMonth}
                    onPourClick={handlePourClick}
                    employeesOnLeave={onLeave}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activePour ? (
            <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-lg">
              <p className="text-sm font-medium">{activePour.pour_name}</p>
              {activePour.job && (
                <p className="text-xs opacity-80">{activePour.job.name}</p>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Pour Detail Sheet */}
      <PourDetailSheet
        pour={selectedPour}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
      />
    </AdminLayout>
  );
}
