import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlaskConical, Truck, FileText, Calendar, ArrowRight, Inbox } from "lucide-react";
import { format } from "date-fns";
import { PendingTestResultsSheet } from "@/components/jobs/PendingTestResultsSheet";
import { PendingDocumentsSheet } from "@/components/jobs/PendingDocumentsSheet";
import { PendingPlansSheet } from "@/components/jobs/PendingPlansSheet";

interface InboxWidgetProps {
  businessId: string;
}

export function InboxWidget({ businessId }: InboxWidgetProps) {
  const [activeTab, setActiveTab] = useState("plans");
  const [testResultsSheetOpen, setTestResultsSheetOpen] = useState(false);
  const [documentsSheetOpen, setDocumentsSheetOpen] = useState(false);
  const [plansSheetOpen, setPlansSheetOpen] = useState(false);

  // Fetch pending plans
  const { data: pendingPlans = [] } = useQuery({
    queryKey: ["pending-plans", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pending_plans")
        .select("id, subject, from_email, from_name, received_at, extracted_data, status")
        .eq("business_id", businessId)
        .eq("status", "pending")
        .order("received_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!businessId
  });

  // Fetch unassigned pending test results
  const { data: pendingTestResults = [] } = useQuery({
    queryKey: ["unassigned-test-results", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pending_test_results")
        .select("id, subject, from_email, received_at, extracted_data, match_status")
        .eq("business_id", businessId)
        .eq("status", "pending")
        .eq("match_status", "pending")
        .order("received_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!businessId
  });

  // Fetch unassigned pending documents (delivery dockets)
  const { data: pendingDocuments = [] } = useQuery({
    queryKey: ["unassigned-documents", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pending_documents")
        .select("id, subject, from_email, received_at, extracted_data, match_status, file_name")
        .eq("business_id", businessId)
        .eq("status", "pending")
        .eq("match_status", "pending")
        .order("received_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!businessId
  });

  const totalUnread = pendingPlans.length + pendingTestResults.length + pendingDocuments.length;

  if (totalUnread === 0) {
    return null;
  }

  const getActiveItems = () => {
    switch (activeTab) {
      case "plans":
        return pendingPlans.map(item => ({
          ...item,
          type: "plan" as const,
          displayId: (item.extracted_data as any)?.project_name || item.subject || "(No subject)"
        }));
      case "tests":
        return pendingTestResults.map(item => ({
          ...item,
          type: "test" as const,
          displayId: (item.extracted_data as any)?.test_id || item.subject || "(No subject)"
        }));
      case "dockets":
        return pendingDocuments.map(item => ({
          ...item,
          type: "docket" as const,
          displayId: (item.extracted_data as any)?.docket_number || item.subject || "(No subject)"
        }));
      default:
        return [];
    }
  };

  const handleItemClick = (type: string) => {
    switch (type) {
      case "plan":
        setPlansSheetOpen(true);
        break;
      case "test":
        setTestResultsSheetOpen(true);
        break;
      case "docket":
        setDocumentsSheetOpen(true);
        break;
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-primary" />
              Inbox
            </span>
            <Badge variant="secondary">{totalUnread} new</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="plans" className="text-xs px-2">
                <FileText className="w-3 h-3 mr-1" />
                Plans {pendingPlans.length > 0 && `(${pendingPlans.length})`}
              </TabsTrigger>
              <TabsTrigger value="tests" className="text-xs px-2">
                <FlaskConical className="w-3 h-3 mr-1" />
                Tests {pendingTestResults.length > 0 && `(${pendingTestResults.length})`}
              </TabsTrigger>
              <TabsTrigger value="dockets" className="text-xs px-2">
                <Truck className="w-3 h-3 mr-1" />
                Dockets {pendingDocuments.length > 0 && `(${pendingDocuments.length})`}
              </TabsTrigger>
            </TabsList>

            <div className="mt-3">
              {getActiveItems().length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No pending {activeTab === "plans" ? "plans" : activeTab === "tests" ? "test results" : "dockets"}
                </div>
              ) : (
                <div className="space-y-2">
                  {getActiveItems().slice(0, 4).map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-md bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors text-sm"
                      onClick={() => handleItemClick(item.type)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {item.type === "plan" && <FileText className="w-4 h-4 text-primary shrink-0" />}
                        {item.type === "test" && <FlaskConical className="w-4 h-4 text-primary shrink-0" />}
                        {item.type === "docket" && <Truck className="w-4 h-4 text-primary shrink-0" />}
                        <span className="truncate">{item.displayId}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(item.received_at), "d MMM")}
                        </span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      <PendingPlansSheet
        open={plansSheetOpen}
        onOpenChange={setPlansSheetOpen}
        businessId={businessId}
      />

      <PendingTestResultsSheet
        open={testResultsSheetOpen}
        onOpenChange={setTestResultsSheetOpen}
        businessId={businessId}
      />

      <PendingDocumentsSheet
        open={documentsSheetOpen}
        onOpenChange={setDocumentsSheetOpen}
        businessId={businessId}
      />
    </>
  );
}
