import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ChevronDown, ChevronRight, Mail, Users, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Campaign {
  id: string;
  subject: string;
  html_body: string;
  filter_type: string | null;
  recipient_count: number | null;
  sent_at: string | null;
  created_at: string;
}

interface Recipient {
  id: string;
  email: string;
  contact_type: string;
  status: string | null;
  sent_at: string | null;
}

interface SentEmailsLogProps {
  onResend?: (subject: string, htmlBody: string) => void;
}

export function SentEmailsLog({ onResend }: SentEmailsLogProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["crm-sent-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_email_campaigns")
        .select("*")
        .order("sent_at", { ascending: false });
      if (error) throw error;
      return data as Campaign[];
    },
  });

  const { data: recipients } = useQuery({
    queryKey: ["crm-sent-recipients", expandedId],
    queryFn: async () => {
      if (!expandedId) return [];
      const { data, error } = await supabase
        .from("crm_email_recipients")
        .select("*")
        .eq("campaign_id", expandedId)
        .order("email");
      if (error) throw error;
      return data as Recipient[];
    },
    enabled: !!expandedId,
  });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading sent emails...</div>;
  }

  if (!campaigns?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Mail className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>No emails sent yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {campaigns.map((campaign) => {
        const isOpen = expandedId === campaign.id;
        return (
          <Collapsible
            key={campaign.id}
            open={isOpen}
            onOpenChange={(open) => setExpandedId(open ? campaign.id : null)}
          >
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-left w-full">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{campaign.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {campaign.sent_at
                      ? format(new Date(campaign.sent_at), "dd MMM yyyy, h:mm a")
                      : "Not sent"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {campaign.filter_type && (
                    <Badge variant="secondary" className="text-[10px]">
                      {campaign.filter_type}
                    </Badge>
                  )}
                  <Badge variant="outline" className="gap-1">
                    <Users className="h-3 w-3" />
                    {campaign.recipient_count ?? 0}
                  </Badge>
                </div>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="border rounded-lg mt-1 p-4 space-y-4 bg-card">
                {/* HTML Preview */}
                <div>
                  <p className="text-sm font-medium mb-2">Email Preview</p>
                  <iframe
                    srcDoc={campaign.html_body}
                    className="w-full h-64 border rounded bg-white"
                    sandbox=""
                    title="Email preview"
                  />
                </div>

                {onResend && (
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onResend(campaign.subject, campaign.html_body)}
                    >
                      <RotateCw className="h-4 w-4 mr-2" />
                      Resend to New Recipients
                    </Button>
                  </div>
                )}

                {/* Recipients Table */}
                <div>
                  <p className="text-sm font-medium mb-2">Recipients</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recipients?.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-mono text-xs">{r.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-[10px]">
                              {r.contact_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={r.status === "sent" ? "default" : "destructive"}
                              className="text-[10px]"
                            >
                              {r.status ?? "pending"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )) ?? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            Loading...
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}
