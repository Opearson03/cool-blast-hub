import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Eye, Code, Loader2, Send, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CrmContact {
  contact_type: string;
  contact_id: string;
  email: string;
  full_name: string | null;
}

interface ComposeEmailProps {
  preSelectedContacts?: CrmContact[];
  onBack: () => void;
}

type RecipientMode = "selected" | "all" | "leads" | "waitlist" | "users";

export function ComposeEmail({ preSelectedContacts, onBack }: ComposeEmailProps) {
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [recipientMode, setRecipientMode] = useState<RecipientMode>(
    preSelectedContacts?.length ? "selected" : "all"
  );
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setHtmlBody((prev) => prev + tag);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newBody = htmlBody.substring(0, start) + tag + htmlBody.substring(end);
    setHtmlBody(newBody);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + tag.length;
    });
  };

  // Fetch contacts for filter-based sending
  const { data: filterContacts } = useQuery({
    queryKey: ["staff-crm-contacts-for-email", recipientMode],
    queryFn: async () => {
      if (recipientMode === "selected") return [];
      const filterVal = recipientMode === "all" ? "all" : recipientMode;
      const { data, error } = await supabase.rpc("get_crm_contacts", { _filter: filterVal });
      if (error) throw error;
      return (data as unknown as CrmContact[]) || [];
    },
    enabled: recipientMode !== "selected",
  });

  const recipients = recipientMode === "selected"
    ? (preSelectedContacts || [])
    : (filterContacts || []);

  const handleSend = async () => {
    if (!subject.trim()) { toast.error("Subject is required"); return; }
    if (!htmlBody.trim()) { toast.error("Email body is required"); return; }
    if (recipients.length === 0) { toast.error("No recipients"); return; }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-crm-email", {
        body: {
          subject,
          htmlBody,
          filterType: recipientMode,
          recipients: recipients.map((c) => ({
            email: c.email,
            name: c.full_name || "",
            contactType: c.contact_type,
            contactId: c.contact_id,
            company: (c as any).company_name || "",
          })),
        },
      });

      if (error) throw error;

      toast.success(`Sent to ${data.sent} recipients${data.failed ? ` (${data.failed} failed)` : ""}`);
      onBack();
    } catch (err: any) {
      toast.error(err.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h3 className="text-lg font-semibold">Compose Email</h3>
      </div>

      {/* Recipients */}
      <div className="space-y-2">
        <Label>Recipients</Label>
        <Select value={recipientMode} onValueChange={(v) => setRecipientMode(v as RecipientMode)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {preSelectedContacts?.length ? (
              <SelectItem value="selected">
                Selected Contacts ({preSelectedContacts.length})
              </SelectItem>
            ) : null}
            <SelectItem value="all">All Contacts</SelectItem>
            <SelectItem value="leads">All Leads</SelectItem>
            <SelectItem value="waitlist">All Waitlist</SelectItem>
            <SelectItem value="users">All Users</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{recipients.length} recipients</p>
      </div>

      {/* Subject */}
      <div className="space-y-2">
        <Label htmlFor="email-subject">Subject</Label>
        <Input
          id="email-subject"
          placeholder="Email subject line..."
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>

      {/* Body */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Body (HTML)</Label>
          <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? <Code className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            {showPreview ? "Edit" : "Preview"}
          </Button>
        </div>
        {!showPreview && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Insert variable:</span>
            {["{name}", "{email}", "{company}"].map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => insertTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
        {showPreview ? (
          <>
            <div
              className="border rounded-lg p-4 min-h-[200px] bg-white text-black prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: htmlBody
                  .replace(/{name}/g, "Jane Smith")
                  .replace(/{email}/g, "jane@example.com")
                  .replace(/{company}/g, "Acme Pty Ltd"),
              }}
            />
            <p className="text-xs text-muted-foreground italic">
              Preview shows sample data. Variables will be replaced per-recipient at send time.
            </p>
          </>
        ) : (
          <Textarea
            ref={textareaRef}
            placeholder='<h1>Hi {name}!</h1><p>Your email content here...</p>'
            value={htmlBody}
            onChange={(e) => setHtmlBody(e.target.value)}
            rows={12}
            className="font-mono text-sm"
          />
        )}
      </div>

      {/* Send */}
      <div className="flex justify-end">
        <Button onClick={handleSend} disabled={sending}>
          {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
          Send to {recipients.length} Recipient{recipients.length !== 1 ? "s" : ""}
        </Button>
      </div>
    </div>
  );
}
