import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Video, ArrowRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BookingConfirmationProps {
  bookingTime: Date;
  zoomLink?: string;
  name: string;
  email: string;
  company: string;
}

export function BookingConfirmation({ bookingTime, zoomLink, name, email, company }: BookingConfirmationProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleStartTrial = async () => {
    setIsRedirecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          email,
          fullName: name,
          businessName: company,
          tier: "pro",
          freeMonths: 1,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error("Something went wrong. Please try again.");
      setIsRedirecting(false);
    }
  };

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
          As a thank you for booking, enjoy your first month of PourHub Pro free!
        </p>
        <Button
          size="lg"
          className="w-full"
          onClick={handleStartTrial}
          disabled={isRedirecting}
        >
          {isRedirecting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Redirecting to checkout...
            </>
          ) : (
            <>
              Start Your Free Month
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
