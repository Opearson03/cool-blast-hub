import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, ArrowRight, AlertCircle } from "lucide-react";

interface CheckoutData {
  email: string;
  fullName: string;
  businessName: string;
  plan: string;
  customerId: string;
  subscriptionId: string;
}

export default function SignupSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const planFromUrl = searchParams.get("plan") || "starter";
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [step, setStep] = useState<"verify" | "create" | "complete">("verify");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Verify checkout session on mount
  useEffect(() => {
    const verifyCheckout = async () => {
      if (!sessionId) {
        setVerifyError("No session ID found. Please try the signup process again.");
        setVerifying(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("verify-checkout", {
          body: { sessionId },
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error || "Verification failed");

        setCheckoutData({
          email: data.email || sessionStorage.getItem("signup_email") || "",
          fullName: data.fullName || sessionStorage.getItem("signup_name") || "",
          businessName: data.businessName || sessionStorage.getItem("signup_business") || "",
          plan: data.plan || sessionStorage.getItem("signup_plan") || planFromUrl,
          customerId: data.customerId || "",
          subscriptionId: data.subscriptionId || "",
        });
        setEmail(data.email || sessionStorage.getItem("signup_email") || "");
        setStep("create");
      } catch (error: any) {
        console.error("Verification error:", error);
        setVerifyError(error.message || "Failed to verify payment. Please contact support.");
      } finally {
        setVerifying(false);
      }
    };

    verifyCheckout();
  }, [sessionId, planFromUrl]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutData) return;
    
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
          data: { 
            full_name: checkoutData.fullName,
            business_name: checkoutData.businessName,
            signup_type: "business_owner",
            stripe_customer_id: checkoutData.customerId,
            stripe_subscription_id: checkoutData.subscriptionId,
            plan_tier: checkoutData.plan,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Account created!",
        description: "Your business is ready. Signing you in...",
      });

      // Sign in immediately after signup
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        toast({
          title: "Please sign in",
          description: "Your account is created. Please sign in to continue.",
        });
        navigate("/auth");
        return;
      }

      // Clear session storage
      sessionStorage.removeItem("signup_email");
      sessionStorage.removeItem("signup_business");
      sessionStorage.removeItem("signup_name");
      sessionStorage.removeItem("signup_plan");

      setStep("complete");
      
      // Redirect to admin after a short delay
      setTimeout(() => {
        navigate("/admin");
      }, 2000);
    } catch (error: any) {
      console.error("Account creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Loading/verifying state
  if (verifying) {
    return (
      <div className="min-h-screen flex flex-col bg-charcoal-dark">
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CardTitle className="text-xl">Verifying Payment</CardTitle>
              <CardDescription>Please wait while we confirm your payment...</CardDescription>
            </CardHeader>
            <CardContent>
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (verifyError) {
    return (
      <div className="min-h-screen flex flex-col bg-charcoal-dark">
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-xl">Verification Failed</CardTitle>
              <CardDescription>{verifyError}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full">
                <Link to="/pricing">Try Again</Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                If you were charged, please contact support at support@pourhub.com.au
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Complete state
  if (step === "complete") {
    return (
      <div className="min-h-screen flex flex-col bg-charcoal-dark">
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">You're All Set!</CardTitle>
              <CardDescription>
                Welcome to PourHub. Redirecting you to your dashboard...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Create account form
  return (
    <div className="min-h-screen flex flex-col bg-charcoal-dark">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Payment Successful!</CardTitle>
            <CardDescription>
              Now let's create your login credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            {checkoutData && (
              <div className="mb-4 p-3 bg-muted/50 rounded-lg text-sm">
                <p><strong>Business:</strong> {checkoutData.businessName}</p>
                <p><strong>Plan:</strong> {checkoutData.plan.charAt(0).toUpperCase() + checkoutData.plan.slice(1)}</p>
              </div>
            )}
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                  disabled={loading}
                  className="touch-target"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Create Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  disabled={loading}
                  minLength={6}
                  className="touch-target"
                />
              </div>
              <Button type="submit" className="w-full touch-target" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account & Continue
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
