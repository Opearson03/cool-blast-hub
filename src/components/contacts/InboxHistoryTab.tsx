import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { InboxDetailSheet } from "./InboxDetailSheet";

export interface InboxItem {
  id: string;
  type: "plan" | "test" | "docket";
  from_email: string;
  from_name: string | null;
  subject: string | null;
  file_url: string | null;
  file_name: string | null;
  received_at: string;
  status: string;
  linked_id: string | null;
  email_body?: string | null;
}

export function InboxHistoryTab() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

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
          items.push({
            id: test.id,
            type: "test",
            from_email: test.from_email,
            from_name: null,
            subject: test.subject,
            file_url: test.lab_report_url,
            file_name: test.lab_report_url ? "Lab Report" : null,
            received_at: test.received_at,
            status: test.status,
            linked_id: test.linked_job_id,
            email_body: test.email_body,
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
      />
    </div>
  );
}
