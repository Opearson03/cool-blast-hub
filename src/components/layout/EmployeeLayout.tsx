import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, CalendarDays, User, LogOut, Menu, X, Users, Calendar } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { SubscriptionGate } from "@/components/subscription/SubscriptionGate";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useThemeOnAuth } from "@/hooks/useThemeOnAuth";

const navItems = [
  { href: "/employee", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employee/schedule", label: "Schedule", icon: Calendar },
  { href: "/employee/leave", label: "Leave", icon: CalendarDays },
  { href: "/employee/contacts", label: "Contacts", icon: Users },
  { href: "/employee/profile", label: "Profile", icon: User },
];

export function EmployeeLayout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Set dark mode as default for authenticated users
  useThemeOnAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <SubscriptionGate>
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <Link to="/employee" className="flex items-center gap-2">
          <Logo size="md" className="rounded-lg" />
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
        <div className="lg:hidden fixed inset-0 z-40 bg-background pt-16">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-lg touch-target",
                  location.pathname === item.href ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
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
          <Link to="/employee" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg overflow-hidden">
              <Logo className="w-full h-full" />
            </div>
            <span className="text-xl font-bold">PourHub</span>
          </Link>
          <ThemeToggle />
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                location.pathname === item.href ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3">
            <LogOut className="w-5 h-5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 p-4 lg:p-6 pb-24 lg:pb-6">
        {children}
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-2 flex justify-around safe-area-inset">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-lg touch-target transition-colors",
              location.pathname === item.href 
                ? "text-primary bg-primary/10" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
    </SubscriptionGate>
  );
}
