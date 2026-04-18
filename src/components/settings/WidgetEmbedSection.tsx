import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, Loader2, ExternalLink, Mail, AlertCircle } from "lucide-react";

export function WidgetEmbedSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [color, setColor] = useState("#f97316");
  const [label, setLabel] = useState("Request a Quote");
  const [notifyEmail, setNotifyEmail] = useState("");

  const { data: business, isLoading } = useQuery({
    queryKey: ["business-for-widget-embed"],
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
      queryClient.invalidateQueries({ queryKey: ["business-for-widget-embed"] });
      toast({ title: "Saved", description: "Notification email updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  const PUBLIC_ORIGIN = "https://pourhub.com.au";
  const alias = business?.inbound_email_alias || "your-business";

  const snippet = `<script src="${PUBLIC_ORIGIN}/widget.js"
        data-business="${alias}"
        data-color="${color}"
        data-label="${label}"></script>`;

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      toast({ title: "Copied!", description: "Embed code copied to clipboard" });
    } catch {
      toast({ title: "Copy failed", description: "Please copy manually", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  const emailDirty = notifyEmail.trim() !== (business?.email || "").trim();

  return (
    <div className="space-y-4 pt-2">
      <CardDescription>
        Paste this snippet into your website's HTML — just before the closing <code className="text-xs bg-muted px-1 py-0.5 rounded">&lt;/body&gt;</code> tag — to add a "Request a Quote" button. Submissions land straight in your PourHub Inbox with the building plans attached.
      </CardDescription>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="widget-label" className="text-sm font-medium">Button text</Label>
          <Input
            id="widget-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={40}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="widget-color" className="text-sm font-medium">Accent colour</Label>
          <div className="flex gap-2">
            <input
              id="widget-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-12 h-10 rounded border cursor-pointer"
            />
            <Input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#f97316"
              maxLength={7}
              className="font-mono text-sm"
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="widget-notify-email" className="text-sm font-medium flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Notification email
        </Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            id="widget-notify-email"
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
          We'll send quote submissions to this address with the plan attached. Leave blank to disable email notifications.
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
        <Label className="text-sm font-medium">Embed code</Label>
        <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto whitespace-pre-wrap break-all border">
          {snippet}
        </pre>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={copySnippet} className="flex-1">
            <Copy className="w-4 h-4 mr-2" />
            Copy embed code
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link to="/admin/widget">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open full widget settings
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
