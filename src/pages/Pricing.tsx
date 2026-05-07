import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Check,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Download,
  Calculator,
  Calendar,
  ClipboardCheck,
} from "lucide-react";
import { LandingShell } from "@/components/landing/LandingShell";
import { SEOHead } from "@/components/seo/SEOHead";
import { SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Is there a contract?",
    a: "No lock-in. Monthly plans roll month-to-month and annual plans simply renew at the end of the year — cancel anytime from your settings.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "Yes — all plans are paid and start at $99/month, so we ask for card details up front. There's no lock-in and you can cancel anytime from settings.",
  },
  {
    q: "Is there a free trial?",
    a: "We don't run a free trial — instead, every plan is month-to-month with no contract, so you can try Estimating or Pro for a single month and cancel if it's not the right fit.",
  },
  {
    q: "Can I switch between Estimating and Pro?",
    a: "Yep, upgrade or downgrade anytime from your billing settings. Changes are pro-rated automatically.",
  },
  {
    q: "Do you offer onboarding or training?",
    a: "Every paid plan includes a free 15-minute walkthrough. Enterprise customers get dedicated onboarding tailored to their workflow.",
  },
  {
    q: "Can I import my existing price list?",
    a: "Yes — you can upload a CSV or paste rates directly into your price list during onboarding, and tweak them anytime after.",
  },
  {
    q: "What payment methods do you accept?",
    a: "All major credit and debit cards via Stripe. Annual plans can also be invoiced — just get in touch.",
  },
  {
    q: "Is my data backed up and secure?",
    a: "Daily encrypted backups, hosted in Australia, with row-level access controls so your business data is only ever visible to your team.",
  },
  {
    q: "Do you support sole traders and single-user accounts?",
    a: "Absolutely — most of our customers start as sole operators. There's no minimum seat count on any plan.",
  },
  {
    q: "Can I cancel and come back later?",
    a: "Of course. Cancel in two clicks and your account stays archived. When you're ready, log back in and resubscribe — your data is right where you left it.",
  },
];

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
        title="PourHub Pricing — Estimating & Pro Plans | Concreting Software Australia"
        description="Simple paid pricing for PourHub. Estimating from $99/month or Pro from $199/month. No lock-in, cancel anytime."
        canonicalPath="/pricing"
        keywords="concreting software pricing, construction management software cost, concrete quoting software"
      />
      <LandingShell ctaHref="/signup?tier=pro" ctaLabel="Get started">
        <div className="bg-charcoal-dark text-primary-foreground">
          {/* Hero */}
          <section className="px-4 pt-16 pb-10 sm:pt-20">
            <div className="max-w-4xl mx-auto text-center">
              <span className="eyebrow">Pricing</span>
              <h1 className="font-display text-5xl sm:text-6xl font-bold leading-[1.05] mt-5">
                Simple pricing.<br />
                <span className="text-primary">No surprises.</span>
              </h1>
              <p className="mt-6 text-lg text-primary-foreground/70 max-w-2xl mx-auto">
                Plans start at $99/month. Month-to-month, no lock-in, cancel anytime.
              </p>

              {/* Trust strip */}
              <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-primary-foreground/55 uppercase tracking-wider font-medium">
                <span>No lock-in contract</span>
                <span className="text-primary/40">•</span>
                <span>Cancel anytime</span>
                <span className="text-primary/40">•</span>
                <span>Built in Australia</span>
              </div>

              {/* Monthly / Annual Toggle */}
              <div className="mt-9 inline-flex items-center gap-1 bg-charcoal/70 border border-border/40 rounded-full p-1">
                <button
                  onClick={() => setInterval("monthly")}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                    !isAnnual
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-primary-foreground/60 hover:text-primary-foreground"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setInterval("annual")}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-colors inline-flex items-center gap-2 ${
                    isAnnual
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-primary-foreground/60 hover:text-primary-foreground"
                  }`}
                >
                  Annual
                  <span className="text-[10px] uppercase tracking-wider rounded-full bg-primary-foreground/15 px-2 py-0.5">
                    Save ~16%
                  </span>
                </button>
              </div>
            </div>
          </section>

          {/* Pricing Cards */}
          <section className="px-4 pb-16">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {/* Estimating */}
              <Card className="border-border/70 bg-card/80 backdrop-blur rounded-3xl flex flex-col transition-all hover:border-primary/50 hover:-translate-y-0.5">
                <CardHeader className="text-center pb-2 pt-8">
                  <h2 className="font-display text-2xl font-semibold">{estimatingTier.name}</h2>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">For solo estimators</p>
                  <div className="mt-5 flex items-baseline justify-center">
                    <span className="font-display text-5xl font-bold text-primary">${estimatingPrice}</span>
                    <span className="text-muted-foreground ml-1">/ {isAnnual ? "year" : "month"}</span>
                  </div>
                  <div className="min-h-[1.75rem] mt-2 flex items-center justify-center">
                    {isAnnual && (
                      <span className="text-xs text-primary font-medium">Save ${estimatingSaving}/year</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 px-2">
                    {estimatingTier.description}
                  </p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="mb-4 p-2 rounded-lg bg-muted/40 text-center text-xs text-muted-foreground uppercase tracking-wider font-medium">
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
                    <Button variant="outline" className="w-full touch-target h-11" size="lg">
                      Get started
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Pro */}
              <Card className="relative border-primary/60 bg-card/90 backdrop-blur rounded-3xl shadow-lg shadow-primary/15 flex flex-col transition-all hover:-translate-y-0.5">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 backdrop-blur">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">Most popular</span>
                </div>
                <CardHeader className="text-center pb-2 pt-8">
                  <h2 className="font-display text-2xl font-semibold">{proTier.name}</h2>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">For growing crews</p>
                  <div className="mt-5 flex items-baseline justify-center">
                    <span className="font-display text-5xl font-bold text-primary">${proPrice}</span>
                    <span className="text-muted-foreground ml-1">/ {isAnnual ? "year" : "month"}</span>
                  </div>
                  <div className="min-h-[1.75rem] mt-2 flex items-center justify-center">
                    {isAnnual && (
                      <span className="text-xs text-primary font-medium">Save ${proSaving}/year</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 px-2">
                    {proTier.description}
                  </p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="mb-4 p-2 rounded-lg bg-primary/15 border border-primary/25 text-center text-xs font-semibold uppercase tracking-wider text-primary">
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
                    <Button className="w-full touch-target h-11" size="lg">
                      Get started
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Enterprise */}
              <Card className="border-border/70 bg-card/80 backdrop-blur rounded-3xl flex flex-col transition-all hover:border-primary/50 hover:-translate-y-0.5">
                <CardHeader className="text-center pb-2 pt-8">
                  <h2 className="font-display text-2xl font-semibold">Enterprise</h2>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">For commercial operations</p>
                  <div className="mt-5 flex items-baseline justify-center">
                    <span className="font-display text-5xl font-bold text-primary">Custom</span>
                  </div>
                  <div className="min-h-[1.75rem] mt-2" aria-hidden />
                  <p className="text-sm text-muted-foreground mt-2 px-2">
                    Fully custom platform for large commercial concreting companies.
                  </p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="mb-4 p-2 rounded-lg bg-muted/40 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Bespoke build
                  </div>
                  <ul className="space-y-3 flex-1">
                    {[
                      "Everything in Pro",
                      "Custom workflows",
                      "Tool & equipment logs",
                      "Plant & vehicle tracking",
                      "Multi-site scheduling",
                      "Custom integrations",
                      "Dedicated onboarding",
                      "Priority support",
                    ].map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/enterprise" className="mt-6">
                    <Button variant="outline" className="w-full touch-target h-11" size="lg">
                      Enquire now
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Risk-reversal strip */}
          <section className="px-4 py-12 border-y border-border/20 bg-charcoal/40">
            <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                {
                  icon: <CreditCard className="w-5 h-5 text-primary" />,
                  title: "Month-to-month",
                  body: "No annual contracts required. Pay monthly, cancel any time.",
                },
                {
                  icon: <ShieldCheck className="w-5 h-5 text-primary" />,
                  title: "Cancel anytime",
                  body: "Monthly plans cancel from settings in two clicks.",
                },
                {
                  icon: <Download className="w-5 h-5 text-primary" />,
                  title: "Your data stays yours",
                  body: "Export quotes, jobs and contacts to CSV anytime.",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="rounded-lg border border-primary/25 bg-primary/10 p-2 shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-base">{item.title}</h3>
                    <p className="text-sm text-primary-foreground/65 mt-0.5">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Comparison Table */}
          <section className="px-4 py-20">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-10">
                <span className="eyebrow">Compare plans</span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold mt-4">
                  See exactly what's included.
                </h2>
              </div>
              <div className="rounded-2xl border border-border/40 overflow-hidden bg-card/40 backdrop-blur">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-charcoal/60 border-b border-border/40">
                        <th className="text-left py-4 px-4 text-muted-foreground font-medium">Feature</th>
                        <th className="text-center py-4 px-4 font-display font-semibold">Estimating</th>
                        <th className="text-center py-4 px-4 font-display font-semibold text-primary">Pro</th>
                        <th className="text-center py-4 px-4 font-display font-semibold text-primary">Enterprise</th>
                      </tr>
                    </thead>
                    <tbody className="text-primary-foreground/85">
                      {[
                        ["Quotes per month", "Unlimited", "Unlimited", "Unlimited"],
                        ["Professional PDFs", true, true, true],
                        ["Quote signing", true, true, true],
                        ["Email delivery", true, true, true],
                        ["Job management", false, true, true],
                        ["Scheduling", false, true, "Multi-site"],
                        ["Test result tracking", false, true, true],
                        ["Tool & equipment logs", false, false, true],
                        ["Plant & vehicle tracking", false, false, true],
                        ["Custom integrations", false, false, true],
                        ["Dedicated onboarding", false, false, true],
                        ["Priority support", true, true, true],
                      ].map((row, i) => (
                        <tr
                          key={i}
                          className="border-b border-border/30 last:border-0 hover:bg-charcoal/40 transition-colors"
                        >
                          <td className="py-3 px-4">{row[0]}</td>
                          {[1, 2, 3].map((col) => {
                            const v = row[col];
                            return (
                              <td key={col} className="text-center py-3 px-4">
                                {v === true ? (
                                  <Check className="w-4 h-4 text-primary mx-auto" />
                                ) : v === false ? (
                                  <span className="text-muted-foreground">—</span>
                                ) : (
                                  <span>{v as string}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          {/* What you get on day one */}
          <section className="px-4 py-20 border-t border-border/20 bg-charcoal/40">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <span className="eyebrow">Day one</span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold mt-4">
                  What you get the moment you sign up.
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  {
                    icon: <Calculator className="w-5 h-5 text-primary" />,
                    title: "Quote in minutes",
                    body: "Modular calculators handle the maths — pick a scope, punch in dimensions, send.",
                  },
                  {
                    icon: <Calendar className="w-5 h-5 text-primary" />,
                    title: "Schedule the week",
                    body: "Drag-and-drop pours across crews, with conflict warnings built in.",
                  },
                  {
                    icon: <ClipboardCheck className="w-5 h-5 text-primary" />,
                    title: "Track every test",
                    body: "MPa, slump and supplier dockets matched to pours automatically.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur p-6"
                  >
                    <div className="rounded-lg border border-primary/25 bg-primary/10 p-2 inline-flex">
                      {item.icon}
                    </div>
                    <h3 className="font-display font-semibold text-lg mt-4">{item.title}</h3>
                    <p className="text-sm text-primary-foreground/65 mt-2">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="px-4 py-20">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-10">
                <span className="eyebrow">Questions?</span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold mt-4">
                  Common questions, straight answers.
                </h2>
              </div>
              <Accordion type="single" collapsible className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur divide-y divide-border/30">
                {FAQS.map((item, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border-0 px-5">
                    <AccordionTrigger className="text-left font-display font-semibold text-base hover:no-underline py-5">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-primary-foreground/70 text-sm pb-5">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>

          {/* Still deciding */}
          <section className="px-4 py-16 border-t border-border/20 bg-charcoal/40">
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-primary-foreground/70 mb-6">
                Free forever on the starter plan. Upgrade in 30 seconds when you're ready.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/signup?tier=pro">
                  <Button size="lg" className="h-12 px-7 touch-target font-medium">
                    Start free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/bookings">
                  <Button size="lg" variant="outline" className="h-12 px-7 touch-target font-medium border-primary/40 text-primary-foreground hover:bg-primary/10">
                    Book a 15-min walkthrough
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section className="bg-primary px-4 py-16">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground">
                Ready to quote your next job?
              </h2>
              <p className="text-primary-foreground/85 mt-3">
                Join Aussie concreters running calmer, faster operations on PourHub.
              </p>
              <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/signup?tier=pro">
                  <Button size="lg" variant="secondary" className="h-12 px-7 touch-target font-medium">
                    Start free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/">
                  <Button size="lg" variant="outline" className="h-12 px-7 touch-target font-medium bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10">
                    <ArrowLeft className="mr-2 w-5 h-5" />
                    Back to home
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </LandingShell>
    </>
  );
};

export default Pricing;
