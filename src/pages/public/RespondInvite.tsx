import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Wrench, Check, X, Loader2, CalendarPlus, AlertCircle, Users } from "lucide-react";
import { format } from "date-fns";

interface SingleInviteDetails {
  valid: boolean;
  is_batch: false;
  pour_name: string;
  pour_date: string | null;
  scheduled_time: string | null;
  start_time: string | null;
  site_address: string;
  job_name: string;
  role: string;
  notes: string | null;
  business_name: string;
  business_logo: string | null;
  recipient_name: string;
}

interface BatchInviteItem {
  invite_id: string;
  pour_name: string;
  pour_date: string | null;
  scheduled_time: string | null;
  start_time: string | null;
  site_address: string;
  job_name: string;
  status: string;
  already_responded: boolean;
}

interface BatchInviteDetails {
  valid: boolean;
  is_batch: true;
  batch_id: string;
  role: string;
  notes: string | null;
  start_time: string | null;
  business_name: string;
  business_logo: string | null;
  recipient_name: string;
  invites: BatchInviteItem[];
}

type InviteDetails = SingleInviteDetails | BatchInviteDetails;

type ResponseChoice = "accepted" | "declined";

const JoinDirectoryCTA = () => (
  <div className="mt-6 space-y-4">
    <Separator />
    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 rounded-xl border border-primary/20 text-center">
      <Users className="h-6 w-6 text-primary mx-auto mb-2" />
      <h3 className="font-bold text-base mb-1">Want more work?</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Join the free PourHub directory to get discovered by local businesses.
      </p>
      <Button asChild className="w-full gap-2">
        <a href="/sub-contractors">Join Free Directory</a>
      </Button>
    </div>
    <p className="text-center text-xs text-muted-foreground">Powered by PourHub</p>
  </div>
);

