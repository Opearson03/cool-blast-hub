import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Sparkles,
  Building2,
  Mail,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { SEOHead } from "@/components/seo/SEOHead";
import { IntegrationsMarquee } from "@/components/marketing/IntegrationsMarquee";

const Enterprise = () => {
  const capabilities = [
    {
      icon: <Calculator className="w-6 h-6" />,
      title: "Estimating & Tendering at Scale",
      description: "Manage high-volume tenders with custom estimating templates, plan takeoffs, and approval workflows tuned to your business.",
    },
    {
      icon: <Briefcase className="w-6 h-6" />,
      title: "Job & Project Management",
      description: "Run hundreds of jobs and packages across teams with full visibility from win to handover.",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Crew & Subcontractor Coordination",
      description: "Manage in-house crews, labour-hire, and subbies in one place with allocations, timesheets, and compliance tracking.",
    },
    {
      icon: <CalendarDays className="w-6 h-6" />,
      title: "Multi-Site Scheduling",
      description: "Coordinate pours, deliveries, and crews across multiple active sites with conflict detection.",
    },
    {
      icon: <FlaskConical className="w-6 h-6" />,
      title: "Concrete Testing & Compliance",
      description: "Track ITPs, slump tests, cylinder breaks, and lab reports against every pour for full QA traceability.",
    },
    {
      icon: <Wrench className="w-6 h-6" />,
      title: "Equipment & Tool Logs",
      description: "Track every tool and piece of equipment — who has it, where it is, when it's serviced, and when it's due back.",
    },
    {
      icon: <Truck className="w-6 h-6" />,
      title: "Plant & Vehicle Tracking",
      description: "Manage your fleet, servicing intervals, registrations, and on-site assignments alongside your jobs.",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Custom Reporting & Dashboards",
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
            <Badge className="mb-6 px-4 py-2 text-sm font-semibold bg-primary/20 text-primary border border-primary/30">
              <Sparkles className="w-4 h-4 mr-2" />
              NEW — INTRODUCING
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-bold text-primary-foreground mb-6 tracking-tight">
              PourHub <span className="text-primary">Enterprise</span>
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
              A fully custom-built platform for large commercial concreting companies — from estimating to tool logs.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/bookings">
                <Button size="lg" className="text-lg px-8 py-6 touch-target">
                  Enquire Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="mailto:hello@pourhub.com.au?subject=PourHub%20Enterprise%20Enquiry">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 touch-target bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  <Mail className="mr-2 w-5 h-5" />
                  Email Us
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Integrations marquee */}
        <IntegrationsMarquee />

        {/* What we manage */}
        <div className="bg-charcoal py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
                End-to-End Coverage for Commercial Concreting
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                One platform, custom built around how your business actually runs.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {capabilities.map((cap, idx) => (
                <Card key={idx} className="border-border bg-card/80 backdrop-blur hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 text-primary flex items-center justify-center mb-4">
                      {cap.icon}
                    </div>
                    <h3 className="font-semibold mb-2">{cap.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{cap.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Integrations marquee */}
        <IntegrationsMarquee />

        {/* Built for your business */}
        <div className="bg-charcoal-dark py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 border-primary/40 text-primary">
                FULLY CUSTOM BUILD
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
                Built for Your Business
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Enterprise isn't a tier — it's a partnership. We build the platform around your workflows, not the other way around.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-card/60 border border-border rounded-lg p-6">
                <h3 className="font-semibold text-primary mb-2">Custom Workflows</h3>
                <p className="text-sm text-muted-foreground">We map your existing processes — estimating handover, pour day, QA sign-offs — and build the system to match.</p>
              </div>
              <div className="bg-card/60 border border-border rounded-lg p-6">
                <h3 className="font-semibold text-primary mb-2">Integrations</h3>
                <p className="text-sm text-muted-foreground">Connect with your accounting, payroll, batch plant, and other systems via custom integrations.</p>
              </div>
              <div className="bg-card/60 border border-border rounded-lg p-6">
                <h3 className="font-semibold text-primary mb-2">Dedicated Onboarding</h3>
                <p className="text-sm text-muted-foreground">Hands-on rollout with your team — data migration, training, and pilot site sign-off.</p>
              </div>
              <div className="bg-card/60 border border-border rounded-lg p-6">
                <h3 className="font-semibold text-primary mb-2">White-Glove Support</h3>
                <p className="text-sm text-muted-foreground">A direct line to our team. Priority response, ongoing development, and a roadmap shaped around your needs.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Who it's for */}
        <div className="bg-charcoal py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Building2 className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-6">
              Who It's For
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
              <div>
                <p className="text-3xl font-bold text-primary mb-2">Commercial</p>
                <p className="text-muted-foreground text-sm">Large commercial concreting contractors running multi-million dollar projects.</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary mb-2">Multi-Crew</p>
                <p className="text-muted-foreground text-sm">Operations running multiple crews, sites, and packages concurrently.</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary mb-2">Bespoke</p>
                <p className="text-muted-foreground text-sm">Businesses that need workflows and integrations off-the-shelf software can't deliver.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-primary py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-4">
              Let's Talk About Your Operation
            </h3>
            <p className="text-primary-foreground/90 mb-8">
              Book a discovery call and we'll walk through how PourHub Enterprise can be built around your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/bookings">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6 touch-target">
                  Enquire Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 touch-target bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  <ArrowLeft className="mr-2 w-5 h-5" />
                  See All Plans
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-charcoal-dark py-8 px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <p className="text-muted-foreground text-sm mb-4">
              © {new Date().getFullYear()} PourHub. Operations management for Australian concreting businesses.
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
                Pricing
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

export default Enterprise;
