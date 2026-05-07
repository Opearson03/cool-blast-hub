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
} from "lucide-react";
import { LandingShell } from "@/components/landing/LandingShell";
import { SEOHead } from "@/components/seo/SEOHead";

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
            title: "Access denied",
            description: "This account does not have subcontractor access.",
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
      title: "ABN-verified profiles",
      description: "Every subcontractor is verified against the Australian Business Register. Real trades only.",
    },
    {
      icon: Users,
      title: "Get discovered by builders",
      description: "Builders and concreting businesses search the directory to find verified labour for their projects.",
    },
    {
      icon: MapPin,
      title: "Location-based matching",
      description: "Set your service radius and base postcode so businesses in your area can find you.",
    },
    {
      icon: HardHat,
      title: "Showcase your trade",
      description: "List your specialisations, experience, insurance and availability status.",
    },
  ];

  return (
    <>
      <SEOHead
        title="Concreting Subcontractor Directory | PourHub"
        description="Australia's ABN-verified directory of concreters, steel fixers, formworkers, pump operators and labourers. Create your free profile and get discovered by builders."
        canonicalPath="/sub-contractors"
      />
      <LandingShell ctaHref="/sub-contractors/signup" ctaLabel="Create profile">
        <div className="bg-charcoal-dark text-primary-foreground">
          {/* Hero + Login */}
          <section className="px-4 pt-16 pb-20 sm:pt-20">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="eyebrow">For subbies</span>
                <h1 className="font-display text-4xl md:text-5xl font-bold leading-[1.05] mt-5">
                  Australia's verified concreting<br />
                  <span className="text-primary">subcontractor network.</span>
                </h1>
                <p className="mt-6 text-lg text-primary-foreground/70 max-w-xl">
                  Create your verified profile, showcase your trade and get discovered by builders and concreting businesses looking for reliable labour.
                </p>
                <div className="mt-7 flex flex-wrap gap-2">
                  {tradeTypes.map((trade) => (
                    <span
                      key={trade}
                      className="rounded-full border border-border/40 bg-charcoal/60 px-3 py-1.5 text-xs text-primary-foreground/80"
                    >
                      {trade}
                    </span>
                  ))}
                </div>
                <div className="mt-8">
                  <Button size="lg" className="h-12 px-7 touch-target font-medium" onClick={() => navigate("/sub-contractors/signup")}>
                    Create your profile
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Login card */}
              <Card className="w-full max-w-md mx-auto lg:ml-auto rounded-2xl border-border/50 bg-card/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="font-display">Subcontractor login</CardTitle>
                  <CardDescription>Already registered? Sign in to your dashboard.</CardDescription>
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
                        "Sign in"
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
          </section>

          {/* Features */}
          <section className="px-4 py-20 border-t border-border/20 bg-charcoal/40">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <span className="eyebrow">Why join</span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold mt-4">
                  Build trust. Get found.
                </h2>
                <p className="text-primary-foreground/65 mt-3 max-w-2xl mx-auto">
                  Verified credentials and location matching that put you in front of the right businesses.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur p-6"
                  >
                    <div className="rounded-lg border border-primary/25 bg-primary/10 p-2 inline-flex">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-lg mt-4">{feature.title}</h3>
                    <p className="text-sm text-primary-foreground/65 mt-2">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How it works */}
          <section className="px-4 py-20">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <span className="eyebrow">How it works</span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold mt-4">
                  From signup to discovered in four steps.
                </h2>
              </div>
              <div className="grid md:grid-cols-4 gap-6">
                {[
                  { step: "1", title: "Create account", desc: "Sign up with your email" },
                  { step: "2", title: "Verify ABN", desc: "Enter your ABN — we verify it instantly" },
                  { step: "3", title: "Complete profile", desc: "Add your trade, experience & insurance" },
                  { step: "4", title: "Get discovered", desc: "Builders find you in the directory" },
                ].map((item) => (
                  <div key={item.step} className="text-center">
                    <div className="w-12 h-12 bg-primary/15 border border-primary/30 text-primary rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-display font-bold">
                      {item.step}
                    </div>
                    <h3 className="font-display font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-primary-foreground/65">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-primary px-4 py-16">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground">
                Ready to get verified?
              </h2>
              <p className="text-primary-foreground/85 mt-3">
                Join Australia's verified concreting subcontractor network. Free to create your profile.
              </p>
              <div className="mt-7">
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-12 px-7 touch-target font-medium"
                  onClick={() => navigate("/sub-contractors/signup")}
                >
                  Create your profile
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </section>
        </div>
      </LandingShell>
    </>
  );
}
