import { useLandingTracker } from "@/hooks/useLandingTracker";
import { LandingShell } from "@/components/landing/LandingShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead } from "@/components/seo/SEOHead";
import { ArrowRight, Clock, Zap, Calculator, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-concrete-pour.jpg";

export default function LandingA() {
  const { trackCTA } = useLandingTracker("a");
  // Variant A: Try it now → straight to signup → Stripe checkout (Estimating, $99/mo)
  const ctaHref = "/signup?tier=estimating&interval=monthly&variant=a";
  const ctaLabel = "Try it now — $99/mo";

  return (
    <>
      <SEOHead
        title="Quote a Concrete Slab in 10 Minutes | PourHub"
        description="Stop losing nights to quoting. PourHub's takeoff and pricing engine builds detailed concrete quotes in minutes — not hours."
        canonicalPath="/lp/a"
      />
      <LandingShell ctaHref={ctaHref} ctaLabel="Try it now" onCtaClick={() => trackCTA("header")}>
        {/* Hero with concreting background */}
        <section
          className="relative py-20 md:py-32 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})` }}
        >
          <div className="absolute inset-0 bg-black/65" aria-hidden />
          <div className="container relative mx-auto px-4 max-w-4xl text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-white/20">
              <Zap className="h-4 w-4" /> Built for concreters
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
              Quote a slab in <span className="text-primary">10 minutes</span>.
              <br />Not 3 hours.
            </h1>
            <p className="text-xl md:text-2xl text-white/85 mb-8 max-w-2xl mx-auto">
              Drop a plan, click your areas, get a fully-priced concrete quote ready to send. No spreadsheets. No guesswork.
            </p>
            <Button size="lg" asChild className="h-14 px-8 text-base" onClick={() => trackCTA("hero")}>
              <Link to={ctaHref}>
                {ctaLabel} <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <p className="text-sm text-white/70 mt-4">Cancel anytime • Monthly or annual</p>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Clock, title: "Save 5+ hours per quote", desc: "On-screen takeoff replaces graph paper, calculators, and back-of-the-envelope maths." },
                { icon: Calculator, title: "Australian price list built in", desc: "Concrete, mesh, formwork, labour — all priced per region. Tweak once, use forever." },
                { icon: CheckCircle2, title: "Nothing forgotten", desc: "Pumping, pods, joints, sundries — every line item prompted so margin doesn't leak." },
              ].map((b, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <b.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{b.title}</h3>
                    <p className="text-sm text-muted-foreground">{b.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Social proof */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <blockquote className="text-2xl md:text-3xl font-medium leading-snug mb-4">
              “I used to lose every Sunday night quoting. Now I knock them out before smoko.”
            </blockquote>
            <p className="text-sm text-muted-foreground">— Concreter, NSW</p>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="py-20 bg-primary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Get your weekends back.
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              $99/mo. Cancel anytime. Be quoting in under 5 minutes.
            </p>
            <Button size="lg" variant="secondary" asChild className="h-14 px-8" onClick={() => trackCTA("footer")}>
              <Link to={ctaHref}>
                {ctaLabel} <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </LandingShell>
    </>
  );
}
