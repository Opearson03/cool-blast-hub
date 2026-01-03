import { useDroppable } from "@dnd-kit/core";
import { format, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { DraggablePour } from "./DraggablePour";
import { Badge } from "@/components/ui/badge";
import { Palmtree } from "lucide-react";

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

interface EmployeeOnLeave {
  employee_id: string;
  employee_name: string;
  leave_type: string;
}

interface DroppablePourDayProps {
  date: Date;
  dateKey: string;
  pours: Pour[];
  isWeekView?: boolean;
  isCurrentMonth?: boolean;
  onPourClick?: (pour: Pour) => void;
  employeesOnLeave?: EmployeeOnLeave[];
}

export function DroppablePourDay({
  date,
  dateKey,
  pours,
  isWeekView = false,
  isCurrentMonth = true,
  onPourClick,
  employeesOnLeave = [],
}: DroppablePourDayProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: dateKey,
  });

  const today = isToday(date);

  if (isWeekView) {
    return (
      <div
        ref={setNodeRef}
        className={cn(
          "border rounded-lg p-3 transition-colors min-h-[80px]",
          isOver && "border-primary bg-primary/5",
          today && "border-primary/50 bg-primary/5"
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-sm font-medium",
                today && "bg-primary text-primary-foreground px-2 py-0.5 rounded-full"
              )}
            >
              {format(date, "EEE d")}
            </span>
            {pours.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {pours.length} pour{pours.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {employeesOnLeave.length > 0 && (
            <div className="flex items-center gap-1">
              <Palmtree className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs text-amber-500 font-medium">
                {employeesOnLeave.length} on leave
              </span>
            </div>
          )}
        </div>

        {/* On Leave Badges */}
        {employeesOnLeave.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {employeesOnLeave.map((emp) => (
              <Badge 
                key={emp.employee_id} 
                variant="outline" 
                className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/30"
              >
                <Palmtree className="w-3 h-3 mr-1" />
                {emp.employee_name.split(" ")[0]}
              </Badge>
            ))}
          </div>
        )}

        <div className="space-y-2">
          {pours.map((pour) => (
            <DraggablePour key={pour.id} pour={pour} onClick={onPourClick} />
          ))}
        </div>
        {pours.length === 0 && employeesOnLeave.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">No pours</p>
        )}
      </div>
    );
  }

  // Month view - compact cells
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border rounded-lg p-1 sm:p-1.5 min-h-[60px] sm:min-h-[100px] transition-colors",
        isOver && "border-primary bg-primary/5",
        today && "border-primary/50 bg-primary/5",
        !isCurrentMonth && "opacity-40"
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <div
          className={cn(
            "text-xs font-medium",
            today && "bg-primary text-primary-foreground w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs"
          )}
        >
          {format(date, "d")}
        </div>
        {employeesOnLeave.length > 0 && (
          <Palmtree className="w-3 h-3 text-amber-500" />
        )}
      </div>
      
      {/* Mobile: Show dots/count indicator */}
      <div className="sm:hidden">
        {pours.length > 0 && (
          <div className="flex flex-wrap gap-0.5 justify-center">
            {pours.slice(0, 4).map((pour) => (
              <div
                key={pour.id}
                className={cn(
                  "w-2 h-2 rounded-full",
                  pour.status === "completed" ? "bg-green-500" :
                  pour.status === "in_progress" ? "bg-orange-500" : "bg-blue-500"
                )}
                onClick={() => onPourClick?.(pour)}
              />
            ))}
            {pours.length > 4 && (
              <span className="text-[10px] text-muted-foreground">+{pours.length - 4}</span>
            )}
          </div>
        )}
        {pours.length > 0 && (
          <p className="text-[10px] text-center text-muted-foreground mt-0.5 truncate">
            {pours.length} {pours.length === 1 ? "pour" : "pours"}
          </p>
        )}
      </div>

      {/* Desktop: Show pour cards */}
      <div className="hidden sm:block space-y-1">
        {pours.slice(0, 2).map((pour) => (
          <DraggablePour key={pour.id} pour={pour} compact onClick={onPourClick} />
        ))}
        {pours.length > 2 && (
          <p className="text-xs text-muted-foreground text-center">
            +{pours.length - 2} more
          </p>
        )}
        {employeesOnLeave.length > 0 && pours.length <= 1 && (
          <div className="text-xs text-amber-500 truncate">
            {employeesOnLeave.length} on leave
          </div>
        )}
      </div>
    </div>
  );
}
