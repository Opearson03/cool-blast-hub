import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CheckCircle,
  ArrowRight,
  Loader2,
  FileText,
  Calculator,
  MessageSquare,
  HardHat,
  ClipboardCheck,
  Sparkles,
} from "lucide-react";
import { FeedbackDialog } from "@/components/feedback/FeedbackDialog";
import heroPourBackground from "@/assets/hero-pour-background.png";
import jobDetailsScreenshot from "@/assets/job-details-screenshot.png";
import estimateScreenshot from "@/assets/estimate-screenshot.png";
import scheduleScreenshot from "@/assets/schedule-screenshot.png";
import { Logo } from "@/components/ui/Logo";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/seo/SEOHead";
import { useTotalQuotedValue } from "@/hooks/useTotalQuotedValue";
import { formatCurrency } from "@/lib/format-currency";
import { Reveal } from "@/components/marketing/Reveal";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [checking, setChecking] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const isNative = Capacitor.isNativePlatform();
  const { data: totalQuotedValue, isLoading: isQuoteLoading } = useTotalQuotedValue();
  const affCode = searchParams.get("aff") || searchParams.get("ref") || "";
  const signupHref = affCode ? `/signup?tier=pro&aff=${affCode}` : "/signup?tier=pro";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const checkPlatformAndAuth = async () => {
      if (isNative) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const [{ data: isAdmin }, { data: isStaff }] = await Promise.all([
            supabase.rpc("has_role", { _role: "admin", _user_id: session.user.id }),
            supabase.rpc("has_role", { _role: "staff", _user_id: session.user.id }),
          ]);
          if (isAdmin) navigate("/admin", { replace: true });
          else if (isStaff) navigate("/employee", { replace: true });
          else navigate("/auth", { replace: true });
        } else {
          navigate("/auth", { replace: true });
        }
      }
      setChecking(false);
    };
    checkPlatformAndAuth();
  }, [navigate, isNative]);

  if (isNative && checking) {
    return (
      <div className="min-h-screen bg-charcoal-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="PourHub - Concreting Business Management Software | Australia"
        description="PourHub is the all-in-one management platform for Australian concreting businesses. Manage jobs, estimates, schedules, and concrete test results. Get started today."
        canonicalPath="/"
        keywords="concreting software, concrete business management, job scheduling, estimates, Australian concreting"
      />
      <div className="min-h-screen bg-charcoal-dark text-primary-foreground scroll-smooth">

        {/* Nav */}
        <nav
          className={
            "sticky top-0 z-50 transition-all duration-300 " +
            (scrolled
              ? "bg-charcoal-dark/95 backdrop-blur-md border-b border-border/30"
              : "bg-charcoal-dark/40 backdrop-blur-sm border-b border-transparent")
          }
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
            <Link to="/" className="flex items-center gap-2">
              <Logo size="sm" className="w-8 h-8 rounded-lg" />
              <span className="text-lg font-display font-bold">
                Pour<span className="text-primary">Hub</span>
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <a href="#features" className="px-3 py-2 text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">Features</a>
              <Link to="/pricing" className="px-3 py-2 text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">Pricing</Link>
              <a href="#subbies" className="px-3 py-2 text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">Subbies</a>
              <Link to="/articles" className="px-3 py-2 text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">Articles</Link>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/auth" className="px-3 py-2 text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Sign in
              </Link>
              <Link to={signupHref}>
                <Button size="sm" className="font-medium">Get started</Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <header className="relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroPourBackground})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal-dark via-charcoal-dark/85 to-charcoal-dark/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-dark via-transparent to-transparent" />

          <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-28 md:pt-28 md:pb-36">
            <div className="max-w-2xl">
              <Reveal>
                <span className="eyebrow">Built in Australia for concreters</span>
              </Reveal>
              <Reveal delay={80}>
                <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.02] mt-5">
                  Run your concreting<br />
                  business <span className="text-primary">like a pro.</span>
                </h1>
              </Reveal>
              <Reveal delay={160}>
                <p className="mt-6 text-lg sm:text-xl text-primary-foreground/75 max-w-xl leading-relaxed">
                  One platform for jobs, quotes, schedules and concrete test results. Built for Aussie concreters who'd rather be on the tools than buried in paperwork.
                </p>
              </Reveal>
              <Reveal delay={240}>
                <div className="mt-9 flex flex-wrap items-center gap-4">
                  <Link to={signupHref}>
                    <Button size="lg" className="text-base px-7 h-12 touch-target font-medium shadow-lg shadow-primary/20">
                      Get started
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Link to="/bookings" className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                    Book a 15-min walkthrough
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </Reveal>
              <Reveal delay={320}>
                <div className="mt-10 inline-flex items-center gap-3 rounded-full border border-primary/25 bg-primary/10 backdrop-blur-sm px-4 py-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  <span className="text-sm text-primary-foreground/85">
                    {isQuoteLoading ? (
                      <span className="inline-block w-20 h-4 animate-pulse bg-primary/30 rounded align-middle" />
                    ) : (
                      <span className="text-primary font-semibold">{formatCurrency(totalQuotedValue ?? 0)}</span>
                    )}
                    <span className="ml-1.5 text-primary-foreground/60">quoted through PourHub</span>
                  </span>
                </div>
              </Reveal>
            </div>
          </div>
        </header>

        {/* Trust strip */}
        <div className="border-y border-border/20 bg-charcoal/40">
          <div className="max-w-6xl mx-auto px-4 py-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs sm:text-sm text-primary-foreground/55 uppercase tracking-wider font-medium">
            <span>Australian-built</span>
            <span className="text-primary/40">•</span>
            <span>Mobile-first</span>
            <span className="text-primary/40">•</span>
            <span>ABN-verified subbies</span>
            <span className="text-primary/40">•</span>
            <span>No lock-in</span>
          </div>
        </div>

        {/* Pillars */}
        <section id="features" className="section bg-charcoal-dark">
          <div className="max-w-6xl mx-auto">
            <Reveal className="max-w-2xl">
              <span className="eyebrow">Everything in one place</span>
              <h2 className="font-display text-4xl sm:text-5xl font-bold mt-4 leading-tight">
                The whole job, end&nbsp;to&nbsp;end.
              </h2>
              <p className="mt-4 text-lg text-primary-foreground/65">
                Stop bouncing between spreadsheets, group chats and notepads. PourHub keeps the entire operation in one calm, fast tool.
              </p>
            </Reveal>

            <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
              <Pillar icon={<FileText className="w-6 h-6" />} title="Jobs" desc="From quote accepted to final pour." />
              <Pillar icon={<Calculator className="w-6 h-6" />} title="Estimates" desc="Quote slabs in minutes, not hours." />
              <Pillar icon={<Calendar className="w-6 h-6" />} title="Schedule" desc="Drag, drop, done — week at a glance." />
              <Pillar icon={<ClipboardCheck className="w-6 h-6" />} title="Testing" desc="Lab results matched automatically." />
            </div>
          </div>
        </section>

        {/* Feature 1 — Jobs (image right) */}
        <FeatureRow
          eyebrow="01 — Jobs"
          title="Every spec, every pour, one place."
          body="Concrete grade, slump, supplier, finish, project checklists, multi-pour schedules — captured once and visible to everyone who needs it."
          bullets={["MPa, slump, supplier, finish type", "Project startup checklists", "Multiple pours per job"]}
          image={jobDetailsScreenshot}
          imageAlt="PourHub job details screen showing concrete specifications and project info"
          imagePosition="right"
        />

        {/* Feature 2 — Estimates (image left) */}
        <FeatureRow
          eyebrow="02 — Estimates"
          title="Quote a slab in the time it takes to brew a coffee."
          body="Pick the scope, punch in dimensions, hand the client a professional PDF. Modular calculators do the maths, including GST."
          bullets={["Modular calculators per scope", "Customisable price lists", "Client-ready PDFs"]}
          image={estimateScreenshot}
          imageAlt="PourHub estimate calculator with concrete costing modules"
          imagePosition="left"
          tone="alt"
        />

        {/* Feature 3 — Schedule (image right) */}
        <FeatureRow
          eyebrow="03 — Schedule"
          title="Plan the week without the WhatsApp chaos."
          body="Drag pours onto the calendar. Crew, time, address, scope — everyone sees the same picture, on any device."
          bullets={["Week and month views", "Drag-and-drop scheduling", "Quick site visit bookings"]}
          image={scheduleScreenshot}
          imageAlt="PourHub scheduling calendar with weekly pour view"
          imagePosition="right"
        />

        {/* Subbies banner */}
        <section id="subbies" className="section bg-charcoal-dark">
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <div className="relative overflow-hidden rounded-3xl border border-border/30 bg-gradient-to-br from-charcoal via-charcoal-dark to-charcoal p-8 md:p-12">
                <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
                <div className="relative grid lg:grid-cols-[1fr_auto] gap-8 items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <HardHat className="w-5 h-5 text-primary" />
                      <span className="eyebrow !mt-0">For subbies</span>
                    </div>
                    <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
                      On the tools? Get listed for free.
                    </h2>
                    <p className="mt-4 text-primary-foreground/70 max-w-2xl">
                      Join Australia's ABN-verified directory of concreters, steel fixers, formworkers, finishers, pump operators, cutters and labourers. Builders find you — no chasing.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {["Concreter", "Steel Fixer", "Formworker", "Finisher", "Pump Operator", "Cutter", "Labourer"].map((t) => (
                        <span key={t} className="rounded-full border border-border/40 bg-charcoal/60 px-3 py-1 text-xs text-primary-foreground/75">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 lg:items-end">
                    <Link to="/sub-contractors/signup">
                      <Button size="lg" className="text-base px-7 h-12 touch-target font-medium">
                        Sign up free
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                    </Link>
                    <Link to="/sub-contractors" className="text-xs text-primary-foreground/55 hover:text-primary-foreground transition-colors lg:text-right">
                      Learn more →
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Enterprise */}
        <section className="section bg-charcoal-dark border-t border-border/15">
          <div className="max-w-5xl mx-auto">
            <Reveal>
              <div className="rounded-3xl border border-primary/25 bg-gradient-to-br from-charcoal/80 to-charcoal-dark p-8 md:p-12 flex flex-col lg:flex-row items-start lg:items-center gap-8">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 mb-4">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">New</span>
                  </div>
                  <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
                    PourHub <span className="text-primary">Enterprise</span>
                  </h2>
                  <p className="mt-4 text-primary-foreground/70 max-w-2xl">
                    A fully custom platform for large commercial concreting operations — estimating, project management, plant tracking, bespoke reporting.
                  </p>
                </div>
                <Link to="/enterprise">
                  <Button size="lg" variant="outline" className="border-primary/40 text-primary-foreground hover:bg-primary/10 h-12 px-7">
                    Learn more
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Final CTA */}
        <section className="section">
          <div className="max-w-4xl mx-auto text-center">
            <Reveal>
              <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.02]">
                Quote your next job<br />
                <span className="text-primary">in minutes.</span>
              </h2>
              <p className="mt-6 text-lg text-primary-foreground/65 max-w-xl mx-auto">
                Free to start. No credit card. Set up in under two minutes.
              </p>
              <div className="mt-9">
                <Link to={signupHref}>
                  <Button size="lg" className="text-base px-8 h-12 touch-target font-medium shadow-lg shadow-primary/20">
                    Start free trial
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/20 bg-charcoal-dark/80 py-12 px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Logo size="sm" className="w-7 h-7 rounded-lg" />
                <span className="font-display font-bold">
                  Pour<span className="text-primary">Hub</span>
                </span>
              </div>
              <p className="text-sm text-primary-foreground/55 max-w-xs">
                Operations management for Australian concreting businesses.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/50 mb-3">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-primary-foreground/75 hover:text-primary transition-colors">Features</a></li>
                <li><Link to="/pricing" className="text-primary-foreground/75 hover:text-primary transition-colors">Pricing</Link></li>
                <li><Link to="/enterprise" className="text-primary-foreground/75 hover:text-primary transition-colors">Enterprise</Link></li>
                <li><Link to="/sub-contractors" className="text-primary-foreground/75 hover:text-primary transition-colors">For subbies</Link></li>
                <li><Link to="/articles" className="text-primary-foreground/75 hover:text-primary transition-colors">Articles</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/50 mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/privacy" className="text-primary-foreground/75 hover:text-primary transition-colors">Privacy</Link></li>
                <li><Link to="/terms" className="text-primary-foreground/75 hover:text-primary transition-colors">Terms</Link></li>
                <li><Link to="/bookings" className="text-primary-foreground/75 hover:text-primary transition-colors">Book a call</Link></li>
                <li>
                  <FeedbackDialog
                    trigger={
                      <button className="inline-flex items-center gap-1.5 text-primary-foreground/75 hover:text-primary transition-colors">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Feedback
                      </button>
                    }
                  />
                </li>
              </ul>
            </div>
          </div>
          <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-border/15 text-xs text-primary-foreground/45">
            © {new Date().getFullYear()} PourHub. All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
};

