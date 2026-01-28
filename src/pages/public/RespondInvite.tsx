import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, MapPin, Wrench, Check, X, Loader2, CalendarPlus, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface InviteDetails {
  valid: boolean;
  pour_name: string;
  pour_date: string | null;
  scheduled_time: string | null;
  site_address: string;
  job_name: string;
  role: string;
  notes: string | null;
  business_name: string;
  business_logo: string | null;
  recipient_name: string;
}

export default function RespondInvite() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [response, setResponse] = useState<"accepted" | "declined" | null>(null);
  const [icsData, setIcsData] = useState<string | null>(null);

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError("Invalid invite link");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke("validate-subtrade-token", {
          body: { token },
        });

        if (fnError) throw fnError;

        if (data.error) {
          setError(data.error);
          if (data.already_responded) {
            setResponse(data.response);
          }
        } else {
          setInvite(data);
        }
      } catch (err: any) {
        console.error("Token validation error:", err);
        setError("Unable to load invite. The link may be invalid or expired.");
      } finally {
        setLoading(false);
      }
    }

    validateToken();
  }, [token]);

  const handleRespond = async (respondWith: "accepted" | "declined") => {
    if (!token) return;

    setSubmitting(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("respond-subtrade-invite", {
        body: { token, response: respondWith },
      });

      if (fnError) throw fnError;

      if (data.error) {
        setError(data.error);
      } else {
        setResponse(respondWith);
        if (data.ics_data) {
          setIcsData(data.ics_data);
        }
      }
    } catch (err: any) {
      console.error("Response error:", err);
      setError("Failed to submit response. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const downloadCalendar = () => {
    if (!icsData || !invite) return;

    const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${invite.pour_name.replace(/\s+/g, "-")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Loading invite...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && !response) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Unable to Load Invite</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Response confirmation state
  if (response) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            {response === "accepted" ? (
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-500" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <X className="h-8 w-8 text-red-500" />
              </div>
            )}

            <h2 className="text-2xl font-bold mb-2">Thanks!</h2>
            <p className="text-muted-foreground mb-6">
              {invite?.business_name || "The business"} has been notified.
            </p>

            {response === "accepted" && icsData && (
              <Button onClick={downloadCalendar} variant="outline" className="gap-2">
                <CalendarPlus className="h-4 w-4" />
                Add to Calendar
              </Button>
            )}

            <Separator className="my-8" />
            <p className="text-xs text-muted-foreground">Powered by PourHub</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main invite view
  if (!invite) return null;

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md overflow-hidden">
        {/* Header with logo */}
        <div className="bg-foreground p-6 text-center">
          {invite.business_logo ? (
            <img
              src={invite.business_logo}
              alt={invite.business_name}
              className="max-h-14 max-w-[200px] mx-auto object-contain"
            />
          ) : (
            <h1 className="text-xl font-bold text-background">{invite.business_name}</h1>
          )}
        </div>

        <CardHeader className="text-center pb-2">
          <CardTitle className="text-lg">You've been invited to work on a pour</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Details */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            {invite.pour_date && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="font-medium">
                  {format(new Date(invite.pour_date), "EEEE, d MMMM yyyy")}
                </span>
              </div>
            )}

            {invite.scheduled_time && (
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="font-medium">{invite.scheduled_time.slice(0, 5)}</span>
              </div>
            )}

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <span className="font-medium">{invite.site_address}</span>
            </div>

            <div className="flex items-center gap-3">
              <Wrench className="h-5 w-5 text-muted-foreground shrink-0" />
              <span className="font-medium">Role: {invite.role}</span>
            </div>
          </div>

          {/* Notes */}
          {invite.notes && (
            <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-r-lg">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Notes from {invite.business_name}:
              </p>
              <p className="text-sm mt-1 text-amber-800 dark:text-amber-300">{invite.notes}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              size="lg"
              className="gap-2 border-red-500/50 text-red-600 hover:bg-red-500/10 hover:text-red-600"
              onClick={() => handleRespond("declined")}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              Decline
            </Button>
            <Button
              size="lg"
              className="gap-2 bg-green-600 hover:bg-green-700"
              onClick={() => handleRespond("accepted")}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Accept
            </Button>
          </div>

          <Separator className="my-4" />
          <p className="text-center text-xs text-muted-foreground">Powered by PourHub</p>
        </CardContent>
      </Card>
    </div>
  );
}
