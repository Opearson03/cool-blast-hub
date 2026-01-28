import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SubTradeStatus = "drafted" | "sent" | "viewed" | "accepted" | "declined" | "revoked" | "expired";

interface SubTradeStatusBadgeProps {
  status: SubTradeStatus;
  className?: string;
}

const statusConfig: Record<SubTradeStatus, { label: string; className: string }> = {
  drafted: {
    label: "Draft",
    className: "bg-muted text-muted-foreground border-muted",
  },
  sent: {
    label: "Invited",
    className: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
  },
  viewed: {
    label: "Viewed",
    className: "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
  accepted: {
    label: "Confirmed",
    className: "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30",
  },
  declined: {
    label: "Declined",
    className: "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30",
  },
  revoked: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground border-muted line-through",
  },
  expired: {
    label: "Expired",
    className: "bg-muted text-muted-foreground border-muted",
  },
};

export function SubTradeStatusBadge({ status, className }: SubTradeStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.sent;

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}

// Compact dot indicator for calendar/schedule views
interface SubTradeStatusDotProps {
  status: SubTradeStatus;
  className?: string;
}

const dotColors: Record<SubTradeStatus, string> = {
  drafted: "bg-muted-foreground",
  sent: "bg-yellow-500",
  viewed: "bg-blue-500",
  accepted: "bg-green-500",
  declined: "bg-red-500",
  revoked: "bg-muted-foreground",
  expired: "bg-muted-foreground",
};

export function SubTradeStatusDot({ status, className }: SubTradeStatusDotProps) {
  return (
    <span
      className={cn("inline-block w-2 h-2 rounded-full", dotColors[status], className)}
      title={statusConfig[status]?.label || status}
    />
  );
}
