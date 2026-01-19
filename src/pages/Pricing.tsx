import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, ArrowLeft, Users } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { SEOHead } from "@/components/seo/SEOHead";
import { SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";
import { useWaitlistCount } from "@/hooks/useWaitlistCount";

const Pricing = () => {
  const freeTier = SUBSCRIPTION_TIERS.free;
  const proTier = SUBSCRIPTION_TIERS.standard;
  const { data: waitlistCount = 0 } = useWaitlistCount();

  return (
    <>
      <SEOHead
        title="PourHub Pricing - Free & Pro Plans | Concreting Software Australia"
        description="Simple pricing for PourHub concreting business management software. Start free with 1 quote/month or go Pro for $100/month with unlimited quotes."
        canonicalPath="/pricing"
        keywords="concreting software pricing, construction management software cost, concrete quoting software"
      />
      <div className="min-h-screen bg-charcoal-dark">
        {/* Header */}
        <header className="px-4 py-6 border-b border-border/30">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Logo size="lg" className="rounded-lg" />
              <span className="text-2xl font-bold text-primary-foreground">
                Pour<span className="text-primary">Hub</span>
              </span>
            </Link>
            <Link to="/auth">
              <Button variant="outline" className="touch-target border-primary-foreground/50 text-primary-foreground bg-primary-foreground/10 hover:bg-primary-foreground/20">
                Sign In
              </Button>
            </Link>
          </div>
        </header>

        {/* Hero */}
        <div className="px-4 py-16 sm:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-primary-foreground mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
              Start free with 1 quote per month. Full job management included.
            </p>
            {/* Waitlist Counter */}
            <div className="flex items-center justify-center gap-3 bg-primary/20 rounded-lg px-4 py-3 w-fit mx-auto">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-primary-foreground font-medium">
                <span className="text-primary font-bold">{waitlistCount}</span> concreters on the waiting list
              </span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="px-4 pb-20">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free Tier */}
            <Card className="border-border">
              <CardHeader className="text-center pb-2">
                <h2 className="text-2xl font-bold">{freeTier.name}</h2>
                <div className="mt-4">
                  <span className="text-5xl font-bold text-primary">$0</span>
                  <span className="text-muted-foreground"> / month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  {freeTier.description}
                </p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 flex-1">
                  {freeTier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/" className="mt-6">
                  <Button variant="outline" className="w-full touch-target" size="lg">
                    Join Waiting List
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro Tier */}
            <Card className="relative border-primary shadow-lg shadow-primary/20">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1">
                Most Popular
              </Badge>
              <CardHeader className="text-center pb-2">
                <h2 className="text-2xl font-bold">{proTier.name}</h2>
                <div className="mt-4">
                  <span className="text-5xl font-bold text-primary">${proTier.price}</span>
                  <span className="text-muted-foreground"> / month</span>
                </div>
                <div className="mt-2">
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                    One month free trial
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  {proTier.description}
                </p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 flex-1">
                  {proTier.features.slice(0, 10).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                  {proTier.features.length > 10 && (
                    <li className="text-sm text-muted-foreground pl-8">
                      + {proTier.features.length - 10} more features
                    </li>
                  )}
                </ul>
                <Link to="/" className="mt-6">
                  <Button className="w-full touch-target" size="lg">
                    Join Waiting List
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Value Props */}
        <div className="bg-charcoal py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-primary-foreground">
              Why Concreters Choose <span className="text-primary">PourHub</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">$100</div>
                <p className="text-primary-foreground/90">Less than 1 hour of labour per month</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">100%</div>
                <p className="text-primary-foreground/90">Digital compliance documentation</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">0</div>
                <p className="text-primary-foreground/90">Missed test results</p>
              </div>
            </div>
          </div>
        </div>

        {/* Value Explanation */}
        <div className="bg-background py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Start Free, Upgrade Anytime</h2>
            <div className="bg-card border border-border rounded-lg p-6">
              <p className="text-muted-foreground text-center">
                Try PourHub with 1 free quote per month and full access to job management. 
                When you're ready to scale, upgrade to Pro for unlimited quotes and priority support.
                No commitment required—upgrade only when it makes sense for your business.
              </p>
            </div>
          </div>
        </div>

        {/* CTA with Waitlist Form */}
        <div className="bg-primary py-16 px-4">
          <div className="max-w-xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-4 text-center">
              Join the Waiting List
            </h3>
            <p className="text-primary-foreground/90 mb-8 text-center">
              Be first in line when PourHub launches. We'll notify you as soon as you can get started.
            </p>
            <div className="bg-charcoal/50 backdrop-blur-sm border border-border/30 rounded-xl p-6">
              <WaitlistForm />
            </div>
            <div className="mt-6 text-center">
              <Link to="/">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 touch-target bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  <ArrowLeft className="mr-2 w-5 h-5" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-charcoal-dark py-8 px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <p className="text-muted-foreground text-sm mb-4">
              © {new Date().getFullYear()} PourHub. Operations management for NSW concreting businesses.
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                Terms & Conditions
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                Home
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Pricing;
