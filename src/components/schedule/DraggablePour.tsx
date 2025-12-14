import { useDraggable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500",
  in_progress: "bg-orange-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
};

const visitTypeLabels: Record<string, string> = {
  pour: "Pour",
  earthworks: "Earthworks",
  formwork_place: "Place Formwork",
  formwork_strip: "Strip Formwork",
  cure: "Cure",
  seal: "Seal",
  other: "Other",
};

interface DraggablePourProps {
  pour: Pour;
  compact?: boolean;
  onClick?: (pour: Pour) => void;
}

export function DraggablePour({ pour, compact = false, onClick }: DraggablePourProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: pour.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const visitType = pour.visit_type || "pour";
  const isPour = visitType === "pour";

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger click if not dragging
    if (!isDragging && onClick) {
      e.stopPropagation();
      onClick(pour);
    }
  };

  if (compact) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        onClick={handleClick}
        className={cn(
          "bg-card border rounded-lg px-3 py-2 cursor-grab active:cursor-grabbing touch-target",
          "hover:border-primary/50 transition-colors",
          isDragging && "opacity-50"
        )}
      >
        <p className="text-sm font-medium truncate">{pour.pour_name}</p>
        {pour.job && (
          <p className="text-xs text-muted-foreground truncate">{pour.job.name}</p>
        )}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={handleClick}
      className={cn(
        "bg-card border rounded-lg p-3 cursor-grab active:cursor-grabbing",
        "hover:border-primary/50 transition-colors",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-start gap-2">
        <div className={cn("w-1 h-full min-h-[40px] rounded-full shrink-0", statusColors[pour.status || "scheduled"])} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium truncate">{pour.pour_name}</p>
            {pour.scheduled_time && (
              <span className="text-xs text-muted-foreground shrink-0">
                {pour.scheduled_time.slice(0, 5)}
              </span>
            )}
          </div>
          {pour.job && (
            <>
              <p className="text-xs text-muted-foreground truncate">{pour.job.name}</p>
              <p className="text-xs text-muted-foreground/70 truncate">{pour.job.site_address}</p>
            </>
          )}
          <div className="flex gap-1 mt-1">
            {!isPour && (
              <Badge variant="outline" className="text-xs">
                {visitTypeLabels[visitType] || visitType}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}