import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: "admin" | "staff";
}

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { user, isLoading, isAdmin, isStaff } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const userRole = isAdmin ? "admin" : isStaff ? "staff" : null;

  if (userRole !== allowedRole) {
    if (userRole === "admin") {
      return <Navigate to="/admin" replace />;
    }
    if (userRole === "staff") {
      return <Navigate to="/employee" replace />;
    }
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
