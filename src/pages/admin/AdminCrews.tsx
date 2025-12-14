import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Pencil, Trash2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CrewFormDialog } from "@/components/crews/CrewFormDialog";
import { CrewMembersDialog } from "@/components/crews/CrewMembersDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Crew = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

type CrewMember = {
  id: string;
  crew_id: string;
  employee_id: string;
  is_supervisor: boolean;
  profiles: {
    id: string;
    full_name: string;
    phone: string | null;
  };
};

export default function AdminCrews() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editCrew, setEditCrew] = useState<Crew | null>(null);
  const [manageMembersCrew, setManageMembersCrew] = useState<Crew | null>(null);
  const [deleteCrewId, setDeleteCrewId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: crews = [], isLoading } = useQuery({
    queryKey: ["crews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crews")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Crew[];
    },
  });

  const { data: crewMembers = [] } = useQuery({
    queryKey: ["crew-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crew_members")
        .select("*, profiles(id, full_name, phone)");
      if (error) throw error;
      return data as CrewMember[];
    },
  });

  const deleteCrew = useMutation({
    mutationFn: async (crewId: string) => {
      const { error } = await supabase.from("crews").delete().eq("id", crewId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crews"] });
      queryClient.invalidateQueries({ queryKey: ["crew-members"] });
      toast({ title: "Crew deleted successfully" });
      setDeleteCrewId(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getMembersForCrew = (crewId: string) => {
    return crewMembers.filter((m) => m.crew_id === crewId);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Crews</h1>
          <Button onClick={() => setIsCreateOpen(true)} className="touch-target">
            <Plus className="w-5 h-5 mr-2" />
            New Crew
          </Button>
        </div>

        {/* Crews List */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading crews...</div>
        ) : crews.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No crews yet. Create your first crew to organize your team.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {crews.map((crew) => {
              const members = getMembersForCrew(crew.id);
              const supervisor = members.find((m) => m.is_supervisor);

              return (
                <Card key={crew.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{crew.name}</CardTitle>
                        {crew.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {crew.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditCrew(crew)}
                          className="h-8 w-8"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteCrewId(crew.id)}
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {members.length} member{members.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {supervisor && (
                      <div className="mb-3">
                        <Badge variant="secondary" className="text-xs">
                          Supervisor: {supervisor.profiles.full_name}
                        </Badge>
                      </div>
                    )}

                    {members.length > 0 && (
                      <div className="space-y-1 mb-3">
                        {members
                          .filter((m) => !m.is_supervisor)
                          .slice(0, 3)
                          .map((member) => (
                            <p key={member.id} className="text-sm truncate">
                              {member.profiles.full_name}
                            </p>
                          ))}
                        {members.filter((m) => !m.is_supervisor).length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{members.filter((m) => !m.is_supervisor).length - 3} more
                          </p>
                        )}
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full touch-target"
                      onClick={() => setManageMembersCrew(crew)}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Manage Members
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <CrewFormDialog
        open={isCreateOpen || !!editCrew}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditCrew(null);
          }
        }}
        editCrew={editCrew}
      />

      {/* Manage Members Dialog */}
      <CrewMembersDialog
        crew={manageMembersCrew}
        open={!!manageMembersCrew}
        onOpenChange={(open) => {
          if (!open) setManageMembersCrew(null);
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCrewId} onOpenChange={(open) => !open && setDeleteCrewId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Crew</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this crew? This will remove all member assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCrewId && deleteCrew.mutate(deleteCrewId)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
