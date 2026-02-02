import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building2, Truck, Inbox } from "lucide-react";
import { ClientsTab } from "@/components/contacts/ClientsTab";
import { SubbiesTab } from "@/components/contacts/SubbiesTab";
import { SuppliersTab } from "@/components/contacts/SuppliersTab";
import { InboxHistoryTab } from "@/components/contacts/InboxHistoryTab";

export default function AdminContacts() {
  const [activeTab, setActiveTab] = useState("inbox");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Contacts</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="inbox" className="gap-2">
              <Inbox className="h-4 w-4 hidden sm:inline" />
              Inbox
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-2">
              <Users className="h-4 w-4 hidden sm:inline" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="subbies" className="gap-2">
              <Building2 className="h-4 w-4 hidden sm:inline" />
              Sub-Contractors
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="gap-2">
              <Truck className="h-4 w-4 hidden sm:inline" />
              Suppliers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="mt-6">
            <InboxHistoryTab />
          </TabsContent>

          <TabsContent value="clients" className="mt-6">
            <ClientsTab />
          </TabsContent>

          <TabsContent value="subbies" className="mt-6">
            <SubbiesTab />
          </TabsContent>

          <TabsContent value="suppliers" className="mt-6">
            <SuppliersTab />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
