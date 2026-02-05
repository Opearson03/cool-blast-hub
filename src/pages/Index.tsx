import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Capacitor } from '@capacitor/core';
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, ArrowRight, Loader2, FileText, Calculator, MessageSquare, Users } from "lucide-react";
import { FeedbackDialog } from "@/components/feedback/FeedbackDialog";
import heroPourBackground from "@/assets/hero-pour-background.png";
import jobDetailsScreenshot from "@/assets/job-details-screenshot.png";
import estimateScreenshot from "@/assets/estimate-screenshot.png";
import scheduleScreenshot from "@/assets/schedule-screenshot.png";
import { Logo } from "@/components/ui/Logo";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/seo/SEOHead";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";
import { useWaitlistCount } from "@/hooks/useWaitlistCount";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [checking, setChecking] = useState(true);
  const isNative = Capacitor.isNativePlatform();
  const { data: waitlistCount = 0 } = useWaitlistCount();
  
  // Get referral code from URL
  const referralCode = searchParams.get('ref') || undefined;

  useEffect(() => {
    const checkPlatformAndAuth = async () => {
      // Only handle native platform redirects
      if (isNative) {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Check role and redirect to appropriate dashboard
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
          // Not logged in on native - go to auth
          navigate('/auth', { replace: true });
        }
      }
      setChecking(false);
    };
    
    checkPlatformAndAuth();
  }, [navigate, isNative]);

  // Show loading while checking on native
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
        description="PourHub is the all-in-one management platform for Australian concreting businesses. Manage jobs, estimates, schedules, and concrete test results."
        canonicalPath="/"
        keywords="concreting software, concrete business management, job scheduling, estimates, Australian concreting"
      />
      <div className="min-h-screen bg-charcoal-dark">
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
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground">
                  Pour<span className="text-primary">Hub</span>
                </h1>
              </div>
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6 leading-tight">
                Run Your Concreting<br />Business Like a Pro
              </h2>
              
              <p className="text-xl text-primary-foreground/80 mb-8 max-w-xl">
                Jobs, estimates, schedules, and test results — all in one place. Built for Aussie concreters who want to work smarter.
              </p>
              
              {/* Waitlist Counter */}
              <div className="flex items-center gap-3 bg-primary/20 rounded-lg px-4 py-3 w-fit mb-4">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-primary-foreground font-medium">
                  <span className="text-primary font-bold">{waitlistCount}</span> concreters on the waiting list
                </span>
              </div>
              
              <Link to="/auth">
                <Button size="sm" variant="ghost" className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10">
                  Already have access? Sign In
                </Button>
              </Link>
            </div>
            
            {/* Right side - Waitlist Form */}
            <div className="bg-charcoal/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 lg:p-8">
              <h3 className="text-2xl font-bold text-primary-foreground mb-2">Join the Waiting List</h3>
              <p className="text-muted-foreground mb-4">
                We're launching soon. Get early access when we go live.
              </p>
              
              {/* Show different banner based on referral */}
              {referralCode ? (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-6">
                  <p className="text-green-400 font-semibold text-sm">🎉 You've been referred!</p>
                  <p className="text-primary-foreground/80 text-sm">
                    You'll get your <span className="text-green-400 font-bold">first month FREE</span> when you join.
                  </p>
                </div>
              ) : (
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 mb-6">
                  <p className="text-primary font-semibold text-sm">🎉 Early Bird Offer</p>
                  <p className="text-primary-foreground/80 text-sm">
                    Refer a mate and you <span className="text-primary font-bold">BOTH get your first month FREE!</span>
                  </p>
                </div>
              )}
              
              <WaitlistForm referralCode={referralCode} />
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-background py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Built for <span className="text-primary">Concreters</span>
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
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
      <div className="bg-charcoal-dark py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-primary-foreground mb-4">
            See <span className="text-primary">PourHub</span> in Action
          </h2>
          <p className="text-primary-foreground/70 text-center mb-12 max-w-2xl mx-auto">
            Real tools designed for real concreters. Here's what you'll get.
          </p>
          {/* Feature 2: Job Management */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16 items-center">
            <div>
              <h3 className="text-2xl font-bold text-primary-foreground mb-4">
                Complete Job Control
              </h3>
              <p className="text-primary-foreground/70 mb-6">
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
            <div className="relative rounded-xl overflow-hidden shadow-2xl border border-border/30">
              <img 
                src={jobDetailsScreenshot}
                alt="PourHub job details management showing concrete specifications, MPa strength, slump values, and supplier information" 
                className="w-full h-64 lg:h-80 object-cover object-top"
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
          <div className="grid lg:grid-cols-2 gap-8 mb-16 items-center">
            <div className="relative rounded-xl overflow-hidden shadow-2xl order-2 lg:order-1 border border-border/30">
              <img 
                src={estimateScreenshot}
                alt="PourHub estimate calculator showing concrete costing modules with automatic GST calculations" 
                className="w-full h-64 lg:h-80 object-cover object-top"
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
              <p className="text-primary-foreground/70 mb-6">
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
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-primary-foreground mb-4">
                Plan Your Week with Ease
              </h3>
              <p className="text-primary-foreground/70 mb-6">
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
            <div className="relative rounded-xl overflow-hidden shadow-2xl border border-border/30">
              <img 
                src={scheduleScreenshot}
                alt="PourHub scheduling calendar showing weekly pour schedule for concreting jobs" 
                className="w-full h-64 lg:h-80 object-cover object-top"
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
      {/* CTA Section */}
      <div className="bg-primary py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-4">
            Ready to Get Organised?
          </h3>
          <p className="text-primary-foreground/90 mb-8 max-w-xl mx-auto">
            Join {waitlistCount} other concreters on the waiting list. Be first in line when we launch.
          </p>
          <a href="#top">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6 touch-target">
              Join the Waiting List
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-charcoal-dark py-8 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-muted-foreground text-sm mb-4">
            © {new Date().getFullYear()} PourHub. Operations management for Australian concreting businesses.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4 text-sm">
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
            <FeedbackDialog 
              trigger={
                <button className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1">
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
    <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

export default Index;
