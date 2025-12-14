import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, Users, Briefcase, CheckCircle, ArrowRight, ArrowLeft, X } from "lucide-react";

interface OnboardingWizardProps {
  businessId: string;
  onComplete: () => void;
}

export function OnboardingWizard({ businessId, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Business details
  const [abn, setAbn] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  // Invite employee
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");

  const totalSteps = 3;

  const handleSaveBusinessDetails = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("businesses")
        .update({
          abn,
          address,
          phone,
          onboarding_step: 2,
        })
        .eq("id", businessId);

      if (error) throw error;
      setStep(2);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteEmployee = async () => {
    if (!inviteEmail || !inviteName) {
      setStep(3);
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("pending_invites").insert({
        email: inviteEmail,
        full_name: inviteName,
        role: "staff",
        invited_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Invite sent!",
        description: `${inviteName} can now sign up at your app URL.`,
      });

      await supabase
        .from("businesses")
        .update({ onboarding_step: 3 })
        .eq("id", businessId);

      setStep(3);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await supabase
        .from("businesses")
        .update({
          onboarding_completed: true,
          onboarding_step: 3,
        })
        .eq("id", businessId);

      toast({
        title: "Welcome to PourHub!",
        description: "Your business is set up and ready to go.",
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const skipStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg [&>button]:hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Getting Started</DialogTitle>
            <span className="text-sm text-muted-foreground">
              Step {step} of {totalSteps}
            </span>
          </div>
        </DialogHeader>

        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2 mb-4">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Business Details</h3>
                <p className="text-sm text-muted-foreground">Add some basic info about your business</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="abn">ABN (Optional)</Label>
                <Input
                  id="abn"
                  value={abn}
                  onChange={(e) => setAbn(e.target.value)}
                  placeholder="XX XXX XXX XXX"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Business Address (Optional)</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St, Sydney NSW"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="04XX XXX XXX"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="ghost" onClick={skipStep} disabled={loading}>
                Skip for now
              </Button>
              <Button onClick={handleSaveBusinessDetails} disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Invite Your First Employee</h3>
                <p className="text-sm text-muted-foreground">Get your team on board (optional)</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="inviteName">Employee Name</Label>
                <Input
                  id="inviteName"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="John Smith"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Employee Email</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="john@example.com"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back
              </Button>
              <Button variant="ghost" onClick={skipStep} disabled={loading}>
                Skip
              </Button>
              <Button onClick={handleInviteEmployee} disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {inviteEmail ? "Send Invite" : "Continue"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">You're Ready!</h3>
                <p className="text-sm text-muted-foreground">Here's what you can do next</p>
              </div>
            </div>
            <div className="space-y-3">
              <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => { handleComplete(); navigate("/admin/jobs"); }}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Create your first job</p>
                    <p className="text-sm text-muted-foreground">Add a job with scheduling and compliance docs</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => { handleComplete(); navigate("/admin/employees"); }}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Add more employees</p>
                    <p className="text-sm text-muted-foreground">Invite your crew to join PourHub</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(2)} disabled={loading}>
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back
              </Button>
              <Button onClick={handleComplete} disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Go to Dashboard
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
