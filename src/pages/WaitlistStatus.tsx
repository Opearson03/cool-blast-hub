import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Gift, Share2, Copy, MessageCircle, Mail, Loader2, CalendarCheck } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "@/components/ui/Logo";

interface WaitlistStatus {
  found: boolean;
  id?: string;
  full_name?: string;
  referral_count?: number;
  referral_code?: string;
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
      const message = `Join me on PourHub! We'll both get a month FREE: ${link}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const shareViaSMS = () => {
    if (status?.referral_code) {
      const link = `${window.location.origin}?ref=${status.referral_code}`;
      const message = `Join me on PourHub! We'll both get a month FREE: ${link}`;
      window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const referralCount = status?.referral_count || 0;
  const freeMonths = 1 + referralCount;

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
          <p className="text-muted-foreground">Enter your email to see your free months and referral progress</p>
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
            {/* Free Months Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5 text-primary" />
                  Free Months Earned
                </CardTitle>
                <CardDescription>
                  {status.full_name ? `Hey ${status.full_name}!` : 'Here\'s your reward summary'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center p-6 rounded-lg bg-muted">
                  <div className="text-5xl font-bold text-primary mb-2">{freeMonths}</div>
                  <div className="text-sm text-muted-foreground">
                    free month{freeMonths !== 1 ? 's' : ''} when PourHub launches
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    1 for joining{referralCount > 0 ? ` + ${referralCount} from referrals` : ''}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Referral Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Want More Free Months?
                </CardTitle>
                <CardDescription>
                  Refer a mate — when they join the waitlist, you <strong>both</strong> get an extra month FREE. No cap!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center p-4 rounded-lg bg-muted mb-4">
                  <div className="text-sm text-muted-foreground">You've referred</div>
                  <div className="text-3xl font-bold text-foreground">{referralCount}</div>
                  <div className="text-sm text-muted-foreground">mate{referralCount !== 1 ? 's' : ''} so far</div>
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
