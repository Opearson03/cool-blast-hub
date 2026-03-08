import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, Send, Inbox, History, CalendarDays } from "lucide-react";
import { CrmContactsTable } from "./CrmContactsTable";
import { ComposeEmail } from "./ComposeEmail";
import { CrmInbox } from "./CrmInbox";
import { SentEmailsLog } from "./SentEmailsLog";
import { BookingsTab } from "@/components/staff/BookingsTab";

interface CrmContact {
  contact_type: string;
  contact_id: string;
  email: string;
  full_name: string | null;
}

export function CrmTab() {
  const [subTab, setSubTab] = useState("contacts");
  const [emailContacts, setEmailContacts] = useState<CrmContact[]>([]);
  const [prefillSubject, setPrefillSubject] = useState("");
  const [prefillBody, setPrefillBody] = useState("");

  const { data: unreadCount } = useQuery({
    queryKey: ["staff-crm-inbox-unread-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("crm_inbox")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const handleEmailSelected = (contacts: CrmContact[]) => {
    setEmailContacts(contacts);
    setSubTab("compose");
  };

  return (
    <Tabs value={subTab} onValueChange={setSubTab} className="space-y-4">
      <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
        <TabsTrigger value="contacts">
          <Users className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Contacts</span>
        </TabsTrigger>
        <TabsTrigger value="compose">
          <Send className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Compose</span>
        </TabsTrigger>
        <TabsTrigger value="sent">
          <History className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Sent</span>
        </TabsTrigger>
        <TabsTrigger value="inbox" className="relative">
          <Inbox className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Inbox</span>
          {(unreadCount ?? 0) > 0 && (
            <Badge variant="destructive" className="ml-1 sm:ml-2 h-5 px-1.5 text-[10px]">
              {unreadCount}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="contacts">
        <CrmContactsTable onEmailSelected={handleEmailSelected} />
      </TabsContent>

      <TabsContent value="compose">
        <ComposeEmail
          preSelectedContacts={emailContacts.length > 0 ? emailContacts : undefined}
          initialSubject={prefillSubject}
          initialBody={prefillBody}
          onBack={() => { setSubTab("contacts"); setEmailContacts([]); setPrefillSubject(""); setPrefillBody(""); }}
        />
      </TabsContent>

      <TabsContent value="sent">
        <SentEmailsLog onResend={(subject, body) => {
          setPrefillSubject(subject);
          setPrefillBody(body);
          setEmailContacts([]);
          setSubTab("compose");
        }} />
      </TabsContent>

      <TabsContent value="inbox">
        <CrmInbox />
      </TabsContent>
    </Tabs>
  );
}
