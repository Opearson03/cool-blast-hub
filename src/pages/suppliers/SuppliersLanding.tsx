import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  ArrowRight,
  FileText,
  ShoppingCart,
  Repeat,
  Target,
  Zap,
  MapPin,
  Lock,
  DollarSign,
} from "lucide-react";
import { LandingShell } from "@/components/landing/LandingShell";
import { SEOHead } from "@/components/seo/SEOHead";
import { SupplierRegistrationDialog } from "@/components/suppliers/SupplierRegistrationDialog";

export default function SuppliersLanding() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.session) {
        const { data: isSupplier } = await supabase.rpc("is_supplier", {
          _user_id: data.session.user.id,
        });

        if (isSupplier) {
          navigate("/suppliers/dashboard");
        } else {
          await supabase.auth.signOut();
          toast({
            title: "Access denied",
            description: "This account does not have supplier access.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const supplierCategories = [
    "Concrete",
    "Reinforcement",
    "Formwork",
    "Pump hire",
    "Admixtures",
    "Testing & compliance",
    "Consumables",
  ];

  const placementMoments = [
    {
      icon: FileText,
      number: "1",
      title: "RFQ requests",
      description: "Appear at the top of the supplier list when concreters request pricing.",
    },
    {
      icon: ShoppingCart,
      number: "2",
      title: "PO issuance",
      description: "Surfaced as preferred supplier when quotes convert to purchase orders.",
    },
    {
      icon: Repeat,
      number: "3",
      title: "Repeat orders",
      description: "Become familiar and easy to reselect for future jobs.",
    },
  ];

  const benefits = [
    {
      icon: Target,
      title: "Confirmed-intent buyers",
      description: "Reach concreters actively quoting jobs and issuing POs — not casual browsers.",
    },
    {
      icon: Zap,
      title: "Bypass price-shopping",
      description: "Default positioning reduces comparison and increases conversion speed.",
    },
    {
      icon: MapPin,
      title: "Geographic targeting",
      description: "State-based or region-based placements. Pay only for markets you service.",
    },
    {
      icon: Lock,
      title: "Category exclusivity",
      description: "Be the only sponsored supplier in your category for a state.",
    },
    {
      icon: FileText,
      title: "Direct RFQs & POs",
      description: "Structured requests with job details — not vague emails.",
    },
    {
      icon: DollarSign,
      title: "No commission",
      description: "No revenue share, no percentage of invoices. Pay for placement, not margin.",
    },
  ];

  return (
    <>
      <SEOHead
        title="Preferred Supplier Placement | PourHub"
        description="Put your brand in front of Australian concreters at the moment they place orders. Preferred supplier placements inside the PourHub workflow."
        canonicalPath="/suppliers"
      />
      <LandingShell ctaLabel="Register interest" onCtaClick={() => setShowRegistrationDialog(true)}>
        <div className="bg-charcoal-dark text-primary-foreground">
          {/* Hero + Login */}
          <section className="px-4 pt-16 pb-20 sm:pt-20">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="eyebrow">Preferred supplier placement</span>
                <h1 className="font-display text-4xl md:text-5xl font-bold leading-[1.05] mt-5">
                  Reach concreters at the<br />
                  <span className="text-primary">moment they order.</span>
                </h1>
                <p className="mt-6 text-lg text-primary-foreground/70 max-w-xl">
                  Supplier selection happens inside PourHub — not via Google, cold calls or ads. Become the default option in your category.
                </p>
                <div className="mt-7 flex flex-wrap gap-2">
                  {supplierCategories.map((cat) => (
                    <span
                      key={cat}
                      className="rounded-full border border-border/40 bg-charcoal/60 px-3 py-1.5 text-xs text-primary-foreground/80"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
                <div className="mt-8">
                  <Button size="lg" className="h-12 px-7 touch-target font-medium" onClick={() => setShowRegistrationDialog(true)}>
                    Register interest
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Login Card */}
              <Card className="w-full max-w-md mx-auto lg:ml-auto rounded-2xl border-border/50 bg-card/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="font-display">Supplier login</CardTitle>
                  <CardDescription>Already a registered supplier? Sign in to your dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="sup-email">Email</Label>
                      <Input
                        id="sup-email"
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sup-password">Password</Label>
                      <Input
                        id="sup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign in"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Placement moments */}
          <section className="px-4 py-20 border-t border-border/20 bg-charcoal/40">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <span className="eyebrow">How it works</span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold mt-4">
                  Three moments your brand appears.
                </h2>
                <p className="text-primary-foreground/65 mt-3 max-w-2xl mx-auto">
                  PourHub is the operations platform concreters use to quote, schedule and order materials. You appear at the critical moments.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {placementMoments.map((moment, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur p-6 text-center"
                  >
                    <div className="w-12 h-12 bg-primary/15 border border-primary/30 text-primary rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-display font-bold">
                      {moment.number}
                    </div>
                    <div className="rounded-lg border border-primary/25 bg-primary/10 p-2 inline-flex mb-3">
                      <moment.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-lg">{moment.title}</h3>
                    <p className="text-sm text-primary-foreground/65 mt-2">{moment.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Benefits */}
          <section className="px-4 py-20">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <span className="eyebrow">Why PourHub</span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold mt-4">
                  Pay for placement, not margin.
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {benefits.map((benefit, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur p-6"
                  >
                    <div className="rounded-lg border border-primary/25 bg-primary/10 p-2 inline-flex">
                      <benefit.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-lg mt-4">{benefit.title}</h3>
                    <p className="text-sm text-primary-foreground/65 mt-2">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-primary px-4 py-16">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground">
                Ready to get started?
              </h2>
              <p className="text-primary-foreground/85 mt-3">
                Register your interest and our team will be in touch about becoming a Preferred Supplier.
              </p>
              <div className="mt-7">
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-12 px-7 touch-target font-medium"
                  onClick={() => setShowRegistrationDialog(true)}
                >
                  Register interest
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </section>
        </div>
      </LandingShell>

      <SupplierRegistrationDialog
        open={showRegistrationDialog}
        onOpenChange={setShowRegistrationDialog}
      />
    </>
  );
}
