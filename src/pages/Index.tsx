import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HardHat, Users, Calendar, ClipboardCheck, Truck, CheckCircle, ArrowRight } from "lucide-react";
import heroPourBackground from "@/assets/hero-pour-background.png";
import concreteFinishing from "@/assets/concrete-finishing.jpg";
import concreteFormwork from "@/assets/concrete-formwork.jpg";

const Index = () => {
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
              <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
                <HardHat className="w-10 h-10 text-primary-foreground" />
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground">
                Pour<span className="text-primary">Hub</span>
              </h1>
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6 leading-tight">
              Run Your Concreting<br />Business Like a Pro
            </h2>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-xl">
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
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 touch-target w-full sm:w-auto bg-background/10 border-border/30 hover:bg-background/20">
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
              icon={<HardHat className="w-8 h-8" />}
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

      {/* Image Gallery Section */}
      <div className="bg-charcoal py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            From <span className="text-primary">Site to Office</span>
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Whether you're pouring slabs, finishing floors, or managing paperwork — PourHub keeps everything organized.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative overflow-hidden rounded-xl aspect-[4/3]">
              <img 
                src={concreteFinishing} 
                alt="Concrete crew finishing a polished floor" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-dark/80 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-xl font-semibold text-primary-foreground">Professional Finishing</h3>
                <p className="text-muted-foreground text-sm">Track every pour from placement to polish</p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl aspect-[4/3]">
              <img 
                src={concreteFormwork} 
                alt="Steel reinforcement and formwork" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-dark/80 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-xl font-semibold text-primary-foreground">Inspection Ready</h3>
                <p className="text-muted-foreground text-sm">Digital ITPs keep your compliance on point</p>
              </div>
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
