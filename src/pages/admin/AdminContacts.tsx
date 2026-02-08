import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building2, Truck, Inbox, UserCircle } from "lucide-react";
import { ClientsTab } from "@/components/contacts/ClientsTab";
import { SubbiesTab } from "@/components/contacts/SubbiesTab";
import { SuppliersTab } from "@/components/contacts/SuppliersTab";
import { InboxHistoryTab } from "@/components/contacts/InboxHistoryTab";
import { InternalContactsTab } from "@/components/contacts/InternalContactsTab";

export default function AdminContacts() {
  const [activeTab, setActiveTab] = useState("inbox");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Contact</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
            <TabsTrigger value="inbox" className="gap-1.5">
              <Inbox className="h-4 w-4 hidden sm:inline" />
              Inbox
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-1.5">
              <Users className="h-4 w-4 hidden sm:inline" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="subbies" className="gap-1.5">
              <Building2 className="h-4 w-4 hidden sm:inline" />
              <span className="hidden sm:inline">Sub-Contractors</span>
              <span className="sm:hidden">Subbies</span>
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="gap-1.5">
              <Truck className="h-4 w-4 hidden sm:inline" />
              <span className="hidden sm:inline">Suppliers</span>
              <span className="sm:hidden">Supply</span>
            </TabsTrigger>
            <TabsTrigger value="internal" className="gap-1.5">
              <UserCircle className="h-4 w-4 hidden sm:inline" />
              Internal
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

          <TabsContent value="internal" className="mt-6">
            <InternalContactsTab />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
