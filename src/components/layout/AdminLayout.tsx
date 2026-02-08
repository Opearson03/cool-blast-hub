import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Briefcase, Calendar, Users, FileText, Settings, LogOut, Menu, X, Lock, Crown, Loader2 } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { SubscriptionGate } from "@/components/subscription/SubscriptionGate";
import { FullAppAccessGate } from "@/components/subscription/FullAppAccessGate";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useThemeOnAuth } from "@/hooks/useThemeOnAuth";
import { usePlatform } from "@/hooks/usePlatform";
import { useSubscription } from "@/hooks/useSubscription";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { AdminBottomNav } from "./AdminBottomNav";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  requiresPro?: boolean;
}

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, requiresPro: true },
  { href: "/admin/jobs", label: "Jobs", icon: Briefcase, requiresPro: true },
  { href: "/admin/estimates", label: "Quotes", icon: FileText, requiresPro: false },
  { href: "/admin/schedule", label: "Schedule", icon: Calendar, requiresPro: true },
  { href: "/admin/contacts", label: "Contact", icon: Users, requiresPro: true },
  { href: "/admin/settings", label: "Settings", icon: Settings, requiresPro: false },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isNative } = usePlatform();
  const { tier, isExempt, hasFullAppAccess } = useSubscription();
  
  // Set dark mode as default for authenticated users
  useThemeOnAuth();

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { upgrade: true, tier: "pro" },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      toast({
        title: "Upgrade failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleLogout = async () => {
    // Clear all cached queries before signing out to prevent cross-business data leakage
    queryClient.clear();
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleLockedItemClick = (e: React.MouseEvent, item: NavItem) => {
    e.preventDefault();
    toast({
      title: "PourHub Pro feature",
      description: `Upgrade to Pro to unlock ${item.label}, Jobs, Schedule, and Contacts.`,
    });
  };

  const renderNavItem = (item: NavItem, isMobile: boolean = false) => {
    const isActive = location.pathname === item.href;
    const isLocked = item.requiresPro && !hasFullAppAccess;
    
    const baseClasses = cn(
      isMobile
        ? "flex items-center gap-3 px-4 py-3 rounded-lg text-lg touch-target"
        : "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
      isActive && !isLocked
        ? "bg-primary text-primary-foreground" 
        : isLocked
          ? "text-muted-foreground/60 cursor-not-allowed"
          : "hover:bg-muted"
    );

    // If locked, render as a non-navigating element
    if (isLocked) {
      return (
        <div
          key={item.href}
          role="button"
          aria-disabled="true"
          tabIndex={-1}
          onClick={(e) => handleLockedItemClick(e, item)}
          className={baseClasses}
        >
          <item.icon className="w-5 h-5 opacity-50" />
          <span className="flex-1 opacity-70">{item.label}</span>
          <Lock className="w-4 h-4 opacity-50" />
        </div>
      );
    }
    
    return (
      <Link
        key={item.href}
        to={item.href}
        onClick={() => isMobile && setMobileMenuOpen(false)}
        className={baseClasses}
      >
        <item.icon className="w-5 h-5" />
        <span className="flex-1">{item.label}</span>
      </Link>
    );
  };

  // Determine logo link based on access level
  const logoLink = hasFullAppAccess ? "/admin" : "/admin/estimates";

  // Tier display badge
  const TierBadge = () => {
    if (isExempt) {
      return <Badge variant="secondary" className="text-xs">Demo</Badge>;
    }
    if (tier === "pro" || tier === "standard") {
      return <Badge className="text-xs bg-primary/20 text-primary border-primary/30">Pro</Badge>;
    }
    if (tier === "estimating") {
      return <Badge variant="secondary" className="text-xs">Estimating</Badge>;
    }
    return <Badge variant="outline" className="text-xs">Free</Badge>;
  };

  return (
    <SubscriptionGate>
      <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header 
        className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between"
        style={isNative ? { paddingTop: 'calc(env(safe-area-inset-top) + 8px)' } : undefined}
      >
        <Link to={logoLink} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            <Logo className="w-full h-full" />
          </div>
          <span className="font-bold">PourHub</span>
          <TierBadge />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background" style={isNative ? { paddingTop: 'calc(env(safe-area-inset-top) + 48px)' } : { paddingTop: '56px' }}>
          <nav className="p-4 space-y-2">
            {navItems.map((item) => renderNavItem(item, true))}
            <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3 px-4 py-3 text-lg touch-target">
              <LogOut className="w-5 h-5" />
              Sign Out
            </Button>
            
            {/* Upgrade prompt for non-pro users */}
            {!hasFullAppAccess && (
              <div className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-primary">Upgrade to Pro</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Unlock jobs, scheduling, and full business management.
                </p>
                <Button 
                  size="sm" 
                  className="w-full" 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleUpgrade();
                  }}
                  disabled={isUpgrading}
                >
                  {isUpgrading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Upgrade Now
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link to={logoLink} className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg overflow-hidden">
              <Logo className="w-full h-full" />
            </div>
            <span className="text-xl font-bold">PourHub</span>
          </Link>
          <div className="flex items-center gap-2">
            <TierBadge />
            <ThemeToggle />
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => renderNavItem(item, false))}
        </nav>
        
        {/* Upgrade prompt for non-pro users */}
        {!hasFullAppAccess && (
          <div className="p-4 border-t border-border">
            <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Upgrade to Pro</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Unlock all features
              </p>
              <Button 
                size="sm" 
                className="w-full text-xs" 
                onClick={handleUpgrade}
                disabled={isUpgrading}
              >
                {isUpgrading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Upgrade Now
              </Button>
            </div>
          </div>
        )}
        
        <div className="p-4 border-t border-border">
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3">
            <LogOut className="w-5 h-5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content - header is ~56px + safe-area on native, bottom nav is ~60px on mobile */}
      <main 
        className="lg:ml-64 p-4 lg:p-6 pt-20 lg:pt-6 pb-20 lg:pb-6 overflow-x-hidden max-w-full"
        style={isNative ? { 
          paddingTop: 'calc(env(safe-area-inset-top) + 72px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 72px)'
        } : undefined}
      >
        <div className="w-full max-w-full overflow-x-auto">
          <FullAppAccessGate>
            {children}
          </FullAppAccessGate>
        </div>
      </main>

      {/* Bottom Navigation - Mobile/Tablet Only */}
      <AdminBottomNav />
    </div>
    </SubscriptionGate>
  );
}
