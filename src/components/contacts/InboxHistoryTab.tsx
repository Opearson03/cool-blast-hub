import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Inbox, 
  Search,
  FileText,
  FlaskConical,
  Truck,
  Calendar,
  Mail,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { InboxDetailSheet } from "./InboxDetailSheet";
import { AssignTestDialog } from "./AssignTestDialog";
import { AssignDocketDialog } from "./AssignDocketDialog";
import { ActionQuoteDialog } from "./ActionQuoteDialog";
import { toast } from "sonner";

export interface InboxItem {
  id: string;
  type: "plan" | "test" | "docket" | "general" | "quote";
  from_email: string;
  from_name: string | null;
  subject: string | null;
  file_url: string | null;
  file_name: string | null;
  received_at: string;
  status: string;
  linked_id: string | null;
  email_body?: string | null;
  linked_rfq_id?: string | null;
}

export function InboxHistoryTab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  
  // For test result assignment
  const [testAssignSheetOpen, setTestAssignSheetOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  
  // For docket assignment
  const [docketAssignSheetOpen, setDocketAssignSheetOpen] = useState(false);
  const [selectedDocketId, setSelectedDocketId] = useState<string | null>(null);

  // For quote conversion
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  // Helper to extract filename from URL
  const getFileNameFromUrl = (url: string | null): string | null => {
    if (!url) return null;
    try {
      const urlPath = url.split('?')[0]; // Remove query params
      const parts = urlPath.split('/');
      return parts[parts.length - 1] || null;
    } catch {
      return null;
    }
  };

  const { data: inboxItems = [], isLoading } = useQuery({
    queryKey: ["inbox-history"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!profile?.business_id) return [];

      const items: InboxItem[] = [];

      // Fetch plans
      const { data: plans } = await supabase
        .from("pending_plans")
        .select("id, from_email, from_name, subject, file_url, file_name, received_at, status, linked_estimate_id, email_body")
        .eq("business_id", profile.business_id);

      if (plans) {
        for (const plan of plans) {
          items.push({
            id: plan.id,
            type: "plan",
            from_email: plan.from_email,
            from_name: plan.from_name,
            subject: plan.subject,
            file_url: plan.file_url,
            file_name: plan.file_name,
            received_at: plan.received_at,
            status: plan.status,
            linked_id: plan.linked_estimate_id,
            email_body: plan.email_body,
          });
        }
      }

      // Fetch dockets
      const { data: dockets } = await supabase
        .from("pending_documents")
        .select("id, from_email, subject, file_url, file_name, received_at, status, linked_job_id, email_body")
        .eq("business_id", profile.business_id);

      if (dockets) {
        for (const docket of dockets) {
          items.push({
            id: docket.id,
            type: "docket",
            from_email: docket.from_email,
            from_name: null,
            subject: docket.subject,
            file_url: docket.file_url,
            file_name: docket.file_name,
            received_at: docket.received_at,
            status: docket.status,
            linked_id: docket.linked_job_id,
            email_body: docket.email_body,
          });
        }
      }

      // Fetch test results
      const { data: testResults } = await supabase
        .from("pending_test_results")
        .select("id, from_email, subject, lab_report_url, received_at, status, linked_job_id, email_body")
        .eq("business_id", profile.business_id);

      if (testResults) {
        for (const test of testResults) {
          // Extract actual filename from URL or use default with proper extension
          const extractedName = getFileNameFromUrl(test.lab_report_url);
          const fileName = extractedName || (test.lab_report_url ? "lab-report.pdf" : null);
          
          items.push({
            id: test.id,
            type: "test",
            from_email: test.from_email,
            from_name: null,
            subject: test.subject,
            file_url: test.lab_report_url,
            file_name: fileName,
            received_at: test.received_at,
            status: test.status,
            linked_id: test.linked_job_id,
            email_body: test.email_body,
          });
        }
      }

      // Fetch general items
      const { data: generalItems } = await supabase
        .from("pending_general")
        .select("id, from_email, from_name, subject, file_url, file_name, received_at, status, email_body")
        .eq("business_id", profile.business_id);

      if (generalItems) {
        for (const general of generalItems) {
          items.push({
            id: general.id,
            type: "general",
            from_email: general.from_email,
            from_name: general.from_name,
            subject: general.subject,
            file_url: general.file_url,
            file_name: general.file_name,
            received_at: general.received_at,
            status: general.status,
            linked_id: null,
            email_body: general.email_body,
          });
        }
      }

      // Fetch quotes
      const { data: quotes } = await supabase
        .from("pending_quotes")
        .select("id, from_email, from_name, subject, file_url, file_name, received_at, status, linked_rfq_id, linked_job_id, email_body")
        .eq("business_id", profile.business_id);

      if (quotes) {
        for (const quote of quotes) {
          items.push({
            id: quote.id,
            type: "quote",
            from_email: quote.from_email,
            from_name: quote.from_name,
            subject: quote.subject,
            file_url: quote.file_url,
            file_name: quote.file_name,
            received_at: quote.received_at,
            status: quote.status,
            linked_id: quote.linked_job_id,
            email_body: quote.email_body,
            linked_rfq_id: quote.linked_rfq_id,
          });
        }
      }

      // Sort by received_at descending
      items.sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime());

      return items;
    },
  });

  const filteredItems = useMemo(() => {
    let filtered = inboxItems;

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((item) => item.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "pending") {
        filtered = filtered.filter((item) => item.status === "pending");
      } else {
        filtered = filtered.filter((item) => item.status !== "pending");
      }
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.from_email.toLowerCase().includes(query) ||
          item.from_name?.toLowerCase().includes(query) ||
          item.subject?.toLowerCase().includes(query) ||
          item.file_name?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [inboxItems, typeFilter, statusFilter, searchQuery]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "plan":
        return <FileText className="h-4 w-4 text-primary" />;
      case "test":
        return <FlaskConical className="h-4 w-4 text-secondary-foreground" />;
      case "docket":
        return <Truck className="h-4 w-4 text-muted-foreground" />;
      case "general":
        return <Mail className="h-4 w-4 text-muted-foreground" />;
      case "quote":
        return <DollarSign className="h-4 w-4 text-primary" />;
      default:
        return <Inbox className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "plan":
        return "Plan";
      case "test":
        return "Test Result";
      case "docket":
        return "Docket";
      case "general":
        return "General";
      case "quote":
        return "Supplier";
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-warning/10 text-warning">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-primary/10 text-primary">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-destructive/10 text-destructive">Rejected</Badge>;
      case "converted":
        return <Badge variant="outline" className="bg-accent text-accent-foreground">Converted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleItemClick = (item: InboxItem) => {
    setSelectedItem(item);
    setSheetOpen(true);
  };

  const handleNavigateToLinked = (item: InboxItem) => {
    if (!item.linked_id) return;
    setSheetOpen(false);
    
    if (item.type === "plan") {
      navigate("/admin/estimates");
    } else {
      navigate(`/admin/jobs/${item.linked_id}`);
    }
  };

  // Start an estimate from a plan email
  const handleStartEstimate = async (item: InboxItem) => {
    if (item.type !== "plan") return;
    setSheetOpen(false);
    
    try {
      // Get user's business_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Not authenticated");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!profile?.business_id) {
        toast.error("Business not found");
        return;
      }

      // Get the pending plan data with extracted info
      const { data: plan } = await supabase
        .from("pending_plans")
        .select("*")
        .eq("id", item.id)
        .single();

      if (!plan) {
        toast.error("Plan not found");
        return;
      }

      const extractedData = plan.extracted_data as {
        client_name?: string;
        site_address?: string;
        client_email?: string;
      } | null;

      // Create a new estimate
      const { data: estimate, error: estimateError } = await supabase
        .from("estimates")
        .insert({
          business_id: profile.business_id,
          client_name: extractedData?.client_name || "New Client",
          site_address: extractedData?.site_address || plan.subject || "TBC",
          client_email: extractedData?.client_email || plan.from_email,
          status: "draft",
          estimate_type: "driveway", // Must match check constraint: driveway, house_slab, commercial_slab
          created_by: user.id,
        })
        .select()
        .single();

      if (estimateError || !estimate) {
        toast.error("Failed to create estimate");
        console.error(estimateError);
        return;
      }

      // Copy the PDF to estimate-plans bucket and create takeoff record
      if (plan.file_url) {
        // Copy file from test-documents to estimate-plans
        const fileName = `${estimate.id}/${plan.file_name || "plan.pdf"}`;
        
        // Get source file path
        let sourcePath = plan.file_url;
        if (sourcePath.startsWith("http")) {
          // If it's a full URL, extract the path
          const url = new URL(sourcePath);
          sourcePath = url.pathname.replace(/^\/storage\/v1\/object\/public\//, "");
        }

        // Create takeoff record
        const { data: takeoff, error: takeoffError } = await supabase
          .from("estimate_takeoffs")
          .insert({
            estimate_id: estimate.id,
            plan_url: plan.file_url,
            plan_type: "pdf",
            page_count: 1,
          })
          .select()
          .single();

        if (!takeoffError && takeoff) {
          // Create takeoff_files record
          await supabase.from("takeoff_files").insert({
            takeoff_id: takeoff.id,
            file_url: plan.file_url,
            file_name: plan.file_name || "plan.pdf",
            file_type: "application/pdf",
            page_count: 1,
            sort_order: 0,
          });
        }
      }

      // Update the pending plan to link to this estimate
      await supabase
        .from("pending_plans")
        .update({
          linked_estimate_id: estimate.id,
          status: "converted",
        })
        .eq("id", item.id);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["inbox-history"] });

      toast.success("Estimate created");
      navigate(`/admin/estimates?id=${estimate.id}&forceStart=true`);
    } catch (error) {
      console.error("Error starting estimate:", error);
      toast.error("Failed to start estimate");
    }
  };

  // Open assignment sheet for test results
  const handleAssignTest = (item: InboxItem) => {
    if (item.type !== "test") return;
    setSheetOpen(false);
    setSelectedTestId(item.id);
    setTestAssignSheetOpen(true);
  };

  // Open assignment sheet for dockets
  const handleAssignDocket = (item: InboxItem) => {
    if (item.type !== "docket") return;
    setSheetOpen(false);
    setSelectedDocketId(item.id);
    setDocketAssignSheetOpen(true);
  };

  const handleTestAssigned = () => {
    setTestAssignSheetOpen(false);
    setSelectedTestId(null);
    queryClient.invalidateQueries({ queryKey: ["inbox-history"] });
  };

  const handleDocketAssigned = () => {
    setDocketAssignSheetOpen(false);
    setSelectedDocketId(null);
    queryClient.invalidateQueries({ queryKey: ["inbox-history"] });
  };

  // Open quote conversion dialog
  const handleConvertQuote = (item: InboxItem) => {
    if (item.type !== "quote") return;
    setSheetOpen(false);
    setSelectedQuoteId(item.id);
    setQuoteDialogOpen(true);
  };

  const handleQuoteConverted = () => {
    setQuoteDialogOpen(false);
    setSelectedQuoteId(null);
    queryClient.invalidateQueries({ queryKey: ["inbox-history"] });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="plan">Plans</SelectItem>
            <SelectItem value="test">Test Results</SelectItem>
            <SelectItem value="docket">Dockets</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="quote">Suppliers</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processed">Processed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : inboxItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No emails received yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Emails sent to your inbox will appear here
            </p>
          </CardContent>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No emails match your filters
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => {
            const isPending = item.status === "pending";
            return (
            <Card 
              key={`${item.type}-${item.id}`} 
              className={`overflow-hidden cursor-pointer transition-colors ${
                isPending 
                  ? "border-warning/50 bg-warning/5 hover:bg-warning/10" 
                  : "hover:bg-muted/50"
              }`}
              onClick={() => handleItemClick(item)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {getTypeLabel(item.type)}
                      </Badge>
                      {getStatusBadge(item.status)}
                    </div>
                    <p className="font-medium mt-1 truncate">
                      {item.subject || item.file_name || "(No subject)"}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      From: {item.from_name || item.from_email}
                    </p>
                    {item.email_body && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {item.email_body}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(item.received_at), "dd MMM yyyy 'at' h:mm a")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      {/* Detail Sheet */}
      <InboxDetailSheet
        item={selectedItem}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onNavigateToLinked={handleNavigateToLinked}
        onStartEstimate={handleStartEstimate}
        onAssignTest={handleAssignTest}
        onAssignDocket={handleAssignDocket}
        onConvertQuote={handleConvertQuote}
        onReclassify={() => queryClient.invalidateQueries({ queryKey: ["inbox-history"] })}
      />

      {/* Test Result Assignment Dialog */}
      {selectedTestId && (
        <AssignTestDialog
          open={testAssignSheetOpen}
          onOpenChange={(open) => {
            setTestAssignSheetOpen(open);
            if (!open) setSelectedTestId(null);
          }}
          testId={selectedTestId}
          onAssigned={handleTestAssigned}
        />
      )}

      {/* Docket Assignment Dialog */}
      {selectedDocketId && (
        <AssignDocketDialog
          open={docketAssignSheetOpen}
          onOpenChange={(open) => {
            setDocketAssignSheetOpen(open);
            if (!open) setSelectedDocketId(null);
          }}
          docketId={selectedDocketId}
          onAssigned={handleDocketAssigned}
        />
      )}

      {/* Quote Conversion Dialog */}
      {selectedQuoteId && (
        <ActionQuoteDialog
          open={quoteDialogOpen}
          onOpenChange={(open) => {
            setQuoteDialogOpen(open);
            if (!open) setSelectedQuoteId(null);
          }}
          quoteId={selectedQuoteId}
          onConverted={handleQuoteConverted}
        />
      )}
    </div>
  );
}
