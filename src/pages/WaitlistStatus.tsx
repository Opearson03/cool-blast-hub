import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowLeft, Crown, Gift, Share2, Users, Trophy, Copy, MessageCircle, Mail, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "@/components/ui/Logo";

interface WaitlistStatus {
  found: boolean;
  id?: string;
  full_name?: string;
  referral_count?: number;
  referral_code?: string;
  vip_status?: boolean;
  founder_status?: boolean;
  founder_reward?: string;
  bonus_estimates?: number;
  base_position?: number;
  effective_position?: number;
  spots_jumped?: number;
  created_at?: string;
}

export default function WaitlistStatus() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<WaitlistStatus | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_waitlist_by_email', { _email: email.trim() });
      
      if (error) throw error;
      
      const result = data as unknown as WaitlistStatus;
      if (!result?.found) {
        toast.error("Email not found on waitlist");
        setStatus(null);
      } else {
        setStatus(result);
      }
    } catch (error) {
      console.error("Error looking up status:", error);
      toast.error("Failed to look up status");
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferralCode = () => {
    if (status?.referral_code) {
      navigator.clipboard.writeText(status.referral_code);
      toast.success("Code copied!");
    }
  };

  const copyReferralLink = () => {
    if (status?.referral_code) {
      const link = `${window.location.origin}?ref=${status.referral_code}`;
      navigator.clipboard.writeText(link);
      toast.success("Link copied!");
    }
  };

  const shareViaWhatsApp = () => {
    if (status?.referral_code) {
      const link = `${window.location.origin}?ref=${status.referral_code}`;
      const message = `Join me on PourHub - the ultimate tool for Aussie concreters! Use my code ${status.referral_code} and we both get 1 month FREE: ${link}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const shareViaSMS = () => {
    if (status?.referral_code) {
      const link = `${window.location.origin}?ref=${status.referral_code}`;
      const message = `Join me on PourHub! Use my code ${status.referral_code} and we both get 1 month FREE: ${link}`;
      window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const progressToVip = status ? Math.min(100, (status.referral_count || 0) / 3 * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <Logo className="h-8" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Check Your Waitlist Status</h1>
          <p className="text-muted-foreground">Enter your email to see your position and referral progress</p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleLookup} className="flex gap-3">
              <Input
                type="email"
                placeholder="Enter your email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Look Up"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {status?.found && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Founder Badge */}
            {status.founder_status && (
              <Card className="border-2 border-yellow-500 bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-yellow-500/20">
                      <Crown className="h-8 w-8 text-yellow-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-yellow-500">🎉 You're a Founding Member!</h3>
                      <p className="text-muted-foreground">As one of our first 10 signups, you get <strong>1 YEAR FREE</strong> when we launch!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* VIP Badge */}
            {status.vip_status && !status.founder_status && (
              <Card className="border-2 border-primary bg-primary/10">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/20">
                      <Trophy className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-primary">🌟 VIP Status Achieved!</h3>
                      <p className="text-muted-foreground">You've earned early access + 5 bonus quotes!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Position Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Your Position
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted">
                    <div className="text-4xl font-bold text-primary">#{status.effective_position}</div>
                    <div className="text-sm text-muted-foreground">Current Position</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted">
                    <div className="text-4xl font-bold text-green-500">+{status.spots_jumped}</div>
                    <div className="text-sm text-muted-foreground">Spots Jumped</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Referral Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Referral Progress
                </CardTitle>
                <CardDescription>
                  You've referred <strong>{status.referral_count}</strong> mate{status.referral_count !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!status.vip_status && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress to VIP</span>
                      <span>{status.referral_count}/3 referrals</span>
                    </div>
                    <Progress value={progressToVip} className="h-2" />
                  </div>
                )}

                <div className="space-y-3">
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${(status.referral_count || 0) >= 1 ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted'}`}>
                    <Badge variant={(status.referral_count || 0) >= 1 ? "default" : "secondary"}>
                      {(status.referral_count || 0) >= 1 ? '✓' : '1'}
                    </Badge>
                    <div>
                      <div className="font-medium">Refer 1 mate</div>
                      <div className="text-sm text-muted-foreground">Jump 50 spots + 1 month FREE each</div>
                    </div>
                  </div>

                  <div className={`flex items-center gap-3 p-3 rounded-lg ${status.vip_status ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted'}`}>
                    <Badge variant={status.vip_status ? "default" : "secondary"}>
                      {status.vip_status ? '✓' : '3'}
                    </Badge>
                    <div>
                      <div className="font-medium">Refer 3 mates</div>
                      <div className="text-sm text-muted-foreground">Guaranteed early access + 5 bonus quotes</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Share & Earn
                </CardTitle>
                <CardDescription>
                  Your referral code: <strong className="text-primary">{status.referral_code}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={copyReferralCode} className="flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    Copy Code
                  </Button>
                  <Button variant="outline" onClick={copyReferralLink} className="flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    Copy Link
                  </Button>
                  <Button onClick={shareViaWhatsApp} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Button>
                  <Button onClick={shareViaSMS} variant="secondary" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    SMS
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
