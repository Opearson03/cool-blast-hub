import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, HardHat, ArrowLeft, Building2, UserPlus } from "lucide-react";

type AuthMode = "login" | "employee_signup" | "business_signup";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await redirectBasedOnRole(session.user.id);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        await redirectBasedOnRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const redirectBasedOnRole = async (userId: string) => {
    try {
      const [{ data: isAdmin }, { data: isStaff }] = await Promise.all([
        supabase.rpc("has_role", { _role: "admin", _user_id: userId }),
        supabase.rpc("has_role", { _role: "staff", _user_id: userId }),
      ]);

      if (isAdmin) {
        navigate("/admin");
      } else if (isStaff) {
        navigate("/employee");
      } else {
        await supabase.auth.signOut();
        toast({
          title: "Access Denied",
          description: "Your account has not been assigned a role yet. Please contact your administrator.",
          variant: "destructive",
        });
        setLoading(false);
      }
    } catch (error) {
      console.error("Error checking roles:", error);
      toast({
        title: "Error",
        description: "Failed to verify account permissions. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (authMode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "You've been successfully logged in.",
        });

        if (data.user) {
          await redirectBasedOnRole(data.user.id);
        }
      } else if (authMode === "business_signup") {
        // Business owner signup - no invite required
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/admin`,
            data: { 
              full_name: fullName,
              business_name: businessName,
              signup_type: "business_owner"
            },
          },
        });

        if (error) throw error;

        toast({
          title: "Account created!",
          description: "You can now log in with your credentials.",
        });
        setAuthMode("login");
        setEmail("");
        setPassword("");
        setFullName("");
        setBusinessName("");
      } else {
        // Employee signup - requires invite
        const { data: inviteData, error: inviteError } = await supabase
          .from("pending_invites")
          .select("*")
          .ilike("email", email)
          .is("accepted_at", null)
          .maybeSingle();

        if (inviteError) throw inviteError;
        if (!inviteData) {
          throw new Error("No pending invite found. Please contact your administrator.");
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/admin`,
            data: { full_name: fullName },
          },
        });

        if (error) throw error;

        toast({
          title: "Account created!",
          description: "You can now log in with your credentials.",
        });
        setAuthMode("login");
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

  const getTitle = () => {
    switch (authMode) {
      case "login": return "Sign In";
      case "business_signup": return "Start Your Business";
      case "employee_signup": return "Employee Sign Up";
    }
  };

  const getDescription = () => {
    switch (authMode) {
      case "login": return "Enter your credentials to access your account";
      case "business_signup": return "Create your business account to get started";
      case "employee_signup": return "Sign up with your invite to join your team";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-charcoal-dark">
      <div className="p-4">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <HardHat className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold">
                Pour<span className="text-primary">Hub</span>
              </span>
            </div>
            <CardTitle>{getTitle()}</CardTitle>
            <CardDescription>{getDescription()}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === "business_signup" && (
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Smith Concreting"
                    required
                    disabled={loading}
                    className="touch-target"
                  />
                </div>
              )}
              {authMode !== "login" && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Your Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={loading}
                    className="touch-target"
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
                  className="touch-target"
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
                  className="touch-target"
                />
              </div>
              <Button type="submit" className="w-full touch-target" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {authMode === "login" ? "Sign In" : authMode === "business_signup" ? "Create Business" : "Create Account"}
              </Button>
            </form>
            
            {authMode === "login" && (
              <div className="mt-6 space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full touch-target"
                  onClick={() => setAuthMode("business_signup")}
                  disabled={loading}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Start a New Business
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full touch-target"
                  onClick={() => setAuthMode("employee_signup")}
                  disabled={loading}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Have an invite? Join your team
                </Button>
              </div>
            )}
            
            {authMode !== "login" && (
              <div className="mt-4 text-center text-sm">
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className="text-primary hover:underline"
                  disabled={loading}
                >
                  Already have an account? Sign in
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
