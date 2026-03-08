import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, HardHat, Megaphone } from "lucide-react";
import { SupplierRegistrationsTable } from "./SupplierRegistrationsTable";
import { SubcontractorAdminTable } from "@/components/subcontractors/SubcontractorAdminTable";
import { AffiliatesTab } from "./AffiliatesTab";

export function PartnersTab() {
  const [subTab, setSubTab] = useState("suppliers");

  return (
    <Tabs value={subTab} onValueChange={setSubTab} className="space-y-4">
      <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
        <TabsTrigger value="suppliers">
          <Truck className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Suppliers</span>
        </TabsTrigger>
        <TabsTrigger value="subcontractors">
          <HardHat className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Subcontractors</span>
        </TabsTrigger>
        <TabsTrigger value="affiliates">
          <Megaphone className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Affiliates</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="suppliers">
        <SupplierRegistrationsTable />
      </TabsContent>

      <TabsContent value="subcontractors">
        <SubcontractorAdminTable />
      </TabsContent>

      <TabsContent value="affiliates">
        <AffiliatesTab />
      </TabsContent>
    </Tabs>
  );
}
