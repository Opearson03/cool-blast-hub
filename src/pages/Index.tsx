import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Capacitor } from '@capacitor/core';
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, ArrowRight, Loader2, FileText, Calculator, MessageSquare, HardHat, Search, Bell, CalendarDays, LayoutDashboard } from "lucide-react";
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

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [checking, setChecking] = useState(true);
  const isNative = Capacitor.isNativePlatform();
  const { data: totalQuotedValue, isLoading: isQuoteLoading } = useTotalQuotedValue();
  const affCode = searchParams.get('aff') || searchParams.get('ref') || '';

  useEffect(() => {
    const checkPlatformAndAuth = async () => {
      if (isNative) {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const [{ data: isAdmin }, { data: isStaff }] = await Promise.all([
            supabase.rpc("has_role", { _role: "admin", _user_id: session.user.id }),
            supabase.rpc("has_role", { _role: "staff", _user_id: session.user.id }),
          ]);

          if (isAdmin) {
            navigate('/admin', { replace: true });
          } else if (isStaff) {
            navigate('/employee', { replace: true });
          } else {
            navigate('/auth', { replace: true });
          }
        } else {
          navigate('/auth', { replace: true });
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
      <div className="min-h-screen bg-charcoal-dark scroll-smooth">

      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 bg-charcoal-dark/80 backdrop-blur-md border-b border-border/20">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <Logo size="sm" className="w-8 h-8 rounded-lg" />
            <span className="text-xl font-bold text-primary-foreground">
              Pour<span className="text-primary">Hub</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/pricing">
              <Button size="sm" variant="ghost" className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-all duration-300">
                Pricing
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 transition-all duration-300">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with Background Image */}
      <div className="relative overflow-hidden min-h-[80vh] flex items-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroPourBackground})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal-dark/95 via-charcoal-dark/80 to-charcoal-dark/60" />
        
        <div className="relative px-4 py-16 sm:py-24 lg:py-32 w-full">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Copy */}
            <div>
              {/* Logo */}
              <div className="flex items-center gap-3 mb-8">
                <Logo size="xl" className="w-16 h-16 rounded-xl" />
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground tracking-tight" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
                  Pour<span className="text-primary">Hub</span>
                </h1>
              </div>
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6 leading-tight tracking-tight" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                Run Your Concreting<br />Business Like a Pro
              </h2>
              
              <p className="text-xl text-primary-foreground/80 mb-8 max-w-xl leading-relaxed">
                Jobs, estimates, schedules, and test results — all in one place. Built for Aussie concreters who want to work smarter.
              </p>
              
              {/* Total Quoted Value Counter */}
              {(isQuoteLoading || (totalQuotedValue != null && totalQuotedValue > 0)) && (
                <div className="flex items-center gap-3 bg-primary/15 backdrop-blur-sm rounded-lg px-4 py-3 w-fit mb-3 border border-primary/20">
                  <Calculator className="w-5 h-5 text-primary" />
                  <span className="text-primary-foreground font-medium">
                    {isQuoteLoading ? (
                      <span className="inline-block w-24 h-5 animate-pulse bg-primary/30 rounded align-middle" />
                    ) : (
                      <span className="text-primary font-bold">{formatCurrency(totalQuotedValue ?? 0)}</span>
                    )} quoted through PourHub
                  </span>
                </div>
              )}

              <p className="text-sm text-primary-foreground/50 mb-0">Trusted by Australian concreters</p>
            </div>
            
            {/* Right side - CTA */}
            <div className="bg-charcoal/60 backdrop-blur-lg border border-primary/15 rounded-2xl p-6 lg:p-8 flex flex-col items-center justify-center text-center shadow-xl shadow-primary/5">
              <h3 className="text-2xl font-bold text-primary-foreground mb-2">Start Managing Jobs Today</h3>
              <p className="text-muted-foreground mb-6">
                Sign up in under 2 minutes.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Link to={affCode ? `/signup?tier=pro&aff=${affCode}` : '/signup?tier=pro'} className="flex-1">
                  <Button size="lg" className="w-full text-lg px-8 py-6 touch-target transition-all duration-300 hover:scale-[1.02]">
                    Get Started
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/pricing" className="flex-1">
                  <Button size="lg" variant="outline" className="w-full text-lg px-8 py-6 touch-target transition-all duration-300 hover:scale-[1.02]">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-background py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 tracking-tight">
            Built for <span className="text-primary">Concreters</span>
          </h2>
          <p className="text-muted-foreground text-center mb-14 max-w-2xl mx-auto">
            Everything you need to manage your concreting business from the job site.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<FileText className="w-8 h-8" />}
              title="Job Management"
              description="Track jobs from quote to completion with full concrete specs"
            />
            <FeatureCard
              icon={<Calculator className="w-8 h-8" />}
              title="Estimates"
              description="Generate professional quotes with built-in calculators"
            />
            <FeatureCard
              icon={<Calendar className="w-8 h-8" />}
              title="Scheduling"
              description="Drag and drop calendar to plan pours and manage your week"
            />
            <FeatureCard
              icon={<CheckCircle className="w-8 h-8" />}
              title="Concrete Testing"
              description="Track test results, lab reports, and pass/fail alerts"
            />
          </div>
        </div>
      </div>

      {/* App Showcase Section */}
      <div className="bg-charcoal-dark py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-primary-foreground mb-4 tracking-tight">
            See <span className="text-primary">PourHub</span> in Action
          </h2>
          <p className="text-primary-foreground/70 text-center mb-14 max-w-2xl mx-auto">
            Real tools designed for real concreters. Here's what you'll get.
          </p>

          {/* Feature 2: Job Management */}
          <div className="grid lg:grid-cols-2 gap-10 mb-20 items-center">
            <div>
              <h3 className="text-2xl font-bold text-primary-foreground mb-4">
                Complete Job Control
              </h3>
              <p className="text-primary-foreground/70 mb-6 leading-relaxed">
                Track every detail from concrete specs to test results. 
                Manage multiple jobs with full visibility on progress, clients, and materials.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-primary-foreground/80">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Concrete specs: MPa, slump, supplier, finish type</span>
                </li>
                <li className="flex items-center gap-3 text-primary-foreground/80">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Project startup checklists</span>
                </li>
                <li className="flex items-center gap-3 text-primary-foreground/80">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Multiple pours per job with scheduling</span>
                </li>
              </ul>
            </div>
            <div className="relative rounded-xl overflow-hidden shadow-2xl border border-border/30 ring-1 ring-primary/20">
              <img 
                src={jobDetailsScreenshot}
                alt="PourHub job details management showing concrete specifications, MPa strength, slump values, and supplier information" 
                className="w-full h-64 lg:h-96 object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-dark/90 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center gap-4 text-primary-foreground">
                  <div className="bg-primary/20 p-3 rounded-lg">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Job Details</h4>
                    <p className="text-sm text-primary-foreground/70">Full specs, notes & client info</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: Estimates */}
          <div className="grid lg:grid-cols-2 gap-10 mb-20 items-center">
            <div className="relative rounded-xl overflow-hidden shadow-2xl order-2 lg:order-1 border border-border/30 ring-1 ring-primary/20">
              <img 
                src={estimateScreenshot}
                alt="PourHub estimate calculator showing concrete costing modules with automatic GST calculations" 
                className="w-full h-64 lg:h-96 object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-dark/90 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center gap-4 text-primary-foreground">
                  <div className="bg-primary/20 p-3 rounded-lg">
                    <Calculator className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Smart Estimates</h4>
                    <p className="text-sm text-primary-foreground/70">Built-in calculators for accurate quotes</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h3 className="text-2xl font-bold text-primary-foreground mb-4">
                Quote Jobs in Minutes
              </h3>
              <p className="text-primary-foreground/70 mb-6 leading-relaxed">
                Built-in calculators for driveways, slabs, piers, footings and more. 
                Select your scope, enter dimensions, and get accurate costing with GST automatically.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-primary-foreground/80">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Modular calculators for every scope</span>
                </li>
                <li className="flex items-center gap-3 text-primary-foreground/80">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Customisable price lists</span>
                </li>
                <li className="flex items-center gap-3 text-primary-foreground/80">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Professional PDF quotes to email</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 4: Schedule */}
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h3 className="text-2xl font-bold text-primary-foreground mb-4">
                Plan Your Week with Ease
              </h3>
              <p className="text-primary-foreground/70 mb-6 leading-relaxed">
                Drag and drop pours onto your calendar. See your week at a glance with 
                job details, times, and addresses all in one view.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-primary-foreground/80">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Week and month calendar views</span>
                </li>
                <li className="flex items-center gap-3 text-primary-foreground/80">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Drag and drop scheduling</span>
                </li>
                <li className="flex items-center gap-3 text-primary-foreground/80">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Quick site visit bookings</span>
                </li>
              </ul>
            </div>
            <div className="relative rounded-xl overflow-hidden shadow-2xl border border-border/30 ring-1 ring-primary/20">
              <img 
                src={scheduleScreenshot}
                alt="PourHub scheduling calendar showing weekly pour schedule for concreting jobs" 
                className="w-full h-64 lg:h-96 object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-dark/90 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center gap-4 text-primary-foreground">
                  <div className="bg-primary/20 p-3 rounded-lg">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Visual Schedule</h4>
                    <p className="text-sm text-primary-foreground/70">Weekly & monthly pour planning</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* For Tradies / Subcontractor Section */}
      <div className="bg-background py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <HardHat className="w-8 h-8 text-primary" />
            <h2 className="text-3xl sm:text-4xl font-bold text-center tracking-tight">
              Are You a <span className="text-primary">Subbie</span>?
            </h2>
          </div>
          <p className="text-muted-foreground text-center mb-4 max-w-2xl mx-auto">
            Join the free directory and get found by local concreting businesses looking for reliable subbies.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-14">
            {["Concreter", "Steel Fixer", "Formworker", "Concrete Finisher", "Pump Operator", "Concrete Cutter", "Labourer"].map((trade) => (
              <span key={trade} className="inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                {trade}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div className="group bg-card border border-border border-t-2 border-t-primary rounded-lg p-7 shadow-md hover:shadow-lg hover:border-primary/50 transition-all duration-300">
              <div className="text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Free Directory Listing</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Get listed and visible to local concreting businesses actively looking for subbies in your area.</p>
            </div>
            <div className="group bg-card border border-border border-t-2 border-t-primary rounded-lg p-7 shadow-md hover:shadow-lg hover:border-primary/50 transition-all duration-300">
              <div className="text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">ABN-Verified Profile</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Build trust and credibility with a verified profile that shows businesses you're legit.</p>
            </div>
            <div className="group bg-card border border-border border-t-2 border-t-primary rounded-lg p-7 shadow-md hover:shadow-lg hover:border-primary/50 transition-all duration-300">
              <div className="text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
                <Bell className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Job Invitations</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Receive job invitations directly from businesses in your area — no chasing work.</p>
            </div>
            <div className="group bg-card border border-border border-t-2 border-t-primary rounded-lg p-7 shadow-md hover:shadow-lg hover:border-primary/50 transition-all duration-300">
              <div className="text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
                <CalendarDays className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Availability Calendar</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Set your availability so businesses know when you're free and can book you in.</p>
            </div>
            <div className="group bg-card border border-border border-t-2 border-t-primary rounded-lg p-7 shadow-md hover:shadow-lg hover:border-primary/50 transition-all duration-300">
              <div className="text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
                <LayoutDashboard className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Work Dashboard</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Track invited jobs, manage your schedule, and stay on top of upcoming work.</p>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-center p-7">
                <p className="text-2xl font-bold text-primary mb-2">100% Free</p>
                <p className="text-muted-foreground text-sm">No credit card required.<br />No hidden fees. Ever.</p>
              </div>
            </div>
          </div>

          <div className="text-center flex flex-col items-center gap-3">
            <Link to="/sub-contractors/signup">
              <Button size="lg" className="text-lg px-10 py-6 touch-target transition-all duration-300 hover:scale-[1.02]">
                Sign Up Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/sub-contractors">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                More Info
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary to-orange-600 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-4 tracking-tight">
            Ready to Get Organised?
          </h3>
          <p className="text-primary-foreground/90 mb-8 max-w-xl mx-auto">
            Join hundreds of concreters already using PourHub to run their business smarter.
          </p>
          <Link to={affCode ? `/signup?tier=pro&aff=${affCode}` : '/signup?tier=pro'}>
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6 touch-target transition-all duration-300 hover:scale-[1.02]">
              Get Started Today
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-charcoal-dark border-t border-border/30 py-10 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-muted-foreground text-sm mb-4">
            © {new Date().getFullYear()} PourHub. Operations management for Australian concreting businesses.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4 text-sm">
            <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-all duration-300">
              Privacy Policy
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/terms" className="text-muted-foreground hover:text-primary transition-all duration-300">
              Terms & Conditions
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/pricing" className="text-muted-foreground hover:text-primary transition-all duration-300">
              Pricing
            </Link>
            <span className="text-muted-foreground">•</span>
            <FeedbackDialog 
              trigger={
                <button className="text-muted-foreground hover:text-primary transition-all duration-300 inline-flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  Feedback
                </button>
              }
            />
          </div>
        </div>
      </footer>
      </div>
    </>
  );
};

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group bg-card border border-border border-t-2 border-t-primary rounded-lg p-7 shadow-md hover:shadow-lg hover:border-primary/50 transition-all duration-300">
      <div className="text-primary mb-4 group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}

export default Index;
