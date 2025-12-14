import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, FileText } from "lucide-react";

interface SWMSViewerProps {
  swmsId: string;
}

export function SWMSViewer({ swmsId }: SWMSViewerProps) {
  const { toast } = useToast();
  const [swms, setSwms] = useState<any>(null);
  const [hazards, setHazards] = useState<any[]>([]);
  const [signoffs, setSignoffs] = useState<any[]>([]);
  const [emergencyProcs, setEmergencyProcs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [signerName, setSignerName] = useState("");
  const [signerRole, setSignerRole] = useState("");

  useEffect(() => {
    fetchSWMSData();
  }, [swmsId]);

  const fetchSWMSData = async () => {
    setLoading(true);

    const [swmsResult, hazardsResult, signoffsResult, emergencyResult] = await Promise.all([
      supabase.from("swms_documents").select("*, jobs(job_number, title)").eq("id", swmsId).single(),
      supabase.from("swms_hazards").select("*").eq("swms_id", swmsId).order("step_number"),
      supabase.from("swms_signoffs").select("*").eq("swms_id", swmsId).order("signed_at", { ascending: false }),
      supabase.from("swms_emergency_procedures").select("*").eq("swms_id", swmsId),
    ]);

    if (swmsResult.data) setSwms(swmsResult.data);
    if (hazardsResult.data) setHazards(hazardsResult.data);
    if (signoffsResult.data) setSignoffs(signoffsResult.data);
    if (emergencyResult.data) setEmergencyProcs(emergencyResult.data);

    setLoading(false);
  };

  const handleSignoff = async () => {
    if (!signerName.trim()) {
      toast({ title: "Error", description: "Please enter your name", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("swms_signoffs").insert({
      swms_id: swmsId,
      signer_name: signerName,
      signer_role: signerRole,
      acknowledged: true,
    });

    if (error) {
      toast({ title: "Error", description: "Failed to sign SWMS", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "SWMS signed successfully" });
      setSignerName("");
      setSignerRole("");
      fetchSWMSData();
    }
  };

  if (loading) return <div className="text-center py-8">Loading SWMS...</div>;
  if (!swms) return <div className="text-center py-8">SWMS not found</div>;

  return (
    <div className="space-y-6 print:text-black">
      {/* Header */}
      <div className="text-center border-b pb-4">
        <h1 className="text-2xl font-bold mb-2">SAFE WORK METHOD STATEMENT</h1>
        <p className="text-sm text-muted-foreground">NSW WHS Regulation 2017 Compliant</p>
      </div>

      {/* Document Info */}
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold">SWMS Number:</span> {swms.swms_number}
          </div>
          <div>
            <span className="font-semibold">Version:</span> {swms.version}
          </div>
          <div>
            <span className="font-semibold">Status:</span>{" "}
            <span className="uppercase font-semibold">{swms.status}</span>
          </div>
          <div>
            <span className="font-semibold">Valid From:</span>{" "}
            {new Date(swms.valid_from).toLocaleDateString()}
          </div>
          {swms.jobs && (
            <div className="col-span-2">
              <span className="font-semibold">Job:</span> {swms.jobs.job_number} - {swms.jobs.title}
            </div>
          )}
        </div>
      </Card>

      {/* Project Details */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Project Details</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-semibold">Title:</span> {swms.title}
          </div>
          <div>
            <span className="font-semibold">Work Description:</span>
            <p className="mt-1">{swms.work_description}</p>
          </div>
          <div>
            <span className="font-semibold">Location:</span> {swms.location}
          </div>
          <div>
            <span className="font-semibold">Principal Contractor:</span> {swms.principal_contractor}
          </div>
          {swms.subcontractor && (
            <div>
              <span className="font-semibold">Subcontractor:</span> {swms.subcontractor}
            </div>
          )}
        </div>
      </Card>

      {/* High-Risk Work */}
      {swms.high_risk_work_types && swms.high_risk_work_types.length > 0 && (
        <Card className="p-4 bg-orange-500/10 border-orange-500/20">
          <h3 className="font-semibold mb-3 text-orange-600 dark:text-orange-400">
            ⚠️ High-Risk Construction Work Categories
          </h3>
          <ul className="list-disc list-inside text-sm space-y-1">
            {swms.high_risk_work_types.map((type: string, idx: number) => (
              <li key={idx}>{type.replace(/_/g, " ").toUpperCase()}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Hazards and Controls */}
      <div>
        <h3 className="font-semibold mb-4">Hazard Identification & Risk Assessment</h3>
        <div className="space-y-4">
          {hazards.map((hazard) => (
            <Card key={hazard.id} className="p-4">
              <div className="mb-3">
                <h4 className="font-semibold text-lg">Step {hazard.step_number}: {hazard.work_activity}</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="font-semibold">Hazard:</span> {hazard.hazard}
                </div>
                <div>
                  <span className="font-semibold">Potential Harm:</span> {hazard.potential_harm}
                </div>
                <div>
                  <span className="font-semibold">Risk Rating:</span>{" "}
                  <span className="font-bold">{hazard.initial_risk_rating}</span>
                </div>
                <div>
                  <span className="font-semibold">Responsible Person:</span> {hazard.responsible_person}
                </div>
              </div>
              <Separator className="my-3" />
              <div className="space-y-2 text-sm">
                <h5 className="font-semibold">Control Measures:</h5>
                {hazard.elimination_controls && (
                  <div className="text-green-600 dark:text-green-400">
                    <span className="font-semibold">Elimination:</span> {hazard.elimination_controls}
                  </div>
                )}
                {hazard.substitution_controls && (
                  <div className="text-blue-600 dark:text-blue-400">
                    <span className="font-semibold">Substitution:</span> {hazard.substitution_controls}
                  </div>
                )}
                {hazard.engineering_controls && (
                  <div className="text-purple-600 dark:text-purple-400">
                    <span className="font-semibold">Engineering:</span> {hazard.engineering_controls}
                  </div>
                )}
                {hazard.administrative_controls && (
                  <div className="text-orange-600 dark:text-orange-400">
                    <span className="font-semibold">Administrative:</span> {hazard.administrative_controls}
                  </div>
                )}
                {hazard.ppe_required && (
                  <div className="text-red-600 dark:text-red-400">
                    <span className="font-semibold">PPE Required:</span> {hazard.ppe_required}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Emergency Procedures */}
      {emergencyProcs.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Emergency Procedures</h3>
          {emergencyProcs.map((proc) => (
            <div key={proc.id} className="space-y-2 text-sm">
              <div>
                <span className="font-semibold">Procedure:</span>
                <p className="mt-1 whitespace-pre-wrap">{proc.procedure}</p>
              </div>
              {proc.emergency_contacts && (
                <div>
                  <span className="font-semibold">Emergency Contacts:</span>
                  <p className="mt-1 whitespace-pre-wrap">{proc.emergency_contacts}</p>
                </div>
              )}
              {proc.assembly_point && (
                <div>
                  <span className="font-semibold">Assembly Point:</span> {proc.assembly_point}
                </div>
              )}
            </div>
          ))}
        </Card>
      )}

      {/* Sign-off Section */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Worker Sign-Off</h3>
        <p className="text-sm text-muted-foreground mb-4">
          By signing below, you acknowledge that you have read, understood, and will comply with this SWMS.
        </p>
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="signer_name">Your Name</Label>
              <Input
                id="signer_name"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div>
              <Label htmlFor="signer_role">Your Role</Label>
              <Input
                id="signer_role"
                value={signerRole}
                onChange={(e) => setSignerRole(e.target.value)}
                placeholder="e.g., Carpenter, Labourer"
              />
            </div>
          </div>
          <Button onClick={handleSignoff} className="w-full">
            <CheckCircle className="mr-2 h-4 w-4" />
            Sign SWMS
          </Button>
        </div>

        {/* Existing Sign-offs */}
        {signoffs.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3">Sign-Off History</h4>
            <div className="space-y-2">
              {signoffs.map((signoff) => (
                <div key={signoff.id} className="flex items-center justify-between text-sm border-b pb-2">
                  <div>
                    <span className="font-semibold">{signoff.signer_name}</span>
                    {signoff.signer_role && <span className="text-muted-foreground"> ({signoff.signer_role})</span>}
                  </div>
                  <div className="text-muted-foreground">
                    {new Date(signoff.signed_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
