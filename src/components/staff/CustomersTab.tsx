import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building2 } from "lucide-react";
import { UsersTable } from "./UsersTable";
import { SubscribersTable } from "./SubscribersTable";

export function CustomersTab() {
  const [subTab, setSubTab] = useState("users");

  return (
    <Tabs value={subTab} onValueChange={setSubTab} className="space-y-4">
      <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
        <TabsTrigger value="users">
          <Users className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Users</span>
        </TabsTrigger>
        <TabsTrigger value="businesses">
          <Building2 className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Businesses</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="users">
        <UsersTable />
      </TabsContent>

      <TabsContent value="businesses">
        <SubscribersTable />
      </TabsContent>
    </Tabs>
  );
}
