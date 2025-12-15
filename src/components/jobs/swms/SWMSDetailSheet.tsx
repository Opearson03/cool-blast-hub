import { useState, useRef, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { AlertTriangle, Check, Shield, Printer, Clock, Pencil, Trash2, X, Save, Users, Download } from "lucide-react";
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
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editRequiredSigners, setEditRequiredSigners] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Reset edit state when swms changes
  useEffect(() => {
    if (swms) {
      setEditName(swms.name);
      setEditRequiredSigners((swms.required_signers as string[] | null) || []);
    }
  }, [swms]);

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

  // Fetch all employees for editing required signers
  const { data: allEmployees = [] } = useQuery({
    queryKey: ["all-employees-for-swms-edit"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_team_profiles");
      if (error) throw error;
      return (data || []).map((p: any) => ({ id: p.id, full_name: p.full_name }));
    },
    enabled: isEditing,
  });

  // Fetch employees assigned to this job's pours
  const { data: jobEmployees = [] } = useQuery({
    queryKey: ["job-employees", jobId],
    queryFn: async () => {
      const { data: pours, error: poursError } = await supabase
        .from("job_pours")
        .select("id")
        .eq("job_id", jobId);
      
      if (poursError) throw poursError;
      if (!pours || pours.length === 0) return [];

      const pourIds = pours.map(p => p.id);
      const { data: pourEmployees, error: peError } = await supabase
        .from("pour_employees")
        .select("employee_id")
        .in("pour_id", pourIds);
      
      if (peError) throw peError;
      if (!pourEmployees || pourEmployees.length === 0) return [];

      return [...new Set(pourEmployees.map(pe => pe.employee_id))];
    },
    enabled: isEditing,
  });

  // Fetch required signers' details
  const requiredSignerIds = (swms?.required_signers as string[] | null) || [];
  
  const { data: requiredSigners = [] } = useQuery({
    queryKey: ["required-signers", swms?.id],
    queryFn: async () => {
      if (requiredSignerIds.length === 0) return [];
      const { data, error } = await supabase.rpc("get_team_profiles");
      if (error) throw error;
      return (data || [])
        .filter((p: any) => requiredSignerIds.includes(p.id))
        .map((p: any) => ({ id: p.id, full_name: p.full_name }));
    },
    enabled: !!swms && requiredSignerIds.length > 0,
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

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!swms) throw new Error("No SWMS selected");

      const { error } = await supabase
        .from("job_swms")
        .update({
          name: editName.trim(),
          required_signers: editRequiredSigners,
        })
        .eq("id", swms.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-swms", jobId] });
      queryClient.invalidateQueries({ queryKey: ["required-signers", swms?.id] });
      toast.success("SWMS updated successfully");
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error("Failed to update SWMS: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!swms) throw new Error("No SWMS selected");

      // Delete signoffs first
      const { error: signoffError } = await supabase
        .from("swms_signoffs")
        .delete()
        .eq("swms_id", swms.id);

      if (signoffError) throw signoffError;

      // Delete SWMS
      const { error } = await supabase
        .from("job_swms")
        .delete()
        .eq("id", swms.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-swms", jobId] });
      queryClient.invalidateQueries({ queryKey: ["swms-signoffs", jobId] });
      toast.success("SWMS deleted successfully");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to delete SWMS: " + error.message);
    },
  });

  const handlePrint = () => {
    setShowPrintView(true);
    setTimeout(() => {
      window.print();
      setShowPrintView(false);
    }, 100);
  };

  const handleDownloadPDF = () => {
    setShowPrintView(true);
    setTimeout(() => {
      window.print();
      setShowPrintView(false);
    }, 100);
  };

  const toggleEditEmployee = (employeeId: string) => {
    setEditRequiredSigners(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAllOnJob = () => {
    setEditRequiredSigners(jobEmployees);
  };

  if (!swms) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center justify-between">
              {isEditing ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="max-w-[200px]"
                />
              ) : (
                <SheetTitle>{swms.name}</SheetTitle>
              )}
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setIsEditing(false);
                        setEditName(swms.name);
                        setEditRequiredSigners((swms.required_signers as string[] | null) || []);
                      }}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => updateMutation.mutate()}
                      disabled={updateMutation.isPending}
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadPDF} title="Download PDF">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrint} title="Print">
                      <Printer className="w-4 h-4" />
                    </Button>
                    <Badge variant="outline" className={statusColors[swms.status || "pending"]}>
                      {swms.status === "completed" ? "Completed" : swms.status === "active" ? "Active" : "Pending"}
                    </Badge>
                  </>
                )}
              </div>
            </div>
            {!isEditing && (
              <div className="text-sm text-muted-foreground">
                {signoffs.length} signoff(s)
              </div>
            )}
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Edit Required Signers */}
            {isEditing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Required Signers
                  </label>
                  {jobEmployees.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllOnJob}
                      className="text-xs h-7"
                    >
                      Select All on Job
                    </Button>
                  )}
                </div>
                <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                  {allEmployees.map((employee) => {
                    const isOnJob = jobEmployees.includes(employee.id);
                    return (
                      <div key={employee.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`edit-emp-${employee.id}`}
                          checked={editRequiredSigners.includes(employee.id)}
                          onCheckedChange={() => toggleEditEmployee(employee.id)}
                        />
                        <label
                          htmlFor={`edit-emp-${employee.id}`}
                          className="text-sm cursor-pointer flex-1 flex items-center gap-2"
                        >
                          {employee.full_name}
                          {isOnJob && (
                            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              On Job
                            </span>
                          )}
                        </label>
                      </div>
                    );
                  })}
                </div>
                {editRequiredSigners.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {editRequiredSigners.length} worker{editRequiredSigners.length !== 1 ? "s" : ""} selected
                  </p>
                )}
                <Separator />
              </div>
            )}

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

            {/* Required Signers & Signoffs */}
            <div>
              <h3 className="font-semibold mb-3">Required Signoffs</h3>
              
              {requiredSigners.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {requiredSigners.map((signer) => {
                    const hasSignedOff = signoffs.some(
                      s => s.employee_id === signer.id || 
                           s.employee_name.toLowerCase() === signer.full_name.toLowerCase()
                    );
                    const signoffData = signoffs.find(
                      s => s.employee_id === signer.id || 
                           s.employee_name.toLowerCase() === signer.full_name.toLowerCase()
                    );
                    
                    return (
                      <Card key={signer.id} className={hasSignedOff ? "border-green-500/30" : "border-yellow-500/30"}>
                        <CardContent className="p-3 flex items-center gap-3">
                          {hasSignedOff ? (
                            <Check className="w-5 h-5 text-green-500" />
                          ) : (
                            <Clock className="w-5 h-5 text-yellow-500" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{signer.full_name}</p>
                            {hasSignedOff && signoffData ? (
                              <p className="text-xs text-muted-foreground">
                                Signed: {format(new Date(signoffData.signed_at!), "d MMM yyyy, HH:mm")}
                              </p>
                            ) : (
                              <p className="text-xs text-yellow-500">Awaiting signature</p>
                            )}
                          </div>
                          {hasSignedOff && signoffData?.signature_data && (
                            <img
                              src={signoffData.signature_data}
                              alt="Signature"
                              className="h-10 border rounded"
                            />
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-4">No specific workers assigned - anyone can sign</p>
              )}

              {/* Additional Signoffs (not in required list) */}
              {signoffs.filter(s => 
                !requiredSigners.some(r => r.id === s.employee_id || r.full_name.toLowerCase() === s.employee_name.toLowerCase())
              ).length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Additional Signoffs</h4>
                  <div className="space-y-2">
                    {signoffs
                      .filter(s => !requiredSigners.some(r => r.id === s.employee_id || r.full_name.toLowerCase() === s.employee_name.toLowerCase()))
                      .map((signoff) => (
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
                </div>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete SWMS</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{swms.name}"? This will also remove all {signoffs.length} signoff(s). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
