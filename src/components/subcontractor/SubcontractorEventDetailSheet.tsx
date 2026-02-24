import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Calendar, Building2, FileText } from "lucide-react";
import type { SubcontractorInvite } from "@/hooks/useSubcontractorInvites";

interface SubcontractorEventDetailSheetProps {
  invite: SubcontractorInvite | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubcontractorEventDetailSheet({ invite, open, onOpenChange }: SubcontractorEventDetailSheetProps) {
  if (!invite) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-xl max-h-[80vh]">
        <SheetHeader className="text-left pb-4">
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="text-lg">{invite.pour_name}</SheetTitle>
            <Badge variant="outline">{invite.role}</Badge>
          </div>
          <SheetDescription className="sr-only">Event details</SheetDescription>
        </SheetHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{invite.business_name}</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{invite.site_address}</span>
            </div>

            {invite.pour_date && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{invite.pour_date}</span>
              </div>
            )}

            {(invite.start_time || invite.scheduled_time) && (
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{invite.start_time || invite.scheduled_time}</span>
              </div>
            )}

            {invite.job_name && (
              <div className="flex items-center gap-3 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{invite.job_name}</span>
              </div>
            )}
          </div>

          {invite.notes && (
            <div className="rounded-lg bg-muted/50 p-3 border border-border">
              <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
              <p className="text-sm">{invite.notes}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
