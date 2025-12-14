import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Briefcase, 
  Building
} from "lucide-react";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { UpcomingJobs } from "@/components/dashboard/UpcomingJobs";

export default function Admin() {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      } else {
        setTimeout(() => {
          checkAdminStatus(session.user.id);
        }, 0);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .single();
    
    setIsAdmin(!!data);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Welcome back, {user?.email}
            </p>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        </div>

        {/* KPI Stats */}
        <DashboardStats />

        {/* Upcoming Jobs and Pending Bookings */}
        <UpcomingJobs />

        {/* Navigation Cards */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Quick Access</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Link to="/admin/jobs">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <Briefcase className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>Jobs & Bookings</CardTitle>
                  <CardDescription>Manage bookings, jobs, and schedule</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link to="/admin/customers">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <Building className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>Customers</CardTitle>
                  <CardDescription>Manage customer relationships</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            {isAdmin && (
              <Link to="/admin/staff">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <Users className="h-8 w-8 mb-2 text-primary" />
                    <CardTitle>Staff Management</CardTitle>
                    <CardDescription>Team, schedule, timesheets & safety docs</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
