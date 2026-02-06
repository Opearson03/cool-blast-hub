import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, TrendingUp, Users, Shield, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function SuppliersLanding() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
        // Check if user has supplier role
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

  const benefits = [
    {
      icon: Users,
      title: "Reach More Concreters",
      description: "Get your business in front of hundreds of concrete contractors actively looking for suppliers.",
    },
    {
      icon: TrendingUp,
      title: "Receive Quote Requests",
      description: "Get notified when contractors in your area need materials or services you provide.",
    },
    {
      icon: Shield,
      title: "Verified Badge",
      description: "Stand out with a verified supplier badge that builds trust with potential customers.",
    },
  ];

  const steps = [
    { step: 1, title: "Register", description: "Sign up and create your supplier profile" },
    { step: 2, title: "Get Verified", description: "Our team reviews and verifies your business" },
    { step: 3, title: "Receive Leads", description: "Start receiving quote requests from contractors" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <span className="text-sm text-muted-foreground">Supplier Portal</span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Reach More Concreters with PourHub
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Join Australia's growing network of concrete suppliers. Connect with contractors, 
                receive quote requests, and grow your business.
              </p>
              <Button size="lg" className="gap-2" onClick={() => {
                toast({
                  title: "Coming Soon",
                  description: "Supplier registration will be available soon. Contact us to express interest.",
                });
              }}>
                Register Interest <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Login Card */}
            <Card className="max-w-md mx-auto w-full">
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

      {/* Benefits Section */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Why Advertise on PourHub?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Grow Your Business?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join the network of suppliers connecting with concrete contractors across Australia.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="gap-2"
            onClick={() => {
              toast({
                title: "Coming Soon",
                description: "Supplier registration will be available soon. Contact us to express interest.",
              });
            }}
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
    </div>
  );
}
