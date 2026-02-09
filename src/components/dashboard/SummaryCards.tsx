import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Users, AlertTriangle } from "lucide-react";

interface SummaryCardsProps {
  todayTasksCount: number;
  pendingInvitesCount: number;
  actionsRequiredCount: number;
  isLoading?: boolean;
  onActionRequiredClick?: () => void;
}

export function SummaryCards({
  todayTasksCount,
  pendingInvitesCount,
  actionsRequiredCount,
  isLoading = false,
  onActionRequiredClick,
}: SummaryCardsProps) {
  const cards = [
    {
      title: "Today's Tasks",
      value: todayTasksCount,
      icon: Briefcase,
      iconColor: "text-primary",
    },
    {
      title: "Pending Responses",
      value: pendingInvitesCount,
      icon: Users,
      iconColor: pendingInvitesCount > 0 ? "text-amber-500" : "text-muted-foreground",
    },
    {
      title: "Action Required",
      value: actionsRequiredCount,
      icon: AlertTriangle,
      iconColor: actionsRequiredCount > 0 ? "text-destructive" : "text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map((card) => {
        const isClickable = card.title === "Action Required" && card.value > 0 && onActionRequiredClick;
        return (
          <Card
            key={card.title}
            className={isClickable ? "cursor-pointer transition-colors hover:bg-accent/50" : ""}
            onClick={isClickable ? onActionRequiredClick : undefined}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <card.icon className={`w-4 h-4 ${card.iconColor}`} />
                <span className="truncate">{card.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {isLoading ? "..." : card.value}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
