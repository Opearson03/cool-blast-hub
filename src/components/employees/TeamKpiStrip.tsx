import { Card, CardContent } from "@/components/ui/card";
import { Clock, Plane, Bell, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  clockedIn: number;
  onLeaveToday: number;
  pendingLeave: number;
  expiringTickets: number;
}

export function TeamKpiStrip({ clockedIn, onLeaveToday, pendingLeave, expiringTickets }: Props) {
  const items = [
    { label: "Clocked in now", value: clockedIn, icon: Clock, tone: "text-emerald-500" },
    { label: "On leave today", value: onLeaveToday, icon: Plane, tone: "text-sky-500" },
    { label: "Pending leave", value: pendingLeave, icon: Bell, tone: pendingLeave > 0 ? "text-amber-500" : "text-muted-foreground" },
    { label: "Expiring tickets", value: expiringTickets, icon: Award, tone: expiringTickets > 0 ? "text-destructive" : "text-muted-foreground" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((it) => (
        <Card key={it.label} className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn("h-10 w-10 rounded-lg bg-muted flex items-center justify-center", it.tone)}>
              <it.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold leading-tight">{it.value}</div>
              <div className="text-xs text-muted-foreground">{it.label}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
