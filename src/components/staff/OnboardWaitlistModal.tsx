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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ExternalLink,
  Mail,
  Copy,
  CheckCircle,
  Phone,
  Gift,
  Loader2,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers";

interface WaitlistEntry {
  id: string;
  email: string;
  full_name: string | null;
  business_name: string | null;
  referral_count: number;
  outreach_status?: string;
  checkout_url?: string | null;
  checkout_tier?: string | null;
  staff_notes?: string | null;
}

interface OnboardWaitlistModalProps {
  entry: WaitlistEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: () => void;
}

type Tier = "estimating" | "pro";

interface CheckoutResult {
  url: string;
  sessionId: string;
  trialDays: number;
  freeMonths: number;
}

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

export function OnboardWaitlistModal({ entry, open, onOpenChange, onStatusChange }: OnboardWaitlistModalProps) {
  const [selectedTier, setSelectedTier] = useState<Tier>("estimating");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [staffNotes, setStaffNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const freeMonths = 1 + (entry?.referral_count ?? 0);

  const handleReset = () => {
    setCheckoutResult(null);
    setLinkCopied(false);
    setEmailSent(false);
    setStaffNotes(entry?.staff_notes ?? "");
  };

  const handleClose = (open: boolean) => {
    if (!open) handleReset();
    onOpenChange(open);
  };

  const createCheckout = async () => {
    if (!entry) return;
    setIsLoading(true);
    try {
      // Build signup URL client-side instead of calling Stripe
      const origin = window.location.origin;
      const params = new URLSearchParams();
      params.set("tier", selectedTier);
      if (entry.email) params.set("email", entry.email);
      if (entry.full_name) params.set("name", entry.full_name);
      if (entry.business_name) params.set("business", entry.business_name);
      params.set("freeMonths", String(freeMonths));

      const signupUrl = `${origin}/signup?${params.toString()}`;
      setCheckoutResult({
        url: signupUrl,
        sessionId: "",
        trialDays: 30 * freeMonths,
        freeMonths,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate link";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCheckout = () => {
    if (checkoutResult?.url) window.open(checkoutResult.url, "_blank");
  };

  const handleCopyLink = async () => {
    if (!checkoutResult?.url) return;
    await navigator.clipboard.writeText(checkoutResult.url);
    setLinkCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setLinkCopied(false), 3000);
  };

  const handleSendInviteEmail = async () => {
    if (!entry || !checkoutResult?.url) return;
    setIsSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-waitlist-invite", {
        body: {
          waitlistId: entry.id,
          email: entry.email,
          fullName: entry.full_name,
          businessName: entry.business_name,
          checkoutUrl: checkoutResult.url,
          freeMonths: checkoutResult.freeMonths,
          tier: selectedTier,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setEmailSent(true);
      toast.success(`Invite email sent to ${entry.email}`);
      onStatusChange?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send invite email";
      toast.error(message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!entry) return;
    setIsSavingNotes(true);
    try {
      const { error } = await supabase
        .from("waiting_list" as never)
        .update({ staff_notes: staffNotes } as never)
        .eq("id", entry.id);
      if (error) throw error;
      toast.success("Notes saved");
      onStatusChange?.();
    } catch (err) {
      toast.error("Failed to save notes");
    } finally {
      setIsSavingNotes(false);
    }
  };

  if (!entry) return null;

  const alreadyInvited = entry.outreach_status === "invited" || entry.outreach_status === "converted";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Onboard Waitlist Member</DialogTitle>
          <DialogDescription>
            Generate a signup link and reach out via email or phone.
          </DialogDescription>
        </DialogHeader>

        {/* Customer Info */}
        <div className="rounded-lg border bg-muted/40 p-3 space-y-1">
          <p className="font-medium text-sm">{entry.full_name || "—"}</p>
          <p className="text-sm text-muted-foreground">{entry.email}</p>
          {entry.business_name && (
            <p className="text-sm text-muted-foreground">{entry.business_name}</p>
          )}
          {alreadyInvited && (
            <span className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-1">
              <CheckCircle className="h-3 w-3" />
              {entry.outreach_status === "converted" ? "Converted" : "Invite sent"}
            </span>
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

        <Tabs defaultValue="email">
          <TabsList className="w-full">
            <TabsTrigger value="email" className="flex-1">
              <Mail className="h-4 w-4 mr-2" />
              Email Invite
            </TabsTrigger>
            <TabsTrigger value="phone" className="flex-1">
              <Phone className="h-4 w-4 mr-2" />
              Phone Call
            </TabsTrigger>
          </TabsList>

          {/* EMAIL TAB */}
          <TabsContent value="email" className="space-y-4 mt-4">
            {!checkoutResult ? (
              <>
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
                    "Generate Signup Link"
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 rounded-lg bg-muted border border-border px-3 py-2">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Signup link ready</p>
                    <p className="text-xs text-muted-foreground">
                      {checkoutResult.freeMonths} month{checkoutResult.freeMonths !== 1 ? "s" : ""} free · {SUBSCRIPTION_TIERS[selectedTier].name}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleSendInviteEmail}
                  disabled={isSendingEmail || emailSent}
                  className="w-full"
                >
                  {isSendingEmail ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending…
                    </>
                  ) : emailSent ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                      Invite Sent!
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Branded Invite Email
                    </>
                  )}
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
                  <Button onClick={handleOpenCheckout} variant="outline" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>

                <Separator />
                <Button variant="ghost" size="sm" onClick={handleReset} className="w-full text-muted-foreground">
                  ← Change plan or regenerate
                </Button>
              </>
            )}
          </TabsContent>

          {/* PHONE TAB */}
          <TabsContent value="phone" className="space-y-4 mt-4">
            {!checkoutResult ? (
              <>
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
                    "Generate Signup Link"
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 rounded-lg bg-muted border border-border px-3 py-2">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Signup link ready</p>
                    <p className="text-xs text-muted-foreground">
                      {checkoutResult.freeMonths} month{checkoutResult.freeMonths !== 1 ? "s" : ""} free · {SUBSCRIPTION_TIERS[selectedTier].name}
                    </p>
                  </div>
                </div>

                <Button onClick={handleOpenCheckout} className="w-full" variant="default">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Signup Page
                  <span className="ml-1 text-xs opacity-70">(guide them through setup)</span>
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
                  <Button variant="outline" className="w-full" onClick={() => {
                    const subject = encodeURIComponent("Your PourHub Account – Get Started");
                    const tierName = SUBSCRIPTION_TIERS[selectedTier].name;
                    const body = encodeURIComponent(
                      `Hi ${entry.full_name || "there"},\n\nGreat chatting with you! Here's your personalised PourHub signup link:\n\n${checkoutResult.url}\n\nYou're starting with ${checkoutResult.freeMonths} month${checkoutResult.freeMonths !== 1 ? "s" : ""} free on the ${tierName} plan.\n\nClick the link to set up your account and get started.\n\nWelcome aboard!\nThe PourHub Team`
                    );
                    window.open(`mailto:${entry.email}?subject=${subject}&body=${body}`, "_blank");
                  }}>
                    <Mail className="h-4 w-4 mr-2" />
                    Draft Email
                  </Button>
                </div>

                <Separator />
                <Button variant="ghost" size="sm" onClick={handleReset} className="w-full text-muted-foreground">
                  ← Change plan or regenerate
                </Button>
              </>
            )}

            {/* Staff Notes */}
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium">Call Notes</p>
              <Textarea
                placeholder="Log what was discussed, objections, follow-up actions…"
                value={staffNotes || entry.staff_notes || ""}
                onChange={(e) => setStaffNotes(e.target.value)}
                className="min-h-[80px] text-sm resize-none"
              />
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
              >
                {isSavingNotes ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Save Notes
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
