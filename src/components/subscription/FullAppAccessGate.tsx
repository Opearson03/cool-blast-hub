import { useLocation, Link } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Briefcase, Calendar, LayoutDashboard, Check, Crown } from "lucide-react";
import { SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers";

interface FullAppAccessGateProps {
  children: React.ReactNode;
}

export function FullAppAccessGate({ children }: FullAppAccessGateProps) {
  const { tier, isExempt } = useSubscription();
  const location = useLocation();
  
  // Allow access to quotes page for all tiers
  const isQuotesPage = location.pathname.includes("/estimates");
  const isSettingsPage = location.pathname.includes("/settings");
  
  // Pro tier, standard (legacy), and exempt users get full access
  const hasFullAccess = isExempt || tier === "pro" || tier === "standard";
  
  // Free and Estimating tiers can only access quotes + settings
  if (!hasFullAccess && !isQuotesPage && !isSettingsPage) {
    return <UpgradeToProPrompt currentTier={tier} />;
  }
  
  return <>{children}</>;
}

function UpgradeToProPrompt({ currentTier }: { currentTier: string | null }) {
  const proTier = SUBSCRIPTION_TIERS.pro;
  
  const lockedFeatures = [
    { icon: LayoutDashboard, label: "Dashboard & Analytics" },
    { icon: Briefcase, label: "Job Management" },
    { icon: Calendar, label: "Scheduling & Calendar" },
  ];

  const handleUpgrade = async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase.functions.invoke("create-checkout", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: {
        upgrade: true,
        tier: "pro",
      },
    });

    if (!error && data?.url) {
      window.location.href = data.url;
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Upgrade to PourHub Pro</CardTitle>
          <CardDescription className="text-base mt-2">
            {currentTier === "estimating" 
              ? "You're on the Estimating plan. Upgrade to Pro for full job management features."
              : "You're on the Free plan. Upgrade to Pro to unlock all features."
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Locked Features */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              This page requires PourHub Pro:
            </p>
            <div className="grid gap-2">
              {lockedFeatures.map((feature, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <feature.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">{feature.label}</span>
                  <Lock className="w-4 h-4 text-muted-foreground ml-auto" />
                </div>
              ))}
            </div>
          </div>

          {/* Pro Benefits */}
          <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-primary" />
              <span className="font-semibold text-primary">PourHub Pro - ${proTier.price}/month</span>
            </div>
            <ul className="space-y-2">
              {proTier.features.slice(0, 5).map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button onClick={handleUpgrade} size="lg" className="w-full">
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Pro
            </Button>
            <Link to="/admin/estimates">
              <Button variant="outline" size="lg" className="w-full">
                Back to Quotes
              </Button>
            </Link>
          </div>

          {currentTier === "free" && (
            <p className="text-xs text-center text-muted-foreground">
              Or upgrade to <span className="font-medium">Estimating ($99/mo)</span> for unlimited quotes
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
