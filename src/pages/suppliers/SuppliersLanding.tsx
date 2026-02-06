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
  Award
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { SupplierRegistrationDialog } from "@/components/suppliers/SupplierRegistrationDialog";
import supplierConcretePour from "@/assets/supplier-concrete-pour.png";
import supplierConcreteFinish from "@/assets/supplier-concrete-finish.png";

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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

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
            title: "Access Denied",
            description: "This account does not have supplier access.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
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
      title: "RFQ Requests",
      description: "Appear at the top of the supplier list when concreters request pricing.",
    },
    {
      icon: ShoppingCart,
      number: "2",
      title: "PO Issuance",
      description: "Surfaced as preferred supplier when quotes convert to purchase orders.",
    },
    {
      icon: Repeat,
      number: "3",
      title: "Repeat Orders",
      description: "Become familiar and easy to reselect for future jobs.",
    },
  ];

  const benefits = [
    {
      icon: Target,
      title: "Confirmed Intent Buyers",
      description: "Reach concreters actively quoting jobs and issuing POs — not casual browsers.",
    },
    {
      icon: Zap,
      title: "Bypass Price-Shopping",
      description: "Default positioning reduces comparison and increases conversion speed.",
    },
    {
      icon: MapPin,
      title: "Geographic Targeting",
      description: "State-based or region-based placements. Pay only for markets you service.",
    },
    {
      icon: Lock,
      title: "Category Exclusivity",
      description: "Be the only sponsored supplier in your category for a state.",
    },
    {
      icon: FileText,
      title: "Direct RFQs & POs",
      description: "Structured requests with job details — not vague emails.",
    },
    {
      icon: DollarSign,
      title: "No Commission",
      description: "No revenue share, no percentage of invoices. Pay for placement, not margin.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <span className="text-sm text-muted-foreground font-medium">Supplier Portal</span>
        </div>
      </header>

      {/* Section 1: Hero + Login */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={supplierConcretePour} 
            alt="" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/80" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Award className="h-4 w-4" />
                Preferred Supplier Placement
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                Put your brand in front of concreters at the exact moment they place orders
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Supplier selection happens inside PourHub — not via Google, cold calls, or ads. Become the default option.
              </p>
              <Button size="lg" className="gap-2" onClick={() => setShowRegistrationDialog(true)}>
                Register Interest <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Login Card */}
            <Card className="max-w-md mx-auto w-full lg:ml-auto">
              <CardHeader>
                <CardTitle>Supplier Login</CardTitle>
                <CardDescription>
                  Already a registered supplier? Sign in to your dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
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
                      "Sign In"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 2: How It Works */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground mb-6">
              PourHub is the operations platform concreters use to quote, schedule, and order materials. Your brand appears at critical moments in their workflow.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {supplierCategories.map((category, index) => (
                <span 
                  key={index} 
                  className="bg-muted text-foreground px-3 py-1.5 rounded-full text-sm font-medium border"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>

          {/* Industry image banner */}
          <div className="max-w-4xl mx-auto mb-10 rounded-xl overflow-hidden shadow-lg">
            <img 
              src={supplierConcreteFinish} 
              alt="Professional concreter finishing a slab with hand tools" 
              className="w-full h-48 md:h-64 object-cover"
            />
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {placementMoments.map((moment, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    {moment.number}
                  </div>
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <moment.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {moment.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {moment.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Why Choose PourHub */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-4">Why PourHub</h2>
            <p className="text-lg text-muted-foreground">
              Better than traditional marketing. You pay for placement and access, not margin erosion.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <benefit.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: CTA + Footer */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-primary-foreground mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Register your interest today and our team will be in touch about becoming a Preferred Supplier.
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              className="gap-2"
              onClick={() => setShowRegistrationDialog(true)}
            >
              Register Interest <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-card">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Logo />
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} PourHub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Registration Dialog */}
      <SupplierRegistrationDialog 
        open={showRegistrationDialog} 
        onOpenChange={setShowRegistrationDialog} 
      />
    </div>
  );
}
