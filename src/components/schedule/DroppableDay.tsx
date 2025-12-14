import { useDroppable } from "@dnd-kit/core";
import { format, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { DraggableJob } from "./DraggableJob";

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

interface DroppableDayProps {
  date: Date;
  dateKey: string;
  jobs: Job[];
  getCrewName: (crewId: string | null) => string | null | undefined;
  isWeekView?: boolean;
  isCurrentMonth?: boolean;
}

export function DroppableDay({
  date,
  dateKey,
  jobs,
  getCrewName,
  isWeekView = false,
  isCurrentMonth = true,
}: DroppableDayProps) {
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
            {jobs.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {jobs.length} job{jobs.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        <div className="space-y-2">
          {jobs.map((job) => (
            <DraggableJob key={job.id} job={job} getCrewName={getCrewName} />
          ))}
        </div>
        {jobs.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">No jobs</p>
        )}
      </div>
    );
  }

  // Month view - compact cells
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border rounded-lg p-1.5 min-h-[80px] sm:min-h-[100px] transition-colors",
        isOver && "border-primary bg-primary/5",
        today && "border-primary/50 bg-primary/5",
        !isCurrentMonth && "opacity-40"
      )}
    >
      <div
        className={cn(
          "text-xs font-medium mb-1",
          today && "bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center"
        )}
      >
        {format(date, "d")}
      </div>
      <div className="space-y-1">
        {jobs.slice(0, 2).map((job) => (
          <DraggableJob key={job.id} job={job} getCrewName={getCrewName} compact />
        ))}
        {jobs.length > 2 && (
          <p className="text-xs text-muted-foreground text-center">
            +{jobs.length - 2} more
          </p>
        )}
      </div>
    </div>
  );
}
