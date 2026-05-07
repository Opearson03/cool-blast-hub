import { useLandingTracker } from "@/hooks/useLandingTracker";
import { LandingShell } from "@/components/landing/LandingShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead } from "@/components/seo/SEOHead";
import { ArrowRight, Clock, Zap, Calculator, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function LandingA() {
  const { trackCTA } = useLandingTracker("a");
  const ctaHref = "/pricing?variant=a";

  return (
    <>
      <SEOHead
        title="Quote a Concrete Slab in 10 Minutes | PourHub"
        description="Stop losing nights to quoting. PourHub's takeoff and pricing engine builds detailed concrete quotes in minutes — not hours."
        canonicalPath="/lp/a"
      />
      <LandingShell ctaHref={ctaHref} onCtaClick={() => trackCTA("header")}>
        {/* Hero */}
        <section className="py-20 md:py-28 bg-gradient-to-br from-background via-background to-primary/10">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Zap className="h-4 w-4" /> Built for concreters
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
              Quote a slab in <span className="text-primary">10 minutes</span>.
              <br />Not 3 hours.
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Drop a plan, click your areas, get a fully-priced concrete quote ready to send. No spreadsheets. No guesswork.
            </p>
            <Button size="lg" asChild className="h-14 px-8 text-base" onClick={() => trackCTA("hero")}>
              <Link to={ctaHref}>
                Start free trial <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground mt-4">No credit card • 14-day trial</p>
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
              Try PourHub free for 14 days. Cancel anytime.
            </p>
            <Button size="lg" variant="secondary" asChild className="h-14 px-8" onClick={() => trackCTA("footer")}>
              <Link to={ctaHref}>
                Start free trial <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </LandingShell>
    </>
  );
}
