import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ExternalLink,
  Mail,
  Copy,
  CheckCircle,
  Phone,
  Gift,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers";

interface WaitlistEntry {
  id: string;
  email: string;
  full_name: string | null;
  business_name: string | null;
  referral_count: number;
}

interface OnboardWaitlistModalProps {
  entry: WaitlistEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Tier = "estimating" | "pro";

interface CheckoutResult {
  url: string;
  sessionId: string;
  trialDays: number;
  freeMonths: number;
}

export function OnboardWaitlistModal({ entry, open, onOpenChange }: OnboardWaitlistModalProps) {
  const [selectedTier, setSelectedTier] = useState<Tier>("estimating");
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const freeMonths = 1 + (entry?.referral_count ?? 0);

  const handleReset = () => {
    setCheckoutResult(null);
    setLinkCopied(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) handleReset();
    onOpenChange(open);
  };

  const createCheckout = async () => {
    if (!entry) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("staff-create-checkout", {
        body: {
          email: entry.email,
          fullName: entry.full_name,
          businessName: entry.business_name,
          tier: selectedTier,
          referralCount: entry.referral_count,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setCheckoutResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create checkout link";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCheckout = () => {
    if (checkoutResult?.url) {
      window.open(checkoutResult.url, "_blank");
    }
  };

  const handleCopyLink = async () => {
    if (!checkoutResult?.url) return;
    await navigator.clipboard.writeText(checkoutResult.url);
    setLinkCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setLinkCopied(false), 3000);
  };

  const handleSendEmail = () => {
    if (!entry || !checkoutResult?.url) return;
    const subject = encodeURIComponent("Your PourHub Account – Get Started");
    const tierName = SUBSCRIPTION_TIERS[selectedTier].name;
    const body = encodeURIComponent(
      `Hi ${entry.full_name || "there"},\n\nGreat chatting with you! Here's your personalised PourHub signup link:\n\n${checkoutResult.url}\n\nYou're starting with ${checkoutResult.freeMonths} month${checkoutResult.freeMonths !== 1 ? "s" : ""} free on the ${tierName} plan.\n\nClick the link above to enter your card details and complete signup. Once done, you'll be taken through the setup process.\n\nWelcome aboard!\nThe PourHub Team`
    );
    window.open(`mailto:${entry.email}?subject=${subject}&body=${body}`, "_blank");
  };

  if (!entry) return null;

  const tierOptions: { key: Tier; label: string; price: number; description: string }[] = [
    {
      key: "estimating",
      label: "Estimating",
      price: 99,
      description: "Unlimited quotes, professional PDFs, email delivery",
    },
    {
      key: "pro",
      label: "PourHub Pro",
      price: 240,
      description: "Full app access, scheduling, job management, and more",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            <DialogTitle>Phone Onboarding</DialogTitle>
          </div>
          <DialogDescription>
            Create a Stripe checkout link for this waitlist member.
          </DialogDescription>
        </DialogHeader>

        {/* Customer Info */}
        <div className="rounded-lg border bg-muted/40 p-3 space-y-1">
          <p className="font-medium text-sm">{entry.full_name || "—"}</p>
          <p className="text-sm text-muted-foreground">{entry.email}</p>
          {entry.business_name && (
            <p className="text-sm text-muted-foreground">{entry.business_name}</p>
          )}
        </div>

        {/* Free Months Badge */}
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2">
          <Gift className="h-4 w-4 text-primary flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-primary">
              {freeMonths} month{freeMonths !== 1 ? "s" : ""} free
            </p>
            <p className="text-xs text-muted-foreground">
              1 base + {entry.referral_count} referral{entry.referral_count !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {!checkoutResult ? (
          <>
            {/* Tier Selection */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Select plan</p>
              <div className="grid grid-cols-2 gap-2">
                {tierOptions.map((tier) => (
                  <button
                    key={tier.key}
                    onClick={() => setSelectedTier(tier.key)}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      selectedTier === tier.key
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="text-sm font-semibold">{tier.label}</p>
                    <p className="text-lg font-bold mt-0.5">
                      ${tier.price}
                      <span className="text-xs font-normal text-muted-foreground">/mo</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-tight">
                      {tier.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            <Button onClick={createCheckout} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating link…
                </>
              ) : (
                "Create Checkout Link"
              )}
            </Button>
          </>
        ) : (
          <>
            {/* Success State */}
            <div className="flex items-center gap-2 rounded-lg bg-muted border border-border px-3 py-2">
              <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Checkout link ready
                </p>
                <p className="text-xs text-muted-foreground">
                  {checkoutResult.freeMonths} month{checkoutResult.freeMonths !== 1 ? "s" : ""} free trial · {SUBSCRIPTION_TIERS[selectedTier].name}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Button onClick={handleOpenCheckout} className="w-full" variant="default">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Checkout
                <span className="ml-1 text-xs opacity-70">(enter card while on call)</span>
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={handleCopyLink} variant="outline" className="w-full">
                  {linkCopied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </>
                  )}
                </Button>
                <Button onClick={handleSendEmail} variant="outline" className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              </div>
            </div>

            <Separator />

            <Button variant="ghost" size="sm" onClick={handleReset} className="w-full text-muted-foreground">
              ← Change plan or regenerate
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
