import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { SEOHead } from "@/components/seo/SEOHead";

const Pricing = () => {
  return (
    <>
      <SEOHead
        title="PourHub Pricing - $100/month | Concreting Software Australia"
        description="Simple, all-inclusive pricing for PourHub concreting business management software. $100/month with one month free trial. All features included."
        canonicalPath="/pricing"
        keywords="concreting software pricing, construction management software cost, ITP SWMS software price"
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
              Simple, All-Inclusive Pricing
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              One plan. All features. No hidden fees, cancel anytime.
            </p>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="px-4 pb-20">
          <div className="max-w-lg mx-auto">
            <Card className="relative border-primary shadow-lg shadow-primary/20">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1">
                All Features Included
              </Badge>
              <CardHeader className="text-center pb-2">
                <h2 className="text-2xl font-bold">PourHub</h2>
                <div className="mt-4">
                  <span className="text-5xl font-bold text-primary">$100</span>
                  <span className="text-muted-foreground"> / month</span>
                </div>
                <div className="mt-2">
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                    One month free trial
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Complete job management for concreting businesses
                </p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 flex-1">
                  {[
                    "Unlimited employees",
                    "Unlimited jobs",
                    "Unlimited crews",
                    "Job scheduling with conflict warnings",
                    "Project Startup checklist",
                    "ITPs & SWMS",
                    "Concrete test result tracking & alerts",
                    "Photo & document uploads",
                    "Job Pack PDF export",
                    "Equipment register with service reminders",
                    "Custom ITP & SWMS templates",
                    "Business branding on PDFs",
                    "Priority support",
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className="mt-6">
                  <Button className="w-full touch-target" size="lg">
                    Start Free Trial
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
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-secondary">
              Why Concreters Choose <span className="text-primary">PourHub</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">$100</div>
                <p className="text-primary-foreground/90">Less than 2 hours of labour per month</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">100%</div>
                <p className="text-primary-foreground/90">Digital compliance documentation</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">0</div>
                <p className="text-primary-foreground/90">Missed test results or expired tickets</p>
              </div>
            </div>
          </div>
        </div>

        {/* Value Explanation */}
        <div className="bg-background py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Why $100/month?</h2>
            <div className="bg-card border border-border rounded-lg p-6">
              <p className="text-muted-foreground">
                One failed ITP or missing concrete test can cost thousands. Builders love clean 
                compliance packs, and PourHub makes it easy to deliver professional documentation 
                every time. At $100/month, it's less than 2 hours of labour—but saves you countless 
                hours of paperwork and prevents costly compliance issues. Every feature included, 
                no restrictions.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-primary py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-primary-foreground/90 mb-8">
              Sign up today and get your business organized in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6 touch-target">
                  Get Started Now
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
