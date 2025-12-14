import { useDroppable } from "@dnd-kit/core";
import { format, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { DraggablePour } from "./DraggablePour";

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

interface DroppablePourDayProps {
  date: Date;
  dateKey: string;
  pours: Pour[];
  isWeekView?: boolean;
  isCurrentMonth?: boolean;
  onPourClick?: (pour: Pour) => void;
}

export function DroppablePourDay({
  date,
  dateKey,
  pours,
  isWeekView = false,
  isCurrentMonth = true,
  onPourClick,
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
        </div>
        <div className="space-y-2">
          {pours.map((pour) => (
            <DraggablePour key={pour.id} pour={pour} onClick={onPourClick} />
          ))}
        </div>
        {pours.length === 0 && (
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
        {pours.slice(0, 2).map((pour) => (
          <DraggablePour key={pour.id} pour={pour} compact onClick={onPourClick} />
        ))}
        {pours.length > 2 && (
          <p className="text-xs text-muted-foreground text-center">
            +{pours.length - 2} more
          </p>
        )}
      </div>
    </div>
  );
}