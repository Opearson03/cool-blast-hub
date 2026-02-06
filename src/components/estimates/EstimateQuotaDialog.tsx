import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Calendar, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers";

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
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleUpgrade = async (tier: "estimating" | "pro") => {
    setLoading(tier);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          upgrade: true,
          tier: tier,
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
      setLoading(null);
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

  const estimatingTier = SUBSCRIPTION_TIERS.estimating;
  const proTier = SUBSCRIPTION_TIERS.pro;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
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
          
          {/* Estimating Tier */}
          <div className="p-4 bg-muted/50 border border-border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium">{estimatingTier.name}</p>
                <p className="text-2xl font-bold text-primary">${estimatingTier.price}<span className="text-sm font-normal text-muted-foreground">/month</span></p>
              </div>
              <Button 
                onClick={() => handleUpgrade("estimating")} 
                disabled={loading !== null}
                variant="outline"
              >
                {loading === "estimating" ? "Loading..." : "Select"}
              </Button>
            </div>
            <ul className="space-y-1">
              {estimatingTier.features.slice(0, 3).map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro Tier - Recommended */}
          <div className="p-4 bg-primary/10 border-2 border-primary/30 rounded-lg relative">
            <Badge className="absolute -top-2 left-4 bg-primary">Recommended</Badge>
            <div className="flex items-center justify-between mb-3 mt-1">
              <div>
                <p className="font-medium">{proTier.name}</p>
                <p className="text-2xl font-bold text-primary">${proTier.price}<span className="text-sm font-normal text-muted-foreground">/month</span></p>
              </div>
              <Button 
                onClick={() => handleUpgrade("pro")} 
                disabled={loading !== null}
              >
                {loading === "pro" ? "Loading..." : "Select"}
              </Button>
            </div>
            <ul className="space-y-1">
              {proTier.features.slice(0, 4).map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
              <li className="text-xs text-muted-foreground pl-6">
                + {proTier.features.length - 4} more features
              </li>
            </ul>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
