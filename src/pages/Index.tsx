import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Capacitor } from '@capacitor/core';
import { Button } from "@/components/ui/button";
import { Users, Calendar, ClipboardCheck, Truck, CheckCircle, ArrowRight, Shield, Loader2, BarChart3, Clock, FileText } from "lucide-react";
import heroPourBackground from "@/assets/hero-pour-background.png";
import concreteFinishing from "@/assets/concrete-finishing.jpg";
import concreteFormwork from "@/assets/concrete-formwork.jpg";
import { Logo } from "@/components/ui/Logo";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const isNative = Capacitor.isNativePlatform();

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

  // Web: show landing page as normal
  return (
    <div className="min-h-screen bg-charcoal-dark">
      {/* Hero Section with Background Image */}
      <div className="relative overflow-hidden min-h-[80vh] flex items-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroPourBackground})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal-dark/95 via-charcoal-dark/80 to-charcoal-dark/60" />
        
        <div className="relative px-4 py-16 sm:py-24 lg:py-32 w-full">
          <div className="max-w-4xl mx-auto">
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
              Jobs, crews, schedules, compliance, and test results — all in one place. Built for NSW concreters who want to work smarter.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/pricing">
                <Button size="lg" className="text-lg px-8 py-6 touch-target w-full sm:w-auto">
                  View Pricing
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 touch-target w-full sm:w-auto bg-primary-foreground/10 border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/20">
                  Sign In
                </Button>
              </Link>
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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Calendar className="w-8 h-8" />}
              title="Job Scheduling"
              description="Drag and drop calendar, crew allocation, and conflict management"
            />
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Crew Management"
              description="Organize teams, assign supervisors, and track availability"
            />
            <FeatureCard
              icon={<ClipboardCheck className="w-8 h-8" />}
              title="ITPs & SWMS"
              description="Digital inspection checklists and safety documentation"
            />
            <FeatureCard
              icon={<Truck className="w-8 h-8" />}
              title="Equipment Register"
              description="Track plant, service schedules, and job assignments"
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="Compliance Tracking"
              description="Tickets, certifications, and expiry reminders"
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

          {/* Feature 1: Dashboard & Team Communication */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16 items-center">
            <div className="relative rounded-xl overflow-hidden shadow-2xl order-2 lg:order-1">
              <img 
                src=https://pasteboard.co/R6MdQ2lgyXx7.png 
                alt="PourHub Dashboard" 
                className="w-full h-64 lg:h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-dark/90 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center gap-4 text-primary-foreground">
                  <div className="bg-primary/20 p-3 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Live Dashboard</h4>
                    <p className="text-sm text-primary-foreground/70">Track pours, crews & alerts at a glance</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h3 className="text-2xl font-bold text-primary-foreground mb-4">
                Your Business at a Glance
              </h3>
              <p className="text-primary-foreground/70 mb-6">
                See today's pours, active crews, upcoming jobs and alerts all in one dashboard. 
                Share updates with your team using @mentions and keep everyone on the same page.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-primary-foreground/80">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Daily pour counts and crew overview</span>
                </li>
                <li className="flex items-center gap-3 text-primary-foreground/80">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Team feed with @mentions and crew tagging</span>
                </li>
                <li className="flex items-center gap-3 text-primary-foreground/80">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Leave request management</span>
                </li>
              </ul>
            </div>
          </div>

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
            <div className="relative rounded-xl overflow-hidden shadow-2xl">
              <img 
                src={concreteFinishing} 
                alt="Job Details Management" 
                className="w-full h-64 lg:h-80 object-cover"
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

          {/* Feature 3: Testing & Compliance */}
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="relative rounded-xl overflow-hidden shadow-2xl order-2 lg:order-1">
              <div className="bg-gradient-to-br from-charcoal/80 to-charcoal-dark p-8 h-64 lg:h-80 flex flex-col justify-center">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                    <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                    <span className="text-2xl font-bold text-green-500">12</span>
                    <p className="text-xs text-primary-foreground/60">Passed</p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
                    <span className="text-2xl font-bold text-red-500">1</span>
                    <p className="text-xs text-primary-foreground/60">Failed</p>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-center">
                    <Clock className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                    <span className="text-2xl font-bold text-amber-500">3</span>
                    <p className="text-xs text-primary-foreground/60">Pending</p>
                  </div>
                </div>
                <div className="bg-background/10 rounded-lg p-4">
                  <div className="flex justify-between text-sm text-primary-foreground/70 mb-2">
                    <span>Test ID: P241036-685B</span>
                    <span className="text-green-500">Pass</span>
                  </div>
                  <div className="flex justify-between text-xs text-primary-foreground/50">
                    <span>28-Day • Target: 32 MPa</span>
                    <span>Actual: 38 MPa</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h3 className="text-2xl font-bold text-primary-foreground mb-4">
                Never Miss a Test Result
              </h3>
              <p className="text-primary-foreground/70 mb-6">
                Track 7-day, 28-day and slump tests with pass/fail status. 
                Upload lab reports and get instant visibility on concrete quality across all jobs.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-primary-foreground/80">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>7, 14, 28-day strength tracking</span>
                </li>
                <li className="flex items-center gap-3 text-primary-foreground/80">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Lab report uploads & storage</span>
                </li>
                <li className="flex items-center gap-3 text-primary-foreground/80">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Automatic pass/fail based on target MPa</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      {/* CTA Section */}
      <div className="bg-primary py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-4">
            Ready to Get Organized?
          </h3>
          <p className="text-primary-foreground/90 mb-8 max-w-xl mx-auto">
            Join concreting businesses across NSW who trust PourHub to manage their operations.
          </p>
          <Link to="/pricing">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6 touch-target">
              See Pricing Plans
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
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
