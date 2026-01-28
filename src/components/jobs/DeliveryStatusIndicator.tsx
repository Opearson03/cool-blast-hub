import { Phone, Mail, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface DeliveryStatusIndicatorProps {
  smsStatus: "sent" | "failed" | "rate_limited" | null;
  emailStatus: "sent" | "failed" | null;
  smsError?: string | null;
  emailError?: string | null;
  className?: string;
}

export function DeliveryStatusIndicator({
  smsStatus,
  emailStatus,
  smsError,
  emailError,
  className,
}: DeliveryStatusIndicatorProps) {
  const hasIssues = smsStatus === "failed" || smsStatus === "rate_limited" || emailStatus === "failed";

  // If no notifications were attempted, don't show anything
  if (!smsStatus && !emailStatus) return null;

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-1", className)}>
        {/* SMS Status */}
        {smsStatus && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center">
                {smsStatus === "sent" ? (
                  <span className="relative">
                    <Phone className="h-3 w-3 text-green-500" />
                    <CheckCircle2 className="h-2 w-2 text-green-500 absolute -top-0.5 -right-0.5" />
                  </span>
                ) : smsStatus === "rate_limited" ? (
                  <span className="relative">
                    <Phone className="h-3 w-3 text-yellow-500" />
                    <AlertTriangle className="h-2 w-2 text-yellow-500 absolute -top-0.5 -right-0.5" />
                  </span>
                ) : (
                  <span className="relative">
                    <Phone className="h-3 w-3 text-red-500" />
                    <XCircle className="h-2 w-2 text-red-500 absolute -top-0.5 -right-0.5" />
                  </span>
                )}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              {smsStatus === "sent" ? (
                <p className="text-xs">SMS sent successfully</p>
              ) : smsStatus === "rate_limited" ? (
                <p className="text-xs">SMS skipped: Daily limit (50) reached</p>
              ) : (
                <div>
                  <p className="text-xs font-medium text-red-500">SMS delivery failed</p>
                  {smsError && <p className="text-xs text-muted-foreground mt-1">{smsError}</p>}
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Email Status */}
        {emailStatus && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center">
                {emailStatus === "sent" ? (
                  <span className="relative">
                    <Mail className="h-3 w-3 text-green-500" />
                    <CheckCircle2 className="h-2 w-2 text-green-500 absolute -top-0.5 -right-0.5" />
                  </span>
                ) : (
                  <span className="relative">
                    <Mail className="h-3 w-3 text-red-500" />
                    <XCircle className="h-2 w-2 text-red-500 absolute -top-0.5 -right-0.5" />
                  </span>
                )}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              {emailStatus === "sent" ? (
                <p className="text-xs">Email sent successfully</p>
              ) : (
                <div>
                  <p className="text-xs font-medium text-red-500">Email delivery failed</p>
                  {emailError && <p className="text-xs text-muted-foreground mt-1">{emailError}</p>}
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Warning badge if there are issues */}
        {hasIssues && (
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 ml-0.5" />
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">Some notifications failed to deliver</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
