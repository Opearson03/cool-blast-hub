import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, HardHat, CheckCircle, ArrowRight } from "lucide-react";

export default function SignupSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const plan = searchParams.get("plan") || "starter";
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"create" | "complete">("create");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Try to get email from session storage (set during checkout)
  useEffect(() => {
    const savedEmail = sessionStorage.getItem("signup_email");
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get business info from Stripe session via metadata
      // For now, we'll ask the user to re-enter or use stored values
      const businessName = sessionStorage.getItem("signup_business") || "My Business";
      const fullName = sessionStorage.getItem("signup_name") || email.split("@")[0];

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
          data: { 
            full_name: fullName,
            business_name: businessName,
            signup_type: "business_owner",
            stripe_session_id: sessionId,
            plan_tier: plan,
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
        // If auto-signin fails, redirect to login
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
