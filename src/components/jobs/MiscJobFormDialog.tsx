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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, X, Plus, Search, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useBusinessSubbies, PastSubbie } from "@/hooks/useBusinessSubbies";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface MiscJobFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SelectedSubbie {
  recipient_name: string;
  recipient_phone: string | null;
  recipient_email: string | null;
  role: string;
  isNew?: boolean;
}

export function MiscJobFormDialog({ open, onOpenChange }: MiscJobFormDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [selectedSubbies, setSelectedSubbies] = useState<SelectedSubbie[]>([]);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newSubbieName, setNewSubbieName] = useState("");
  const [newSubbiePhone, setNewSubbiePhone] = useState("");
  const [newSubbieRole, setNewSubbieRole] = useState("");

  const { data: pastSubbies = [], isLoading: subbiesLoading } = useBusinessSubbies();

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!profile?.business_id) throw new Error("No business found");

      // Create the misc job
      const { data: job, error: jobError } = await supabase.from("jobs").insert({
        name,
        site_address: address,
        scheduled_date: date ? format(date, "yyyy-MM-dd") : null,
        job_notes: notes || null,
        job_type: "misc",
        status: "scheduled",
        business_id: profile.business_id,
        created_by: user.id,
      }).select().single();

      if (jobError) throw jobError;

      // If there are subbies to invite and we have a date, create a pour and invites
      if (selectedSubbies.length > 0 && date) {
        // Create a pour for the misc job
        const { data: pour, error: pourError } = await supabase.from("job_pours").insert({
          job_id: job.id,
          pour_name: name,
          pour_date: format(date, "yyyy-MM-dd"),
          visit_type: "misc",
          status: "scheduled",
        }).select().single();

        if (pourError) throw pourError;

        // Create invites for each subbie
        for (const subbie of selectedSubbies) {
          const token = crypto.randomUUID();
          const tokenHash = await hashToken(token);

          await supabase.from("external_invites").insert({
            business_id: profile.business_id,
            job_id: job.id,
            job_pour_id: pour.id,
            recipient_name: subbie.recipient_name,
            recipient_phone: subbie.recipient_phone,
            recipient_email: subbie.recipient_email,
            role: subbie.role,
            token_hash: tokenHash,
            status: "drafted",
            created_by: user.id,
          });
        }
      }

      return job;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["schedule-pours"] });
      queryClient.invalidateQueries({ queryKey: ["business-subbies"] });
      toast.success(selectedSubbies.length > 0 
        ? `Misc job added with ${selectedSubbies.length} subbie(s)` 
        : "Misc job added"
      );
      handleClose();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const hashToken = async (token: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const handleClose = () => {
    setName("");
    setAddress("");
    setDate(undefined);
    setNotes("");
    setSelectedSubbies([]);
    setShowAddNew(false);
    setNewSubbieName("");
    setNewSubbiePhone("");
    setNewSubbieRole("");
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      toast.error("Name and address are required");
      return;
    }
    createMutation.mutate();
  };

  const handleSelectSubbie = (subbie: PastSubbie) => {
    const exists = selectedSubbies.some(
      (s) => s.recipient_name === subbie.recipient_name && s.role === subbie.role
    );
    if (!exists) {
      setSelectedSubbies([...selectedSubbies, {
        recipient_name: subbie.recipient_name,
        recipient_phone: subbie.recipient_phone,
        recipient_email: subbie.recipient_email,
        role: subbie.role,
      }]);
    }
  };

  const handleRemoveSubbie = (index: number) => {
    setSelectedSubbies(selectedSubbies.filter((_, i) => i !== index));
  };

  const handleAddNewSubbie = () => {
    if (!newSubbieName.trim() || !newSubbieRole.trim()) {
      toast.error("Name and role are required");
      return;
    }
    setSelectedSubbies([...selectedSubbies, {
      recipient_name: newSubbieName,
      recipient_phone: newSubbiePhone || null,
      recipient_email: null,
      role: newSubbieRole,
      isNew: true,
    }]);
    setNewSubbieName("");
    setNewSubbiePhone("");
    setNewSubbieRole("");
    setShowAddNew(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Quick Add - Misc Job</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 pb-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Subbie work at Acme Concrete"
                  className="touch-target"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g., 123 Other St, Sydney"
                  className="touch-target"
                />
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal touch-target",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., 2 blokes booked for the day"
                  rows={2}
                />
              </div>

              {/* Subbie Allocation Section */}
              <div className="space-y-2 border-t pt-4">
                <Label className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Allocate Subbies
                </Label>
                
                {/* Selected Subbies */}
                {selectedSubbies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedSubbies.map((subbie, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="flex items-center gap-1 py-1"
                      >
                        <span>{subbie.recipient_name}</span>
                        <span className="text-xs text-muted-foreground">({subbie.role})</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubbie(index)}
                          className="ml-1 hover:bg-muted rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Search Past Subbies */}
                {!showAddNew && (
                  <Command className="border rounded-md">
                    <CommandInput placeholder="Search past subbies..." />
                    <CommandList className="max-h-32">
                      <CommandEmpty>
                        <span className="text-muted-foreground text-sm">No subbies found</span>
                      </CommandEmpty>
                      <CommandGroup>
                        {pastSubbies.map((subbie, index) => {
                          const isSelected = selectedSubbies.some(
                            (s) => s.recipient_name === subbie.recipient_name && s.role === subbie.role
                          );
                          return (
                            <CommandItem
                              key={index}
                              onSelect={() => handleSelectSubbie(subbie)}
                              disabled={isSelected}
                              className={cn(isSelected && "opacity-50")}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{subbie.recipient_name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {subbie.role} {subbie.recipient_phone && `• ${subbie.recipient_phone}`}
                                </span>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                )}

                {/* Add New Subbie Form */}
                {showAddNew ? (
                  <div className="space-y-2 border rounded-md p-3 bg-muted/30">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium">New Subbie</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddNew(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Name *"
                      value={newSubbieName}
                      onChange={(e) => setNewSubbieName(e.target.value)}
                      className="h-9"
                    />
                    <Input
                      placeholder="Phone"
                      value={newSubbiePhone}
                      onChange={(e) => setNewSubbiePhone(e.target.value)}
                      className="h-9"
                    />
                    <Input
                      placeholder="Role (e.g., Pump Operator) *"
                      value={newSubbieRole}
                      onChange={(e) => setNewSubbieRole(e.target.value)}
                      className="h-9"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddNewSubbie}
                      className="w-full"
                    >
                      Add Subbie
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddNew(true)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Subbie
                  </Button>
                )}
              </div>
            </div>
          </ScrollArea>

          <div className="flex gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 touch-target"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 touch-target"
            >
              {createMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Add Job
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
