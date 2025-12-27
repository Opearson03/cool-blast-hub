import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface InviteEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteEmployeeDialog({ open, onOpenChange }: InviteEmployeeDialogProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [limitError, setLimitError] = useState<string | null>(null);
  const [isCheckingLimit, setIsCheckingLimit] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { checkEmployeeLimit } = useSubscription();

  const mutation = useMutation({
    mutationFn: async () => {
      // Server-side check for employee limit
      setIsCheckingLimit(true);
      setLimitError(null);
      
      try {
        const limitCheck = await checkEmployeeLimit();
        
        if (!limitCheck.canAdd && !limitCheck.isExempt) {
          throw new Error(
            `You've reached your employee limit (${limitCheck.currentCount}/${limitCheck.limit}). ` +
            `Upgrade your plan to add more employees.`
          );
        }
      } finally {
        setIsCheckingLimit(false);
      }

      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("pending_invites").insert({
        email: email.toLowerCase().trim(),
        full_name: fullName,
        role,
        invited_by: userData.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-invites"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast({
        title: "Invite sent",
        description: `${fullName} can now sign up at the login page.`,
      });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Employee</DialogTitle>
          <DialogDescription>
            Send an invite so they can create their account.
          </DialogDescription>
        </DialogHeader>

        {limitError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{limitError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Smith"
              className="touch-target"
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="touch-target"
            />
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "admin" | "staff")}>
              <SelectTrigger className="touch-target">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Employee</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 touch-target"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={mutation.isPending || isCheckingLimit} 
              className="flex-1 touch-target"
            >
              {(mutation.isPending || isCheckingLimit) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send Invite
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
