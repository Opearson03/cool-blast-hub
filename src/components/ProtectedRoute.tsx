import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: "admin" | "staff";
}

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"admin" | "staff" | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    setIsAuthenticated(true);

    try {
      const [
        { data: isAdmin, error: adminError },
        { data: isStaff, error: staffError },
      ] = await Promise.all([
        supabase.rpc("has_role", {
          _role: "admin",
          _user_id: session.user.id,
        }),
        supabase.rpc("has_role", {
          _role: "staff",
          _user_id: session.user.id,
        }),
      ]);

      if (adminError) {
        console.error("Error checking admin role:", adminError);
      }
      if (staffError) {
        console.error("Error checking staff role:", staffError);
      }

      if (isAdmin) {
        setUserRole("admin");
      } else if (isStaff) {
        setUserRole("staff");
      } else {
        setUserRole(null);
      }
    } catch (error) {
      console.error("Error checking roles:", error);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (userRole !== allowedRole) {
    if (userRole === "admin") {
      return <Navigate to="/admin" replace />;
    }
    if (userRole === "staff") {
      return <Navigate to="/staff" replace />;
    }
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
