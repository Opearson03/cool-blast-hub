import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Capacitor } from '@capacitor/core';
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Building2, UserPlus } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { usePlatform } from "@/hooks/usePlatform";

type AuthMode = "login" | "employee_signup";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get("mode");
  const emailParam = searchParams.get("email");
  
  const [email, setEmail] = useState(emailParam || "");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  
  const [authMode, setAuthMode] = useState<AuthMode>(modeParam === "signup" ? "employee_signup" : "login");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const { isNative } = usePlatform();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        // Set dark mode on successful login
        setTheme("dark");
        setTimeout(() => {
          void redirectBasedOnRole(session.user.id);
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setTheme("dark");
        setTimeout(() => {
          void redirectBasedOnRole(session.user.id);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, setTheme]);

  const redirectBasedOnRole = async (userId: string) => {
    try {
      const [{ data: isAdmin }, { data: isStaff }, { data: isSub }] = await Promise.all([
        supabase.rpc("has_role", { _role: "admin", _user_id: userId }),
        supabase.rpc("has_role", { _role: "staff", _user_id: userId }),
        supabase.rpc("is_subcontractor", { _user_id: userId }),
      ]);

      if (isAdmin) {
        navigate("/admin");
        return;
      }

      if (isStaff) {
        navigate("/employee");
        return;
      }

      if (isSub) {
        navigate("/sub-contractors/dashboard");
        return;
      }

      // If no role yet, try to accept any pending invite for this user's email, then re-check
      const { error: acceptErr } = await supabase.functions.invoke("accept-invite", { body: {} });
      if (!acceptErr) {
        const [{ data: isAdmin2 }, { data: isStaff2 }, { data: isSub2 }] = await Promise.all([
          supabase.rpc("has_role", { _role: "admin", _user_id: userId }),
          supabase.rpc("has_role", { _role: "staff", _user_id: userId }),
          supabase.rpc("is_subcontractor", { _user_id: userId }),
        ]);

        if (isAdmin2) {
          navigate("/admin");
          return;
        }
        if (isStaff2) {
          navigate("/employee");
          return;
        }
        if (isSub2) {
          navigate("/sub-contractors/dashboard");
          return;
        }
      }

      await supabase.auth.signOut();
      toast({
        title: "Access Denied",
        description: "Your account has not been assigned a role yet. Please contact your administrator.",
        variant: "destructive",
      });
      setLoading(false);
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
          setTheme("dark");
          // Redirect will be handled by auth state change listener
        }
      } else {
        // Employee signup - requires invite
        const normalizedEmail = email.toLowerCase().trim();
        
        // First verify the invite exists and get role info
        const { data: verifyData, error: verifyError } = await supabase.functions.invoke("verify-invite", {
          body: { email: normalizedEmail },
        });

        if (verifyError) {
          throw new Error("Failed to verify invitation. Please try again.");
        }

        if (!verifyData?.valid) {
          throw new Error(verifyData?.error || "No pending invitation found for this email address. Please contact your administrator.");
        }

        // Use the name from the invite if user didn't provide one
        const signupName = fullName || verifyData.fullName || normalizedEmail.split("@")[0];
        
        // Include signup_type and role in metadata for the trigger
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: { 
              full_name: signupName,
              signup_type: "employee_invite",
              invite_role: verifyData.role,
              invite_id: verifyData.inviteId,
              business_id: verifyData.businessId
            },
          },
        });

        if (signupError) {
          // Check if user already exists
          if (signupError.message.includes("already registered")) {
            throw new Error("An account with this email already exists. Please sign in instead, and your invite will be processed automatically.");
          }
          throw signupError;
        }

        // If signup succeeded but user already existed (auto-confirm scenario), process invite
        if (signupData?.user && !signupData?.session) {
          toast({
            title: "Account created!",
            description: "You can now log in with your credentials.",
          });
        } else if (signupData?.session) {
          // User was auto-confirmed and logged in - process invite
          try {
            await supabase.functions.invoke("accept-invite", {
              body: { email: normalizedEmail },
            });
          } catch {
            // Ignore - trigger should have handled it
          }
          toast({
            title: "Welcome to the team!",
            description: "Your account has been created.",
          });
          setTheme("dark");
          await redirectBasedOnRole(signupData.user.id);
          return;
        }
        
        setAuthMode("login");
        setEmail(normalizedEmail);
        setPassword("");
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
    return authMode === "login" ? "Sign In" : "Employee Sign Up";
  };

  const getDescription = () => {
    return authMode === "login" 
      ? "Enter your credentials to access your account" 
      : "Sign up with your invite to join your team";
  };

  const isNativeDevice = Capacitor.isNativePlatform();

  return (
    <div 
      className="min-h-screen flex flex-col bg-background"
      style={isNative ? { paddingTop: 'env(safe-area-inset-top)' } : undefined}
    >
      {!isNativeDevice && (
        <div className="p-4">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors min-h-[44px]">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      )}
      
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg overflow-hidden">
                <Logo className="w-full h-full" />
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {authMode === "login" && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!email) {
                          toast({
                            title: "Email required",
                            description: "Please enter your email address first.",
                            variant: "destructive",
                          });
                          return;
                        }
                        setLoading(true);
                        try {
                          const { data, error } = await supabase.functions.invoke("send-password-reset", {
                            body: { 
                              email: email.toLowerCase().trim(),
                              // Always send users to the website reset page (not the preview domain)
                              redirectTo: "https://pourhub.com.au/reset-password",
                            },
                          });
                          
                          if (error) throw error;
                          
                          toast({
                            title: "Password reset email sent",
                            description: "Check your email for a link to reset your password.",
                          });
                        } catch (err: any) {
                          toast({
                            title: "Password reset email sent",
                            description: "If an account exists, you'll receive a reset link.",
                          });
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="text-xs text-primary hover:underline"
                      disabled={loading}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
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
                {authMode === "login" ? "Sign In" : "Create Account"}
              </Button>
            </form>
            
            {authMode === "login" && !isNativeDevice && (
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
                  onClick={() => navigate("/pricing")}
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
            
            {isNativeDevice && authMode === "login" && (
              <div className="mt-4 space-y-3">
                <p className="text-center text-xs text-muted-foreground">
                  To create an account, please visit pourhub.com.au on a web browser.
                </p>
                <div className="flex justify-center gap-4 text-xs">
                  <Link to="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  <Link to="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>
                </div>
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
