import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  User, 
  Building2, 
  Phone, 
  Mail, 
  MapPin,
  Trash2,
  Plus,
  Package,
  Users
} from "lucide-react";
import { PourFormDialog } from "./PourFormDialog";
import { SubTradeInviteDialog } from "./SubTradeInviteDialog";

interface JobStartupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: {
    id: string;
    name: string;
    job_number: string | null;
    site_address: string;
    builder_client: string | null;
    source_estimate_id: string | null;
  };
  onComplete: () => void;
}

type Step = "client" | "pours" | "subbies";

interface CustomerInfo {
  clientName: string;
  companyName: string;
  clientEmail: string;
  clientPhone: string;
  siteAddress: string;
}

interface Pour {
  id: string;
  pour_name: string;
  estimated_m3: number | null;
  mpa_strength: string | null;
  slump: string | null;
  status: string | null;
}

export function JobStartupWizard({ open, onOpenChange, job, onComplete }: JobStartupWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>("client");
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    clientName: "",
    companyName: "",
    clientEmail: "",
    clientPhone: "",
    siteAddress: job.site_address,
  });
  const [isAddPourOpen, setIsAddPourOpen] = useState(false);
  const [isInviteSubbieOpen, setIsInviteSubbieOpen] = useState(false);
  const [selectedPourId, setSelectedPourId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch source estimate for customer details
  const { data: sourceEstimate, isLoading: loadingEstimate } = useQuery({
    queryKey: ["source-estimate-startup", job.source_estimate_id],
    queryFn: async () => {
      if (!job.source_estimate_id) return null;
      const { data, error } = await supabase
        .from("estimates")
        .select("client_name, company_name, client_email, client_phone, site_address")
        .eq("id", job.source_estimate_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!job.source_estimate_id && open,
  });

  // Initialize customer info from estimate
  useState(() => {
    if (sourceEstimate) {
      setCustomerInfo({
        clientName: sourceEstimate.client_name || "",
        companyName: sourceEstimate.company_name || "",
        clientEmail: sourceEstimate.client_email || "",
        clientPhone: sourceEstimate.client_phone || "",
        siteAddress: sourceEstimate.site_address || job.site_address,
      });
    }
  });

  // Fetch pours for this job
  const { data: pours = [], isLoading: loadingPours, refetch: refetchPours } = useQuery({
    queryKey: ["job-pours-startup", job.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_pours")
        .select("*")
        .eq("job_id", job.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Pour[];
    },
    enabled: open,
  });

  // Delete pour mutation
  const deletePourMutation = useMutation({
    mutationFn: async (pourId: string) => {
      const { error } = await supabase
        .from("job_pours")
        .delete()
        .eq("id", pourId);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchPours();
      toast({ title: "Pour deleted" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Complete startup mutation
  const completeStartupMutation = useMutation({
    mutationFn: async () => {
      // Update job with any modified customer info
      const { error } = await supabase
        .from("jobs")
        .update({
          startup_completed: true,
          builder_client: customerInfo.clientName || customerInfo.companyName || null,
          site_address: customerInfo.siteAddress,
        })
        .eq("id", job.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job", job.id] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast({ title: "Job startup completed!" });
      onComplete();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSkip = async () => {
    await completeStartupMutation.mutateAsync();
  };

  const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
    { key: "client", label: "Client Details", icon: <User className="w-4 h-4" /> },
    { key: "pours", label: "Pours", icon: <Package className="w-4 h-4" /> },
    { key: "subbies", label: "Sub-Trades", icon: <Users className="w-4 h-4" /> },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  const goNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].key);
    } else {
      completeStartupMutation.mutate();
    }
  };

  const goBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].key);
    }
  };

  const handleInviteSubbie = (pourId: string) => {
    setSelectedPourId(pourId);
    setIsInviteSubbieOpen(true);
  };

  // Update customer info when estimate loads
  if (sourceEstimate && !customerInfo.clientName && sourceEstimate.client_name) {
    setCustomerInfo({
      clientName: sourceEstimate.client_name || "",
      companyName: sourceEstimate.company_name || "",
      clientEmail: sourceEstimate.client_email || "",
      clientPhone: sourceEstimate.client_phone || "",
      siteAddress: sourceEstimate.site_address || job.site_address,
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <Badge className="mb-2 bg-primary/20 text-primary border-primary/30">
                  New Job
                </Badge>
                <DialogTitle>Job Startup</DialogTitle>
                <DialogDescription>
                  {job.name} • {job.job_number}
                </DialogDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground">
                Skip
              </Button>
            </div>
          </DialogHeader>

          {/* Step Indicators */}
          <div className="flex items-center justify-between px-2 py-3 border-b">
            {steps.map((step, index) => (
              <div
                key={step.key}
                className={`flex items-center gap-2 ${
                  index === currentStepIndex
                    ? "text-primary font-medium"
                    : index < currentStepIndex
                    ? "text-green-500"
                    : "text-muted-foreground"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    index === currentStepIndex
                      ? "border-primary bg-primary/10"
                      : index < currentStepIndex
                      ? "border-green-500 bg-green-500/10"
                      : "border-muted"
                  }`}
                >
                  {index < currentStepIndex ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    step.icon
                  )}
                </div>
                <span className="hidden sm:inline text-sm">{step.label}</span>
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {currentStep === "client" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Confirm the client details from the signed quote.
                </p>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="clientName" className="flex items-center gap-2">
                      <User className="w-4 h-4" /> Contact Name
                    </Label>
                    <Input
                      id="clientName"
                      value={customerInfo.clientName}
                      onChange={(e) => setCustomerInfo((prev) => ({ ...prev, clientName: e.target.value }))}
                      placeholder="John Smith"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="companyName" className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> Company
                    </Label>
                    <Input
                      id="companyName"
                      value={customerInfo.companyName}
                      onChange={(e) => setCustomerInfo((prev) => ({ ...prev, companyName: e.target.value }))}
                      placeholder="ABC Builders"
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="clientEmail" className="flex items-center gap-2">
                        <Mail className="w-4 h-4" /> Email
                      </Label>
                      <Input
                        id="clientEmail"
                        type="email"
                        value={customerInfo.clientEmail}
                        onChange={(e) => setCustomerInfo((prev) => ({ ...prev, clientEmail: e.target.value }))}
                        placeholder="john@example.com"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientPhone" className="flex items-center gap-2">
                        <Phone className="w-4 h-4" /> Phone
                      </Label>
                      <Input
                        id="clientPhone"
                        value={customerInfo.clientPhone}
                        onChange={(e) => setCustomerInfo((prev) => ({ ...prev, clientPhone: e.target.value }))}
                        placeholder="0412 345 678"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="siteAddress" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Site Address
                    </Label>
                    <Input
                      id="siteAddress"
                      value={customerInfo.siteAddress}
                      onChange={(e) => setCustomerInfo((prev) => ({ ...prev, siteAddress: e.target.value }))}
                      placeholder="123 Main St, Sydney NSW"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === "pours" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Review auto-generated pours from the quote. Add, edit or remove as needed.
                  </p>
                  <Button size="sm" variant="outline" onClick={() => setIsAddPourOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Pour
                  </Button>
                </div>

                {loadingPours ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : pours.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No pours created yet.</p>
                      <Button variant="link" onClick={() => setIsAddPourOpen(true)}>
                        Add your first pour
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {pours.map((pour) => (
                      <Card key={pour.id} className="overflow-hidden">
                        <CardContent className="p-3 flex items-center justify-between">
                          <div>
                            <p className="font-medium">{pour.pour_name}</p>
                            <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                              {pour.estimated_m3 && <span>{pour.estimated_m3}m³</span>}
                              {pour.mpa_strength && <span>N{pour.mpa_strength}</span>}
                              {pour.slump && <span>Slump: {pour.slump}</span>}
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deletePourMutation.mutate(pour.id)}
                            disabled={deletePourMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {currentStep === "subbies" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Invite sub-contractors to your pours. You can also do this later from the job details.
                </p>

                {pours.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Add pours first to invite sub-trades.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {pours.map((pour) => (
                      <Card key={pour.id}>
                        <CardContent className="p-3 flex items-center justify-between">
                          <div>
                            <p className="font-medium">{pour.pour_name}</p>
                            {pour.estimated_m3 && (
                              <p className="text-xs text-muted-foreground">{pour.estimated_m3}m³</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleInviteSubbie(pour.id)}
                          >
                            <Users className="w-4 h-4 mr-1" />
                            Invite Subbie
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={goBack}
              disabled={currentStepIndex === 0}
              className="touch-target"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            
            <div className="text-sm text-muted-foreground">
              Step {currentStepIndex + 1} of {steps.length}
            </div>

            <Button
              onClick={goNext}
              disabled={completeStartupMutation.isPending}
              className="touch-target"
            >
              {completeStartupMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {currentStepIndex === steps.length - 1 ? (
                <>
                  Complete
                  <Check className="w-4 h-4 ml-1" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Pour Dialog */}
      <PourFormDialog
        open={isAddPourOpen}
        onOpenChange={(open) => {
          setIsAddPourOpen(open);
          if (!open) refetchPours();
        }}
        jobId={job.id}
      />

      {/* Invite Sub-Trade Dialog */}
      {selectedPourId && (
        <SubTradeInviteDialog
          open={isInviteSubbieOpen}
          onOpenChange={setIsInviteSubbieOpen}
          jobId={job.id}
          pourId={selectedPourId}
          pourName={pours.find(p => p.id === selectedPourId)?.pour_name || "Pour"}
          pourDate={null}
        />
      )}
    </>
  );
}
