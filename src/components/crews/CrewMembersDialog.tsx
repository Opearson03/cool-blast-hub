import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, X, Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Crew = {
  id: string;
  name: string;
  description: string | null;
};

type Employee = {
  id: string;
  full_name: string;
  phone: string | null;
};

type CrewMember = {
  id: string;
  crew_id: string;
  employee_id: string;
  is_supervisor: boolean;
};

interface CrewMembersDialogProps {
  crew: Crew | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CrewMembersDialog({ crew, open, onOpenChange }: CrewMembersDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .order("full_name");
      if (error) throw error;
      return data as Employee[];
    },
  });

  const { data: crewMembers = [] } = useQuery({
    queryKey: ["crew-members", crew?.id],
    queryFn: async () => {
      if (!crew) return [];
      const { data, error } = await supabase
        .from("crew_members")
        .select("*")
        .eq("crew_id", crew.id);
      if (error) throw error;
      return data as CrewMember[];
    },
    enabled: !!crew,
  });

  const addMember = useMutation({
    mutationFn: async (employeeId: string) => {
      if (!crew) return;
      const { error } = await supabase.from("crew_members").insert({
        crew_id: crew.id,
        employee_id: employeeId,
        is_supervisor: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crew-members"] });
      toast({ title: "Member added" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from("crew_members").delete().eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crew-members"] });
      toast({ title: "Member removed" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleSupervisor = useMutation({
    mutationFn: async ({ memberId, isSupervisor }: { memberId: string; isSupervisor: boolean }) => {
      // First, remove supervisor status from all members in this crew
      if (isSupervisor && crew) {
        await supabase
          .from("crew_members")
          .update({ is_supervisor: false })
          .eq("crew_id", crew.id);
      }
      // Then set the new supervisor
      const { error } = await supabase
        .from("crew_members")
        .update({ is_supervisor: isSupervisor })
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crew-members"] });
      toast({ title: "Supervisor updated" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (!crew) return null;

  const memberIds = crewMembers.map((m) => m.employee_id);
  const currentMembers = employees.filter((e) => memberIds.includes(e.id));
  const availableEmployees = employees.filter((e) => !memberIds.includes(e.id));

  const getMember = (employeeId: string) => crewMembers.find((m) => m.employee_id === employeeId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage {crew.name} Members</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Members */}
          <div>
            <h4 className="text-sm font-medium mb-2">
              Current Members ({currentMembers.length})
            </h4>
            {currentMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members assigned yet.</p>
            ) : (
              <div className="space-y-2">
                {currentMembers.map((employee) => {
                  const member = getMember(employee.id);
                  return (
                    <div
                      key={employee.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-sm">{employee.full_name}</p>
                          {employee.phone && (
                            <p className="text-xs text-muted-foreground">{employee.phone}</p>
                          )}
                        </div>
                        {member?.is_supervisor && (
                          <Badge className="bg-primary">
                            <Star className="w-3 h-3 mr-1" />
                            Supervisor
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            member &&
                            toggleSupervisor.mutate({
                              memberId: member.id,
                              isSupervisor: !member.is_supervisor,
                            })
                          }
                          className={cn(
                            "text-xs",
                            member?.is_supervisor && "text-primary"
                          )}
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => member && removeMember.mutate(member.id)}
                          className="h-8 w-8 text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Available Employees */}
          {availableEmployees.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Add Members</h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {availableEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{employee.full_name}</p>
                      {employee.phone && (
                        <p className="text-xs text-muted-foreground">{employee.phone}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addMember.mutate(employee.id)}
                      disabled={addMember.isPending}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button onClick={() => onOpenChange(false)} className="w-full touch-target mt-4">
          Done
        </Button>
      </DialogContent>
    </Dialog>
  );
}
