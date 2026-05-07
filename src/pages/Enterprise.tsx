import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  ArrowLeft,
  Calculator,
  Briefcase,
  Users,
  CalendarDays,
  FlaskConical,
  Wrench,
  Truck,
  BarChart3,
  Building2,
  Mail,
} from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { LandingShell } from "@/components/landing/LandingShell";
import { IntegrationsMarquee } from "@/components/marketing/IntegrationsMarquee";

const Enterprise = () => {
  const capabilities = [
    {
      icon: <Calculator className="w-6 h-6" />,
      title: "Estimating & tendering at scale",
      description: "Manage high-volume tenders with custom estimating templates, plan takeoffs, and approval workflows tuned to your business.",
    },
    {
      icon: <Briefcase className="w-6 h-6" />,
      title: "Job & project management",
      description: "Run hundreds of jobs and packages across teams with full visibility from win to handover.",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Crew & subcontractor coordination",
      description: "Manage in-house crews, labour-hire, and subbies in one place with allocations, timesheets, and compliance tracking.",
    },
    {
      icon: <CalendarDays className="w-6 h-6" />,
      title: "Multi-site scheduling",
      description: "Coordinate pours, deliveries, and crews across multiple active sites with conflict detection.",
    },
    {
      icon: <FlaskConical className="w-6 h-6" />,
      title: "Concrete testing & compliance",
      description: "Track ITPs, slump tests, cylinder breaks, and lab reports against every pour for full QA traceability.",
    },
    {
      icon: <Wrench className="w-6 h-6" />,
      title: "Equipment & tool logs",
      description: "Track every tool and piece of equipment — who has it, where it is, when it's serviced, and when it's due back.",
    },
    {
      icon: <Truck className="w-6 h-6" />,
      title: "Plant & vehicle tracking",
      description: "Manage your fleet, servicing intervals, registrations, and on-site assignments alongside your jobs.",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Custom reporting & dashboards",
      description: "Bespoke reports built around the metrics your operations and finance teams actually care about.",
    },
  ];

  return (
    <>
      <SEOHead
        title="PourHub Enterprise - Custom Software for Large Commercial Concreters"
        description="A fully custom-built platform for large commercial concreting companies. From estimating and project management to tool logs, plant tracking, and custom reporting."
        canonicalPath="/enterprise"
        keywords="enterprise concreting software, commercial concrete management platform, custom construction software, large concreting company software"
      />
      <LandingShell ctaHref="/bookings" ctaLabel="Enquire now">
        <div className="bg-charcoal-dark">
          {/* Hero */}
          <section className="px-4 py-16 sm:py-24">
            <div className="max-w-4xl mx-auto text-center">
              <span className="eyebrow text-primary inline-block mb-6">
                New — introducing
              </span>
              <h1 className="font-display text-4xl sm:text-6xl font-bold text-primary-foreground mb-6 tracking-tight">
                PourHub <span className="text-primary">Enterprise</span>
              </h1>
              <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
                A fully custom-built platform for large commercial concreting companies — from estimating to tool logs.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/bookings">
                  <Button size="lg" className="text-lg px-8 py-6 touch-target">
                    Enquire now
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <a href="mailto:hello@pourhub.com.au?subject=PourHub%20Enterprise%20Enquiry">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 touch-target bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                    <Mail className="mr-2 w-5 h-5" />
                    Email us
                  </Button>
                </a>
              </div>
            </div>
          </section>

          {/* Integrations marquee */}
          <IntegrationsMarquee />

          {/* What we manage */}
          <section className="bg-charcoal py-20 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-14">
                <span className="eyebrow text-primary inline-block mb-6">
                  Capabilities
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
                  End-to-end coverage for commercial concreting
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  One platform, custom built around how your business actually runs.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {capabilities.map((cap, idx) => (
                  <Card key={idx} className="border-border/70 bg-card/80 backdrop-blur transition-all hover:border-primary/50 hover:-translate-y-0.5">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-lg bg-primary/20 text-primary flex items-center justify-center mb-4">
                        {cap.icon}
                      </div>
                      <h3 className="font-display font-semibold mb-2">{cap.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{cap.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Built for your business */}
          <section className="bg-charcoal-dark py-20 px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <span className="eyebrow text-primary inline-block mb-6">
                  Fully custom build
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
                  Built for your business
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Enterprise isn't a tier — it's a partnership. We build the platform around your workflows, not the other way around.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { title: "Custom workflows", body: "We map your existing processes — estimating handover, pour day, QA sign-offs — and build the system to match." },
                  { title: "Integrations", body: "Connect with your accounting, payroll, batch plant, and other systems via custom integrations." },
                  { title: "Dedicated onboarding", body: "Hands-on rollout with your team — data migration, training, and pilot site sign-off." },
                  { title: "White-glove support", body: "A direct line to our team. Priority response, ongoing development, and a roadmap shaped around your needs." },
                ].map((item) => (
                  <div key={item.title} className="bg-card/60 border border-border/70 rounded-lg p-6">
                    <h3 className="font-display font-semibold text-primary mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Who it's for */}
          <section className="bg-charcoal py-20 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Building2 className="w-12 h-12 text-primary mx-auto mb-6" />
              <span className="eyebrow text-primary inline-block mb-6">
                Who it's for
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground mb-6">
                Built for serious operators
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
                <div>
                  <p className="font-display text-3xl font-bold text-primary mb-2">Commercial</p>
                  <p className="text-muted-foreground text-sm">Large commercial concreting contractors running multi-million dollar projects.</p>
                </div>
                <div>
                  <p className="font-display text-3xl font-bold text-primary mb-2">Multi-crew</p>
                  <p className="text-muted-foreground text-sm">Operations running multiple crews, sites, and packages concurrently.</p>
                </div>
                <div>
                  <p className="font-display text-3xl font-bold text-primary mb-2">Bespoke</p>
                  <p className="text-muted-foreground text-sm">Businesses that need workflows and integrations off-the-shelf software can't deliver.</p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-primary py-16 px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-primary-foreground mb-4">
                Let's talk about your operation
              </h3>
              <p className="text-primary-foreground/90 mb-8">
                Book a discovery call and we'll walk through how PourHub Enterprise can be built around your business.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/bookings">
                  <Button size="lg" variant="secondary" className="text-lg px-8 py-6 touch-target">
                    Enquire now
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 touch-target bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                    <ArrowLeft className="mr-2 w-5 h-5" />
                    See all plans
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

export default Enterprise;
