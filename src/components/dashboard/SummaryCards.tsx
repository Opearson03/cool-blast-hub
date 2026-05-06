import { Briefcase, Users, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryCardsProps {
  todayTasksCount: number;
  pendingInvitesCount: number;
  actionsRequiredCount: number;
  isLoading?: boolean;
  onTodayTasksClick?: () => void;
  onPendingResponsesClick?: () => void;
  onActionRequiredClick?: () => void;
}

export function SummaryCards({
  todayTasksCount,
  pendingInvitesCount,
  actionsRequiredCount,
  isLoading = false,
  onTodayTasksClick,
  onPendingResponsesClick,
  onActionRequiredClick,
}: SummaryCardsProps) {
  const cards = [
    {
      label: "Today's Tasks",
      value: todayTasksCount,
      icon: Briefcase,
      tone: "text-primary",
      onClick: onTodayTasksClick,
    },
    {
      label: "Pending Subbie Responses",
      value: pendingInvitesCount,
      icon: Users,
      tone: pendingInvitesCount > 0 ? "text-warning" : "text-muted-foreground",
      onClick: onPendingResponsesClick,
    },
    {
      label: "Action Required",
      value: actionsRequiredCount,
      icon: AlertTriangle,
      tone: actionsRequiredCount > 0 ? "text-destructive" : "text-muted-foreground",
      onClick: onActionRequiredClick,
    },
  ];

  return (
    <div className="rounded-xl border border-border/70 bg-card grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/70">
      {cards.map((card) => {
        const isClickable = card.value > 0 && card.onClick;
        return (
          <button
            key={card.label}
            type="button"
            disabled={!isClickable}
            onClick={isClickable ? card.onClick : undefined}
            className={cn(
              "text-left p-5 flex flex-col gap-3 transition-colors",
              isClickable ? "hover:bg-muted/40 cursor-pointer" : "cursor-default"
            )}
          >
            <div className="flex items-center gap-2">
              <card.icon className={cn("w-3.5 h-3.5", card.tone)} />
              <span className="eyebrow-muted">{card.label}</span>
            </div>
            <div className="stat-number">{isLoading ? "—" : card.value}</div>
          </button>
        );
      })}
    </div>
  );
}
