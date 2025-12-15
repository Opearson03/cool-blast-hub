import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EmployeeLayout } from "@/components/layout/EmployeeLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Clock, FileCheck, MapPin, Calendar, AlertTriangle, Shield } from "lucide-react";
import { format, isToday, isTomorrow, differenceInDays } from "date-fns";
import { ITPDetailSheet } from "@/components/jobs/itps/ITPDetailSheet";
import { SWMSDetailSheet } from "@/components/jobs/swms/SWMSDetailSheet";
import type { Tables } from "@/integrations/supabase/types";

type JobITP = Tables<"job_itps">;
type JobSWMS = Tables<"job_swms">;
type SWMSSignoff = Tables<"swms_signoffs">;

interface ITPWithDetails extends JobITP {
  job?: { id: string; name: string; job_number: string; site_address: string } | null;
  pour?: { id: string; pour_name: string; pour_date: string; visit_type: string } | null;
}

interface SWMSWithDetails extends JobSWMS {
  job?: { id: string; name: string; job_number: string; site_address: string } | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  in_progress: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  completed: "bg-green-500/20 text-green-600 border-green-500/30",
  active: "bg-blue-500/20 text-blue-600 border-blue-500/30",
};

export default function EmployeeDashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedItp, setSelectedItp] = useState<ITPWithDetails | null>(null);
  const [selectedSwms, setSelectedSwms] = useState<SWMSWithDetails | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || null);
    };
    loadUser();
  }, []);

  // Fetch ITPs assigned to this user
  const { data: assignedItps = [], isLoading } = useQuery({
    queryKey: ["my-assigned-itps", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("job_itps")
        .select(`
          *,
          job:jobs(id, name, job_number, site_address),
          pour:job_pours(id, pour_name, pour_date, visit_type)
        `)
        .eq("assigned_to", userId)
        .neq("status", "completed")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as ITPWithDetails[];
    },
    enabled: !!userId,
  });

  // Fetch completed ITPs
  const { data: completedItps = [] } = useQuery({
    queryKey: ["my-completed-itps", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("job_itps")
        .select(`
          *,
          job:jobs(id, name, job_number, site_address),
          pour:job_pours(id, pour_name, pour_date, visit_type)
        `)
        .eq("assigned_to", userId)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return (data || []) as ITPWithDetails[];
    },
    enabled: !!userId,
  });

  // Fetch SWMS assigned to this user that need signing
  const { data: assignedSwms = [] } = useQuery({
    queryKey: ["my-assigned-swms", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      // Get all SWMS where user is in required_signers
      const { data: swmsData, error: swmsError } = await supabase
        .from("job_swms")
        .select(`
          *,
          job:jobs(id, name, job_number, site_address)
        `)
        .contains("required_signers", [userId])
        .order("created_at", { ascending: false });

      if (swmsError) throw swmsError;
      if (!swmsData || swmsData.length === 0) return [];

      // Get signoffs for these SWMS
      const swmsIds = swmsData.map(s => s.id);
      const { data: signoffs, error: signoffError } = await supabase
        .from("swms_signoffs")
        .select("swms_id, employee_id")
        .in("swms_id", swmsIds)
        .eq("employee_id", userId);

      if (signoffError) throw signoffError;

      const signedSwmsIds = new Set((signoffs || []).map(s => s.swms_id));
      
      // Return only SWMS the user hasn't signed yet
      return swmsData.filter(s => !signedSwmsIds.has(s.id)) as SWMSWithDetails[];
    },
    enabled: !!userId,
  });

  // Fetch signoffs for the selected SWMS
  const { data: selectedSwmsSignoffs = [] } = useQuery({
    queryKey: ["swms-signoffs-for-detail", selectedSwms?.id],
    queryFn: async () => {
      if (!selectedSwms) return [];
      const { data, error } = await supabase
        .from("swms_signoffs")
        .select("*")
        .eq("swms_id", selectedSwms.id);
      if (error) throw error;
      return data as SWMSSignoff[];
    },
    enabled: !!selectedSwms,
  });

  // Fetch upcoming pours for this user
  const { data: upcomingPours = [] } = useQuery({
    queryKey: ["my-upcoming-pours", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const today = format(new Date(), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("pour_employees")
        .select(`
          pour_id,
          job_pours!inner (
            id,
            pour_name,
            pour_date,
            scheduled_time,
            visit_type,
            jobs!inner (name, site_address)
          )
        `)
        .eq("employee_id", userId)
        .gte("job_pours.pour_date", today)
        .order("job_pours(pour_date)", { ascending: true })
        .limit(5);

      if (error) throw error;
      return (data || []).map((item: any) => ({
        id: item.job_pours.id,
        pour_name: item.job_pours.pour_name,
        pour_date: item.job_pours.pour_date,
        scheduled_time: item.job_pours.scheduled_time,
        visit_type: item.job_pours.visit_type,
        job_name: item.job_pours.jobs.name,
        site_address: item.job_pours.jobs.site_address,
      }));
    },
    enabled: !!userId,
  });

  // Fetch expiring tickets
  const { data: expiringTickets = [] } = useQuery({
    queryKey: ["my-expiring-tickets", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("employee_tickets")
        .select("*")
        .eq("employee_id", userId)
        .not("expiry_date", "is", null)
        .order("expiry_date", { ascending: true });

      if (error) throw error;
      
      // Filter to only show tickets expiring in next 90 days or already expired
      return (data || []).filter((ticket) => {
        const days = differenceInDays(new Date(ticket.expiry_date!), new Date());
        return days <= 90;
      });
    },
    enabled: !!userId,
  });

  const visitTypeLabels: Record<string, string> = {
    pour: "Pour",
    earthworks: "Earthworks",
    formwork_place: "Place Formwork",
    formwork_strip: "Strip Formwork",
    cure: "Curing",
    seal: "Sealing",
    other: "Other",
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, d MMM");
  };

  return (
    <EmployeeLayout>
      <div className="space-y-6 pb-20">
        <h1 className="text-xl font-bold">My Dashboard</h1>

        {/* Expiring Tickets Alert */}
        {expiringTickets.length > 0 && (
          <Card className="border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-600">Tickets Expiring Soon</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {expiringTickets.map((t) => t.ticket_type).join(", ")} - check your profile to update
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Work */}
        {upcomingPours.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="w-5 h-5" />
                Upcoming Work
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {upcomingPours.map((pour: any) => (
                  <div
                    key={pour.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-sm">{pour.pour_name}</p>
                      <p className="text-xs text-muted-foreground">{pour.job_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{getDateLabel(pour.pour_date)}</p>
                      {pour.scheduled_time && (
                        <p className="text-xs text-muted-foreground">{pour.scheduled_time}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* SWMS Requiring Signature */}
        {assignedSwms.length > 0 && (
          <Card className="border-orange-500/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="w-5 h-5 text-orange-500" />
                SWMS Requiring Your Signature
                <Badge variant="outline" className="ml-auto bg-orange-500/20 text-orange-600 border-orange-500/30">
                  {assignedSwms.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {assignedSwms.map((swms) => (
                  <Card
                    key={swms.id}
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setSelectedSwms(swms)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-orange-500 mt-0.5" />
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium">{swms.name}</span>
                            <Badge variant="outline" className={statusColors[swms.status || "pending"]}>
                              {swms.status === "active" ? "Active" : "Pending"}
                            </Badge>
                          </div>
                          {swms.job && (
                            <p className="text-sm text-muted-foreground">
                              {swms.job.job_number} - {swms.job.name}
                            </p>
                          )}
                          {swms.job?.site_address && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {swms.job.site_address}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assigned ITPs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="w-5 h-5" />
              My Assigned ITPs
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : assignedItps.length === 0 ? (
              <p className="text-muted-foreground text-sm">No ITPs assigned to you.</p>
            ) : (
              <div className="space-y-3">
                {assignedItps.map((itp) => (
                  <Card
                    key={itp.id}
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setSelectedItp(itp)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          {itp.status === "in_progress" ? (
                            <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
                          ) : (
                            <ClipboardList className="w-5 h-5 text-muted-foreground mt-0.5" />
                          )}
                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-medium">{itp.name}</span>
                              <Badge variant="outline" className={statusColors[itp.status || "pending"]}>
                                {itp.status === "in_progress" ? "In Progress" : "Pending"}
                              </Badge>
                            </div>
                            {itp.job && (
                              <p className="text-sm text-muted-foreground">
                                {itp.job.job_number} - {itp.job.name}
                              </p>
                            )}
                            {itp.pour && (
                              <p className="text-sm text-muted-foreground">
                                {itp.pour.pour_name} • {visitTypeLabels[itp.pour.visit_type || "pour"]}
                                {itp.pour.pour_date && ` • ${format(new Date(itp.pour.pour_date), "d MMM")}`}
                              </p>
                            )}
                            {itp.job?.site_address && (
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {itp.job.site_address}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recently Completed */}
        {completedItps.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileCheck className="w-5 h-5" />
                Recently Completed
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {completedItps.map((itp) => (
                  <div
                    key={itp.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-sm">{itp.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {itp.job?.job_number} - {itp.job?.name}
                      </p>
                    </div>
                    {itp.completed_at && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(itp.completed_at), "d MMM")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ITP Detail Sheet */}
      <ITPDetailSheet
        open={!!selectedItp}
        onOpenChange={(open) => !open && setSelectedItp(null)}
        itp={selectedItp}
        jobId={selectedItp?.job_id || ""}
      />

      {/* SWMS Detail Sheet */}
      <SWMSDetailSheet
        open={!!selectedSwms}
        onOpenChange={(open) => !open && setSelectedSwms(null)}
        swms={selectedSwms}
        signoffs={selectedSwmsSignoffs}
        jobId={selectedSwms?.job_id || ""}
      />
    </EmployeeLayout>
  );
}
