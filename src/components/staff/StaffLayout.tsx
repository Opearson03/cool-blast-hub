import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Clock,
  User,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

const menuItems = [
  { title: "Dashboard", url: "/staff", icon: LayoutDashboard },
  { title: "My Shifts", url: "/staff/shifts", icon: Calendar },
  { title: "SWMS to Sign", url: "/staff/swms", icon: FileText },
  { title: "My Timesheets", url: "/staff/timesheets", icon: Clock },
  { title: "My Profile", url: "/staff/profile", icon: User },
];

interface StaffLayoutProps {
  children: React.ReactNode;
}

export function StaffLayout({ children }: StaffLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [pendingSWMSCount, setPendingSWMSCount] = useState(0);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    fetchPendingSWMS();
    fetchUserName();
  }, []);

  const fetchUserName = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", session.user.id)
        .single();
      
      if (data) setUserName(data.full_name);
    }
  };

  const fetchPendingSWMS = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("swms_documents")
      .select(`
        id,
        job_assignments!inner(staff_id)
      `)
      .eq("job_assignments.staff_id", session.user.id)
      .eq("status", "approved");

    if (data) {
      const unsignedCount = await Promise.all(
        data.map(async (swms) => {
          const { data: signoff } = await supabase
            .from("swms_signoffs")
            .select("id")
            .eq("swms_id", swms.id)
            .eq("staff_id", session.user.id)
            .single();
          return !signoff;
        })
      );

      setPendingSWMSCount(unsignedCount.filter(Boolean).length);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
    navigate("/auth");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-lg font-bold mb-2">
                Staff Portal
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <NavLink
                            to={item.url}
                            className="flex items-center gap-2"
                            activeClassName="bg-accent text-accent-foreground"
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                            {item.title === "SWMS to Sign" && pendingSWMSCount > 0 && (
                              <Badge variant="destructive" className="ml-auto">
                                {pendingSWMSCount}
                              </Badge>
                            )}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          
          <SidebarFooter>
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {userName}
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <div className="border-b">
            <div className="flex h-16 items-center px-6">
              <SidebarTrigger />
            </div>
          </div>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
