import { Link } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ReactNode } from "react";

interface LandingShellProps {
  children: ReactNode;
  ctaHref: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
}

/**
 * Minimal shell for ad landing pages: matches the main landing page chrome
 * (dark charcoal sticky header with PourHub wordmark, dark footer).
 */
export function LandingShell({
  children,
  ctaHref,
  ctaLabel = "Get started",
  onCtaClick,
}: LandingShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 bg-charcoal-dark/95 backdrop-blur-md border-b border-border/30">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <Logo size="sm" className="w-8 h-8 rounded-lg" />
            <span className="text-lg font-display font-bold text-primary-foreground">
              Pour<span className="text-primary">Hub</span>
            </span>
          </Link>
          <Button asChild size="sm" className="font-medium" onClick={onCtaClick}>
            <Link to={ctaHref}>
              {ctaLabel} <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-charcoal-dark border-t border-border/30 py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-primary-foreground/70">
          <p>© {new Date().getFullYear()} PourHub</p>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-primary-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-primary-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
