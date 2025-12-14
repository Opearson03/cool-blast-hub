import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HardHat, Users, Calendar, ClipboardCheck, Truck, ArrowRight, Zap } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-black-pure">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-black-pure via-black-soft to-black-pure" />
        <div className="absolute inset-0 opacity-30">
          <div 
            className="absolute inset-0" 
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, hsl(25 100% 50% / 0.15) 0%, transparent 50%),
                               radial-gradient(circle at 75% 75%, hsl(25 100% 50% / 0.1) 0%, transparent 50%)`,
            }} 
          />
        </div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div 
            className="absolute inset-0" 
            style={{
              backgroundImage: `linear-gradient(hsl(0 0% 100% / 0.1) 1px, transparent 1px),
                               linear-gradient(90deg, hsl(0 0% 100% / 0.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }} 
          />
        </div>
        
        <div className="relative px-4 py-20 sm:py-28 lg:py-36">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo */}
            <div className="flex items-center justify-center gap-4 mb-10">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary rounded-xl flex items-center justify-center shadow-glow animate-pulse-glow">
                <HardHat className="w-10 h-10 sm:w-12 sm:h-12 text-primary-foreground" />
              </div>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl tracking-wide">
                POUR<span className="text-primary">HUB</span>
              </h1>
            </div>
            
            <p className="text-xl sm:text-2xl lg:text-3xl text-foreground font-semibold mb-4">
              Operations Management for <span className="text-primary">Concreting</span> Businesses
            </p>
            <p className="text-muted-foreground mb-12 max-w-2xl mx-auto text-lg">
              Manage jobs, crews, schedules, compliance, equipment, and more — all from your phone on the job site.
            </p>
            
            <Link to="/auth">
              <Button size="lg" className="text-lg px-10 py-7 touch-target group">
                Sign In to Get Started
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-black-soft py-20 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl sm:text-5xl tracking-wide mb-4">
              BUILT FOR <span className="text-primary">CONCRETERS</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to run your concreting business, designed for the job site.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <FeatureCard
              icon={<Calendar className="w-7 h-7" />}
              title="Job Scheduling"
              description="Drag and drop calendar, crew allocation, and conflict management"
            />
            <FeatureCard
              icon={<Users className="w-7 h-7" />}
              title="Crew Management"
              description="Organize teams, assign supervisors, and track availability"
            />
            <FeatureCard
              icon={<ClipboardCheck className="w-7 h-7" />}
              title="ITPs & SWMS"
              description="Digital inspection checklists and safety documentation"
            />
            <FeatureCard
              icon={<Truck className="w-7 h-7" />}
              title="Equipment Register"
              description="Track plant, service schedules, and job assignments"
            />
            <FeatureCard
              icon={<HardHat className="w-7 h-7" />}
              title="Compliance Tracking"
              description="Tickets, certifications, and expiry reminders"
            />
            <FeatureCard
              icon={<Zap className="w-7 h-7" />}
              title="Concrete Testing"
              description="Track test results, lab reports, and pass/fail alerts"
            />
          </div>
        </div>
      </div>

      {/* Mobile First Banner */}
      <div className="relative overflow-hidden py-16 px-4 border-t border-border">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wider mb-6">
            <Zap className="w-4 h-4" />
            Mobile-First Design
          </div>
          <h3 className="font-display text-3xl sm:text-4xl tracking-wide mb-4">
            WORKS ON <span className="text-primary">ANY DEVICE</span>
          </h3>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Built for supervisors and concreters to use on-site. Big buttons, simple navigation, designed for dirty hands and bright sun.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black-pure py-8 px-4 text-center border-t border-border">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
            <HardHat className="w-5 h-5 text-primary" />
          </div>
          <span className="font-display text-xl tracking-wide">POURHUB</span>
        </div>
        <p className="text-muted-foreground text-sm">
          © {new Date().getFullYear()} PourHub. Operations management for NSW concreting businesses.
        </p>
      </footer>
    </div>
  );
};

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group bg-gradient-to-b from-card to-black-soft border border-border rounded-lg p-6 hover:border-primary/50 hover-lift transition-all cursor-default">
      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4 group-hover:bg-primary/20 transition-colors">
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}

export default Index;
