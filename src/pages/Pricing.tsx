import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { SEOHead } from "@/components/seo/SEOHead";
import { SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers";

const Pricing = () => {
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly");
  const estimatingTier = SUBSCRIPTION_TIERS.estimating;
  const proTier = SUBSCRIPTION_TIERS.pro;

  const isAnnual = interval === "annual";
  const estimatingPrice = isAnnual ? estimatingTier.annual_price : estimatingTier.price;
  const proPrice = isAnnual ? proTier.annual_price : proTier.price;
  const estimatingSaving = estimatingTier.price * 12 - estimatingTier.annual_price;
  const proSaving = proTier.price * 12 - proTier.annual_price;

  return (
    <>
      <SEOHead
        title="PourHub Pricing - Estimating & Pro Plans | Concreting Software Australia"
        description="Simple pricing for PourHub concreting business management software. Estimating at $99/month or Pro for $199/month. Choose the plan that fits your business."
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
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Choose the plan that fits your business.
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="inline-flex items-center gap-1 bg-muted/30 rounded-full p-1">
              <button
                onClick={() => setInterval("monthly")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                  !isAnnual
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-primary-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setInterval("annual")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                  isAnnual
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-primary-foreground"
                }`}
              >
                Annual
                <Badge variant="secondary" className="ml-2 text-xs">Save</Badge>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="px-4 pb-20">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Estimating Tier */}
            <Card className="border-border">
              <CardHeader className="text-center pb-2">
                <h2 className="text-2xl font-bold">{estimatingTier.name}</h2>
                <div className="mt-4">
                  <span className="text-5xl font-bold text-primary">${estimatingPrice}</span>
                  <span className="text-muted-foreground"> / {isAnnual ? "year" : "month"}</span>
                </div>
                {isAnnual && (
                  <Badge variant="secondary" className="mt-2">
                    Save ${estimatingSaving}/year
                  </Badge>
                )}
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
                <Link to={`/signup?tier=estimating${isAnnual ? "&interval=annual" : ""}`} className="mt-6">
                  <Button variant="outline" className="w-full touch-target" size="lg">
                    Get Started
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
                  <span className="text-5xl font-bold text-primary">${proPrice}</span>
                  <span className="text-muted-foreground"> / {isAnnual ? "year" : "month"}</span>
                </div>
                {isAnnual && (
                  <Badge variant="secondary" className="mt-2">
                    Save ${proSaving}/year
                  </Badge>
                )}
                <p className="text-sm text-muted-foreground mt-3">
                  {proTier.description}
                </p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="mb-4 p-2 bg-primary/20 rounded text-center text-sm font-medium text-primary">
                  Full app access
                </div>
                <ul className="space-y-3 flex-1">
                  {proTier.features.slice(0, 8).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                  {proTier.features.length > 8 && (
                    <li className="text-sm text-muted-foreground pl-8">
                      + {proTier.features.length - 8} more features
                    </li>
                  )}
                </ul>
                <Link to={`/signup?tier=pro${isAnnual ? "&interval=annual" : ""}`} className="mt-6">
                  <Button className="w-full touch-target" size="lg">
                    Get Started
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-charcoal py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-primary-foreground">
              Compare Plans
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted-foreground">Feature</th>
                    <th className="text-center py-3 px-4">Estimating</th>
                    <th className="text-center py-3 px-4 text-primary">Pro</th>
                  </tr>
                </thead>
                <tbody className="text-primary-foreground">
                  <tr className="border-b border-border/50">
                    <td className="py-3 px-4">Quotes per month</td>
                    <td className="text-center py-3 px-4">Unlimited</td>
                    <td className="text-center py-3 px-4">Unlimited</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 px-4">Professional PDFs</td>
                    <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-primary mx-auto" /></td>
                    <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-primary mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 px-4">Quote signing</td>
                    <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-primary mx-auto" /></td>
                    <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-primary mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 px-4">Email delivery</td>
                    <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-primary mx-auto" /></td>
                    <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-primary mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 px-4">Job management</td>
                    <td className="text-center py-3 px-4 text-muted-foreground">—</td>
                    <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-primary mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 px-4">Scheduling</td>
                    <td className="text-center py-3 px-4 text-muted-foreground">—</td>
                    <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-primary mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 px-4">Test result tracking</td>
                    <td className="text-center py-3 px-4 text-muted-foreground">—</td>
                    <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-primary mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 px-4">Priority support</td>
                    <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-primary mx-auto" /></td>
                    <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-primary mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Value Props */}
        <div className="bg-background py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
              Why Concreters Choose <span className="text-primary">PourHub</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">$199</div>
                <p className="text-muted-foreground">Less than 2 hours of labour per month</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">100%</div>
                <p className="text-muted-foreground">Digital compliance documentation</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">0</div>
                <p className="text-muted-foreground">Missed test results</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-primary py-16 px-4">
          <div className="max-w-xl mx-auto text-center">
            <h3 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-primary-foreground/90 mb-8">
              Join hundreds of concreters already using PourHub to run their business smarter.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/signup">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6 touch-target">
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
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
