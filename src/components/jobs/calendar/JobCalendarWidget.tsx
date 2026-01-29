import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Calendar, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Truck, 
  HardHat, 
  MapPin,
  Bell,
  Flag,
  ClipboardCheck,
  Users
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import { AddJobDateDialog } from "./AddJobDateDialog";
import { useToast } from "@/hooks/use-toast";

interface JobCalendarWidgetProps {
  jobId: string;
  businessId: string;
}

interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  type: "pour" | "site_visit" | "subbie" | "reminder" | "deadline" | "milestone" | "inspection";
  status?: string;
  isCompleted?: boolean;
  sourceTable?: string;
}

const EVENT_COLORS: Record<string, string> = {
  pour: "bg-blue-500",
  site_visit: "bg-purple-500",
  subbie: "bg-orange-500",
  reminder: "bg-yellow-500",
  deadline: "bg-red-500",
  milestone: "bg-green-500",
  inspection: "bg-cyan-500",
};

const EVENT_ICONS: Record<string, React.ReactNode> = {
  pour: <Truck className="w-3 h-3" />,
  site_visit: <MapPin className="w-3 h-3" />,
  subbie: <Users className="w-3 h-3" />,
  reminder: <Bell className="w-3 h-3" />,
  deadline: <Flag className="w-3 h-3" />,
  milestone: <HardHat className="w-3 h-3" />,
  inspection: <ClipboardCheck className="w-3 h-3" />,
};

