import { useState, useEffect } from "react";
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
import type { Tables } from "@/integrations/supabase/types";

type Equipment = Tables<"equipment">;

interface EquipmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editEquipment?: Equipment | null;
}

export function EquipmentFormDialog({ open, onOpenChange, editEquipment }: EquipmentFormDialogProps) {
  const [name, setName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [serviceIntervalDays, setServiceIntervalDays] = useState("");
  const [lastServiceDate, setLastServiceDate] = useState("");
  const [serviceNotes, setServiceNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (editEquipment) {
      setName(editEquipment.name);
      setSerialNumber(editEquipment.serial_number || "");
      setPurchaseDate(editEquipment.purchase_date || "");
      setServiceIntervalDays(editEquipment.service_interval_days?.toString() || "");
      setLastServiceDate(editEquipment.last_service_date || "");
      setServiceNotes(editEquipment.service_notes || "");
    } else {
      resetForm();
    }
  }, [editEquipment, open]);

  const resetForm = () => {
    setName("");
    setSerialNumber("");
    setPurchaseDate("");
    setServiceIntervalDays("");
    setLastServiceDate("");
    setServiceNotes("");
  };

  const calculateNextServiceDate = (lastService: string, intervalDays: number): string | null => {
    if (!lastService || !intervalDays) return null;
    const date = new Date(lastService);
    date.setDate(date.getDate() + intervalDays);
    return date.toISOString().split("T")[0];
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        throw new Error("You must be logged in to add equipment");
      }

      // Try to resolve business from profile first (staff users)
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", userId)
        .maybeSingle();

      let businessId = profile?.business_id as string | null | undefined;

      // If no profile business found, fall back to business where user is the owner (admin users)
      if (!businessId) {
        const { data: business } = await supabase
          .from("businesses")
          .select("id")
          .eq("owner_id", userId)
          .maybeSingle();

        businessId = business?.id;
      }

      if (!businessId) {
        throw new Error("Could not find your business record. Please contact support.");
      }

      const interval = serviceIntervalDays ? parseInt(serviceIntervalDays) : null;
      const nextService = calculateNextServiceDate(lastServiceDate, interval || 0);

      const equipmentData = {
        name,
        serial_number: serialNumber || null,
        purchase_date: purchaseDate || null,
        service_interval_days: interval,
        last_service_date: lastServiceDate || null,
        next_service_date: nextService,
        service_notes: serviceNotes || null,
        business_id: businessId,
      };
      if (editEquipment) {
        const { error } = await supabase
          .from("equipment")
          .update(equipmentData)
          .eq("id", editEquipment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("equipment").insert(equipmentData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast({ title: editEquipment ? "Equipment updated" : "Equipment added" });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Please enter equipment name", variant: "destructive" });
      return;
    }
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editEquipment ? "Edit Equipment" : "Add Equipment"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Equipment Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Concrete Vibrator"
              className="touch-target"
            />
          </div>

          <div>
            <Label htmlFor="serialNumber">Serial Number</Label>
            <Input
              id="serialNumber"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="e.g., SN-12345"
              className="touch-target"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="touch-target"
              />
            </div>
            <div>
              <Label htmlFor="serviceInterval">Service Interval (days)</Label>
              <Input
                id="serviceInterval"
                type="number"
                value={serviceIntervalDays}
                onChange={(e) => setServiceIntervalDays(e.target.value)}
                placeholder="e.g., 90"
                className="touch-target"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="lastService">Last Service Date</Label>
            <Input
              id="lastService"
              type="date"
              value={lastServiceDate}
              onChange={(e) => setLastServiceDate(e.target.value)}
              className="touch-target"
            />
          </div>

          <div>
            <Label htmlFor="serviceNotes">Service Notes</Label>
            <Textarea
              id="serviceNotes"
              value={serviceNotes}
              onChange={(e) => setServiceNotes(e.target.value)}
              placeholder="Notes about maintenance, repairs, etc."
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
              {editEquipment ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
