import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
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

  const fetchRolesAndBusiness = useCallback(async (userId: string) => {
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
    } catch (error) {
      console.error("Error fetching roles:", error);
      setIsAdmin(false);
      setIsStaff(false);
      setBusinessId(null);
    }
  }, []);

  const refreshRoles = useCallback(async () => {
    if (user?.id) {
      await fetchRolesAndBusiness(user.id);
    }
  }, [user?.id, fetchRolesAndBusiness]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      
      if (initialSession?.user) {
        fetchRolesAndBusiness(initialSession.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === "SIGNED_OUT") {
          setIsAdmin(false);
          setIsStaff(false);
          setBusinessId(null);
          setIsLoading(false);
        } else if (newSession?.user) {
          await fetchRolesAndBusiness(newSession.user.id);
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
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
