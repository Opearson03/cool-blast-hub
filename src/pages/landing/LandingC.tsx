import { useLandingTracker } from "@/hooks/useLandingTracker";
import { LandingShell } from "@/components/landing/LandingShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead } from "@/components/seo/SEOHead";
import { ArrowRight, Calendar, Users, Truck, Receipt } from "lucide-react";
import { Link } from "react-router-dom";
import heroBg from "@/assets/lp-hero-c-jobsite.jpg";

export default function LandingC() {
  const { trackCTA } = useLandingTracker("c");
  const ctaHref = "/pricing?variant=c";

  return (
    <>
      <SEOHead
        title="Run Every Concrete Job From One Place | PourHub"
        description="Quote, schedule pours, book subbies, track dockets, get paid — one system for the whole concreting business."
        canonicalPath="/lp/c"
      />
      <LandingShell ctaHref={ctaHref} ctaLabel="See plans" onCtaClick={() => trackCTA("header")}>
        {/* Hero with industrial background */}
        <section
          className="relative py-20 md:py-32 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})` }}
        >
          <div className="absolute inset-0 bg-black/65" aria-hidden />
          <div className="container relative mx-auto px-4 max-w-4xl text-center text-white">
            <span className="eyebrow text-white/90 inline-block mb-6">
              From quote to paid
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
              One system. <br className="md:hidden" />
              <span className="text-primary">Whole concreting business.</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/85 mb-8 max-w-2xl mx-auto">
              Quotes, schedule, subbies, dockets, invoices — stop juggling 6 apps and 3 group chats.
            </p>
            <Button size="lg" asChild className="h-14 px-8 text-base" onClick={() => trackCTA("hero")}>
              <Link to={ctaHref}>
                See it in action <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <p className="text-sm text-white/70 mt-4">From $99/mo • Cancel anytime</p>
          </div>
        </section>

        {/* The four pillars */}
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Calendar, title: "Schedule pours", desc: "Drag pours onto the calendar. Crews, subbies, and pumps stay in sync." },
                { icon: Users, title: "Book subbies", desc: "Verified subcontractor network — book steel fixers, formworkers and pump operators in seconds." },
                { icon: Truck, title: "Track dockets", desc: "Snap a delivery docket, AI extracts volumes, actuals update against the quote." },
                { icon: Receipt, title: "Get paid faster", desc: "Variations, progress claims and invoices — built from the original quote." },
              ].map((b, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <b.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{b.title}</h3>
                    <p className="text-sm text-muted-foreground">{b.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow strip */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="grid md:grid-cols-5 gap-4 items-center text-center">
              {["Quote", "Schedule", "Pour", "Docket", "Invoice"].map((step, i) => (
                <div key={step} className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg mb-2">
                    {i + 1}
                  </div>
                  <div className="font-semibold">{step}</div>
                </div>
              ))}
            </div>
            <p className="text-center text-muted-foreground mt-8 max-w-2xl mx-auto">
              The whole job lives in one record. No re-keying. No hunting for the latest version.
            </p>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="py-20 bg-primary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Run the whole job from one place.
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Built by concreters, for concreting businesses ready to scale.
            </p>
            <Button size="lg" variant="secondary" asChild className="h-14 px-8" onClick={() => trackCTA("footer")}>
              <Link to={ctaHref}>
                See plans <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </LandingShell>
    </>
  );
}
