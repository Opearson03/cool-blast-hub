import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, AlertTriangle, RefreshCw, XCircle, Loader2, MoveRight } from "lucide-react";
import { SubTradeInvite } from "@/hooks/useSubTradeInvites";

interface SubbieRescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pourName: string;
  oldDate: string;
  newDate: string;
  invites: SubTradeInvite[];
  onConfirm: (action: "cancel" | "reschedule" | "silent") => Promise<void>;
  onCancel: () => void;
}

export function SubbieRescheduleDialog({
  open,
  onOpenChange,
  pourName,
  oldDate,
  newDate,
  invites,
  onConfirm,
  onCancel,
}: SubbieRescheduleDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState<"cancel" | "reschedule" | "silent" | null>(null);

  const activeInvites = invites.filter((i) =>
    ["sent", "viewed", "accepted"].includes(i.status)
  );

  const handleConfirm = async (action: "cancel" | "reschedule" | "silent") => {
    setSelectedAction(action);
    setIsLoading(true);
    try {
      await onConfirm(action);
    } finally {
      setIsLoading(false);
      setSelectedAction(null);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onCancel();
      onOpenChange(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Confirmed</Badge>;
      case "viewed":
        return <Badge variant="outline" className="bg-secondary text-secondary-foreground">Viewed</Badge>;
      case "sent":
        return <Badge variant="outline" className="bg-muted text-muted-foreground">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Sub-Trades Affected</DialogTitle>
          </div>
          <DialogDescription>
            This pour has {activeInvites.length} sub-trade{activeInvites.length !== 1 ? "s" : ""} invited.
            Would you like to notify them?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date Change Summary */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">{pourName}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="line-through">
                  {format(new Date(oldDate), "EEE, d MMM")}
                </span>
                <span>→</span>
                <span className="font-medium text-foreground">
                  {format(new Date(newDate), "EEE, d MMM")}
                </span>
              </div>
            </div>
          </div>

          {/* Affected Subbies List */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Affected Sub-Trades:</p>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {activeInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-2 rounded bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium">{invite.recipient_name}</p>
                    <p className="text-xs text-muted-foreground">{invite.role}</p>
                  </div>
                  {getStatusBadge(invite.status)}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            variant="destructive"
            onClick={() => handleConfirm("cancel")}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading && selectedAction === "cancel" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" />
            )}
            Cancel Invitations
          </Button>
          <Button
            variant="outline"
            onClick={() => handleConfirm("silent")}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading && selectedAction === "silent" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MoveRight className="mr-2 h-4 w-4" />
            )}
            Move Only
          </Button>
          <Button
            onClick={() => handleConfirm("reschedule")}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading && selectedAction === "reschedule" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Reschedule & Notify
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
