import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, Copy, Mail, MessageCircle, Share2 } from "lucide-react";

interface WaitlistFormProps {
  onSuccess?: () => void;
  referralCode?: string;
}

export function WaitlistForm({ onSuccess, referralCode }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [userReferralCode, setUserReferralCode] = useState<string | null>(null);
  
  // Friend invite state
  const [friendEmail, setFriendEmail] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsSubmitting(true);

    try {
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
        .select('referral_code')
        .single();

      if (error) {
        if (error.code === "23505") {
          toast.error("This email is already on the waiting list!");
        } else {
          throw error;
        }
        return;
      }

      // Store the user's referral code
      if (insertedRow?.referral_code) {
        setUserReferralCode(insertedRow.referral_code);
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
        // Don't fail the whole flow if email fails
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

  if (isSuccess && userReferralCode) {
    return (
      <div className="space-y-6">
        {/* Success Header */}
        <div className="text-center py-4">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-primary-foreground mb-2">You're on the list!</h3>
          <p className="text-muted-foreground text-sm">Check your email for confirmation.</p>
        </div>

        {/* Referral Code Display */}
        <div className="bg-charcoal border border-primary/30 rounded-lg p-4">
          <p className="text-primary-foreground/80 text-sm text-center mb-3">Your referral code:</p>
          <div className="flex items-center justify-center gap-3">
            <div className="bg-primary/10 border-2 border-dashed border-primary rounded-lg px-6 py-3">
              <span className="text-primary font-bold text-2xl tracking-widest">{userReferralCode}</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={copyReferralCode}
              className="shrink-0"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Referral Benefit */}
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
          <p className="text-primary font-semibold text-sm mb-1">🎁 Share with your mates</p>
          <p className="text-primary-foreground/80 text-sm">
            You <span className="text-primary font-bold">BOTH</span> get your first month FREE!
          </p>
        </div>

        {/* Email Invite Form */}
        <div className="space-y-3">
          <Label htmlFor="friendEmail" className="text-primary-foreground text-sm">
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
        <div className="space-y-3">
          <p className="text-primary-foreground/80 text-sm text-center">Or share your link:</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" size="sm" onClick={copyReferralLink}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
            <Button variant="outline" size="sm" onClick={shareViaWhatsApp}>
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
            <Button variant="outline" size="sm" onClick={shareViaSMS}>
              <Share2 className="w-4 h-4 mr-2" />
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
