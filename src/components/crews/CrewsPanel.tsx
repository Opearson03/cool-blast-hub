import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Pencil, Trash2, UserPlus, HardHat, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CrewFormDialog } from "@/components/crews/CrewFormDialog";
import { CrewMembersDialog } from "@/components/crews/CrewMembersDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Crew = { id: string; name: string; description: string | null; created_at: string };
type CrewMember = {
  id: string; crew_id: string; employee_id: string; is_supervisor: boolean;
  profiles: { id: string; full_name: string; phone: string | null };
};

interface Props {
  onOpenCrewChat?: (crewId: string) => void;
}

export function CrewsPanel({ onOpenCrewChat }: Props) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editCrew, setEditCrew] = useState<Crew | null>(null);
  const [manageMembersCrew, setManageMembersCrew] = useState<Crew | null>(null);
  const [deleteCrewId, setDeleteCrewId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: crews = [], isLoading } = useQuery({
    queryKey: ["crews"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crews").select("*").order("name");
      if (error) throw error;
      return data as Crew[];
    },
  });

  const { data: crewMembers = [] } = useQuery({
    queryKey: ["crew-members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crew_members").select("*, profiles(id, full_name, phone)");
      if (error) throw error;
      return data as CrewMember[];
    },
  });

  const deleteCrew = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crews"] });
      queryClient.invalidateQueries({ queryKey: ["crew-members"] });
      toast({ title: "Crew deleted" });
      setDeleteCrewId(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const membersFor = (id: string) => crewMembers.filter((m) => m.crew_id === id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Organise your team into crews. Each crew gets its own chat channel automatically.</p>
        <Button onClick={() => setIsCreateOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-1" /> New crew
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading crews...</div>
      ) : crews.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No crews yet. Create your first crew to organise your team.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {crews.map((crew) => {
            const members = membersFor(crew.id);
            const supervisor = members.find((m) => m.is_supervisor);
            return (
              <Card key={crew.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <CardTitle className="text-base flex items-center gap-2">
                        <HardHat className="w-4 h-4 text-primary" /> {crew.name}
                      </CardTitle>
                      {crew.description && <CardDescription className="mt-1 text-xs line-clamp-2">{crew.description}</CardDescription>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditCrew(crew)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteCrewId(crew.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{members.length}</span>
                    <span className="text-xs text-muted-foreground">member{members.length !== 1 ? "s" : ""}</span>
                  </div>
                  {supervisor && (
                    <Badge variant="secondary" className="text-xs">Supervisor: {supervisor.profiles.full_name}</Badge>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setManageMembersCrew(crew)}>
                      <UserPlus className="w-3.5 h-3.5 mr-1" /> Members
                    </Button>
                    {onOpenCrewChat && (
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => onOpenCrewChat(crew.id)}>
                        <MessageCircle className="w-3.5 h-3.5 mr-1" /> Chat
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CrewFormDialog
        open={isCreateOpen || !!editCrew}
        onOpenChange={(open) => { if (!open) { setIsCreateOpen(false); setEditCrew(null); } }}
        editCrew={editCrew}
      />
      <CrewMembersDialog
        crew={manageMembersCrew}
        open={!!manageMembersCrew}
        onOpenChange={(open) => { if (!open) setManageMembersCrew(null); }}
      />
      <AlertDialog open={!!deleteCrewId} onOpenChange={(open) => !open && setDeleteCrewId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Crew</AlertDialogTitle>
            <AlertDialogDescription>This will remove all member assignments and the crew chat channel.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCrewId && deleteCrew.mutate(deleteCrewId)}
              className="bg-destructive text-destructive-foreground"
            >Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
