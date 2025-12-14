import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type Crew = {
  id: string;
  name: string;
  description: string | null;
};

interface CrewFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editCrew?: Crew | null;
}

export function CrewFormDialog({ open, onOpenChange, editCrew }: CrewFormDialogProps) {
  const [name, setName] = useState(editCrew?.name || "");
  const [description, setDescription] = useState(editCrew?.description || "");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", userData.user?.id)
        .single();

      const crewData = {
        name,
        description: description || null,
        business_id: profile?.business_id,
      };

      if (editCrew) {
        const { error } = await supabase
          .from("crews")
          .update(crewData)
          .eq("id", editCrew.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("crews").insert(crewData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crews"] });
      toast({ title: editCrew ? "Crew updated" : "Crew created" });
      onOpenChange(false);
      setName("");
      setDescription("");
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Please enter a crew name", variant: "destructive" });
      return;
    }
    mutation.mutate();
  };

  // Reset form when editCrew changes
  useState(() => {
    setName(editCrew?.name || "");
    setDescription(editCrew?.description || "");
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editCrew ? "Edit Crew" : "Create New Crew"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Crew Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Crew A - Slabs"
              className="touch-target"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 touch-target"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending} className="flex-1 touch-target">
              {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editCrew ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
