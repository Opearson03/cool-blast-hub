import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { 
  ChevronLeft, 
  ChevronRight, 
  List,
  Grid3X3,
  Palmtree,
  Plus
} from "lucide-react";
import { QuickSiteVisitDialog } from "@/components/schedule/QuickSiteVisitDialog";
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
import { DraggableEstimate, ScheduleEstimate, EstimateEventType } from "@/components/schedule/DraggableEstimate";
import { DroppablePourDay } from "@/components/schedule/DroppablePourDay";
import { PourDetailSheet } from "@/components/schedule/PourDetailSheet";
import { EstimateDetailSheet } from "@/components/estimates/EstimateDetailSheet";
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

type MiscJob = {
  id: string;
  name: string;
  site_address: string;
  scheduled_date: string | null;
  status: string | null;
  job_notes: string | null;
};

type EstimateEvent = {
  estimate: ScheduleEstimate;
  eventType: EstimateEventType;
  date: string;
};

type FullEstimate = {
  id: string;
  estimate_number: string;
  client_name: string;
  company_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  site_address: string;
  description: string | null;
  total_amount: number;
  status: "draft" | "sent" | "accepted" | "declined";
  created_at: string;
  valid_until: string | null;
  notes: string | null;
  site_visit_date: string | null;
  follow_up_date: string | null;
};

type ViewMode = "week" | "month";

