import { Link } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ReactNode } from "react";

interface LandingShellProps {
  children: ReactNode;
  /** When omitted, no CTA button is rendered in the header. */
  ctaHref?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  /** Optional secondary text link rendered to the left of the CTA (e.g. "Sign in"). */
  secondaryHref?: string;
  secondaryLabel?: string;
}

/**
 * Standard chrome for all public/marketing pages: dark charcoal sticky header with
 * PourHub wordmark, optional CTA + secondary link, and a slim dark footer.
 */
export function LandingShell({
  children,
  ctaHref,
  ctaLabel = "Get started",
  onCtaClick,
  secondaryHref,
  secondaryLabel,
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
          <div className="flex items-center gap-2">
            {secondaryHref && secondaryLabel && (
              <Link
                to={secondaryHref}
                className="px-3 py-2 text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                {secondaryLabel}
              </Link>
            )}
            {ctaHref && (
              <Button asChild size="sm" className="font-medium" onClick={onCtaClick}>
                <Link to={ctaHref}>
                  {ctaLabel} <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            )}
            {!ctaHref && onCtaClick && (
              <Button size="sm" className="font-medium" onClick={onCtaClick}>
                {ctaLabel} <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            )}
          </div>
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
