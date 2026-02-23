import { useState, useMemo } from "react";
import { SubcontractorLayout } from "@/components/layout/SubcontractorLayout";
import { useSubcontractorInvites } from "@/hooks/useSubcontractorInvites";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Building2,
  Calendar,
} from "lucide-react";

export default function SubcontractorSchedule() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const { data: invites, isLoading } = useSubcontractorInvites();

  const acceptedInvites = useMemo(
    () => invites?.filter((i) => i.status === "accepted") || [],
    [invites]
  );

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const invitesByDate = useMemo(() => {
    const map: Record<string, typeof acceptedInvites> = {};
    days.forEach((day) => {
      map[format(day, "yyyy-MM-dd")] = [];
    });
    acceptedInvites.forEach((inv) => {
      if (inv.pour_date) {
        const key = inv.pour_date;
        if (map[key]) {
          map[key].push(inv);
        }
      }
    });
    return map;
  }, [acceptedInvites, days]);

  const navigatePrev = () => setWeekStart((prev) => addDays(prev, -7));
  const navigateNext = () => setWeekStart((prev) => addDays(prev, 7));
  const goToToday = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  return (
    <SubcontractorLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Schedule</h1>
          </div>
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
            {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d, yyyy")}
          </span>
          <Button variant="ghost" size="icon" onClick={navigateNext}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {days.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayInvites = invitesByDate[dateKey] || [];
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
                      {isToday && <Badge variant="default" className="text-xs">Today</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {dayInvites.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">No scheduled work</p>
                    ) : (
                      <div className="space-y-2">
                        {dayInvites.map((inv) => (
                          <div key={inv.id} className="p-3 rounded-lg bg-muted/50 border border-border">
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
        )}
      </div>
    </SubcontractorLayout>
  );
}
