import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Briefcase, Calendar, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlatform } from "@/hooks/usePlatform";

const bottomNavItems = [
  { href: "/sub-contractors/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/sub-contractors/work", label: "Work", icon: Briefcase },
  { href: "/sub-contractors/schedule", label: "Schedule", icon: Calendar },
  { href: "/sub-contractors/settings", label: "Settings", icon: Settings },
];

export function SubcontractorBottomNav() {
  const location = useLocation();
  const { isNative } = usePlatform();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border px-1 py-1.5 flex justify-around"
      style={isNative ? { paddingBottom: 'env(safe-area-inset-bottom)' } : undefined}
    >
      {bottomNavItems.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg touch-target transition-colors",
              isActive
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
