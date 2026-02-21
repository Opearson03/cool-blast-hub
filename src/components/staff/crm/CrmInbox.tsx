import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, MailOpen, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface InboxMessage {
  id: string;
  from_email: string;
  from_name: string | null;
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  received_at: string;
  is_read: boolean;
  in_reply_to_campaign_id: string | null;
}

export function CrmInbox() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["staff-crm-inbox"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_inbox")
        .select("*")
        .order("received_at", { ascending: false });
      if (error) throw error;
      return data as InboxMessage[];
    },
  });

  const unreadCount = messages?.filter((m) => !m.is_read).length || 0;
  const selected = messages?.find((m) => m.id === selectedId);

  const toggleRead = async (id: string, isRead: boolean) => {
    const { error } = await supabase
      .from("crm_inbox")
      .update({ is_read: !isRead })
      .eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    queryClient.invalidateQueries({ queryKey: ["staff-crm-inbox"] });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (selected) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Inbox
        </Button>
        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg">{selected.subject || "(no subject)"}</h3>
              <p className="text-sm text-muted-foreground">
                From: {selected.from_name ? `${selected.from_name} <${selected.from_email}>` : selected.from_email}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(selected.received_at), "PPp")}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleRead(selected.id, selected.is_read)}
            >
              {selected.is_read ? "Mark Unread" : "Mark Read"}
            </Button>
          </div>
          <div className="border-t pt-4">
            {selected.body_html ? (
              <div
                className="prose prose-sm max-w-none bg-white text-black rounded p-4"
                dangerouslySetInnerHTML={{ __html: selected.body_html }}
              />
            ) : (
              <pre className="whitespace-pre-wrap text-sm">{selected.body_text || "(empty)"}</pre>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">Inbox</h3>
        {unreadCount > 0 && <Badge variant="destructive">{unreadCount} unread</Badge>}
      </div>

      {!messages?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <Mail className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>No replies yet</p>
          <p className="text-xs mt-1">Replies to your CRM emails will appear here</p>
        </div>
      ) : (
        <div className="border rounded-lg divide-y">
          {messages.map((m) => (
            <button
              key={m.id}
              className={`w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors flex items-start gap-3 ${!m.is_read ? "bg-accent/20" : ""}`}
              onClick={() => {
                setSelectedId(m.id);
                if (!m.is_read) toggleRead(m.id, false);
              }}
            >
              {m.is_read ? (
                <MailOpen className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
              ) : (
                <Mail className="h-4 w-4 mt-1 text-primary shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm truncate ${!m.is_read ? "font-semibold" : ""}`}>
                    {m.from_name || m.from_email}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {format(new Date(m.received_at), "MMM d")}
                  </span>
                </div>
                <p className={`text-sm truncate ${!m.is_read ? "font-medium" : "text-muted-foreground"}`}>
                  {m.subject || "(no subject)"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
