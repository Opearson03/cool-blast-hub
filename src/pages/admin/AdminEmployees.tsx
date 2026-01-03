import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Phone, AlertTriangle, Award, Clock, RefreshCw, Mail, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EmployeeDetailsSheet } from "@/components/employees/EmployeeDetailsSheet";
import { InviteEmployeeDialog } from "@/components/employees/InviteEmployeeDialog";
import { LeaveRequestsList } from "@/components/leave/LeaveRequestsList";
import { UnassignedEmployeesWidget } from "@/components/employees/UnassignedEmployeesWidget";
import { TimesheetTable } from "@/components/timesheets/TimesheetTable";
import { TimesheetExport } from "@/components/timesheets/TimesheetExport";
import { differenceInDays, isPast, formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

type Employee = {
  id: string;
  full_name: string;
  phone: string | null;
  position: string | null;
  hourly_rate: number | null;
  avatar_url: string | null;
  created_at: string;
};

type PendingInvite = {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "staff";
  invited_at: string | null;
  accepted_at: string | null;
};

type Ticket = {
  id: string;
  employee_id: string;
  ticket_type: string;
  ticket_number: string | null;
  expiry_date: string | null;
};

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

export default function AdminEmployees() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("employees");
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadBusinessId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();
      if (profile?.business_id) setBusinessId(profile.business_id);
    };
    loadBusinessId();
  }, []);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees-team"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_team_profiles");
      if (error) throw error;
      return (data || []) as Employee[];
    },
  });

  const { data: pendingInvites = [], isLoading: isLoadingInvites } = useQuery({
    queryKey: ["pending-invites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pending_invites")
        .select("*")
        .is("accepted_at", null)
        .order("invited_at", { ascending: false });
      if (error) throw error;
      return (data || []) as PendingInvite[];
    },
  });

  // Get business info for resend emails
  const { data: businessInfo } = useQuery({
    queryKey: ["business-info-for-invites"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, business_id")
        .eq("id", userData.user.id)
        .single();
      
      if (!profile?.business_id) return null;
      
      const { data: business } = await supabase
        .from("businesses")
        .select("name")
        .eq("id", profile.business_id)
        .single();
      
      return {
        inviterName: profile.full_name,
        businessName: business?.name || "Your Company"
      };
    },
  });

  const resendInviteMutation = useMutation({
    mutationFn: async (invite: PendingInvite) => {
      const { error } = await supabase.functions.invoke("send-invite-email", {
        body: {
          employeeName: invite.full_name,
          employeeEmail: invite.email,
          businessName: businessInfo?.businessName || "Your Company",
          inviterName: businessInfo?.inviterName || "Your employer",
          role: invite.role,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Invite resent",
        description: "The signup link has been sent again.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to resend invite",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setResendingId(null);
    },
  });

  const handleResendInvite = (invite: PendingInvite) => {
    setResendingId(invite.id);
    resendInviteMutation.mutate(invite);
  };

  const deleteMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: "invite" | "employee" }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("delete-employee", {
        body: { employeeId: id, type },
      });
      
      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.type === "invite" ? "Invite deleted" : "Employee removed",
        description: variables.type === "invite" 
          ? "The pending invite has been cancelled." 
          : "The employee has been removed from your team.",
      });
      queryClient.invalidateQueries({ queryKey: ["pending-invites"] });
      queryClient.invalidateQueries({ queryKey: ["employees-team"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  const handleDelete = (id: string, type: "invite" | "employee") => {
    setDeletingId(id);
    deleteMutation.mutate({ id, type });
  };

  const { data: tickets = [] } = useQuery({
    queryKey: ["employee-tickets", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const { data, error } = await supabase
        .from("employee_tickets")
        .select("*");
      if (error) throw error;
      return data as Ticket[];
    },
    enabled: !!businessId,
  });

  const { data: userRoles = [] } = useQuery({
    queryKey: ["user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: leaveRequests = [], refetch: refetchLeave } = useQuery({
    queryKey: ["leave-requests", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const { data, error } = await supabase
        .from("leave_requests")
        .select("*, profiles!leave_requests_employee_id_fkey(full_name)")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as LeaveRequest[];
    },
    enabled: !!businessId,
  });

  const pendingLeaveCount = leaveRequests.filter(r => r.status === "pending").length;

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.phone?.includes(searchQuery)
  );

  const getTicketsForEmployee = (employeeId: string) => {
    return tickets.filter((t) => t.employee_id === employeeId);
  };

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (isPast(new Date(expiryDate))) return "expired";
    if (days <= 30) return "expiring";
    return "valid";
  };

  const getExpiringTicketsCount = (employeeId: string) => {
    const empTickets = getTicketsForEmployee(employeeId);
    return empTickets.filter((t) => {
      const status = getExpiryStatus(t.expiry_date);
      return status === "expired" || status === "expiring";
    }).length;
  };

  const getRole = (employeeId: string) => {
    const role = userRoles.find((r) => r.user_id === employeeId);
    return role?.role || null;
  };

  const pendingRequests = leaveRequests.filter(r => r.status === "pending");
  const processedRequests = leaveRequests.filter(r => r.status !== "pending");

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["employees-team"] }),
      queryClient.invalidateQueries({ queryKey: ["pending-invites"] }),
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] }),
      queryClient.invalidateQueries({ queryKey: ["employee-tickets"] }),
    ]);
  }, [queryClient]);

  return (
    <AdminLayout>
      <PullToRefresh onRefresh={handleRefresh} className="h-full">
      <div className="space-y-4 max-w-full overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Employees</h1>
          <Button onClick={() => setIsInviteOpen(true)} className="touch-target">
            <Plus className="w-5 h-5 mr-2" />
            Invite Employee
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto -mx-4 px-4">
            <TabsList className="w-max">
              <TabsTrigger value="employees">
                Team ({employees.length})
                {pendingInvites.length > 0 && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    +{pendingInvites.length} pending
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="timesheets">
                <Clock className="w-4 h-4 mr-1" />
                Timesheets
              </TabsTrigger>
              <TabsTrigger value="leave" className="relative">
                Leave
                {pendingLeaveCount > 0 && (
                  <Badge className="ml-2 bg-amber-500 text-white text-xs px-1.5 py-0.5">
                    {pendingLeaveCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="employees" className="mt-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 touch-target"
              />
            </div>

            {/* Pending Invites */}
            {pendingInvites.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Pending Invites</h3>
                {pendingInvites.map((invite) => {
                  const initials = invite.full_name.split(" ").map(n => n[0]).join("").toUpperCase();
                  const invitedAgo = invite.invited_at 
                    ? formatDistanceToNow(new Date(invite.invited_at), { addSuffix: true })
                    : null;

                  return (
                    <Card key={invite.id} className="border-dashed">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-semibold">{invite.full_name}</h3>
                              <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                                Pending
                              </Badge>
                              <Badge variant={invite.role === "admin" ? "default" : "secondary"}>
                                {invite.role}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="w-3 h-3 shrink-0" />
                              <span className="truncate">{invite.email}</span>
                            </div>
                            {invitedAgo && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Invited {invitedAgo}
                              </p>
                            )}
                            <div className="flex gap-2 mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResendInvite(invite)}
                                disabled={resendingId === invite.id || deletingId === invite.id}
                              >
                                <RefreshCw className={`w-4 h-4 mr-1 ${resendingId === invite.id ? 'animate-spin' : ''}`} />
                                Resend
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    disabled={deletingId === invite.id}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Cancel Invite</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to cancel the invite for {invite.full_name}? They will no longer be able to sign up.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Keep Invite</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(invite.id, "invite")}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Cancel Invite
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Active Employees List */}
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading employees...</div>
            ) : filteredEmployees.length === 0 && pendingInvites.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  {searchQuery
                    ? "No employees found matching your search."
                    : "No employees yet. Invite your first team member to get started."}
                </CardContent>
              </Card>
            ) : filteredEmployees.length > 0 && (
              <div className="space-y-3">
                {pendingInvites.length > 0 && (
                  <h3 className="text-sm font-medium text-muted-foreground">Active Team Members</h3>
                )}
                {filteredEmployees.map((employee) => {
                  const empTickets = getTicketsForEmployee(employee.id);
                  const expiringCount = getExpiringTicketsCount(employee.id);
                  const role = getRole(employee.id);
                  const initials = employee.full_name.split(" ").map(n => n[0]).join("").toUpperCase();

                  return (
                    <Card
                      key={employee.id}
                      className="cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarImage src={employee.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-semibold">{employee.full_name}</h3>
                              {role && (
                                <Badge variant={role === "admin" ? "default" : "secondary"}>
                                  {role}
                                </Badge>
                              )}
                              {empTickets.length > 0 && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Award className="w-3 h-3" />
                                  <span>{empTickets.length} ticket{empTickets.length !== 1 ? "s" : ""}</span>
                                </div>
                              )}
                              {employee.id !== currentUserId && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive hover:text-destructive h-7 w-7 p-0 ml-auto"
                                      onClick={(e) => e.stopPropagation()}
                                      disabled={deletingId === employee.id}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Remove Employee</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to remove {employee.full_name} from your team? This will delete all their data including timesheets, tickets, and leave requests. This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDelete(employee.id, "employee");
                                        }}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Remove Employee
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>

                            {employee.position && (
                              <p className="text-sm text-muted-foreground">{employee.position}</p>
                            )}

                            {employee.phone && (
                              <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                                <Phone className="w-3 h-3 shrink-0" />
                                <span>{employee.phone}</span>
                              </div>
                            )}

                            {expiringCount > 0 && (
                              <Badge variant="destructive" className="mt-2">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                {expiringCount} expiring
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="timesheets" className="mt-4 space-y-4">
            {/* Unassigned Employees Widget */}
            {businessId && <UnassignedEmployeesWidget businessId={businessId} />}
            
            <div className="flex justify-end">
              {businessId && <TimesheetExport businessId={businessId} />}
            </div>
            {businessId && <TimesheetTable businessId={businessId} />}
          </TabsContent>

          <TabsContent value="leave" className="mt-4 space-y-4">
            <Tabs defaultValue="pending">
              <TabsList>
                <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>
                <TabsTrigger value="processed">Processed ({processedRequests.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="pending" className="mt-4">
                <LeaveRequestsList requests={pendingRequests} isAdmin={true} onUpdate={() => refetchLeave()} />
              </TabsContent>
              <TabsContent value="processed" className="mt-4">
                <LeaveRequestsList requests={processedRequests} isAdmin={true} onUpdate={() => refetchLeave()} />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>

      <EmployeeDetailsSheet
        employee={selectedEmployee}
        open={!!selectedEmployee}
        onOpenChange={(open) => !open && setSelectedEmployee(null)}
        isAdmin={true}
      />

      <InviteEmployeeDialog
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
      />
      </PullToRefresh>
    </AdminLayout>
  );
}