export default function RespondInvite() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [response, setResponse] = useState<ResponseChoice | null>(null);
  const [icsData, setIcsData] = useState<string | null>(null);

  // For batch invites - track individual responses
  const [batchResponses, setBatchResponses] = useState<Record<string, ResponseChoice>>({});
  const [batchSubmitted, setBatchSubmitted] = useState(false);
  const [batchResults, setBatchResults] = useState<{
    accepted_count: number;
    declined_count: number;
  } | null>(null);

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
          
          // Initialize batch responses for pending invites
          if (data.is_batch && data.invites) {
            const initialResponses: Record<string, ResponseChoice> = {};
            for (const inv of data.invites) {
              if (!inv.already_responded) {
                // Default to no selection - user must choose
              }
            }
            setBatchResponses(initialResponses);
          }
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

  // Single invite response handler
  const handleRespond = async (respondWith: ResponseChoice) => {
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

  // Batch response handler
  const handleBatchSubmit = async () => {
    if (!token || !invite || !("is_batch" in invite) || !invite.is_batch) return;

    const responses = Object.entries(batchResponses)
      .filter(([_, resp]) => resp !== undefined)
      .map(([invite_id, resp]) => ({ invite_id, response: resp }));

    if (responses.length === 0) {
      setError("Please select a response for at least one pour.");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("respond-subtrade-invite", {
        body: { token, responses },
      });

      if (fnError) throw fnError;

      if (data.error) {
        setError(data.error);
      } else {
        setBatchSubmitted(true);
        setBatchResults({
          accepted_count: data.accepted_count || 0,
          declined_count: data.declined_count || 0,
        });
        if (data.ics_data) {
          setIcsData(data.ics_data);
        }
      }
    } catch (err: any) {
      console.error("Batch response error:", err);
      setError("Failed to submit responses. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleBatchResponse = (inviteId: string, choice: ResponseChoice) => {
    setBatchResponses(prev => ({
      ...prev,
      [inviteId]: prev[inviteId] === choice ? undefined as any : choice,
    }));
  };

  const downloadCalendar = () => {
    if (!icsData || !invite) return;

    const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const filename = invite.is_batch ? "pours.ics" : `${(invite as SingleInviteDetails).pour_name.replace(/\s+/g, "-")}.ics`;
    link.download = filename;
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

  // Error state (no response yet)
  if (error && !response && !batchSubmitted) {
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

  // Batch submitted confirmation
  if (batchSubmitted && batchResults) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-500" />
            </div>

            <h2 className="text-2xl font-bold mb-2">Thanks!</h2>
            <p className="text-muted-foreground mb-2">
              {invite?.business_name || "The business"} has been notified.
            </p>

            <div className="flex justify-center gap-4 mb-6">
              {batchResults.accepted_count > 0 && (
                <Badge variant="secondary" className="bg-green-500/20 text-green-700 text-sm">
                  <Check className="w-3 h-3 mr-1" />
                  {batchResults.accepted_count} accepted
                </Badge>
              )}
              {batchResults.declined_count > 0 && (
                <Badge variant="secondary" className="bg-red-500/20 text-red-700 text-sm">
                  <X className="w-3 h-3 mr-1" />
                  {batchResults.declined_count} declined
                </Badge>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {batchResults.accepted_count > 0 && icsData && (
                <Button onClick={downloadCalendar} variant="outline" className="gap-2">
                  <CalendarPlus className="h-4 w-4" />
                  Add to Calendar
                </Button>
              )}
              <Button asChild variant="secondary" className="gap-2">
                <a href="/sub-contractors/work">Login to Dashboard</a>
              </Button>
            </div>

            <JoinDirectoryCTA />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Single invite response confirmation
  if (response && !invite?.is_batch) {
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

            <div className="flex flex-col gap-3">
              {response === "accepted" && icsData && (
                <Button onClick={downloadCalendar} variant="outline" className="gap-2">
                  <CalendarPlus className="h-4 w-4" />
                  Add to Calendar
                </Button>
              )}
              <Button asChild variant="secondary" className="gap-2">
                <a href="/sub-contractors/work">Login to Dashboard</a>
              </Button>
            </div>

            <JoinDirectoryCTA />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invite) return null;

  // Batch invite view
  if (invite.is_batch) {
    const pendingInvites = invite.invites.filter(inv => !inv.already_responded);
    const respondedInvites = invite.invites.filter(inv => inv.already_responded);
    const selectedCount = Object.values(batchResponses).filter(Boolean).length;

    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg overflow-hidden">
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
            <CardTitle className="text-lg">
              Hi {invite.recipient_name}, you've been invited to {invite.invites.length} pour{invite.invites.length !== 1 ? "s" : ""}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Role: <span className="font-medium">{invite.role}</span>
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Notes */}
            {invite.notes && (
              <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-r-lg">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  Notes from {invite.business_name}:
                </p>
                <p className="text-sm mt-1 text-amber-800 dark:text-amber-300">{invite.notes}</p>
              </div>
            )}

            {/* Pending invites */}
            {pendingInvites.length > 0 && (
              <div className="space-y-3">
                {pendingInvites.map((inv) => {
                  const currentResponse = batchResponses[inv.invite_id];
                  return (
                    <div
                      key={inv.invite_id}
                      className={`border rounded-lg p-4 transition-colors ${
                        currentResponse === "accepted"
                          ? "border-green-500 bg-green-500/5"
                          : currentResponse === "declined"
                          ? "border-red-500 bg-red-500/5"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">{inv.pour_name}</p>
                          {inv.pour_date && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {format(new Date(inv.pour_date), "EEEE, d MMM yyyy")}
                              {inv.scheduled_time && ` at ${inv.scheduled_time.slice(0, 5)}`}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {inv.site_address}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant={currentResponse === "declined" ? "default" : "outline"}
                          className={`flex-1 gap-1.5 ${
                            currentResponse === "declined"
                              ? "bg-red-500 hover:bg-red-600 border-red-500"
                              : "border-red-500/50 text-red-600 hover:bg-red-500/10"
                          }`}
                          onClick={() => toggleBatchResponse(inv.invite_id, "declined")}
                          disabled={submitting}
                        >
                          <X className="h-3.5 w-3.5" />
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          variant={currentResponse === "accepted" ? "default" : "outline"}
                          className={`flex-1 gap-1.5 ${
                            currentResponse === "accepted"
                              ? "bg-green-600 hover:bg-green-700 border-green-600"
                              : "border-green-500/50 text-green-600 hover:bg-green-500/10"
                          }`}
                          onClick={() => toggleBatchResponse(inv.invite_id, "accepted")}
                          disabled={submitting}
                        >
                          <Check className="h-3.5 w-3.5" />
                          Accept
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Already responded invites */}
            {respondedInvites.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Already responded:</p>
                {respondedInvites.map((inv) => (
                  <div
                    key={inv.invite_id}
                    className="border rounded-lg p-3 bg-muted/30 opacity-60"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{inv.pour_name}</p>
                        {inv.pour_date && (
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(inv.pour_date), "d MMM yyyy")}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant="secondary"
                        className={
                          inv.status === "accepted"
                            ? "bg-green-500/20 text-green-700"
                            : "bg-red-500/20 text-red-700"
                        }
                      >
                        {inv.status === "accepted" ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Accepted
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3 mr-1" />
                            Declined
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Submit button */}
            {pendingInvites.length > 0 && (
              <Button
                size="lg"
                className="w-full"
                onClick={handleBatchSubmit}
                disabled={submitting || selectedCount === 0}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Submit {selectedCount > 0 ? `${selectedCount} Response${selectedCount !== 1 ? "s" : ""}` : "Responses"}
              </Button>
            )}

            <JoinDirectoryCTA />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Single invite view (backwards compatible)
  const singleInvite = invite as SingleInviteDetails;

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md overflow-hidden">
        {/* Header with logo */}
        <div className="bg-foreground p-6 text-center">
          {singleInvite.business_logo ? (
            <img
              src={singleInvite.business_logo}
              alt={singleInvite.business_name}
              className="max-h-14 max-w-[200px] mx-auto object-contain"
            />
          ) : (
            <h1 className="text-xl font-bold text-background">{singleInvite.business_name}</h1>
          )}
        </div>

        <CardHeader className="text-center pb-2">
          <CardTitle className="text-lg">You've been invited to work on a pour</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Details */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            {singleInvite.pour_date && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="font-medium">
                  {format(new Date(singleInvite.pour_date), "EEEE, d MMMM yyyy")}
                </span>
              </div>
            )}

            {singleInvite.scheduled_time && (
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="font-medium">{singleInvite.scheduled_time.slice(0, 5)}</span>
              </div>
            )}

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <span className="font-medium">{singleInvite.site_address}</span>
            </div>

            <div className="flex items-center gap-3">
              <Wrench className="h-5 w-5 text-muted-foreground shrink-0" />
              <span className="font-medium">Role: {singleInvite.role}</span>
            </div>
          </div>

          {/* Notes */}
          {singleInvite.notes && (
            <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-r-lg">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Notes from {singleInvite.business_name}:
              </p>
              <p className="text-sm mt-1 text-amber-800 dark:text-amber-300">{singleInvite.notes}</p>
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

          <JoinDirectoryCTA />
        </CardContent>
      </Card>
    </div>
  );
}
