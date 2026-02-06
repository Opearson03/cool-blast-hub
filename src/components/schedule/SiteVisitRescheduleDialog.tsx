import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar, Mail, ArrowRight } from "lucide-react";

interface SiteVisitRescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  clientEmail: string | null;
  oldDate: string;
  newDate: string;
  eventType: "site_visit" | "follow_up";
  onConfirm: (sendEmail: boolean) => void;
  onCancel: () => void;
}

export function SiteVisitRescheduleDialog({
  open,
  onOpenChange,
  clientName,
  clientEmail,
  oldDate,
  newDate,
  eventType,
  onConfirm,
  onCancel,
}: SiteVisitRescheduleDialogProps) {
  const eventLabel = eventType === "site_visit" ? "Site Visit" : "Follow-up Call";
  
  const formatDateDisplay = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "EEEE, d MMMM yyyy");
    } catch {
      return dateStr;
    }
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  const handleMoveOnly = () => {
    onConfirm(false);
    onOpenChange(false);
  };

  const handleMoveAndNotify = () => {
    onConfirm(true);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Reschedule {eventLabel}?
          </DialogTitle>
          <DialogDescription>
            Moving {eventLabel.toLowerCase()} for <span className="font-medium text-foreground">{clientName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Date change display */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-3 justify-center text-sm">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">From</p>
                <p className="font-medium">{formatDateDisplay(oldDate)}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">To</p>
                <p className="font-medium text-primary">{formatDateDisplay(newDate)}</p>
              </div>
            </div>
          </div>

          {/* Email status */}
          {clientEmail ? (
            <p className="text-sm text-muted-foreground text-center">
              Would you like to notify the client at <span className="font-medium">{clientEmail}</span>?
            </p>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              No email address on file for this client.
            </p>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleCancel} className="sm:w-auto">
            Cancel
          </Button>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="secondary" 
              onClick={handleMoveOnly}
              className="flex-1 sm:flex-none"
            >
              Move Only
            </Button>
            
            {clientEmail && (
              <Button 
                onClick={handleMoveAndNotify}
                className="flex-1 sm:flex-none gap-2"
              >
                <Mail className="w-4 h-4" />
                Move & Notify
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
