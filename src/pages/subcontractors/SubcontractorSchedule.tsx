import { useState, useMemo } from "react";
import { SubcontractorLayout } from "@/components/layout/SubcontractorLayout";
import { useSubcontractorInvites } from "@/hooks/useSubcontractorInvites";
import type { SubcontractorInvite } from "@/hooks/useSubcontractorInvites";
import { useUnavailableDates, useToggleUnavailableDate } from "@/hooks/useUnavailableDates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  format,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  eachDayOfInterval,
} from "date-fns";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Building2,
  Calendar,
  Ban,
} from "lucide-react";
import { SubcontractorEventDetailSheet } from "@/components/subcontractor/SubcontractorEventDetailSheet";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type ViewMode = "week" | "month";

export default function SubcontractorSchedule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedInvite, setSelectedInvite] = useState<SubcontractorInvite | null>(null);
  const { data: invites, isLoading } = useSubcontractorInvites();
  const { data: unavailableDates = [] } = useUnavailableDates();
  const toggleUnavailable = useToggleUnavailableDate();
  const { toast } = useToast();

  const acceptedInvites = useMemo(
    () => invites?.filter((i) => i.status === "accepted") || [],
    [invites]
  );

  const unavailableDateSet = useMemo(
    () => new Set(unavailableDates.map((d) => d.date)),
    [unavailableDates]
  );

  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 1 }),
    [currentDate]
  );

  const days = useMemo(() => {
    if (viewMode === "week") {
      return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    }
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [viewMode, currentDate, weekStart]);

  const invitesByDate = useMemo(() => {
    const map: Record<string, typeof acceptedInvites> = {};
    days.forEach((day) => {
      map[format(day, "yyyy-MM-dd")] = [];
    });
    acceptedInvites.forEach((inv) => {
      if (inv.pour_date && map[inv.pour_date]) {
        map[inv.pour_date].push(inv);
      }
    });
    return map;
  }, [acceptedInvites, days]);

  const navigatePrev = () => {
    if (viewMode === "week") {
      setCurrentDate((prev) => addDays(prev, -7));
    } else {
      setCurrentDate((prev) => subMonths(prev, 1));
    }
  };

  const navigateNext = () => {
    if (viewMode === "week") {
      setCurrentDate((prev) => addDays(prev, 7));
    } else {
      setCurrentDate((prev) => addMonths(prev, 1));
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  const headerLabel = useMemo(() => {
    if (viewMode === "month") {
      return format(currentDate, "MMMM yyyy");
    }
    return `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d, yyyy")}`;
  }, [viewMode, currentDate, weekStart]);

  const handleToggleUnavailable = (dateKey: string) => {
    toggleUnavailable.mutate(
      { date: dateKey },
      {
        onSuccess: ({ action }) => {
          toast({
            title: action === "added" ? "Marked as unavailable" : "Marked as available",
          });
        },
      }
    );
  };

  return (
    <SubcontractorLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Schedule</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "week" ? "default" : "ghost"}
                size="sm"
                className="rounded-none"
                onClick={() => setViewMode("week")}
              >
                Week
              </Button>
              <Button
                variant={viewMode === "month" ? "default" : "ghost"}
                size="sm"
                className="rounded-none"
                onClick={() => setViewMode("month")}
              >
                Month
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={navigatePrev}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="font-medium text-sm">{headerLabel}</span>
          <Button variant="ghost" size="icon" onClick={navigateNext}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : viewMode === "week" ? (
          /* Week View */
          <div className="space-y-3">
            {days.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayInvites = invitesByDate[dateKey] || [];
              const isToday = isSameDay(day, new Date());
              const isUnavailable = unavailableDateSet.has(dateKey);

              return (
                <Card key={dateKey} className={cn(isToday && "border-primary", isUnavailable && "bg-destructive/5 border-destructive/30")}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={isToday ? "text-primary font-bold" : "text-muted-foreground"}>
                          {format(day, "EEEE")}
                        </span>
                        <span className={isToday ? "text-primary" : ""}>
                          {format(day, "MMM d")}
                        </span>
                        {isToday && <Badge variant="default" className="text-xs">Today</Badge>}
                        {isUnavailable && <Badge variant="destructive" className="text-xs gap-1"><Ban className="h-3 w-3" />Unavailable</Badge>}
                      </div>
                      <Button
                        variant={isUnavailable ? "outline" : "ghost"}
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => handleToggleUnavailable(dateKey)}
                        disabled={toggleUnavailable.isPending}
                      >
                        {isUnavailable ? "Mark Available" : "Mark Unavailable"}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {dayInvites.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">
                        {isUnavailable ? "You've marked this day as unavailable" : "No scheduled work"}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {dayInvites.map((inv) => (
                          <div
                            key={inv.id}
                            className="p-3 rounded-lg bg-muted/50 border border-border cursor-pointer hover:bg-muted transition-colors"
                            onClick={() => setSelectedInvite(inv)}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="font-medium text-sm">{inv.pour_name}</div>
                              <Badge variant="outline">{inv.role}</Badge>
                            </div>
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5" />
                                <span>{inv.business_name}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5" />
                                <span>{inv.site_address}</span>
                              </div>
                              {(inv.start_time || inv.scheduled_time) && (
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>{inv.start_time || inv.scheduled_time}</span>
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
            })}
          </div>
        ) : (
          /* Month View */
          <div>
            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="text-xs font-medium text-muted-foreground text-center py-1">
                  {d}
                </div>
              ))}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayInvites = invitesByDate[dateKey] || [];
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isUnavailable = unavailableDateSet.has(dateKey);

                return (
                  <div
                    key={dateKey}
                    className={cn(
                      "border rounded-lg p-1.5 min-h-[70px] transition-colors",
                      isToday && "border-primary bg-primary/5",
                      !isCurrentMonth && "opacity-40",
                      isUnavailable && "bg-destructive/5 border-destructive/30",
                      "cursor-pointer hover:bg-muted/50"
                    )}
                    onClick={() => {
                      if (dayInvites.length === 1) {
                        setSelectedInvite(dayInvites[0]);
                      } else if (dayInvites.length === 0) {
                        handleToggleUnavailable(dateKey);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={cn(
                          "text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center",
                          isToday && "bg-primary text-primary-foreground rounded-full"
                        )}
                      >
                        {format(day, "d")}
                      </div>
                      {isUnavailable && <Ban className="h-3 w-3 text-destructive" />}
                    </div>
                    {dayInvites.length > 0 && (
                      <div className="space-y-0.5">
                        {dayInvites.slice(0, 2).map((inv) => (
                          <div
                            key={inv.id}
                            className="text-[10px] leading-tight truncate px-1 py-0.5 rounded bg-primary/10 text-primary cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInvite(inv);
                            }}
                          >
                            {inv.pour_name}
                          </div>
                        ))}
                        {dayInvites.length > 2 && (
                          <p className="text-[10px] text-muted-foreground text-center">
                            +{dayInvites.length - 2} more
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <SubcontractorEventDetailSheet
        invite={selectedInvite}
        open={!!selectedInvite}
        onOpenChange={(open) => !open && setSelectedInvite(null)}
      />
    </SubcontractorLayout>
  );
}
