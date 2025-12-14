import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HardHat, Check, ArrowRight, ArrowLeft } from "lucide-react";

const PRICING_TIERS = [
  {
    name: "Starter",
    price: 79,
    description: "Solo concreters, 1–3 person crews, small residential outfits.",
    features: [
      "1 Business",
      "Up to 5 employees",
      "Unlimited jobs",
      "Job scheduling",
      "Project Startup checklist",
      "ITPs & SWMS",
      "Concrete test result tracking",
      "Photo & document uploads",
      "Job Pack PDF export",
      "Equipment register (basic)",
    ],
    highlight: false,
  },
  {
    name: "Professional",
    price: 199,
    description: "Growing concreting businesses, multiple crews, builder work.",
    features: [
      "Everything in Starter, plus:",
      "Up to 15 employees",
      "Unlimited crews",
      "Advanced scheduling (conflict warnings)",
      "Concrete test result alerts",
      "Equipment service reminders",
      "Priority support",
      "Custom ITP & SWMS templates",
      "Business branding on PDFs",
    ],
    highlight: true,
    badge: "Most Popular",
  },
  {
    name: "Enterprise",
    price: 300,
    description: "Large concreters, civil contractors, Tier-2 builder subcontractors.",
    features: [
      "Everything in Professional, plus:",
      "Unlimited employees",
      "Multi-site businesses",
      "Custom workflows",
      "Custom fields",
      "Dedicated onboarding",
      "Priority feature requests",
      "Phone support",
    ],
    highlight: false,
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-charcoal-dark">
      {/* Header */}
      <header className="px-4 py-6 border-b border-border/30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <HardHat className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-primary-foreground">
              Pour<span className="text-primary">Hub</span>
            </span>
          </Link>
          <Link to="/auth">
            <Button variant="outline" className="touch-target">
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
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your business. No hidden fees, cancel anytime.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {PRICING_TIERS.map((tier) => (
              <Card
                key={tier.name}
                className={`relative flex flex-col ${
                  tier.highlight
                    ? "border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                    : "border-border"
                }`}
              >
                {tier.badge && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1">
                    {tier.badge}
                  </Badge>
                )}
                <CardHeader className="text-center pb-2">
                  <h2 className="text-2xl font-bold">{tier.name}</h2>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-primary">${tier.price}</span>
                    <span className="text-muted-foreground"> / month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">{tier.description}</p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 flex-1">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        {idx === 0 && tier.name !== "Starter" ? (
                          <span className="text-sm text-muted-foreground font-medium">
                            {feature}
                          </span>
                        ) : (
                          <>
                            <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                  <Link to={`/signup?plan=${tier.name.toLowerCase()}`} className="mt-6">
                    <Button
                      className="w-full touch-target"
                      variant={tier.highlight ? "default" : "outline"}
                    >
                      Get Started
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Value Props */}
      <div className="bg-charcoal py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Why Concreters Choose <span className="text-primary">PourHub</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">$79</div>
              <p className="text-muted-foreground">Less than one hour of labour per month</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">100%</div>
              <p className="text-muted-foreground">Digital compliance documentation</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">0</div>
              <p className="text-muted-foreground">Missed test results or expired tickets</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ-style Value */}
      <div className="bg-background py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Why These Prices?</h2>
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold mb-2">Starter at $79/month</h3>
              <p className="text-muted-foreground text-sm">
                Under $100 makes it an easy decision. It's cheaper than one hour of labour, 
                but still feels like professional software. Perfect for solo operators who 
                want to look professional to builders.
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold mb-2">Professional at $199/month</h3>
              <p className="text-muted-foreground text-sm">
                This is where most growing businesses land. One failed ITP or missing concrete 
                test can cost thousands. Builders love clean compliance packs, and this tier 
                makes it easy to deliver professional documentation every time.
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold mb-2">Enterprise at $300/month</h3>
              <p className="text-muted-foreground text-sm">
                For large operations that need everything. Unlimited employees, custom workflows, 
                and dedicated support. This tier lets us handle edge cases and provide white-glove 
                onboarding without affecting pricing for smaller businesses.
              </p>
            </div>
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
            <Link to="/signup?plan=starter">
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
        <p className="text-muted-foreground text-sm">
          © {new Date().getFullYear()} PourHub. Operations management for NSW concreting businesses.
        </p>
      </footer>
    </div>
  );
};

export default Pricing;
