import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, Copy } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface InviteEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteEmployeeDialog({ open, onOpenChange }: InviteEmployeeDialogProps) {
  const [tab, setTab] = useState<"invite" | "create">("invite");

  // Invite form
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [limitError, setLimitError] = useState<string | null>(null);

  // Direct-create form
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPassword, setCPassword] = useState("");
  const [cRole, setCRole] = useState<"admin" | "staff">("staff");
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { checkEmployeeLimit } = useSubscription();

  const { data: userProfile } = useQuery({
    queryKey: ["current-user-profile"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, business_id")
        .eq("id", userData.user.id)
        .single();
      if (!profile?.business_id) return null;
      const { data: business } = await supabase
        .from("businesses")
        .select("name")
        .eq("id", profile.business_id)
        .single();
      return {
        inviterName: profile.full_name,
        businessName: business?.name || "Your Company",
      };
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      setLimitError(null);
      const limitCheck = await checkEmployeeLimit();
      if (!limitCheck.canAdd && !limitCheck.isExempt) {
        throw new Error(
          `You've reached your employee limit (${limitCheck.currentCount}/${limitCheck.limit}). Upgrade your plan to add more employees.`,
        );
      }

      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("pending_invites").insert({
        email: email.toLowerCase().trim(),
        full_name: fullName,
        role,
        invited_by: userData.user?.id,
      });
      if (error) throw error;

      const { error: emailError } = await supabase.functions.invoke("send-invite-email", {
        body: {
          employeeName: fullName,
          employeeEmail: email.toLowerCase().trim(),
          businessName: userProfile?.businessName || "Your Company",
          inviterName: userProfile?.inviterName || "Your employer",
          role,
        },
      });
      if (emailError) console.error("Failed to send invite email:", emailError);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-invites"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast({ title: "Invite sent", description: `${fullName} can now sign up at the login page.` });
      onOpenChange(false);
      setEmail("");
      setFullName("");
      setRole("staff");
      setLimitError(null);
    },
    onError: (error) => {
      if (error.message.includes("employee limit")) {
        setLimitError(error.message);
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-create-employee", {
        body: {
          full_name: cName,
          email: cEmail.toLowerCase().trim(),
          password: cPassword,
          role: cRole,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { email: string; temp_password: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setCreatedCreds({ email: data.email, password: data.temp_password });
      toast({ title: "Employee created", description: `${cName} can sign in now.` });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    inviteMutation.mutate();
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName || !cEmail || cPassword.length < 6) {
      toast({ title: "Name, email, and password (>=6 chars) are required", variant: "destructive" });
      return;
    }
    createMutation.mutate();
  };

  const closeAndReset = (v: boolean) => {
    if (!v) {
      setCreatedCreds(null);
      setCName("");
      setCEmail("");
      setCPassword("");
      setCRole("staff");
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={closeAndReset}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Employee</DialogTitle>
          <DialogDescription>
            Invite by email or create their account directly.
          </DialogDescription>
        </DialogHeader>

        {createdCreds ? (
          <div className="space-y-3">
            <Alert>
              <AlertDescription>
                Account created. Share these credentials with the employee — they should change the password on first login.
              </AlertDescription>
            </Alert>
            <div className="rounded-md border p-3 text-sm space-y-1">
              <div><span className="text-muted-foreground">Email:</span> {createdCreds.email}</div>
              <div><span className="text-muted-foreground">Password:</span> {createdCreds.password}</div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  navigator.clipboard.writeText(`Email: ${createdCreds.email}\nPassword: ${createdCreds.password}`);
                  toast({ title: "Copied to clipboard" });
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button type="button" className="flex-1" onClick={() => closeAndReset(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <Tabs value={tab} onValueChange={(v) => setTab(v as "invite" | "create")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="invite">Email Invite</TabsTrigger>
              <TabsTrigger value="create">Create Directly</TabsTrigger>
            </TabsList>

            <TabsContent value="invite" className="space-y-4 mt-4">
              {limitError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{limitError}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Smith" className="touch-target" />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" className="touch-target" />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as "admin" | "staff")}>
                    <SelectTrigger className="touch-target"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Employee</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => closeAndReset(false)} className="flex-1 touch-target">Cancel</Button>
                  <Button type="submit" disabled={inviteMutation.isPending} className="flex-1 touch-target">
                    {inviteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Send Invite
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="create" className="space-y-4 mt-4">
              <Alert>
                <AlertDescription className="text-xs">
                  Creates the account immediately with a password you choose. Share the credentials with the employee.
                </AlertDescription>
              </Alert>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="cName">Full Name *</Label>
                  <Input id="cName" value={cName} onChange={(e) => setCName(e.target.value)} placeholder="John Smith" className="touch-target" />
                </div>
                <div>
                  <Label htmlFor="cEmail">Email *</Label>
                  <Input id="cEmail" type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} placeholder="john@example.com" className="touch-target" />
                </div>
                <div>
                  <Label htmlFor="cPassword">Temporary Password *</Label>
                  <Input id="cPassword" type="text" value={cPassword} onChange={(e) => setCPassword(e.target.value)} placeholder="At least 6 characters" className="touch-target" />
                </div>
                <div>
                  <Label htmlFor="cRole">Role</Label>
                  <Select value={cRole} onValueChange={(v) => setCRole(v as "admin" | "staff")}>
                    <SelectTrigger className="touch-target"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Employee</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => closeAndReset(false)} className="flex-1 touch-target">Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending} className="flex-1 touch-target">
                    {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create Account
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