export function JobCalendarWidget({ jobId, businessId }: JobCalendarWidgetProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pours for this job
  const { data: pours = [] } = useQuery({
    queryKey: ["job-pours-calendar", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_pours")
        .select("id, pour_name, pour_date, status, visit_type")
        .eq("job_id", jobId);
      if (error) throw error;
      return data;
    },
  });

  // Fetch scheduled subbies for this job
  const { data: subbieInvites = [] } = useQuery({
    queryKey: ["job-subbies-calendar", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("external_invites")
        .select("id, recipient_name, role, status")
        .eq("job_id", jobId)
        .eq("invite_type", "sub_trade")
        .eq("status", "accepted");
      if (error) throw error;
      return data;
    },
  });

  // Fetch job pours with subbies to get scheduled dates
  const { data: subbiePours = [] } = useQuery({
    queryKey: ["job-subbie-pours-calendar", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("external_invites")
        .select(`
          id, 
          recipient_name, 
          role, 
          status,
          job_pours!inner(id, pour_date, pour_name)
        `)
        .eq("job_id", jobId)
        .eq("invite_type", "sub_trade")
        .eq("status", "accepted");
      if (error) throw error;
      return data;
    },
  });

  // Fetch custom job dates
  const { data: jobDates = [] } = useQuery({
    queryKey: ["job-dates", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_dates")
        .select("*")
        .eq("job_id", jobId)
        .order("date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Toggle completion mutation
  const toggleCompletion = useMutation({
    mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      const { error } = await supabase
        .from("job_dates")
        .update({ is_completed: isCompleted })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-dates", jobId] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Combine all events
  const events = useMemo((): CalendarEvent[] => {
    const allEvents: CalendarEvent[] = [];

    // Add pours
    pours.forEach((pour) => {
      if (pour.pour_date) {
        allEvents.push({
          id: pour.id,
          date: new Date(pour.pour_date),
          title: pour.pour_name,
          type: pour.visit_type === "site_visit" ? "site_visit" : "pour",
          status: pour.status || undefined,
          sourceTable: "job_pours",
        });
      }
    });

    // Add subbies from pours
    subbiePours.forEach((invite: any) => {
      const pour = invite.job_pours;
      if (pour?.pour_date) {
        allEvents.push({
          id: invite.id,
          date: new Date(pour.pour_date),
          title: `${invite.recipient_name} (${invite.role})`,
          type: "subbie",
          status: invite.status,
          sourceTable: "external_invites",
        });
      }
    });

    // Add custom job dates
    jobDates.forEach((jd: any) => {
      allEvents.push({
        id: jd.id,
        date: new Date(jd.date),
        title: jd.title,
        type: jd.date_type as CalendarEvent["type"],
        isCompleted: jd.is_completed,
        sourceTable: "job_dates",
      });
    });

    return allEvents;
  }, [pours, subbiePours, jobDates]);

  // Get days in current month view
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(event.date, day));
  };

  // Navigation
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  // Upcoming events (next 14 days)
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    return events
      .filter((event) => event.date >= today)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5);
  }, [events]);

  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Job Calendar
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setSelectedDate(null);
              setIsAddDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Date
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="font-semibold min-w-[140px] text-center">
              {format(currentMonth, "MMMM yyyy")}
            </h3>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="border rounded-lg overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-muted text-muted-foreground text-xs font-medium">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="p-2 text-center">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {/* Empty cells for days before month start */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-start-${i}`} className="p-2 min-h-[60px] bg-muted/30" />
            ))}

            {/* Actual days */}
            {daysInMonth.map((day) => {
              const dayEvents = getEventsForDay(day);
              const hasEvents = dayEvents.length > 0;

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "p-1 min-h-[60px] border-t border-l cursor-pointer hover:bg-muted/50 transition-colors",
                    !isSameMonth(day, currentMonth) && "bg-muted/30 text-muted-foreground",
                    isToday(day) && "bg-primary/5"
                  )}
                  onClick={() => {
                    setSelectedDate(day);
                    setIsAddDialogOpen(true);
                  }}
                >
                  <div className={cn(
                    "text-xs font-medium mb-1",
                    isToday(day) && "text-primary font-bold"
                  )}>
                    {format(day, "d")}
                  </div>
                  
                  {/* Event dots/indicators */}
                  {hasEvents && (
                    <div className="flex flex-wrap gap-0.5">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            EVENT_COLORS[event.type],
                            event.isCompleted && "opacity-40"
                          )}
                          title={event.title}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[8px] text-muted-foreground">
                          +{dayEvents.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Empty cells for days after month end */}
            {Array.from({ length: 6 - monthEnd.getDay() }).map((_, i) => (
              <div key={`empty-end-${i}`} className="p-2 min-h-[60px] border-t border-l bg-muted/30" />
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          {Object.entries(EVENT_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className={cn("w-2 h-2 rounded-full", color)} />
              <span className="capitalize text-muted-foreground">
                {type.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>

        {/* Upcoming Events List */}
        {upcomingEvents.length > 0 && (
          <div className="pt-4 border-t space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Upcoming</h4>
            <div className="space-y-2">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg bg-muted/50",
                    event.isCompleted && "opacity-60"
                  )}
                >
                  {event.sourceTable === "job_dates" && (
                    <Checkbox
                      checked={event.isCompleted}
                      onCheckedChange={(checked) => {
                        toggleCompletion.mutate({ 
                          id: event.id, 
                          isCompleted: checked as boolean 
                        });
                      }}
                    />
                  )}
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0",
                    EVENT_COLORS[event.type]
                  )}>
                    {EVENT_ICONS[event.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      event.isCompleted && "line-through"
                    )}>
                      {event.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(event.date, "EEE, d MMM")}
                      {isToday(event.date) && (
                        <Badge variant="outline" className="ml-2 text-[10px] py-0">
                          Today
                        </Badge>
                      )}
                    </p>
                  </div>
                  {event.status && (
                    <Badge variant="secondary" className="text-[10px]">
                      {event.status}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {events.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No events scheduled yet</p>
            <p className="text-xs">Add pours, site visits, or reminders to see them here</p>
          </div>
        )}
      </CardContent>

      <AddJobDateDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        jobId={jobId}
        businessId={businessId}
        initialDate={selectedDate}
      />
    </Card>
  );
}