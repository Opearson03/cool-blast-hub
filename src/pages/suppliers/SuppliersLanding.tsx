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
  CheckCircle, 
  TrendingUp, 
  ArrowRight,
  FileText,
  ShoppingCart,
  Repeat,
  Target,
  Zap,
  Globe,
  Award,
  MapPin,
  Lock,
  DollarSign,
  BarChart3,
  Clock,
  UserCheck,
  PiggyBank
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
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

  const pourhubFeatures = [
    "Quote jobs",
    "Schedule works",
    "Request supplier pricing",
    "Issue purchase orders (POs)",
    "Manage materials and compliance",
  ];

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
      title: "When a concreter requests pricing",
      description: "You appear at the top of the supplier list when they send an RFQ for concrete, reinforcement, formwork, pump hire, admixtures, testing & compliance, or consumables.",
    },
    {
      icon: ShoppingCart,
      number: "2",
      title: "When a PO is issued",
      description: "When the concreter converts a quote into a purchase order, your business is surfaced again as the preferred supplier — reinforcing choice at the point of commitment.",
    },
    {
      icon: Repeat,
      number: "3",
      title: "Inside repeat workflows",
      description: "Once a concreter uses you via PourHub, your business becomes familiar, trusted, and easy to reselect for future jobs. This creates repeat ordering behaviour, not one-off leads.",
    },
  ];

  const whyItWorks = [
    {
      icon: Target,
      title: "You reach buyers with confirmed intent",
      points: [
        "These are not website visitors",
        "Not email opens",
        "Not quote requests \"maybe later\"",
      ],
      highlight: "These are concreters actively quoting real jobs, allocating materials, and issuing POs. Every interaction is tied to a real project.",
    },
    {
      icon: Zap,
      title: "You bypass price-shopping behaviour",
      points: [
        "Reduces comparison",
        "Reduces shopping around",
        "Increases conversion speed",
      ],
      highlight: "Being visible before suppliers are compared changes buyer psychology. Default positioning works in your favour.",
    },
    {
      icon: Globe,
      title: "You capture fragmented demand",
      points: [
        "Thousands of small operators",
        "No central procurement",
        "High repeat spend",
      ],
      highlight: "Concreting is a fragmented industry. PourHub consolidates this demand inside one system.",
    },
  ];

  const supplierBenefits = [
    {
      icon: Award,
      title: "Guaranteed visibility",
      items: ["Priority placement for your category", "Highlighted branding", "\"Preferred supplier\" status"],
    },
    {
      icon: FileText,
      title: "Direct RFQs & POs",
      items: ["Structured RFQs (not vague emails)", "Clean purchase orders with job details", "Faster internal processing on your side"],
    },
    {
      icon: MapPin,
      title: "Geographic targeting",
      items: ["State-based or region-based placements", "Pay only for markets you service"],
    },
    {
      icon: Lock,
      title: "Category exclusivity (optional)",
      items: ["Be the only sponsored supplier in your category for a state", "Strong competitive moat"],
    },
  ];

  const noPayFor = [
    "No commissions on order value",
    "No revenue share",
    "No percentage of invoices",
    "No ad-tech nonsense",
  ];

  const commercialImpact = [
    { icon: TrendingUp, text: "Increased inbound RFQs" },
    { icon: BarChart3, text: "Higher PO conversion rates" },
    { icon: Clock, text: "Shorter sales cycles" },
    { icon: UserCheck, text: "More repeat customers" },
    { icon: PiggyBank, text: "Lower customer acquisition cost" },
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

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
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
                When a concreter uses PourHub, supplier selection happens inside the software — not via Google, not by cold calls, not by ads. This is where you come in.
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

      {/* What is PourHub Section */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">What is PourHub?</h2>
            <p className="text-lg text-muted-foreground">
              PourHub is a purpose-built operations platform used by professional concreting businesses across Australia.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            {pourhubFeatures.map((feature, index) => (
              <div 
                key={index} 
                className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full"
              >
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What is Preferred Supplier Placement */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">What is Preferred Supplier Placement?</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Preferred Supplier Placement gives your business priority visibility inside PourHub when concreters request quotes or issue purchase orders for materials you supply.
            </p>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
              <p className="text-foreground font-medium">
                Instead of competing for attention online, your brand appears:
              </p>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                <span className="bg-primary text-primary-foreground px-4 py-2 rounded-full font-medium">First in the supplier list</span>
                <span className="bg-primary text-primary-foreground px-4 py-2 rounded-full font-medium">Highlighted as recommended</span>
                <span className="bg-primary text-primary-foreground px-4 py-2 rounded-full font-medium">One click away from an RFQ or PO</span>
              </div>
              <p className="text-muted-foreground mt-4 italic">
                You're not interrupting a buyer — you're becoming the default option.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Where Your Brand Appears */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Where Your Brand Appears</h2>
            <p className="text-lg text-muted-foreground">
              Your placement is shown at three critical moments in the concreter's workflow.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {placementMoments.map((moment, index) => (
              <Card key={index} className="relative overflow-hidden">
                <div className="absolute top-4 right-4 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold">
                  {moment.number}
                </div>
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <moment.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3 pr-12">
                    {moment.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {moment.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Supplier Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-4">Categories We Support</h3>
          </div>
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {supplierCategories.map((category, index) => (
              <div 
                key={index} 
                className="bg-muted text-foreground px-5 py-3 rounded-lg font-medium border"
              >
                {category}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why This Works Better */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Why This Works Better Than Traditional Marketing</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {whyItWorks.map((item, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-4">
                    {item.title}
                  </h3>
                  <ul className="space-y-2 mb-4">
                    {item.points.map((point, pointIndex) => (
                      <li key={pointIndex} className="flex items-start gap-2 text-muted-foreground">
                        <span className="text-primary mt-1">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-foreground font-medium bg-primary/5 p-3 rounded-lg">
                    {item.highlight}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What Suppliers Receive */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">What Suppliers Receive</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {supplierBenefits.map((benefit, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    {benefit.title}
                  </h3>
                  <ul className="space-y-2">
                    {benefit.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What You Don't Pay For */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">What You Do NOT Pay For</h2>
            <p className="text-lg text-muted-foreground mb-8">
              You pay for placement and access, not margin erosion.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {noPayFor.map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-full font-medium"
                >
                  <DollarSign className="h-4 w-4" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Commercial Impact */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Expected Commercial Impact</h2>
            <p className="text-lg text-muted-foreground">
              Suppliers typically see significant improvements across key metrics.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 max-w-4xl mx-auto mb-8">
            {commercialImpact.map((item, index) => (
              <div 
                key={index} 
                className="flex items-center gap-3 bg-background border rounded-lg px-5 py-3"
              >
                <item.icon className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground">{item.text}</span>
              </div>
            ))}
          </div>
          <div className="max-w-xl mx-auto">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 text-center">
              <p className="text-lg font-semibold text-foreground">
                One PO can often justify a full month of placement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact-section" className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Become a Preferred Supplier?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join the network of suppliers connecting with concrete contractors across Australia.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="gap-2"
            onClick={() => setShowRegistrationDialog(true)}
          >
            <CheckCircle className="h-5 w-5" />
            Register Interest
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-card">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PourHub. All rights reserved.</p>
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
