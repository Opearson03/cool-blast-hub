import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Copy, Code2, Globe, Sparkles, Eye, Loader2, MessageSquareWarning, Mail, AlertCircle } from "lucide-react";
import { FeedbackDialog } from "@/components/feedback/FeedbackDialog";

export default function WidgetSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [color, setColor] = useState("#f97316");
  const [label, setLabel] = useState("Request a Quote");
  const [notifyEmail, setNotifyEmail] = useState("");

  const { data: business, isLoading } = useQuery({
    queryKey: ["business-for-widget"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();
      if (!profile?.business_id) throw new Error("No business");
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, inbound_email_alias, email")
        .eq("id", profile.business_id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (business?.email) setNotifyEmail(business.email);
  }, [business?.email]);

  const saveEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      if (!business?.id) throw new Error("No business");
      const { error } = await supabase
        .from("businesses")
        .update({ email: email.trim() || null })
        .eq("id", business.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-for-widget"] });
      queryClient.invalidateQueries({ queryKey: ["business-for-widget-embed"] });
      toast({ title: "Saved", description: "Notification email updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  const PUBLIC_ORIGIN = "https://pourhub.com.au";
  const previewOrigin = typeof window !== "undefined" ? window.location.origin : PUBLIC_ORIGIN;
  const alias = business?.inbound_email_alias || "your-business";

  const snippet = `<script src="${PUBLIC_ORIGIN}/widget.js"
        data-business="${alias}"
        data-color="${color}"
        data-label="${label}"></script>`;

  const previewSrc = `${previewOrigin}/embed/quote-request?business=${encodeURIComponent(alias)}&color=${encodeURIComponent(color)}`;

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      toast({ title: "Copied!", description: "Embed code copied to clipboard" });
    } catch {
      toast({ title: "Copy failed", description: "Please copy manually", variant: "destructive" });
    }
  };

  const emailDirty = notifyEmail.trim() !== (business?.email || "").trim();

  return (
    <AdminLayout>
      <div className="container max-w-6xl py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">Website Widget</h1>
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="w-3 h-3" />
                New
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Add a "Request a Quote" button to your website. Customers can submit details and upload building plans — they land straight in your PourHub inbox.
            </p>
          </div>
          <FeedbackDialog
            trigger={
              <Button variant="outline" className="shrink-0 border-orange-500/50 text-orange-500 hover:bg-orange-500/10 hover:text-orange-600">
                <MessageSquareWarning className="w-4 h-4 mr-2" />
                Get help with this
              </Button>
            }
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Customise */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Customise
                </CardTitle>
                <CardDescription>Match your brand</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="label">Button text</Label>
                  <Input
                    id="label"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    maxLength={40}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Accent colour</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="#f97316"
                      maxLength={7}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="notify-email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Notification email
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="notify-email"
                      type="email"
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      placeholder="you@yourcompany.com.au"
                      className="flex-1"
                    />
                    <Button
                      onClick={() => saveEmailMutation.mutate(notifyEmail)}
                      disabled={!emailDirty || saveEmailMutation.isPending}
                      variant="secondary"
                    >
                      {saveEmailMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We'll send each quote submission to this address with the customer's plan attached. Leave blank to disable email notifications.
                  </p>
                  {!notifyEmail.trim() && (
                    <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1.5">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>No notification email set — submissions will only appear in your PourHub Inbox.</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Code2 className="w-4 h-4" />
                    Embed code
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Paste this into your website's HTML, just before the closing <code className="text-xs bg-muted px-1 py-0.5 rounded">&lt;/body&gt;</code> tag.
                  </p>
                  <div className="relative">
                    <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto whitespace-pre-wrap break-all border">
                      {snippet}
                    </pre>
                  </div>
                  <Button onClick={copySnippet} className="w-full">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy embed code
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Live preview
                </CardTitle>
                <CardDescription>This is exactly what your customers will see</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg overflow-hidden border bg-muted/30" style={{ minHeight: 600 }}>
                  <iframe
                    key={`${color}-${alias}`}
                    src={previewSrc}
                    title="Widget preview"
                    className="w-full"
                    style={{ height: 700, border: "none", background: "transparent" }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-1">
              <div className="font-semibold">1. Customer submits</div>
              <p className="text-muted-foreground">Visitor clicks the button on your site, fills in their details and uploads their plans.</p>
            </div>
            <div className="space-y-1">
              <div className="font-semibold">2. Lands in your inbox</div>
              <p className="text-muted-foreground">The submission appears in your PourHub Inbox alongside emailed plans, tagged "Website Widget".</p>
            </div>
            <div className="space-y-1">
              <div className="font-semibold">3. One-click estimate</div>
              <p className="text-muted-foreground">Hit "Start Estimate" — PourHub creates a draft quote with the plan attached, ready to take off.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