export default function AdminSchedule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [activePour, setActivePour] = useState<Pour | null>(null);
  const [activeEstimate, setActiveEstimate] = useState<{ estimate: ScheduleEstimate; eventType: EstimateEventType } | null>(null);
  const [selectedPour, setSelectedPour] = useState<Pour | null>(null);
  const [selectedEstimate, setSelectedEstimate] = useState<FullEstimate | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [estimateSheetOpen, setEstimateSheetOpen] = useState(false);
  const [siteVisitDialogOpen, setSiteVisitDialogOpen] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

  const { data: miscJobs = [] } = useQuery({
    queryKey: ["schedule-misc-jobs"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();
      
      if (!profile?.business_id) return [];

      const { data, error } = await supabase
        .from("jobs")
        .select("id, name, site_address, scheduled_date, status, job_notes")
        .eq("business_id", profile.business_id)
        .eq("job_type", "misc")
        .neq("status", "cancelled")
        .neq("status", "completed");
      
      if (error) throw error;
      return data as MiscJob[];
    },
  });

  const { data: estimates = [] } = useQuery({
    queryKey: ["schedule-estimates"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();
      
      if (!profile?.business_id) return [];

      const { data, error } = await supabase
        .from("estimates")
        .select("id, client_name, site_address, estimate_number, site_visit_date, follow_up_date, status, total_amount")
        .eq("business_id", profile.business_id)
        .neq("status", "accepted")
        .neq("status", "declined")
        .or("site_visit_date.not.is.null,follow_up_date.not.is.null");
      
      if (error) throw error;
      return data as ScheduleEstimate[];
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

  const updateEstimateDate = useMutation({
    mutationFn: async ({ estimateId, field, newDate }: { estimateId: string; field: "site_visit_date" | "follow_up_date"; newDate: string }) => {
      const { error } = await supabase
        .from("estimates")
        .update({ [field]: newDate })
        .eq("id", estimateId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-estimates"] });
      toast({ title: "Estimate rescheduled" });
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

  // Group estimate events by date
  const estimateEventsByDate = useMemo(() => {
    const map = new Map<string, EstimateEvent[]>();
    estimates.forEach((estimate) => {
      if (estimate.site_visit_date) {
        const dateKey = estimate.site_visit_date;
        if (!map.has(dateKey)) map.set(dateKey, []);
        map.get(dateKey)!.push({ estimate, eventType: "site_visit", date: dateKey });
      }
      if (estimate.follow_up_date) {
        const dateKey = estimate.follow_up_date;
        if (!map.has(dateKey)) map.set(dateKey, []);
        map.get(dateKey)!.push({ estimate, eventType: "follow_up", date: dateKey });
      }
    });
    return map;
  }, [estimates]);

  // Group misc jobs by date
  const miscJobsByDate = useMemo(() => {
    const map = new Map<string, MiscJob[]>();
    miscJobs.forEach((job) => {
      if (job.scheduled_date) {
        const dateKey = job.scheduled_date;
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(job);
      }
    });
    return map;
  }, [miscJobs]);

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
    const activeId = event.active.id as string;
    
    // Check if it's an estimate drag
    if (activeId.startsWith("estimate-")) {
      const data = event.active.data.current as { estimate: ScheduleEstimate; eventType: EstimateEventType } | undefined;
      if (data) {
        setActiveEstimate(data);
        setActivePour(null);
      }
    } else {
      // It's a pour drag
      const pour = pours.find((p) => p.id === activeId);
      if (pour) {
        setActivePour(pour);
        setActiveEstimate(null);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActivePour(null);
    setActiveEstimate(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeId = active.id as string;
      const newDate = over.id as string;

      if (newDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Check if it's an estimate drag
        if (activeId.startsWith("estimate-")) {
          const data = active.data.current as { estimate: ScheduleEstimate; eventType: EstimateEventType } | undefined;
          if (data) {
            const field = data.eventType === "site_visit" ? "site_visit_date" : "follow_up_date";
            updateEstimateDate.mutate({ estimateId: data.estimate.id, field, newDate });
          }
        } else {
          // It's a pour
          updatePourDate.mutate({ pourId: activeId, newDate });
        }
      }
    }
  };

  const handlePourClick = (pour: Pour) => {
    setSelectedPour(pour);
    setDetailSheetOpen(true);
  };

  const handleEstimateClick = async (estimate: ScheduleEstimate, _eventType: EstimateEventType) => {
    // Fetch full estimate details
    const { data, error } = await supabase
      .from("estimates")
      .select("*")
      .eq("id", estimate.id)
      .single();
    
    if (error) {
      toast({ title: "Error loading estimate", variant: "destructive" });
      return;
    }
    
    setSelectedEstimate(data as FullEstimate);
    setEstimateSheetOpen(true);
  };

  const handleConvertToJob = (estimate: FullEstimate) => {
    navigate("/admin/jobs", { 
      state: { 
        createJobFromEstimate: {
          name: `${estimate.client_name} - ${estimate.site_address.split(",")[0]}`,
          site_address: estimate.site_address,
          builder_client: estimate.client_name,
          job_notes: `Converted from estimate ${estimate.estimate_number}\nQuote Total: $${estimate.total_amount?.toFixed(2)}`,
        }
      }
    });
  };

  const handleMiscJobClick = (job: MiscJob) => {
    navigate(`/admin/jobs/${job.id}`);
  };

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["schedule-pours"] }),
      queryClient.invalidateQueries({ queryKey: ["schedule-estimates"] }),
      queryClient.invalidateQueries({ queryKey: ["schedule-misc-jobs"] }),
    ]);
  }, [queryClient]);

  return (
    <AdminLayout>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <PullToRefresh onRefresh={handleRefresh} className="h-full">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Schedule</h1>
              <Button size="sm" onClick={() => setSiteVisitDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Site Visit
              </Button>
            </div>
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
                const dayEstimates = estimateEventsByDate.get(dateKey) || [];
                const dayMiscJobs = miscJobsByDate.get(dateKey) || [];
                const onLeave = getEmployeesOnLeaveForDate(dateKey, employeesOnLeave);
                
                return (
                  <DroppablePourDay
                    key={dateKey}
                    date={day}
                    dateKey={dateKey}
                    pours={dayPours}
                    estimateEvents={dayEstimates}
                    miscJobs={dayMiscJobs}
                    isWeekView
                    onPourClick={handlePourClick}
                    onEstimateClick={handleEstimateClick}
                    onMiscJobClick={handleMiscJobClick}
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
                const dayEstimates = estimateEventsByDate.get(dateKey) || [];
                const dayMiscJobs = miscJobsByDate.get(dateKey) || [];
                const isCurrentMonth = isSameMonth(day, currentDate);
                const onLeave = getEmployeesOnLeaveForDate(dateKey, employeesOnLeave);
                
                return (
                  <DroppablePourDay
                    key={dateKey}
                    date={day}
                    dateKey={dateKey}
                    pours={dayPours}
                    estimateEvents={dayEstimates}
                    miscJobs={dayMiscJobs}
                    isCurrentMonth={isCurrentMonth}
                    onPourClick={handlePourClick}
                    onEstimateClick={handleEstimateClick}
                    onMiscJobClick={handleMiscJobClick}
                    employeesOnLeave={onLeave}
                  />
                );
              })}
            </div>
          )}
        </div>
        </PullToRefresh>

        {/* Drag Overlay */}
        <DragOverlay>
          {activePour ? (
            <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-lg">
              <p className="text-sm font-medium">{activePour.pour_name}</p>
              {activePour.job && (
                <p className="text-xs opacity-80">{activePour.job.name}</p>
              )}
            </div>
          ) : activeEstimate ? (
            <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-lg">
              <p className="text-sm font-medium">{activeEstimate.estimate.client_name}</p>
              <p className="text-xs opacity-80">{activeEstimate.eventType === "site_visit" ? "Site Visit" : "Follow Up"}</p>
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

      {/* Estimate Detail Sheet */}
      <EstimateDetailSheet
        estimate={selectedEstimate}
        open={estimateSheetOpen}
        onOpenChange={setEstimateSheetOpen}
        onConvertToJob={handleConvertToJob}
      />

      {/* Quick Site Visit Dialog */}
      <QuickSiteVisitDialog
        open={siteVisitDialogOpen}
        onOpenChange={setSiteVisitDialogOpen}
      />
    </AdminLayout>
  );
}
