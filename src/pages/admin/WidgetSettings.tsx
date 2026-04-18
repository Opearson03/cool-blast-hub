import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Copy, Code2, Globe, Sparkles, Eye, Loader2 } from "lucide-react";

export default function WidgetSettings() {
  const { toast } = useToast();
  const [color, setColor] = useState("#f97316");
  const [label, setLabel] = useState("Request a Quote");

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
        .select("id, name, inbound_email_alias")
        .eq("id", profile.business_id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const origin = typeof window !== "undefined" ? window.location.origin : "https://pourhub.com.au";
  const alias = business?.inbound_email_alias || "your-business";

  const snippet = `<script src="${origin}/widget.js"
        data-business="${alias}"
        data-color="${color}"
        data-label="${label}"></script>`;

  const previewSrc = `${origin}/embed/quote-request?business=${encodeURIComponent(alias)}&color=${encodeURIComponent(color)}`;

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      toast({ title: "Copied!", description: "Embed code copied to clipboard" });
    } catch {
      toast({ title: "Copy failed", description: "Please copy manually", variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="container max-w-6xl py-8 space-y-6">
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
