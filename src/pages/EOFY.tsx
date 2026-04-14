import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Zap, Clock, Shield } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { SEOHead } from "@/components/seo/SEOHead";
import { SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers";

const EOFY = () => {
  const estimatingTier = SUBSCRIPTION_TIERS.estimating;
  const proTier = SUBSCRIPTION_TIERS.pro;

  const estimatingMonthlyTotal = estimatingTier.price * 12;
  const proMonthlyTotal = proTier.price * 12;
  const estimatingSaving = estimatingMonthlyTotal - estimatingTier.annual_price;
  const proSaving = proMonthlyTotal - proTier.annual_price;

  return (
    <>
      <SEOHead
        title="EOFY Sale - Save on PourHub Annual Plans | Concreting Software"
        description="End of Financial Year Sale on PourHub annual plans. Save up to $389/year on concreting business management software. Lock in your rate before June 30."
        canonicalPath="/eofy"
        keywords="EOFY sale concreting software, end of financial year construction software, PourHub annual plan discount"
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
        <div className="px-4 py-16 sm:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 px-4 py-2 text-sm font-semibold bg-destructive text-destructive-foreground">
              🔥 EOFY SALE — LIMITED TIME
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-bold text-primary-foreground mb-6">
              End of Financial Year <span className="text-primary">Sale</span>
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto mb-4">
              Lock in your annual rate before June 30 and save up to <span className="text-primary font-semibold">${proSaving}</span> per year.
            </p>
            <p className="text-sm text-muted-foreground">
              Pay annually and get your concreting business sorted for the new financial year.
            </p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="px-4 pb-20">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Estimating Tier */}
            <Card className="border-border relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-primary/50" />
              <CardHeader className="text-center pb-2">
                <Badge variant="outline" className="mx-auto mb-3 text-xs">EOFY DEAL</Badge>
                <h2 className="text-2xl font-bold">{estimatingTier.name}</h2>
                <div className="mt-4">
                  <div className="text-muted-foreground line-through text-lg mb-1">
                    ${estimatingMonthlyTotal}/yr at monthly rates
                  </div>
                  <span className="text-5xl font-bold text-primary">${estimatingTier.annual_price}</span>
                  <span className="text-muted-foreground"> / year</span>
                </div>
                <Badge variant="secondary" className="mt-3 bg-green-500/20 text-green-400 border-green-500/30">
                  Save ${estimatingSaving}/year
                </Badge>
                <p className="text-sm text-muted-foreground mt-3">
                  {estimatingTier.description}
                </p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="mb-4 p-2 bg-muted/50 rounded text-center text-sm text-muted-foreground">
                  Quotes page only
                </div>
                <ul className="space-y-3 flex-1">
                  {estimatingTier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup?tier=estimating&interval=annual" className="mt-6">
                  <Button variant="outline" className="w-full touch-target" size="lg">
                    Get Started — ${estimatingTier.annual_price}/yr
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro Tier */}
            <Card className="relative border-primary shadow-lg shadow-primary/20 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
              <Badge className="absolute top-4 right-4 bg-destructive text-destructive-foreground text-xs">
                BEST VALUE
              </Badge>
              <CardHeader className="text-center pb-2 pt-8">
                <Badge variant="outline" className="mx-auto mb-3 text-xs">EOFY DEAL</Badge>
                <h2 className="text-2xl font-bold">{proTier.name}</h2>
                <div className="mt-4">
                  <div className="text-muted-foreground line-through text-lg mb-1">
                    ${proMonthlyTotal}/yr at monthly rates
                  </div>
                  <span className="text-5xl font-bold text-primary">${proTier.annual_price}</span>
                  <span className="text-muted-foreground"> / year</span>
                </div>
                <Badge variant="secondary" className="mt-3 bg-green-500/20 text-green-400 border-green-500/30">
                  Save ${proSaving}/year
                </Badge>
                <p className="text-sm text-muted-foreground mt-3">
                  {proTier.description}
                </p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="mb-4 p-2 bg-primary/20 rounded text-center text-sm font-medium text-primary">
                  Full app access
                </div>
                <ul className="space-y-3 flex-1">
                  {proTier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup?tier=pro&interval=annual" className="mt-6">
                  <Button className="w-full touch-target" size="lg">
                    Get Started — ${proTier.annual_price}/yr
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
              Why Go Annual?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-primary-foreground">Save Up To ${proSaving}</h3>
                <p className="text-sm text-muted-foreground">Pay once, save for the whole year vs monthly billing.</p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-primary-foreground">Set & Forget</h3>
                <p className="text-sm text-muted-foreground">One payment, 12 months of access. No monthly invoices to worry about.</p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-primary-foreground">Price Lock</h3>
                <p className="text-sm text-muted-foreground">Lock in today's rate for the entire year — guaranteed.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-primary py-16 px-4">
          <div className="max-w-xl mx-auto text-center">
            <h3 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-4">
              Don't Miss Out — EOFY Sale Ends June 30
            </h3>
            <p className="text-primary-foreground/90 mb-8">
              Start the new financial year with the right tools to run your concreting business.
            </p>
            <Link to="/signup?tier=pro&interval=annual">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6 touch-target">
                Get PourHub Pro — ${proTier.annual_price}/yr
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
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
              <Link to="/pricing" className="text-muted-foreground hover:text-primary transition-colors">
                All Plans
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default EOFY;
