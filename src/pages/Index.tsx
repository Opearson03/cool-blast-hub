import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Capacitor } from '@capacitor/core';
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, ArrowRight, Loader2, FileText, Calculator, MessageSquare, Code2, Zap } from "lucide-react";
import { FeedbackDialog } from "@/components/feedback/FeedbackDialog";
import heroPourBackground from "@/assets/hero-pour-background.png";
import jobDetailsScreenshot from "@/assets/job-details-screenshot.png";
import estimateScreenshot from "@/assets/estimate-screenshot.png";
import scheduleScreenshot from "@/assets/schedule-screenshot.png";
import { Logo } from "@/components/ui/Logo";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/seo/SEOHead";
import { InteractiveFeatureCard } from "@/components/landing/InteractiveFeatureCard";
import { TerminalWindow } from "@/components/landing/TerminalWindow";
import { CountUpStat } from "@/components/landing/CountUpStat";
import { TechStackBar } from "@/components/landing/TechStackBar";
import { BrowserMockup } from "@/components/landing/BrowserMockup";
import { FloatingBadge } from "@/components/landing/FloatingBadge";
import { CodeShowcase, SlabVisualization, DragDemoVisualization } from "@/components/landing/CodeShowcase";

const Index = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const isNative = Capacitor.isNativePlatform();

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

  const terminalLines = [
    { type: 'command' as const, text: 'pourhub calculate --scope=driveway --area=50', delay: 400 },
    { type: 'output' as const, text: '', delay: 200 },
    { type: 'info' as const, text: 'Calculating concrete volume...', delay: 300 },
    { type: 'output' as const, text: '- Slab: 50m² × 100mm = 5.0m³', delay: 200 },
    { type: 'output' as const, text: '- Wastage (5%): 0.25m³', delay: 200 },
    { type: 'success' as const, text: '- Total: 5.25m³ N32 Concrete', delay: 300 },
    { type: 'output' as const, text: '', delay: 200 },
    { type: 'info' as const, text: 'Generating BOQ...', delay: 300 },
    { type: 'output' as const, text: '- SL82 Mesh: 4 sheets', delay: 150 },
    { type: 'output' as const, text: '- Formwork: 30m', delay: 150 },
    { type: 'output' as const, text: '- Crusher Dust: 2.5m³', delay: 150 },
    { type: 'output' as const, text: '', delay: 200 },
    { type: 'success' as const, text: '✓ Done in 0.3s', delay: 100 },
  ];

  const volumeCalculatorCode = `// Calculate concrete volume
const calculateVolume = (answers) => {
  const area = Number(answers.area) || 0;
  const thicknessM = (Number(answers.thickness) || 0) / 1000;
  return area * thicknessM;
};

// With 5% wastage
const totalM3 = volume * 1.05;`;

  const schedulingCode = `// Drag and drop scheduling
const { attributes, listeners, setNodeRef, transform, isDragging } = 
  useDraggable({ 
    id: pour.id,
    data: { type: 'pour', date: pour.pour_date }
  });

// Update pour date on drop
const handleDragEnd = async (event) => {
  const { active, over } = event;
  if (over) {
    await updatePourDate(active.id, over.id);
  }
};`;

  return (
    <>
      <SEOHead
        title="PourHub - Concreting Business Management Software | NSW Australia"
        description="PourHub is the all-in-one management platform for concreting businesses in NSW, Australia. Manage jobs, estimates, schedules, and concrete test results."
        canonicalPath="/"
        keywords="concreting software, concrete business management, job scheduling, estimates, NSW concreting"
      />
      <div className="min-h-screen bg-background">
        {/* Hero Section with Background Image */}
        <div className="relative overflow-hidden min-h-[90vh] flex items-center">
          {/* Background image */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroPourBackground})` }}
          />
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 grid-pattern opacity-30" />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal-dark/95 via-charcoal-dark/85 to-charcoal-dark/70" />
          
          {/* Floating badges */}
          <FloatingBadge 
            text="React + TypeScript" 
            icon={<Code2 className="w-3 h-3" />}
            position="top-right"
            className="hidden md:flex"
          />
          
          <div className="relative px-4 py-16 sm:py-24 lg:py-32 w-full">
            <div className="max-w-5xl mx-auto">
              {/* Logo */}
              <div className="flex items-center gap-3 mb-8 animate-fade-in">
                <Logo size="xl" className="w-16 h-16 rounded-xl shadow-xl animate-pulse-glow" />
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground">
                  Pour<span className="gradient-text">Hub</span>
                </h1>
              </div>
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6 leading-tight animate-fade-in" style={{ animationDelay: '100ms' }}>
                Run Your Concreting<br />Business Like a Pro
              </h2>
              
              <p className="text-xl text-primary-foreground/80 mb-8 max-w-xl animate-fade-in" style={{ animationDelay: '200ms' }}>
                Jobs, estimates, schedules, and test results — all in one place. Built for NSW concreters who want to work smarter.
              </p>
              
              {/* Code-style tagline */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-charcoal/50 border border-border/30 backdrop-blur-sm mb-8 animate-fade-in" style={{ animationDelay: '300ms' }}>
                <span className="text-sm font-mono text-muted-foreground">{'// Built with'}</span>
                <span className="text-sm font-mono text-primary">real concreter feedback</span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: '400ms' }}>
                <Link to="/pricing">
                  <Button size="lg" className="text-lg px-8 py-6 touch-target w-full sm:w-auto group">
                    View Pricing
                    <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
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

        {/* Interactive Features Grid */}
        <div className="bg-card py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
              Built for <span className="gradient-text">Concreters</span>
            </h2>
            <p className="text-muted-foreground text-center mb-4 max-w-2xl mx-auto">
              Everything you need to manage your concreting business from the job site.
            </p>
            <p className="text-center text-sm font-mono text-muted-foreground/60 mb-12">
              {'// Hover to explore'}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <InteractiveFeatureCard
                icon={FileText}
                title="Job Management"
                description="Track jobs from quote to completion with full concrete specs"
                codeSnippet="status: 'scheduled' | 'in_progress'"
                animation="pulse"
              />
              <InteractiveFeatureCard
                icon={Calculator}
                title="Estimates"
                description="Generate professional quotes with built-in calculators"
                codeSnippet="total = subtotal + margin + gst"
                animation="counter"
                counterValue={0}
              />
              <InteractiveFeatureCard
                icon={Calendar}
                title="Scheduling"
                description="Drag and drop calendar to plan pours and manage your week"
                codeSnippet="useDraggable({ id: pour.id })"
                animation="bounce"
              />
              <InteractiveFeatureCard
                icon={CheckCircle}
                title="Concrete Testing"
                description="Track test results, lab reports, and pass/fail alerts"
                codeSnippet="passed: actual >= target"
                animation="pulse"
              />
            </div>
          </div>
        </div>

        {/* Tech Stack Bar */}
        <TechStackBar />

        {/* Code Showcase Section */}
        <div className="bg-background py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                <span className="text-primary">{'<'}</span>
                Under the Hood
                <span className="text-primary">{' />'}</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Real code from PourHub. See how we calculate volumes, handle scheduling, and automate your workflow.
              </p>
            </div>

            <div className="space-y-24">
              {/* Volume Calculator Showcase */}
              <CodeShowcase
                title="Smart Volume Calculations"
                description="Our calculators handle complex concrete volume calculations automatically. Enter dimensions, get accurate quantities with wastage built in."
                code={volumeCalculatorCode}
                visualization={<SlabVisualization />}
              />

              {/* Scheduling Showcase */}
              <CodeShowcase
                title="Drag & Drop Scheduling"
                description="Built with @dnd-kit for smooth, accessible drag and drop. Move pours between days with a single gesture."
                code={schedulingCode}
                visualization={<DragDemoVisualization />}
                reversed
              />
            </div>
          </div>
        </div>

        {/* Terminal Demo Section */}
        <div className="bg-charcoal-dark py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
                Automated <span className="text-primary">Workflows</span>
              </h2>
              <p className="text-primary-foreground/70 max-w-2xl mx-auto">
                Watch PourHub calculate materials, generate BOQs, and prepare quotes — all from a few inputs.
              </p>
            </div>

            <TerminalWindow 
              lines={terminalLines}
              title="pourhub-cli"
              className="max-w-2xl mx-auto"
            />
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-background py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <CountUpStat
                end={15}
                suffix="+"
                label="Scope Types"
                codeComment="// driveways, slabs, footings..."
              />
              <CountUpStat
                end={50}
                suffix="+"
                label="Cost Modules"
                codeComment="// concrete, reo, labour, pumping..."
              />
              <CountUpStat
                end={100}
                suffix="%"
                label="Type-Safe"
                codeComment="// TypeScript coverage"
              />
            </div>
          </div>
        </div>

        {/* App Showcase Section */}
        <div className="bg-card py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
              See <span className="gradient-text">PourHub</span> in Action
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Real tools designed for real concreters. Here's what you'll get.
            </p>
            
            {/* Feature 1: Job Management */}
            <div className="grid lg:grid-cols-2 gap-8 mb-16 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">
                  Complete Job Control
                </h3>
                <p className="text-muted-foreground mb-6">
                  Track every detail from concrete specs to test results. 
                  Manage multiple jobs with full visibility on progress, clients, and materials.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-foreground/80">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Concrete specs: MPa, slump, supplier, finish type</span>
                  </li>
                  <li className="flex items-center gap-3 text-foreground/80">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Project startup checklists</span>
                  </li>
                  <li className="flex items-center gap-3 text-foreground/80">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Multiple pours per job with scheduling</span>
                  </li>
                </ul>
              </div>
              <BrowserMockup
                src={jobDetailsScreenshot}
                alt="PourHub job details management showing concrete specifications"
                showCursor
              />
            </div>

            {/* Feature 2: Estimates */}
            <div className="grid lg:grid-cols-2 gap-8 mb-16 items-center">
              <BrowserMockup
                src={estimateScreenshot}
                alt="PourHub estimate calculator showing concrete costing modules"
                showCursor
                className="order-2 lg:order-1"
              />
              <div className="order-1 lg:order-2">
                <h3 className="text-2xl font-bold mb-4">
                  Quote Jobs in Minutes
                </h3>
                <p className="text-muted-foreground mb-6">
                  Built-in calculators for driveways, slabs, piers, footings and more. 
                  Select your scope, enter dimensions, and get accurate costing with GST automatically.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-foreground/80">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Modular calculators for every scope</span>
                  </li>
                  <li className="flex items-center gap-3 text-foreground/80">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Customizable price lists</span>
                  </li>
                  <li className="flex items-center gap-3 text-foreground/80">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Professional PDF quotes to email</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 3: Schedule */}
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">
                  Plan Your Week with Ease
                </h3>
                <p className="text-muted-foreground mb-6">
                  Drag and drop pours onto your calendar. See your week at a glance with 
                  job details, times, and addresses all in one view.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-foreground/80">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Week and month calendar views</span>
                  </li>
                  <li className="flex items-center gap-3 text-foreground/80">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Drag and drop scheduling</span>
                  </li>
                  <li className="flex items-center gap-3 text-foreground/80">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Quick site visit bookings</span>
                  </li>
                </ul>
              </div>
              <BrowserMockup
                src={scheduleScreenshot}
                alt="PourHub scheduling calendar showing weekly pour schedule"
                showCursor
              />
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary via-primary to-orange-dark py-16 px-4 animate-gradient-shift">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 mb-6">
              <Zap className="w-4 h-4 text-primary-foreground" />
              <span className="text-sm font-mono text-primary-foreground">Ready to deploy</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-4">
              Ready to Get Organized?
            </h3>
            <p className="text-primary-foreground/90 mb-8 max-w-xl mx-auto">
              Join concreting businesses across NSW who trust PourHub to manage their operations.
            </p>
            <Link to="/pricing">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6 touch-target group">
                See Pricing Plans
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-charcoal-dark py-8 px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <p className="text-muted-foreground text-sm mb-4 font-mono">
              {'// '} © {new Date().getFullYear()} PourHub. Operations management for NSW concreting businesses.
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

export default Index;
