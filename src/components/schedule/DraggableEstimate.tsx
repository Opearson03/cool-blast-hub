import { useDraggable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FileText, Phone } from "lucide-react";

export type ScheduleEstimate = {
  id: string;
  client_name: string;
  site_address: string;
  estimate_number: string | null;
  site_visit_date: string | null;
  follow_up_date: string | null;
  status: string;
  total_amount: number | null;
};

export type EstimateEventType = "site_visit" | "follow_up";

interface DraggableEstimateProps {
  estimate: ScheduleEstimate;
  eventType: EstimateEventType;
  compact?: boolean;
  onClick?: (estimate: ScheduleEstimate, eventType: EstimateEventType) => void;
}

export function DraggableEstimate({ estimate, eventType, compact = false, onClick }: DraggableEstimateProps) {
  const dragId = `estimate-${eventType}-${estimate.id}`;
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId,
    data: { estimate, eventType },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const isSiteVisit = eventType === "site_visit";
  // Use orange theme colors for both event types, with subtle differentiation via opacity
  const bgColor = isSiteVisit ? "bg-primary/10" : "bg-primary/5";
  const borderColor = isSiteVisit ? "border-primary/40" : "border-primary/25";
  const textColor = "text-primary";
  const dotColor = isSiteVisit ? "bg-primary" : "bg-primary/70";

  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging && onClick) {
      e.stopPropagation();
      onClick(estimate, eventType);
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
          "border rounded-lg px-3 py-2 cursor-grab active:cursor-grabbing touch-target",
          "hover:border-primary/50 transition-colors",
          bgColor,
          borderColor,
          isDragging && "opacity-50"
        )}
      >
        <div className="flex items-center gap-1.5">
          {isSiteVisit ? (
            <FileText className={cn("w-3 h-3", textColor)} />
          ) : (
            <Phone className={cn("w-3 h-3", textColor)} />
          )}
          <p className={cn("text-sm font-medium truncate", textColor)}>
            {estimate.client_name}
          </p>
        </div>
        <p className="text-xs text-muted-foreground truncate">{estimate.site_address}</p>
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
        "border rounded-lg p-3 cursor-grab active:cursor-grabbing",
        "hover:border-primary/50 transition-colors",
        bgColor,
        borderColor,
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-start gap-2">
        <div className={cn("w-1 h-full min-h-[40px] rounded-full shrink-0", dotColor)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {isSiteVisit ? (
                <FileText className={cn("w-3.5 h-3.5", textColor)} />
              ) : (
                <Phone className={cn("w-3.5 h-3.5", textColor)} />
              )}
              <p className={cn("text-sm font-medium truncate", textColor)}>
                {estimate.client_name}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground truncate">{estimate.site_address}</p>
          <div className="flex gap-1 mt-1">
            <Badge variant="outline" className={cn("text-xs", borderColor, textColor)}>
              {isSiteVisit ? "Site Visit" : "Follow Up"}
            </Badge>
            {estimate.estimate_number && (
              <Badge variant="outline" className="text-xs">
                {estimate.estimate_number}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
