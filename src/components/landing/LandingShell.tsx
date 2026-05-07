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
 * Minimal shell for ad landing pages: tiny header (logo + single CTA),
 * sticky bottom CTA on mobile, and a stripped-down footer.
 */
export function LandingShell({
  children,
  ctaHref,
  ctaLabel = "Get started",
  onCtaClick,
}: LandingShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Logo />
          <Button asChild size="sm" onClick={onCtaClick}>
            <Link to={ctaHref}>
              {ctaLabel} <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-card py-6">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} PourHub</p>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
