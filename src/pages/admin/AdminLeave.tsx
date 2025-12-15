import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { LeaveRequestsList } from "@/components/leave/LeaveRequestsList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  review_notes: string | null;
  created_at: string;
  profiles?: { full_name: string };
}

export default function AdminLeave() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!profile?.business_id) return;

      const { data, error } = await supabase
        .from("leave_requests")
        .select("*, profiles!leave_requests_employee_id_fkey(full_name)")
        .eq("business_id", profile.business_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests((data || []) as unknown as LeaveRequest[]);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const pendingRequests = requests.filter(r => r.status === "pending");
  const processedRequests = requests.filter(r => r.status !== "pending");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Leave Management</h1>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">
                Pending ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="processed">
                Processed ({processedRequests.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="mt-4">
              <LeaveRequestsList requests={pendingRequests} isAdmin={true} onUpdate={fetchRequests} />
            </TabsContent>
            <TabsContent value="processed" className="mt-4">
              <LeaveRequestsList requests={processedRequests} isAdmin={true} onUpdate={fetchRequests} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
}
