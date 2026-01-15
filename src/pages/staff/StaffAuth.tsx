import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import Logo from "@/components/ui/Logo";

export default function StaffAuth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Check if user has pourhub_staff role
        const { data: isStaff } = await supabase.rpc("is_pourhub_staff", {
          _user_id: session.user.id,
        });
        
        if (isStaff) {
          navigate("/staff/dashboard");
        }
      }
      setIsCheckingAuth(false);
    };

    checkExistingSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.user) {
        // Check if user has pourhub_staff role
        const { data: isStaff, error: roleError } = await supabase.rpc("is_pourhub_staff", {
          _user_id: data.user.id,
        });

        if (roleError) {
          toast.error("Failed to verify staff access");
          await supabase.auth.signOut();
          return;
        }

        if (!isStaff) {
          toast.error("Access denied. This portal is for PourHub staff only.");
          await supabase.auth.signOut();
          return;
        }

        toast.success("Welcome back!");
        navigate("/staff/dashboard");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Logo className="h-12" />
          </div>
          <div className="flex items-center justify-center gap-2 text-primary">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wide">Staff Portal</span>
          </div>
          <CardTitle className="text-2xl">Staff Login</CardTitle>
          <CardDescription>
            Access the PourHub internal dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@pourhub.com.au"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
