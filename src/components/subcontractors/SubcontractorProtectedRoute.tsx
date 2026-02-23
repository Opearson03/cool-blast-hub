import { useEffect, useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface SubcontractorProtectedRouteProps {
  children: React.ReactNode;
}

export function SubcontractorProtectedRoute({ children }: SubcontractorProtectedRouteProps) {
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

      const { data: isSub } = await supabase.rpc("is_subcontractor" as any, {
        _user_id: session.user.id,
      });

      setIsAuthorized(!!isSub);
      setIsLoading(false);
      checkedRef.current = true;
    };

    if (!checkedRef.current) {
      checkAuth();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setIsAuthorized(false);
        setIsLoading(false);
      }
    });

    const timeout = setTimeout(() => {
      if (isLoading) setIsLoading(false);
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
    return <Navigate to="/sub-contractors" replace />;
  }

  return <>{children}</>;
}
