import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  businessId: string | null;
  refreshRoles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  
  // Track which user's roles we've loaded to prevent redundant fetches
  const loadedUserIdRef = useRef<string | null>(null);

  const fetchRolesAndBusiness = useCallback(async (userId: string) => {
    // Skip if we already loaded roles for this user
    if (loadedUserIdRef.current === userId) {
      setIsLoading(false);
      return;
    }

    try {
      const [
        { data: adminRole },
        { data: staffRole },
        { data: profile }
      ] = await Promise.all([
        supabase.rpc("has_role", { _role: "admin", _user_id: userId }),
        supabase.rpc("has_role", { _role: "staff", _user_id: userId }),
        supabase.from("profiles").select("business_id").eq("id", userId).maybeSingle()
      ]);

      setIsAdmin(!!adminRole);
      setIsStaff(!!staffRole);
      setBusinessId(profile?.business_id || null);
      loadedUserIdRef.current = userId;
    } catch (error) {
      console.error("Error fetching roles:", error);
      setIsAdmin(false);
      setIsStaff(false);
      setBusinessId(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshRoles = useCallback(async () => {
    if (user?.id) {
      // Force refresh by clearing the cached user id
      loadedUserIdRef.current = null;
      await fetchRolesAndBusiness(user.id);
    }
  }, [user?.id, fetchRolesAndBusiness]);

  useEffect(() => {
    // Safety timeout - prevent infinite loading
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('Auth loading timeout - forcing completion');
        setIsLoading(false);
      }
    }, 5000);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      
      if (initialSession?.user) {
        fetchRolesAndBusiness(initialSession.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        // Synchronous state updates only
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === "SIGNED_OUT") {
          setIsAdmin(false);
          setIsStaff(false);
          setBusinessId(null);
          loadedUserIdRef.current = null;
          setIsLoading(false);
        } else if (newSession?.user) {
          // Defer async operations with setTimeout(0) to prevent Supabase deadlock
          setTimeout(() => {
            fetchRolesAndBusiness(newSession.user.id);
          }, 0);
        }
      }
    );

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [fetchRolesAndBusiness]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAdmin,
        isStaff,
        businessId,
        refreshRoles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
