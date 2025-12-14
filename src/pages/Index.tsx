import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HardHat, Users, Calendar, ClipboardCheck, Truck } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-charcoal-dark">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-charcoal-dark via-charcoal to-charcoal-dark" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="relative px-4 py-16 sm:py-24 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
                <HardHat className="w-10 h-10 text-primary-foreground" />
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground">
                Pour<span className="text-primary">Hub</span>
              </h1>
            </div>
            
            <p className="text-xl sm:text-2xl text-muted-foreground mb-4">
              Operations Management for Concreting Businesses
            </p>
            <p className="text-muted-foreground mb-10 max-w-2xl mx-auto">
              Manage jobs, crews, schedules, compliance, equipment, and more — all from your phone on the job site.
            </p>
            
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 py-6 touch-target">
                Sign In to Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-background py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Built for <span className="text-primary">Concreters</span>
          </h2>
          
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
              icon={<HardHat className="w-8 h-8" />}
              title="Compliance Tracking"
              description="Tickets, certifications, and expiry reminders"
            />
            <FeatureCard
              icon={<ClipboardCheck className="w-8 h-8" />}
              title="Concrete Testing"
              description="Track test results, lab reports, and pass/fail alerts"
            />
          </div>
        </div>
      </div>

      {/* Mobile First Banner */}
      <div className="bg-primary py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-primary-foreground mb-4">
            Mobile-First Design
          </h3>
          <p className="text-primary-foreground/90">
            Built for supervisors and concreters to use on-site. Big buttons, simple navigation, works on any device.
          </p>
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
