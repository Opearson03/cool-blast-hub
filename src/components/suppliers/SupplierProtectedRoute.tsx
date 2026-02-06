import { useEffect, useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface SupplierProtectedRouteProps {
  children: React.ReactNode;
}

export function SupplierProtectedRoute({ children }: SupplierProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const checkedRef = useRef(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsLoading(false);
        return;
      }

      const { data: isSupplier } = await supabase.rpc("is_supplier", {
        _user_id: session.user.id,
      });

      setIsAuthorized(!!isSupplier);
      setIsLoading(false);
      checkedRef.current = true;
    };

    // Only check once on mount
    if (!checkedRef.current) {
      checkAuth();
    }

    // CRITICAL: Keep callback synchronous to avoid deadlock
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // Only re-check on sign out to avoid loops
      if (event === 'SIGNED_OUT') {
        setIsAuthorized(false);
        setIsLoading(false);
      }
    });

    // Safety timeout
    const timeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/suppliers" replace />;
  }

  return <>{children}</>;
}