function Pillar({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Reveal className="group">
      <div className="flex items-center gap-3 text-primary mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <h3 className="font-display text-xl font-semibold mb-1.5">{title}</h3>
      <p className="text-sm text-primary-foreground/60 leading-relaxed">{desc}</p>
    </Reveal>
  );
}

function FeatureRow({
  eyebrow,
  title,
  body,
  bullets,
  image,
  imageAlt,
  imagePosition,
  tone = "default",
}: {
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  image: string;
  imageAlt: string;
  imagePosition: "left" | "right";
  tone?: "default" | "alt";
}) {
  const imageBlock = (
    <Reveal delay={120} className={imagePosition === "right" ? "lg:col-span-7" : "lg:col-span-7 lg:order-2"}>
      <div className="relative rounded-2xl overflow-hidden border border-border/30 bg-charcoal shadow-2xl shadow-charcoal-dark/60">
        <img src={image} alt={imageAlt} className="w-full h-auto block" loading="lazy" />
      </div>
    </Reveal>
  );

  const textBlock = (
    <Reveal className={imagePosition === "right" ? "lg:col-span-5" : "lg:col-span-5 lg:order-1"}>
      <span className="eyebrow">{eyebrow}</span>
      <h3 className="font-display text-3xl sm:text-4xl font-bold mt-4 leading-[1.1]">{title}</h3>
      <p className="mt-5 text-primary-foreground/70 leading-relaxed">{body}</p>
      <ul className="mt-6 space-y-3">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-3 text-primary-foreground/85 text-[15px]">
            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </Reveal>
  );

  return (
    <section className={"section " + (tone === "alt" ? "bg-charcoal/30" : "bg-charcoal-dark")}>
      <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        {imagePosition === "right" ? (
          <>
            {textBlock}
            {imageBlock}
          </>
        ) : (
          <>
            {imageBlock}
            {textBlock}
          </>
        )}
      </div>
    </section>
  );
}

export default Index;
