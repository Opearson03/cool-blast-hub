import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, AlertTriangle, Clock, Plane } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";

export interface RosterEmployee {
  id: string;
  full_name: string;
  position: string | null;
  phone: string | null;
  avatar_url: string | null;
  role?: string | null;
  status: "clocked_in" | "on_leave" | "off";
  clockedInSince?: string | null;
  crewNames: string[];
  expiringTickets: number;
}

interface Props {
  employees: RosterEmployee[];
  onSelect: (id: string) => void;
  onMessage: (id: string) => void;
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export function TeamRosterGrid({ employees, onSelect, onMessage }: Props) {
  if (employees.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No team members match your filters.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {employees.map((emp) => (
        <Card
          key={emp.id}
          className="cursor-pointer hover:border-primary/60 hover:shadow-sm transition-all group"
          onClick={() => onSelect(emp.id)}
        >
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarImage src={emp.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">{initials(emp.full_name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">{emp.full_name}</div>
                {emp.position && <div className="text-xs text-muted-foreground truncate">{emp.position}</div>}
                {emp.role && (
                  <Badge variant={emp.role === "admin" ? "default" : "secondary"} className="mt-1 text-[10px] py-0 h-4">
                    {emp.role}
                  </Badge>
                )}
              </div>
            </div>

            <StatusPill status={emp.status} since={emp.clockedInSince} />

            {emp.crewNames.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {emp.crewNames.map((c) => (
                  <Badge key={c} variant="outline" className="text-[10px] py-0 h-5">{c}</Badge>
                ))}
              </div>
            )}

            {emp.expiringTickets > 0 && (
              <div className="flex items-center gap-1 text-xs text-destructive">
                <AlertTriangle className="w-3 h-3" />
                {emp.expiringTickets} ticket{emp.expiringTickets !== 1 ? "s" : ""} expiring
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={(e) => { e.stopPropagation(); onMessage(emp.id); }}
              >
                <MessageCircle className="w-3.5 h-3.5 mr-1" /> Message
              </Button>
              {emp.phone && (
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <a href={`tel:${emp.phone}`}><Phone className="w-3.5 h-3.5" /></a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatusPill({ status, since }: { status: RosterEmployee["status"]; since?: string | null }) {
  if (status === "clocked_in") {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <Clock className="w-3 h-3" />
        Clocked in {since ? formatDistanceToNowStrict(new Date(since), { addSuffix: true }) : ""}
      </div>
    );
  }
  if (status === "on_leave") {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400">
        <Plane className="w-3 h-3" /> On leave
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60" /> Off
    </div>
  );
}
