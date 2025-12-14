import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { SWMSViewer } from "@/components/safety/SWMSViewer";
import { format } from "date-fns";

interface PendingSWMS {
  id: string;
  title: string;
  swms_number: string;
  valid_from: string;
  work_description: string;
  jobs: {
    title: string;
    scheduled_date: string | null;
  } | null;
}

export default function StaffSWMS() {
  const [pendingSWMS, setPendingSWMS] = useState<PendingSWMS[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSWMS, setSelectedSWMS] = useState<string | null>(null);
  const [signingDialog, setSigningDialog] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signerRole, setSignerRole] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingSWMS();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", session.user.id)
      .single();

    if (data) setSignerName(data.full_name);
  };

  const fetchPendingSWMS = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: assignmentsData } = await supabase
      .from("job_assignments")
      .select(`
        job_id,
        jobs (
          id,
          title,
          scheduled_date
        )
      `)
      .eq("staff_id", session.user.id);

    if (!assignmentsData) {
      setLoading(false);
      return;
    }

    const jobIds = assignmentsData.map((a) => a.job_id);

    const { data: swmsData } = await supabase
      .from("swms_documents")
      .select("id, title, swms_number, valid_from, work_description, job_id")
      .in("job_id", jobIds)
      .eq("status", "approved");

    if (!swmsData) {
      setLoading(false);
      return;
    }

    const pending: PendingSWMS[] = [];
    for (const swms of swmsData) {
      const { data: signoff } = await supabase
        .from("swms_signoffs")
        .select("id")
        .eq("swms_id", swms.id)
        .eq("staff_id", session.user.id)
        .single();

      if (!signoff) {
        const job = assignmentsData.find((a) => a.job_id === swms.job_id)?.jobs;
        pending.push({
          ...swms,
          jobs: job || null,
        });
      }
    }

    setPendingSWMS(pending);
    setLoading(false);
  };

  const handleSignoff = async () => {
    if (!selectedSWMS || !signerName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name to sign",
        variant: "destructive",
      });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from("swms_signoffs").insert({
      swms_id: selectedSWMS,
      staff_id: session.user.id,
      signer_name: signerName,
      signer_role: signerRole || null,
      acknowledged: true,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign document",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Document signed successfully",
      });
      setSigningDialog(false);
      setSelectedSWMS(null);
      fetchPendingSWMS();
    }
  };

  if (loading) {
    return (
      <StaffLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SWMS to Sign</h1>
          <p className="text-muted-foreground mt-1">
            Safe Work Method Statements requiring your signature
          </p>
        </div>

        {pendingSWMS.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
              <p className="text-muted-foreground">
                You have no pending SWMS documents to sign
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pendingSWMS.map((swms) => (
              <Card key={swms.id} className="border-destructive/50">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{swms.title}</CardTitle>
                      <CardDescription>{swms.swms_number}</CardDescription>
                    </div>
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Requires Signature
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {swms.jobs && (
                    <div className="text-sm">
                      <span className="font-medium">Job:</span> {swms.jobs.title}
                      {swms.jobs.scheduled_date && (
                        <span className="text-muted-foreground ml-2">
                          ({format(new Date(swms.jobs.scheduled_date), "MMM d, yyyy")})
                        </span>
                      )}
                    </div>
                  )}
                  <div className="text-sm">
                    <span className="font-medium">Valid from:</span>{" "}
                    {format(new Date(swms.valid_from), "MMM d, yyyy")}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {swms.work_description}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setSelectedSWMS(swms.id);
                        setSigningDialog(false);
                      }}
                      variant="outline"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      View Document
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedSWMS(swms.id);
                        setSigningDialog(true);
                      }}
                    >
                      Sign Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* View SWMS Dialog */}
        <Dialog open={selectedSWMS !== null && !signingDialog} onOpenChange={(open) => !open && setSelectedSWMS(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            {selectedSWMS && <SWMSViewer swmsId={selectedSWMS} />}
          </DialogContent>
        </Dialog>

        {/* Sign SWMS Dialog */}
        <Dialog open={signingDialog} onOpenChange={setSigningDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sign SWMS Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="signerName">Your Name *</Label>
                <Input
                  id="signerName"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="signerRole">Role (Optional)</Label>
                <Input
                  id="signerRole"
                  value={signerRole}
                  onChange={(e) => setSignerRole(e.target.value)}
                  placeholder="e.g., Site Supervisor, Operator"
                />
              </div>
              <div className="bg-muted p-4 rounded-lg text-sm">
                <p className="font-medium mb-2">By signing, you acknowledge that:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>You have read and understood this SWMS</li>
                  <li>You will follow all safety procedures outlined</li>
                  <li>You have the necessary training and competence</li>
                </ul>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setSigningDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSignoff}>
                  Sign Document
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </StaffLayout>
  );
}
