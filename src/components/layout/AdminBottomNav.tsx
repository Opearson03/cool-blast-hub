import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Briefcase, FileText, Calendar, Users, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlatform } from "@/hooks/usePlatform";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "@/hooks/use-toast";

interface BottomNavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  requiresPro?: boolean;
}

const bottomNavItems: BottomNavItem[] = [
  { href: "/admin", label: "Home", icon: LayoutDashboard, requiresPro: true },
  { href: "/admin/jobs", label: "Jobs", icon: Briefcase, requiresPro: true },
  { href: "/admin/estimates", label: "Quotes", icon: FileText, requiresPro: false },
  { href: "/admin/schedule", label: "Schedule", icon: Calendar, requiresPro: true },
  { href: "/admin/people", label: "People", icon: Users, requiresPro: true },
];

export function AdminBottomNav() {
  const location = useLocation();
  const { isNative } = usePlatform();
  const { hasFullAppAccess } = useSubscription();

  const handleLockedClick = (e: React.MouseEvent, item: BottomNavItem) => {
    e.preventDefault();
    toast({
      title: "PourHub Pro feature",
      description: `Upgrade to Pro to unlock ${item.label}.`,
    });
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border px-1 py-1.5 flex justify-around"
      style={isNative ? { paddingBottom: 'env(safe-area-inset-bottom)' } : undefined}
    >
      {bottomNavItems.map((item) => {
        const isActive = location.pathname === item.href;
        const isLocked = item.requiresPro && !hasFullAppAccess;

        if (isLocked) {
          return (
            <button
              key={item.href}
              onClick={(e) => handleLockedClick(e, item)}
              className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg touch-target text-muted-foreground/50"
            >
              <div className="relative">
                <item.icon className="w-5 h-5 opacity-50" />
                <Lock className="w-2.5 h-2.5 absolute -top-0.5 -right-1 opacity-60" />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        }

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
