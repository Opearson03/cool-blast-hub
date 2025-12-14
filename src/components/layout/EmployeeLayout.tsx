import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { HardHat, LayoutDashboard, CalendarDays, User, LogOut, Menu, X, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/employee", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employee/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/employee/contacts", label: "Contacts", icon: Users },
  { href: "/employee/profile", label: "Profile", icon: User },
];

export function EmployeeLayout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <Link to="/employee" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <HardHat className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold">PourHub</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background pt-16">
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

      {/* Main Content */}
      <main className="pt-16 p-4 safe-area-inset">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-2 flex justify-around safe-area-inset">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-lg touch-target",
              location.pathname === item.href ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
