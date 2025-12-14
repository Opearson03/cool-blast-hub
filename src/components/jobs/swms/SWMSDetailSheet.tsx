import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { AlertTriangle, Check, Shield, Printer } from "lucide-react";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";
import { SignaturePad } from "../itps/SignaturePad";
import { PrintableSWMS } from "../documents/PrintableSWMS";

type JobSWMS = Tables<"job_swms">;
type SWMSSignoff = Tables<"swms_signoffs">;

interface SWMSDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  swms: JobSWMS | null;
  signoffs: SWMSSignoff[];
  jobId: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  active: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  completed: "bg-green-500/20 text-green-600 border-green-500/30",
};

const riskColors: Record<string, string> = {
  High: "text-red-500",
  Medium: "text-yellow-500",
  Low: "text-green-500",
};

export function SWMSDetailSheet({ open, onOpenChange, swms, signoffs, jobId }: SWMSDetailSheetProps) {
  const queryClient = useQueryClient();
  const [showSignature, setShowSignature] = useState(false);
  const [employeeName, setEmployeeName] = useState("");
  const [showPrintView, setShowPrintView] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch job details for print
  const { data: job } = useQuery({
    queryKey: ["job-for-print", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("name, site_address, business_id")
        .eq("id", jobId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!jobId,
  });

  // Fetch business details for print
  const { data: business } = useQuery({
    queryKey: ["business-for-print", job?.business_id],
    queryFn: async () => {
      if (!job?.business_id) return null;
      const { data, error } = await supabase
        .from("businesses")
        .select("name, logo_url, address, phone, abn")
        .eq("id", job.business_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!job?.business_id,
  });

  const content = swms?.content as any;
  const hazards = (swms?.hazards || content?.hazards || []) as Array<{
    hazard: string;
    risk: string;
    controls: string[];
  }>;

  const signoffMutation = useMutation({
    mutationFn: async (signatureData: string) => {
      if (!swms) throw new Error("No SWMS selected");
      if (!employeeName.trim()) throw new Error("Please enter your name");

      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase.from("swms_signoffs").insert([{
        swms_id: swms.id,
        employee_name: employeeName.trim(),
        employee_id: userData.user?.id || null,
        signature_data: signatureData,
      }]);

      if (error) throw error;

      // Update SWMS status to active if still pending
      if (swms.status === "pending") {
        await supabase
          .from("job_swms")
          .update({ status: "active" })
          .eq("id", swms.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-swms", jobId] });
      queryClient.invalidateQueries({ queryKey: ["swms-signoffs", jobId] });
      toast.success("SWMS signed successfully");
      setShowSignature(false);
      setEmployeeName("");
    },
    onError: (error) => {
      toast.error("Failed to sign: " + error.message);
    },
  });

  const handlePrint = () => {
    setShowPrintView(true);
    setTimeout(() => {
      window.print();
      setShowPrintView(false);
    }, 100);
  };

  if (!swms) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle>{swms.name}</SheetTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Badge variant="outline" className={statusColors[swms.status || "pending"]}>
                  {swms.status === "completed" ? "Completed" : swms.status === "active" ? "Active" : "Pending"}
                </Badge>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {signoffs.length} signoff(s)
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Scope */}
            {content?.scope && (
              <div>
                <h3 className="font-semibold mb-2">Scope of Work</h3>
                <p className="text-sm text-muted-foreground">{content.scope}</p>
              </div>
            )}

            {/* PPE Required */}
            {content?.ppe_required && (
              <div>
                <h3 className="font-semibold mb-2">PPE Required</h3>
                <div className="flex flex-wrap gap-2">
                  {content.ppe_required.map((ppe: string, i: number) => (
                    <Badge key={i} variant="secondary">{ppe}</Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Hazards */}
            <div>
              <h3 className="font-semibold mb-3">Hazards & Controls</h3>
              <div className="space-y-3">
                {hazards.map((hazard, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className={`w-5 h-5 mt-0.5 ${riskColors[hazard.risk] || "text-muted-foreground"}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{hazard.hazard}</span>
                            <Badge variant="outline" className={riskColors[hazard.risk]}>
                              {hazard.risk} Risk
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground font-medium mt-2">Controls:</p>
                          <ul className="text-sm text-muted-foreground list-disc list-inside">
                            {(hazard.controls || []).map((control, j) => (
                              <li key={j}>{control}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            {/* Signoffs */}
            <div>
              <h3 className="font-semibold mb-3">Signoffs</h3>
              {signoffs.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {signoffs.map((signoff) => (
                    <Card key={signoff.id}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-500" />
                        <div className="flex-1">
                          <p className="font-medium">{signoff.employee_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Signed: {format(new Date(signoff.signed_at!), "d MMM yyyy, HH:mm")}
                          </p>
                        </div>
                        {signoff.signature_data && (
                          <img
                            src={signoff.signature_data}
                            alt="Signature"
                            className="h-10 border rounded"
                          />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-4">No signoffs yet</p>
              )}

              {/* Add Signoff */}
              {!showSignature ? (
                <Button onClick={() => setShowSignature(true)} className="w-full">
                  <Shield className="w-4 h-4 mr-2" />
                  Sign SWMS
                </Button>
              ) : (
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <label className="text-sm font-medium">Your Name</label>
                      <Input
                        value={employeeName}
                        onChange={(e) => setEmployeeName(e.target.value)}
                        placeholder="Enter your full name"
                        className="mt-1"
                      />
                    </div>
                    <SignaturePad
                      onSave={(data) => signoffMutation.mutate(data)}
                      onCancel={() => {
                        setShowSignature(false);
                        setEmployeeName("");
                      }}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Print View */}
      {showPrintView && swms && (
        <div className="fixed inset-0 bg-white z-[100] overflow-auto print:static">
          <PrintableSWMS
            ref={printRef}
            swms={swms}
            signoffs={signoffs}
            jobName={job?.name || ""}
            jobAddress={job?.site_address || ""}
            business={business || null}
          />
        </div>
      )}

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .fixed.inset-0.bg-white {
            display: block !important;
            visibility: visible !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
          }
          .fixed.inset-0.bg-white * {
            visibility: visible !important;
          }
        }
      `}</style>
    </>
  );
}
