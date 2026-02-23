import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, User, StickyNote } from "lucide-react";

interface InternalContact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: string | null;
  notes: string | null;
}

interface InternalContactDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: InternalContact | null;
}

export function InternalContactDetailSheet({ open, onOpenChange, contact }: InternalContactDetailSheetProps) {
  if (!contact) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl flex items-center gap-2">
            <User className="h-5 w-5" />
            {contact.name}
          </SheetTitle>
          {contact.role && (
            <Badge variant="secondary">{contact.role}</Badge>
          )}
        </SheetHeader>

        <div className="space-y-6">
          {/* Contact Actions */}
          <div className="flex gap-2">
            {contact.phone && (
              <Button variant="outline" size="sm" asChild>
                <a href={`tel:${contact.phone}`}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </a>
              </Button>
            )}
            {contact.email && (
              <Button variant="outline" size="sm" asChild>
                <a href={`mailto:${contact.email}`}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </a>
              </Button>
            )}
          </div>

          {/* Contact Details */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              {contact.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${contact.phone}`} className="hover:text-primary">{contact.phone}</a>
                </div>
              )}
              {contact.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${contact.email}`} className="hover:text-primary">{contact.email}</a>
                </div>
              )}
              {!contact.phone && !contact.email && (
                <p className="text-sm text-muted-foreground">No contact details</p>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {contact.notes && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <StickyNote className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Notes</span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contact.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
