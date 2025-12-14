import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Phone, Mail, AlertTriangle, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EmployeeDetailsSheet } from "@/components/employees/EmployeeDetailsSheet";
import { InviteEmployeeDialog } from "@/components/employees/InviteEmployeeDialog";
import { format, differenceInDays, isPast } from "date-fns";

type Employee = {
  id: string;
  full_name: string;
  phone: string | null;
  position: string | null;
  hourly_rate: number | null;
  created_at: string;
};

type Ticket = {
  id: string;
  employee_id: string;
  ticket_type: string;
  ticket_number: string | null;
  expiry_date: string | null;
};

export default function AdminEmployees() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name");
      if (error) throw error;
      return data as Employee[];
    },
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ["employee-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_tickets")
        .select("*");
      if (error) throw error;
      return data as Ticket[];
    },
  });

  const { data: userRoles = [] } = useQuery({
    queryKey: ["user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data;
    },
  });

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

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Employees</h1>
          <Button onClick={() => setIsInviteOpen(true)} className="touch-target">
            <Plus className="w-5 h-5 mr-2" />
            Invite Employee
          </Button>
        </div>

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

        {/* Employees List */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading employees...</div>
        ) : filteredEmployees.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {searchQuery
                ? "No employees found matching your search."
                : "No employees yet. Invite your first team member to get started."}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredEmployees.map((employee) => {
              const empTickets = getTicketsForEmployee(employee.id);
              const expiringCount = getExpiringTicketsCount(employee.id);
              const role = getRole(employee.id);

              return (
                <Card
                  key={employee.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setSelectedEmployee(employee)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{employee.full_name}</h3>
                          {role && (
                            <Badge variant={role === "admin" ? "default" : "secondary"}>
                              {role}
                            </Badge>
                          )}
                        </div>

                        {employee.position && (
                          <p className="text-sm text-muted-foreground">{employee.position}</p>
                        )}

                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                          {employee.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {employee.phone}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {empTickets.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Award className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {empTickets.length} ticket{empTickets.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
                        {expiringCount > 0 && (
                          <Badge variant="destructive" className="mt-1">
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
      </div>

      {/* Employee Details Sheet */}
      <EmployeeDetailsSheet
        employee={selectedEmployee}
        open={!!selectedEmployee}
        onOpenChange={(open) => !open && setSelectedEmployee(null)}
      />

      {/* Invite Dialog */}
      <InviteEmployeeDialog
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
      />
    </AdminLayout>
  );
}
