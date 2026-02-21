import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, Send, Inbox } from "lucide-react";
import { CrmContactsTable } from "./CrmContactsTable";
import { ComposeEmail } from "./ComposeEmail";
import { CrmInbox } from "./CrmInbox";

interface CrmContact {
  contact_type: string;
  contact_id: string;
  email: string;
  full_name: string | null;
}

export function CrmTab() {
  const [subTab, setSubTab] = useState("contacts");
  const [emailContacts, setEmailContacts] = useState<CrmContact[]>([]);

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
      <TabsList>
        <TabsTrigger value="contacts">
          <Users className="h-4 w-4 mr-2" />
          Contacts
        </TabsTrigger>
        <TabsTrigger value="compose">
          <Send className="h-4 w-4 mr-2" />
          Compose
        </TabsTrigger>
        <TabsTrigger value="inbox" className="relative">
          <Inbox className="h-4 w-4 mr-2" />
          Inbox
          {(unreadCount ?? 0) > 0 && (
            <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-[10px]">
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
          onBack={() => { setSubTab("contacts"); setEmailContacts([]); }}
        />
      </TabsContent>

      <TabsContent value="inbox">
        <CrmInbox />
      </TabsContent>
    </Tabs>
  );
}
