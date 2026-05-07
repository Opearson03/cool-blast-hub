import { useLandingTracker } from "@/hooks/useLandingTracker";
import { LandingShell } from "@/components/landing/LandingShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead } from "@/components/seo/SEOHead";
import { ArrowRight, FileText, PenTool, Award, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

export default function LandingB() {
  const { trackCTA } = useLandingTracker("b");
  const ctaHref = "/pricing?variant=b";

  return (
    <>
      <SEOHead
        title="Send Concrete Quotes That Win | PourHub"
        description="Branded PDF quotes with e-signature and a client portal. Stop losing jobs to slicker competitors — look the part on every quote."
        canonicalPath="/lp/b"
      />
      <LandingShell ctaHref={ctaHref} onCtaClick={() => trackCTA("header")}>
        {/* Hero */}
        <section className="py-20 md:py-28 bg-gradient-to-br from-background via-background to-primary/5">
          <div className="container mx-auto px-4 max-w-5xl grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Trophy className="h-4 w-4" /> Win more work
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
                Send quotes that <span className="text-primary">win</span>.
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Polished PDF quotes with your logo, your colours, and one-click e-signature. Look like the most professional concreter in town — because you are.
              </p>
              <Button size="lg" asChild className="h-14 px-8 text-base" onClick={() => trackCTA("hero")}>
                <Link to={ctaHref}>
                  Try free for 14 days <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            <Card className="shadow-2xl rotate-1">
              <CardContent className="p-8 space-y-3">
                <div className="h-3 w-1/3 bg-primary rounded" />
                <div className="h-2 w-2/3 bg-muted rounded" />
                <div className="h-2 w-1/2 bg-muted rounded" />
                <div className="border-t pt-4 mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Concrete supply</span><span className="font-medium">$8,420</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Reinforcement</span><span className="font-medium">$2,180</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Labour & place</span><span className="font-medium">$5,600</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Total ex GST</span><span>$16,200</span>
                  </div>
                </div>
                <div className="bg-primary/10 text-primary text-center rounded py-2 text-sm font-medium">
                  ✓ Accepted & signed
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: FileText, title: "Branded PDF in one click", desc: "Your logo, your colours, your terms — automatically. No Word templates, no formatting fights." },
                { icon: PenTool, title: "E-sign from the client's phone", desc: "Clients accept on the spot. No printing, no scanning, no chasing." },
                { icon: Award, title: "Look bigger than you are", desc: "A polished quote is the difference between 'too expensive' and 'when can you start?'." },
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
              “Conversion went from 1-in-4 to 1-in-2 the month we switched. Same prices — better-looking quotes.”
            </blockquote>
            <p className="text-sm text-muted-foreground">— Owner, residential concreting business</p>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="py-20 bg-primary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Win the next job.
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Send your first branded quote tonight.
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
