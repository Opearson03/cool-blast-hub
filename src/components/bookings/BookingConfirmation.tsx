import { Button } from "@/components/ui/button";
import { CheckCircle, Video, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface BookingConfirmationProps {
  bookingTime: Date;
  zoomLink?: string;
  name: string;
}

export function BookingConfirmation({ bookingTime, zoomLink, name }: BookingConfirmationProps) {
  return (
    <div className="text-center space-y-6 py-8">
      <div className="flex justify-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-primary" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Thanks for booking your call!</h2>
        <p className="text-muted-foreground">
          We've confirmed your 30 minute onboarding call.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6 text-left space-y-3 max-w-md mx-auto">
        <div>
          <p className="text-sm text-muted-foreground">Name</p>
          <p className="font-medium text-foreground">{name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Date & Time</p>
          <p className="font-medium text-foreground">
            {format(bookingTime, "EEEE, d MMMM yyyy 'at' HH:mm")} AEST
          </p>
        </div>
        {zoomLink && (
          <div>
            <p className="text-sm text-muted-foreground">Zoom Link</p>
            <a
              href={zoomLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-medium hover:underline flex items-center gap-1"
            >
              <Video className="h-4 w-4" />
              Join Zoom Meeting
            </a>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        A confirmation email has been sent to your inbox.
      </p>

      <div className="pt-4 space-y-3 max-w-md mx-auto">
        <p className="text-foreground font-medium">
          While you wait, you can start your free PourHub trial here.
        </p>
        <Button asChild size="lg" className="w-full">
          <Link to="/signup">
            Start Free Trial
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
