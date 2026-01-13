import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Check, AlertCircle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers";

const tierConfig = SUBSCRIPTION_TIERS.standard;

export default function Signup() {
  const [searchParams] = useSearchParams();
  const cancelled = searchParams.get("cancelled") === "true";
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (cancelled) {
      toast({
        title: "Checkout Cancelled",
        description: "Your payment was cancelled. You can try again when you're ready.",
        variant: "destructive",
      });
    }
  }, [cancelled, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!termsAccepted) {
      toast({
        title: "Terms Required",
        description: "You must accept the Terms and Conditions to continue.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      // Create Stripe checkout session
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          email,
          fullName,
          businessName,
        },
      });

      if (error) throw error;

      if (data.url) {
        // Store signup data in sessionStorage before redirect
        sessionStorage.setItem("signup_email", email);
        sessionStorage.setItem("signup_business", businessName);
        sessionStorage.setItem("signup_name", fullName);
        sessionStorage.setItem("signup_terms_accepted", "true");
        
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-charcoal-dark">
      <div className="p-4">
        <Link to="/pricing" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to pricing
        </Link>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plan Summary */}
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Your Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h2 className="text-2xl font-bold">{tierConfig.name}</h2>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-primary">${tierConfig.price}</span>
                  <span className="text-muted-foreground"> / month</span>
                </div>
                <Badge variant="secondary" className="mt-2 bg-green-500/20 text-green-400 border-green-500/30">
                  One month free trial
                </Badge>
              </div>
              <ul className="space-y-2">
                {tierConfig.features.slice(0, 6).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
                {tierConfig.features.length > 6 && (
                  <li className="text-sm text-muted-foreground">
                    + {tierConfig.features.length - 6} more features
                  </li>
                )}
              </ul>
              
              {cancelled && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">Payment was cancelled. Please try again.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Signup Form */}
          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Logo size="lg" className="rounded-lg" />
                <span className="text-2xl font-bold">
                  Pour<span className="text-primary">Hub</span>
                </span>
              </div>
              <CardTitle>Create Your Business</CardTitle>
              <CardDescription>Enter your details to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Smith Concreting"
                    required
                    disabled={loading}
                    className="touch-target"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Your Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Smith"
                    required
                    disabled={loading}
                    className="touch-target"
                  />
                </div>
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
                  <Label htmlFor="password">Password</Label>
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
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                    disabled={loading}
                  />
                  <Label htmlFor="terms" className="text-sm leading-tight cursor-pointer">
                    I agree to the{" "}
                    <Link to="/terms" target="_blank" className="text-primary hover:underline">
                      Terms and Conditions
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" target="_blank" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>
                <Button type="submit" className="w-full touch-target" disabled={loading || !termsAccepted}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Continue to Payment
                </Button>
              </form>
              
              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link to="/auth" className="text-primary hover:underline">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
