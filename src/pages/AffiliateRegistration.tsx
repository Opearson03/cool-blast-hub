import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, CheckCircle, DollarSign, Users, TrendingUp } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { SEOHead } from "@/components/seo/SEOHead";

export default function AffiliateRegistration() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [affiliateCode, setAffiliateCode] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc("register_affiliate", {
        _email: email,
        _full_name: fullName,
        _instagram_handle: instagramHandle || null,
      });

      if (error) throw error;

      const result = data as any;
      if (result?.error === "already_registered") {
        toast({
          title: "Already Registered",
          description: "This email is already registered as an affiliate.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      setAffiliateCode(result.affiliate_code);
      setSubmitted(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-charcoal-dark">
        <SEOHead title="Affiliate Application Submitted | PourHub" description="Your affiliate application has been submitted." />
        <div className="p-4">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <CardTitle>Application Submitted!</CardTitle>
              <CardDescription>
                We'll review your application and get back to you within 24-48 hours.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Your affiliate code</p>
                <p className="text-2xl font-mono font-bold text-primary">{affiliateCode}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  This will be activated once your application is approved.
                </p>
              </div>
              <Link to="/">
                <Button variant="outline" className="w-full">Back to Home</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-charcoal-dark">
      <SEOHead
        title="Become a PourHub Affiliate | Earn Commissions"
        description="Join the PourHub affiliate program. Earn 10% commission for 10 months on every referral."
      />
      <div className="p-4">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Benefits */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Logo size="lg" className="rounded-lg" />
                <span className="text-2xl font-bold">
                  Pour<span className="text-primary">Hub</span>
                </span>
              </div>
              <h1 className="text-3xl font-bold mt-4">Affiliate Program</h1>
              <p className="text-muted-foreground mt-2">
                Earn recurring commissions by referring concreters to PourHub.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-card/50">
                <DollarSign className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold">10% Commission</h3>
                  <p className="text-sm text-muted-foreground">
                    Earn 10% of each referral's monthly subscription for 10 months.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-card/50">
                <Users className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Your Followers Save 50%</h3>
                  <p className="text-sm text-muted-foreground">
                    Anyone signing up with your link gets 50% off their first 2 months.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-card/50">
                <TrendingUp className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Track Everything</h3>
                  <p className="text-sm text-muted-foreground">
                    Dashboard to track your referrals, earnings, and payouts.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm font-medium text-primary">Example earnings</p>
              <p className="text-sm text-muted-foreground mt-1">
                Refer 10 PourHub Pro subscribers ($240/mo) → Earn <span className="font-semibold text-foreground">$2,400</span> over 10 months.
              </p>
            </div>
          </div>

          {/* Registration Form */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Apply to be an Affiliate</CardTitle>
              <CardDescription>We'll review your application within 24-48 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram Handle (optional)</Label>
                  <Input
                    id="instagram"
                    value={instagramHandle}
                    onChange={(e) => setInstagramHandle(e.target.value)}
                    placeholder="@yourhandle"
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Application
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
