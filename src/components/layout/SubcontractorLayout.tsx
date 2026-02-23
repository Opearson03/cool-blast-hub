import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Briefcase, Calendar, Settings, LogOut, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useThemeOnAuth } from "@/hooks/useThemeOnAuth";
import { usePlatform } from "@/hooks/usePlatform";
import { SubcontractorBottomNav } from "./SubcontractorBottomNav";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: "/sub-contractors/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sub-contractors/work", label: "My Work", icon: Briefcase },
  { href: "/sub-contractors/schedule", label: "Schedule", icon: Calendar },
  { href: "/sub-contractors/settings", label: "Settings", icon: Settings },
];

export function SubcontractorLayout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isNative } = usePlatform();

  useThemeOnAuth();

  const handleLogout = async () => {
    queryClient.clear();
    await supabase.auth.signOut();
    navigate("/sub-contractors");
  };

  const renderNavItem = (item: NavItem, isMobile: boolean = false) => {
    const isActive = location.pathname === item.href;

    return (
      <Link
        key={item.href}
        to={item.href}
        onClick={() => isMobile && setMobileMenuOpen(false)}
        className={cn(
          isMobile
            ? "flex items-center gap-3 px-4 py-3 rounded-lg text-lg touch-target"
            : "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted"
        )}
      >
        <item.icon className="w-5 h-5" />
        <span className="flex-1">{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between"
        style={isNative ? { paddingTop: 'calc(env(safe-area-inset-top) + 8px)' } : undefined}
      >
        <Link to="/sub-contractors/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            <Logo className="w-full h-full" />
          </div>
          <span className="font-bold">PourHub</span>
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
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link to="/sub-contractors/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg overflow-hidden">
              <Logo className="w-full h-full" />
            </div>
            <span className="text-xl font-bold">PourHub</span>
          </Link>
          <ThemeToggle />
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => renderNavItem(item, false))}
        </nav>
        <div className="p-4 border-t border-border">
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3">
            <LogOut className="w-5 h-5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className="lg:ml-64 p-4 lg:p-6 pt-20 lg:pt-6 pb-20 lg:pb-6 overflow-x-hidden max-w-full"
        style={isNative ? {
          paddingTop: 'calc(env(safe-area-inset-top) + 72px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 72px)'
        } : undefined}
      >
        <div className="w-full max-w-full overflow-x-auto">
          {children}
        </div>
      </main>

      <SubcontractorBottomNav />
    </div>
  );
}
