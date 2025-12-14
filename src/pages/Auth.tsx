import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in and redirect based on role
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;

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
          console.error("Error checking admin role on mount:", adminError);
        }
        if (staffError) {
          console.error("Error checking staff role on mount:", staffError);
        }

        if (isAdmin) {
          navigate("/admin");
        } else if (isStaff) {
          navigate("/staff");
        }
      } catch (error) {
        console.error("Error checking roles on mount:", error);
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error || !data?.user) throw error || new Error("Login failed");

        // Check user role and redirect accordingly using backend function
        try {
          const [
            { data: isAdmin, error: adminError },
            { data: isStaff, error: staffError },
          ] = await Promise.all([
            supabase.rpc("has_role", {
              _role: "admin",
              _user_id: data.user.id,
            }),
            supabase.rpc("has_role", {
              _role: "staff",
              _user_id: data.user.id,
            }),
          ]);

          if (adminError) {
            console.error("Error checking admin role on login:", adminError);
          }
          if (staffError) {
            console.error("Error checking staff role on login:", staffError);
          }

          toast({
            title: "Welcome back!",
            description: "You've been successfully logged in.",
          });

          if (isAdmin) {
            navigate("/admin");
          } else if (isStaff) {
            navigate("/staff");
          } else {
            // Fallback if no role is found
            navigate("/");
          }
        } catch (error) {
          console.error("Error checking roles after login:", error);
          navigate("/");
        }
      } else {
        // Check if user has a pending invite (case-insensitive email)
        const { data: inviteData, error: inviteError } = await supabase
          .from("pending_invites")
          .select("*")
          .ilike("email", email)
          .is("accepted_at", null)
          .single();

        if (inviteError || !inviteData) {
          throw new Error("No pending invite found. Please contact an administrator.");
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/admin`,
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        toast({
          title: "Account created!",
          description: "You can now log in with your credentials.",
        });
        setIsLogin(true);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isLogin ? "Sign In" : "Create Account"}</CardTitle>
          <CardDescription>
            {isLogin
              ? "Enter your credentials to access the admin panel"
              : "Sign up with your invite to get started"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline"
              disabled={loading}
            >
              {isLogin
                ? "Have an invite? Create account"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
