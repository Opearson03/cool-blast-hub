import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface EstimateQuotaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  used: number;
  limit: number;
  resetsAt: string | null;
}

export function EstimateQuotaDialog({ 
  open, 
  onOpenChange, 
  used, 
  limit, 
  resetsAt 
}: EstimateQuotaDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          upgrade: true,
        },
      });

      if (error) throw error;

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast({
        title: "Error",
        description: "Failed to start upgrade process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatResetDate = (dateStr: string | null) => {
    if (!dateStr) return "next month";
    return new Date(dateStr).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Upgrade to Create More Quotes
          </DialogTitle>
          <DialogDescription>
            You've used your {limit} free quote{limit > 1 ? "s" : ""} this month.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Monthly Quota</p>
              <p className="text-sm text-muted-foreground">
                {used} of {limit} quotes used
              </p>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {used}/{limit}
            </Badge>
          </div>
          
          {resetsAt && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Resets on {formatResetDate(resetsAt)}</span>
            </div>
          )}
          
          <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
            <p className="font-medium text-primary">PourHub Pro - $100/month</p>
            <p className="text-sm text-muted-foreground mt-1">
              Unlimited quotes, priority support, and all features included.
            </p>
          </div>
        </div>
        
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Maybe Later
          </Button>
          <Button onClick={handleUpgrade} disabled={loading} className="w-full sm:w-auto">
            {loading ? "Loading..." : "Upgrade Now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
