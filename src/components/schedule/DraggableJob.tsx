import { useDraggable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
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

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500",
  in_progress: "bg-orange-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
};

interface DraggableJobProps {
  job: Job;
  getCrewName: (crewId: string | null) => string | null | undefined;
  compact?: boolean;
}

export function DraggableJob({ job, getCrewName, compact = false }: DraggableJobProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const crewName = getCrewName(job.crew_id);

  if (compact) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={cn(
          "bg-card border rounded-lg px-3 py-2 cursor-grab active:cursor-grabbing touch-target",
          "hover:border-primary/50 transition-colors",
          isDragging && "opacity-50"
        )}
      >
        <p className="text-sm font-medium truncate">{job.name}</p>
        <p className="text-xs text-muted-foreground truncate">{job.site_address}</p>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "bg-card border rounded-lg p-3 cursor-grab active:cursor-grabbing",
        "hover:border-primary/50 transition-colors",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-start gap-2">
        <div className={cn("w-1 h-full min-h-[40px] rounded-full shrink-0", statusColors[job.status])} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium truncate">{job.name}</p>
            {job.pour_time && (
              <span className="text-xs text-muted-foreground shrink-0">
                {job.pour_time.slice(0, 5)}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{job.site_address}</p>
          {crewName && (
            <Badge variant="secondary" className="mt-1 text-xs">
              {crewName}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
