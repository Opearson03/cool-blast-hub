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
  ShieldCheck,
  Users,
  MapPin,
  HardHat,
  CheckCircle2,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function SubcontractorsLanding() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.session) {
        const { data: isSub } = await supabase.rpc("is_subcontractor" as any, {
          _user_id: data.session.user.id,
        });

        if (isSub) {
          navigate("/sub-contractors/dashboard");
        } else {
          await supabase.auth.signOut();
          toast({
            title: "Access Denied",
            description: "This account does not have subcontractor access.",
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

  const tradeTypes = [
    "Concreter",
    "Steel Fixer",
    "Formworker",
    "Pump Operator",
    "Excavation",
    "Labourer",
  ];

  const features = [
    {
      icon: ShieldCheck,
      title: "ABN Verified Profiles",
      description: "Every subcontractor is verified against the Australian Business Register. Real trades only.",
    },
    {
      icon: Users,
      title: "Get Discovered by Builders",
      description: "Builders and concreting businesses search the directory to find verified labour for their projects.",
    },
    {
      icon: MapPin,
      title: "Location-Based Matching",
      description: "Set your service radius and base postcode so businesses in your area can find you.",
    },
    {
      icon: HardHat,
      title: "Showcase Your Trade",
      description: "List your specialisations, experience, insurance, and availability status.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <span className="text-sm text-muted-foreground font-medium">Subcontractor Directory</span>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <ShieldCheck className="h-4 w-4" />
                ABN Verified Subcontractors
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                Australia's Verified Concreting Subcontractor Network
              </h1>
              <p className="text-xl text-muted-foreground mb-6">
                Create your verified profile, showcase your trade, and get discovered by builders and concreting businesses looking for reliable labour.
              </p>
              <div className="flex flex-wrap gap-2 mb-8">
                {tradeTypes.map((trade) => (
                  <span
                    key={trade}
                    className="bg-muted text-foreground px-3 py-1.5 rounded-full text-sm font-medium border"
                  >
                    {trade}
                  </span>
                ))}
              </div>
              <Button size="lg" className="gap-2" onClick={() => navigate("/sub-contractors/signup")}>
                Create Your Profile <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Login Card */}
            <Card className="max-w-md mx-auto w-full lg:ml-auto">
              <CardHeader>
                <CardTitle>Subcontractor Login</CardTitle>
                <CardDescription>
                  Already registered? Sign in to your dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sc-email">Email</Label>
                    <Input
                      id="sc-email"
                      type="email"
                      placeholder="you@business.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sc-password">Password</Label>
                    <Input
                      id="sc-password"
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
                  <p className="text-center text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/sub-contractors/signup")}
                      className="text-primary hover:underline font-medium"
                    >
                      Create one
                    </button>
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Why Join PourHub?</h2>
            <p className="text-lg text-muted-foreground">
              Build trust with verified credentials and get found by the right businesses.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {features.map((feature, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">How It Works</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Create Account", desc: "Sign up with your email" },
              { step: "2", title: "Verify ABN", desc: "Enter your ABN — we verify it instantly" },
              { step: "3", title: "Complete Profile", desc: "Add your trade, experience & insurance" },
              { step: "4", title: "Get Discovered", desc: "Builders find you in the directory" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Ready to Get Verified?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join Australia's verified concreting subcontractor network. Free to create your profile.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="gap-2"
            onClick={() => navigate("/sub-contractors/signup")}
          >
            Create Your Profile <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-card">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <Logo />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} PourHub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
