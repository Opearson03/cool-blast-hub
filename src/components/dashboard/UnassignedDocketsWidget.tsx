import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FlaskConical, Truck, FileText, Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { PendingTestResultsSheet } from "@/components/jobs/PendingTestResultsSheet";
import { PendingDocumentsSheet } from "@/components/jobs/PendingDocumentsSheet";

interface UnassignedDocketsWidgetProps {
  businessId: string;
}

export function UnassignedDocketsWidget({ businessId }: UnassignedDocketsWidgetProps) {
  const [testResultsSheetOpen, setTestResultsSheetOpen] = useState(false);
  const [documentsSheetOpen, setDocumentsSheetOpen] = useState(false);

  // Fetch unassigned pending test results (match_status = 'pending')
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
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!businessId
  });

  // Fetch unassigned pending documents (match_status = 'pending')
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
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!businessId
  });

  const totalUnassigned = pendingTestResults.length + pendingDocuments.length;

  if (totalUnassigned === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-warning" />
              Assign Dockets
            </span>
            <Badge variant="secondary">{totalUnassigned} unassigned</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setTestResultsSheetOpen(true)}
            >
              <CardContent className="p-3 text-center">
                <FlaskConical className="w-6 h-6 mx-auto text-primary mb-1" />
                <p className="text-xl font-bold">{pendingTestResults.length}</p>
                <p className="text-xs text-muted-foreground">Test Results</p>
              </CardContent>
            </Card>
            <Card 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setDocumentsSheetOpen(true)}
            >
              <CardContent className="p-3 text-center">
                <Truck className="w-6 h-6 mx-auto text-primary mb-1" />
                <p className="text-xl font-bold">{pendingDocuments.length}</p>
                <p className="text-xs text-muted-foreground">Delivery Dockets</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent items list */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Recent:</p>
            {[...pendingTestResults.slice(0, 2), ...pendingDocuments.slice(0, 2)]
              .sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime())
              .slice(0, 3)
              .map((item) => {
                const isTest = 'lab_report_url' in item || !('file_name' in item);
                const extractedData = item.extracted_data as any;
                const displayId = isTest 
                  ? extractedData?.test_id 
                  : extractedData?.docket_number;
                
                return (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors text-sm"
                    onClick={() => isTest ? setTestResultsSheetOpen(true) : setDocumentsSheetOpen(true)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isTest ? (
                        <FlaskConical className="w-4 h-4 text-primary shrink-0" />
                      ) : (
                        <Truck className="w-4 h-4 text-primary shrink-0" />
                      )}
                      <span className="truncate">
                        {displayId || item.subject || "(No subject)"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(item.received_at), "d MMM")}
                      </span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </div>
                );
              })}
          </div>

          {totalUnassigned > 3 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => setTestResultsSheetOpen(true)}
            >
              View All Unassigned
            </Button>
          )}
        </CardContent>
      </Card>

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
