import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Building2, Mail, Phone, Globe, MapPin, LogOut, CheckCircle, Clock } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useToast } from "@/hooks/use-toast";

interface SupplierProfile {
  id: string;
  company_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  abn: string | null;
  categories: string[];
  description: string | null;
  logo_url: string | null;
  website: string | null;
  service_areas: string[];
  is_verified: boolean;
}

export default function SupplierDashboard() {
  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/suppliers");
        return;
      }

      const { data, error } = await supabase
        .from("supplier_profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        });
      }

      setProfile(data);
      setIsLoading(false);
    };

    fetchProfile();
  }, [navigate, toast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/suppliers");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="text-sm text-muted-foreground">Supplier Dashboard</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {profile ? (
          <div className="space-y-6">
            {/* Profile Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-3">
                      {profile.company_name}
                      {profile.is_verified ? (
                        <Badge className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Pending Verification
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {profile.description || "No description provided"}
                    </CardDescription>
                  </div>
                  {profile.logo_url && (
                    <img 
                      src={profile.logo_url} 
                      alt={profile.company_name}
                      className="h-16 w-16 object-contain rounded"
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Contact Details</h3>
                    <div className="space-y-2">
                      {profile.contact_name && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          <span>{profile.contact_name}</span>
                        </div>
                      )}
                      {profile.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{profile.email}</span>
                        </div>
                      )}
                      {profile.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{profile.phone}</span>
                        </div>
                      )}
                      {profile.website && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Globe className="h-4 w-4" />
                          <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {profile.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Business Details</h3>
                    <div className="space-y-2">
                      {profile.abn && (
                        <div className="text-muted-foreground">
                          <span className="font-medium">ABN:</span> {profile.abn}
                        </div>
                      )}
                      {profile.categories.length > 0 && (
                        <div>
                          <span className="font-medium text-muted-foreground">Categories:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {profile.categories.map((cat) => (
                              <Badge key={cat} variant="outline">{cat}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {profile.service_areas.length > 0 && (
                        <div>
                          <span className="font-medium text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-4 w-4" /> Service Areas:
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {profile.service_areas.map((area) => (
                              <Badge key={area} variant="secondary">{area}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Coming Soon Features */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-lg">Incoming RFQs</CardTitle>
                  <CardDescription>
                    View and respond to quote requests from contractors.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">Coming soon...</p>
                </CardContent>
              </Card>

              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-lg">Analytics</CardTitle>
                  <CardDescription>
                    Track your profile views and engagement.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">Coming soon...</p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Welcome, Supplier!</CardTitle>
              <CardDescription>
                Your profile is being set up. Please check back soon or contact support if you need assistance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                If you believe this is an error, please contact our team.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
