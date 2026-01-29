import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, Copy, Mail, MessageCircle, Share2, Rocket, Zap, Crown, Gift, TrendingUp } from "lucide-react";

interface WaitlistFormProps {
  onSuccess?: () => void;
  referralCode?: string;
}

interface WaitlistStatus {
  found: boolean;
  referral_count: number;
  referral_code: string;
  vip_status: boolean;
  bonus_estimates: number;
  base_position: number;
  effective_position: number;
  spots_jumped: number;
}

export function WaitlistForm({ onSuccess, referralCode }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [userReferralCode, setUserReferralCode] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [waitlistStatus, setWaitlistStatus] = useState<WaitlistStatus | null>(null);
  
  // Friend invite state
  const [friendEmail, setFriendEmail] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  // Fetch waitlist status when we have a userId
  useEffect(() => {
    const fetchStatus = async () => {
      if (!userId) return;
      
      try {
        const { data, error } = await supabase.rpc('get_waitlist_status', { _user_id: userId });
        if (!error && data && typeof data === 'object' && 'found' in data) {
          const statusData = data as unknown as WaitlistStatus;
          if (statusData.found) {
            setWaitlistStatus(statusData);
          }
        }
      } catch (err) {
        console.error("Failed to fetch waitlist status:", err);
      }
    };
    
    fetchStatus();
  }, [userId]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      // Check if email already exists
      const { data: existingEntry } = await supabase
        .from("waiting_list")
        .select('id, referral_code')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (existingEntry) {
        toast.error("You're already on the waiting list!");
        setIsSubmitting(false);
        return;
      }

      // Look up referrer if referral code provided
      let referredById: string | null = null;
      if (referralCode) {
        const { data: referrerId } = await supabase
          .rpc('get_referrer_by_code', { code: referralCode });
        referredById = referrerId;
      }

      // Insert into waiting list
      const { data: insertedRow, error } = await supabase
        .from("waiting_list")
        .insert({
          email: email.toLowerCase().trim(),
          full_name: fullName.trim() || null,
          business_name: businessName.trim() || null,
          referred_by: referredById,
        })
        .select('id, referral_code')
        .single();

      if (error) {
        if (error.code === "23505") {
          toast.error("This email is already on the waiting list!");
        } else {
          throw error;
        }
        return;
      }

      // Store the user's referral code and id
      if (insertedRow?.referral_code) {
        setUserReferralCode(insertedRow.referral_code);
      }
      if (insertedRow?.id) {
        setUserId(insertedRow.id);
      }

      // Send welcome email with referral code
      try {
        await supabase.functions.invoke('send-waitlist-welcome', {
          body: {
            email: email.toLowerCase().trim(),
            fullName: fullName.trim() || null,
            referralCode: insertedRow?.referral_code,
          },
        });
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
      }

      // Notify the referrer if there was one
      if (referredById) {
        try {
          await supabase.functions.invoke('notify-referral-success', {
            body: {
              referrerId: referredById,
              newMemberName: fullName.trim() || null,
            },
          });
        } catch (notifyError) {
          console.error("Failed to notify referrer:", notifyError);
        }
      }

      setIsSuccess(true);
      toast.success("You're on the list! Check your email for your referral code.");
      onSuccess?.();
    } catch (error: any) {
      console.error("Waitlist error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendInvite = async () => {
    if (!friendEmail || !userReferralCode) {
      toast.error("Please enter your friend's email");
      return;
    }

    setIsSendingInvite(true);
    try {
      const { error } = await supabase.functions.invoke('send-referral-invite', {
        body: {
          referrerName: fullName.trim() || null,
          referralCode: userReferralCode,
          friendEmail: friendEmail.toLowerCase().trim(),
        },
      });

      if (error) throw error;

      toast.success("Invite sent! Your mate will get an email.");
      setFriendEmail("");
    } catch (error: any) {
      console.error("Failed to send invite:", error);
      toast.error("Failed to send invite. Please try again.");
    } finally {
      setIsSendingInvite(false);
    }
  };

  const copyReferralCode = () => {
    if (userReferralCode) {
      navigator.clipboard.writeText(userReferralCode);
      toast.success("Code copied!");
    }
  };

  const copyReferralLink = () => {
    if (userReferralCode) {
      const link = `https://pourhub.com.au?ref=${userReferralCode}`;
      navigator.clipboard.writeText(link);
      toast.success("Link copied!");
    }
  };

  const shareViaWhatsApp = () => {
    if (userReferralCode) {
      const message = `Join me on PourHub! We'll both get our first month FREE. Use my link: https://pourhub.com.au?ref=${userReferralCode}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const shareViaSMS = () => {
    if (userReferralCode) {
      const message = `Join me on PourHub! We'll both get our first month FREE. Use my link: https://pourhub.com.au?ref=${userReferralCode}`;
      window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const referralCount = waitlistStatus?.referral_count || 0;
  const isVip = waitlistStatus?.vip_status || false;
  const effectivePosition = waitlistStatus?.effective_position || 0;
  const spotsJumped = waitlistStatus?.spots_jumped || 0;
  const progressToVip = Math.min((referralCount / 3) * 100, 100);

  if (isSuccess && userReferralCode) {
    return (
      <div className="space-y-5">
        {/* Success Header */}
        <div className="text-center py-3">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <h3 className="text-xl font-semibold text-primary-foreground mb-1">You're on the list!</h3>
          <p className="text-muted-foreground text-sm">Check your email for confirmation.</p>
        </div>

        {/* Your Progress Section */}
        {waitlistStatus && (
          <div className="bg-charcoal border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-primary-foreground text-sm font-medium">Your Progress</span>
              </div>
              {isVip && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                  <Crown className="w-3 h-3 mr-1" />
                  VIP
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-primary">{referralCount}</p>
                <p className="text-xs text-muted-foreground">Referrals</p>
              </div>
              <div className="bg-background/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-500">+{spotsJumped}</p>
                <p className="text-xs text-muted-foreground">Spots jumped</p>
              </div>
            </div>
            
            {!isVip && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{referralCount}/3 to VIP</span>
                  <span className="text-amber-400">Guaranteed early access</span>
                </div>
                <Progress value={progressToVip} className="h-2" />
              </div>
            )}
          </div>
        )}

        {/* Move Up The List CTA */}
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary rounded-xl p-5">
          <div className="flex items-center gap-2 justify-center mb-3">
            <Rocket className="w-5 h-5 text-primary" />
            <h4 className="text-lg font-bold text-primary-foreground">Move up the list!</h4>
          </div>
          <p className="text-primary-foreground/80 text-sm text-center mb-4">
            Invite another concreter and jump ahead
          </p>
          
          {/* Referral Milestones */}
          <div className="space-y-2 mb-4">
            <div className={`flex items-center gap-3 rounded-lg p-3 ${referralCount >= 1 ? 'bg-green-500/20 border border-green-500/30' : 'bg-charcoal/50'}`}>
              <div className={`rounded-full p-2 ${referralCount >= 1 ? 'bg-green-500/30' : 'bg-primary/20'}`}>
                {referralCount >= 1 ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Zap className="w-4 h-4 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${referralCount >= 1 ? 'text-green-400' : 'text-primary-foreground'}`}>Refer 1 mate</p>
                <p className="text-muted-foreground text-xs">Jump 50 spots + 1 month FREE each</p>
              </div>
              <Badge variant="secondary" className={referralCount >= 1 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-primary/20 text-primary border-primary/30'}>
                +50
              </Badge>
            </div>
            
            <div className={`flex items-center gap-3 rounded-lg p-3 ${isVip ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-charcoal/50'}`}>
              <div className={`rounded-full p-2 ${isVip ? 'bg-amber-500/30' : 'bg-amber-500/20'}`}>
                {isVip ? (
                  <CheckCircle className="w-4 h-4 text-amber-400" />
                ) : (
                  <Crown className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${isVip ? 'text-amber-400' : 'text-primary-foreground'}`}>Refer 3 mates</p>
                <p className="text-muted-foreground text-xs">Guaranteed early access + 5 bonus quotes</p>
              </div>
              <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                VIP
              </Badge>
            </div>
          </div>
        </div>

        {/* Referral Code Display */}
        <div className="bg-charcoal border border-border rounded-lg p-4">
          <p className="text-primary-foreground/80 text-xs text-center mb-2">Your referral code:</p>
          <div className="flex items-center justify-center gap-2">
            <div className="bg-primary/10 border-2 border-dashed border-primary rounded-lg px-5 py-2">
              <span className="text-primary font-bold text-xl tracking-widest">{userReferralCode}</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={copyReferralCode}
              className="shrink-0 h-9 w-9"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Email Invite Form */}
        <div className="space-y-3">
          <Label htmlFor="friendEmail" className="text-primary-foreground text-sm flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" />
            Send an invite to a mate
          </Label>
          <div className="flex gap-2">
            <Input
              id="friendEmail"
              type="email"
              placeholder="mate@example.com"
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
              className="bg-background/50 border-border flex-1"
            />
            <Button 
              onClick={handleSendInvite}
              disabled={isSendingInvite || !friendEmail}
              className="shrink-0"
            >
              {isSendingInvite ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="space-y-2">
          <p className="text-primary-foreground/80 text-xs text-center">Or share your link:</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" size="sm" onClick={copyReferralLink}>
              <Copy className="w-4 h-4 mr-1" />
              Link
            </Button>
            <Button variant="outline" size="sm" onClick={shareViaWhatsApp}>
              <MessageCircle className="w-4 h-4 mr-1" />
              WhatsApp
            </Button>
            <Button variant="outline" size="sm" onClick={shareViaSMS}>
              <Share2 className="w-4 h-4 mr-1" />
              SMS
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-primary-foreground">Email *</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-background/50 border-border"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-primary-foreground">Your Name</Label>
        <Input
          id="fullName"
          type="text"
          placeholder="John Smith"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="bg-background/50 border-border"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="businessName" className="text-primary-foreground">Business Name</Label>
        <Input
          id="businessName"
          type="text"
          placeholder="Smith Concrete Pty Ltd"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="bg-background/50 border-border"
        />
      </div>

      <Button 
        type="submit" 
        className="w-full touch-target" 
        size="lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Joining...
          </>
        ) : (
          "Join the Waiting List"
        )}
      </Button>
    </form>
  );
}
