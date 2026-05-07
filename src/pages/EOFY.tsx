import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Zap, Clock, Shield } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { LandingShell } from "@/components/landing/LandingShell";
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
      <LandingShell
        ctaHref="/signup?tier=pro&interval=annual"
        ctaLabel={`Get EOFY deal — $${proTier.annual_price}/yr`}
      >
        <div className="bg-charcoal-dark">
          {/* Hero */}
          <section className="px-4 py-16 sm:py-24">
            <div className="max-w-4xl mx-auto text-center">
              <span className="eyebrow text-primary inline-block mb-6">
                EOFY sale — limited time
              </span>
              <h1 className="font-display text-4xl sm:text-6xl font-bold text-primary-foreground mb-6">
                End of Financial Year <span className="text-primary">Sale</span>
              </h1>
              <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto mb-4">
                Lock in your annual rate before June 30 and save up to{" "}
                <span className="text-primary font-semibold">${proSaving}</span> per year.
              </p>
              <p className="text-sm text-muted-foreground">
                Pay annually and get your concreting business sorted for the new financial year.
              </p>
            </div>
          </section>

          {/* Pricing Cards */}
          <section className="px-4 pb-20">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Estimating Tier */}
              <Card className="border-border relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-primary/50" />
                <CardHeader className="text-center pb-2">
                  <Badge variant="outline" className="mx-auto mb-3 text-xs">EOFY DEAL</Badge>
                  <h2 className="font-display text-2xl font-bold">{estimatingTier.name}</h2>
                  <div className="mt-4">
                    <div className="text-muted-foreground line-through text-lg mb-1">
                      ${estimatingMonthlyTotal}/yr at monthly rates
                    </div>
                    <span className="font-display text-5xl font-bold text-primary">${estimatingTier.annual_price}</span>
                    <span className="text-muted-foreground"> / year</span>
                  </div>
                  <Badge variant="secondary" className="mt-3">
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
                  <h2 className="font-display text-2xl font-bold">{proTier.name}</h2>
                  <div className="mt-4">
                    <div className="text-muted-foreground line-through text-lg mb-1">
                      ${proMonthlyTotal}/yr at monthly rates
                    </div>
                    <span className="font-display text-5xl font-bold text-primary">${proTier.annual_price}</span>
                    <span className="text-muted-foreground"> / year</span>
                  </div>
                  <Badge variant="secondary" className="mt-3">
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
          </section>

          {/* Tax Deduction Callout */}
          <section className="bg-charcoal py-16 px-4">
            <div className="max-w-3xl mx-auto text-center">
              <span className="eyebrow text-primary inline-block mb-6">
                Tax deduction
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-primary-foreground mb-4">
                Claim it as a business expense
              </h2>
              <p className="text-lg text-muted-foreground mb-3">
                PourHub is a <span className="text-primary font-semibold">100% tax-deductible business expense</span>. Pay before June 30 and claim the full amount on this year's tax return.
              </p>
              <p className="text-muted-foreground mb-8">
                An annual plan means a bigger upfront deduction — bring forward 12 months of software costs into this financial year instead of claiming month-by-month.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto text-left">
                <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                  <p className="text-sm text-muted-foreground mb-1">Estimating — claim up to</p>
                  <p className="font-display text-2xl font-bold text-primary">${estimatingTier.annual_price}</p>
                  <p className="text-xs text-muted-foreground mt-1">as a deduction this FY</p>
                </div>
                <div className="bg-background/50 rounded-lg p-4 border border-primary/30">
                  <p className="text-sm text-muted-foreground mb-1">Pro — claim up to</p>
                  <p className="font-display text-2xl font-bold text-primary">${proTier.annual_price}</p>
                  <p className="text-xs text-muted-foreground mt-1">as a deduction this FY</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-6 italic">
                *Consult your accountant for advice specific to your situation. PourHub does not provide tax advice.
              </p>
            </div>
          </section>

          {/* Value Props */}
          <section className="bg-charcoal-dark py-16 px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-12 text-primary-foreground">
                Why go annual?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-primary-foreground">Save up to ${proSaving}</h3>
                  <p className="text-sm text-muted-foreground">Pay once, save for the whole year vs monthly billing.</p>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-primary-foreground">Set & forget</h3>
                  <p className="text-sm text-muted-foreground">One payment, 12 months of access. No monthly invoices to worry about.</p>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-primary-foreground">Price lock</h3>
                  <p className="text-sm text-muted-foreground">Lock in today's rate for the entire year — guaranteed.</p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-primary py-16 px-4">
            <div className="max-w-xl mx-auto text-center">
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-primary-foreground mb-4">
                Don't miss out — EOFY sale ends June 30
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
          </section>
        </div>
      </LandingShell>
    </>
  );
};

export default EOFY;
