import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { MapPin, Clock, Building2, Calendar, UserPlus, Plus, X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { SubTradeStatusBadge, SubTradeStatusDot } from "@/components/jobs/SubTradeStatusBadge";
import { useBusinessSubbies, PastSubbie } from "@/hooks/useBusinessSubbies";
import { useSendSubTradeInvite } from "@/hooks/useSubTradeInvites";
import { toast } from "sonner";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

type Pour = {
  id: string;
  pour_name: string;
  pour_date: string | null;
  scheduled_time: string | null;
  status: string | null;
  visit_type: string | null;
  job_id: string;
  estimated_m3?: number | null;
  concrete_supplier?: string | null;
  mpa_strength?: string | null;
  slump?: string | null;
  notes?: string | null;
  job?: {
    id: string;
    name: string;
    site_address: string;
    job_number: string | null;
  };
};

interface PourDetailSheetProps {
  pour: Pour | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const visitTypeLabels: Record<string, string> = {
  pour: "Concrete Pour",
  earthworks: "Earthworks",
  formwork_place: "Place Formwork",
  formwork_strip: "Strip Formwork",
  cure: "Cure",
  seal: "Seal",
  other: "Other",
};

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500 text-white",
  in_progress: "bg-orange-500 text-white",
  completed: "bg-green-500 text-white",
  cancelled: "bg-red-500 text-white",
};

const statusLabels: Record<string, string> = {
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function PourDetailSheet({ pour, open, onOpenChange }: PourDetailSheetProps) {
  // Fetch full pour details
  const { data: pourDetails } = useQuery({
    queryKey: ["pour-details", pour?.id],
    enabled: !!pour?.id && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_pours")
        .select(`
          *,
          jobs (id, name, site_address, job_number, builder_client)
        `)
        .eq("id", pour!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch sub-trade invites for this pour
  const { data: invites = [] } = useQuery({
    queryKey: ["sub-trade-invites", pour?.id],
    enabled: !!pour?.id && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("external_invites")
        .select("*")
        .eq("job_pour_id", pour!.id)
        .eq("invite_type", "sub_trade")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const queryClient = useQueryClient();
  const { data: pastSubbies = [] } = useBusinessSubbies();
  const sendInvite = useSendSubTradeInvite();
  
  const [addSubbieOpen, setAddSubbieOpen] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newSubbieName, setNewSubbieName] = useState("");
  const [newSubbiePhone, setNewSubbiePhone] = useState("");
  const [newSubbieRole, setNewSubbieRole] = useState("");

  const handleSendInvite = async (subbie: { recipient_name: string; recipient_phone: string | null; recipient_email: string | null; role: string }) => {
    if (!subbie.recipient_phone && !subbie.recipient_email) {
      toast.error("Phone or email is required to send an invite");
      return;
    }
    
    try {
      await sendInvite.mutateAsync({
        job_pour_id: pour!.id,
        recipient_name: subbie.recipient_name,
        role: subbie.role,
        recipient_phone: subbie.recipient_phone || undefined,
        recipient_email: subbie.recipient_email || undefined,
      });
      
      queryClient.invalidateQueries({ queryKey: ["sub-trade-invites", pour?.id] });
      queryClient.invalidateQueries({ queryKey: ["business-subbies"] });
      toast.success("Invite sent to " + subbie.recipient_name);
      setShowAddNew(false);
      setNewSubbieName("");
      setNewSubbiePhone("");
      setNewSubbieRole("");
    } catch (error: any) {
      // Handle duplicate invite error gracefully
      if (error.code === "DUPLICATE_INVITE") {
        toast.error(`${subbie.recipient_name} already has an invite for this pour`);
      } else {
        toast.error(error.message || "Failed to send invite");
      }
    }
  };

  // Filter out sub-contractors who already have active invites
  const availableSubbies = pastSubbies.filter((subbie) => {
    const nameLower = subbie.recipient_name.toLowerCase().trim();
    return !invites.some(
      (i: any) => 
        i.recipient_name.toLowerCase().trim() === nameLower &&
        ["drafted", "sent", "viewed", "accepted"].includes(i.status)
    );
  });

  const handleSelectSubbie = (subbie: PastSubbie) => {
    handleSendInvite(subbie);
  };

  const handleAddNewSubbie = () => {
    if (!newSubbieName.trim() || !newSubbieRole.trim()) {
      toast.error("Name and role are required");
      return;
    }
    if (!newSubbiePhone.trim()) {
      toast.error("Phone number is required to send an invite");
      return;
    }
    handleSendInvite({
      recipient_name: newSubbieName,
      recipient_phone: newSubbiePhone || null,
      recipient_email: null,
      role: newSubbieRole,
    });
  };

  if (!pour) return null;

  const visitType = pour.visit_type || "pour";
  const status = pour.status || "scheduled";
  const details = pourDetails || pour;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">{pour.pour_name}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Status and Type */}
          <div className="flex gap-2">
            <Badge className={statusColors[status]}>
              {statusLabels[status]}
            </Badge>
            <Badge variant="outline">
              {visitTypeLabels[visitType]}
            </Badge>
          </div>

          {/* Date and Time */}
          {(pour.pour_date || pour.scheduled_time) && (
            <div className="space-y-2">
              {pour.pour_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(pour.pour_date), "EEEE, MMMM d, yyyy")}</span>
                </div>
              )}
              {pour.scheduled_time && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{pour.scheduled_time.slice(0, 5)}</span>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Job Info */}
          {pour.job && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Job Details</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <Link 
                    to={`/admin/jobs/${pour.job.id}`} 
                    className="text-primary hover:underline"
                  >
                    {pour.job.name}
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{pour.job.site_address}</span>
                </div>
                {pour.job.job_number && (
                  <p className="text-xs text-muted-foreground pl-6">
                    #{pour.job.job_number}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Concrete Details (if pour type) */}
          {visitType === "pour" && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Concrete Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {details.estimated_m3 && (
                    <div>
                      <p className="text-muted-foreground text-xs">Estimated m³</p>
                      <p>{details.estimated_m3}</p>
                    </div>
                  )}
                  {details.mpa_strength && (
                    <div>
                      <p className="text-muted-foreground text-xs">MPa</p>
                      <p>{details.mpa_strength}</p>
                    </div>
                  )}
                  {details.slump && (
                    <div>
                      <p className="text-muted-foreground text-xs">Slump</p>
                      <p>{details.slump}</p>
                    </div>
                  )}
                  {details.concrete_supplier && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs">Supplier</p>
                      <p>{details.concrete_supplier}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Sub-Trades */}
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Sub-Contractors {invites.length > 0 && `(${invites.filter((i: any) => i.status === "accepted").length}/${invites.length})`}
              </h4>
            </div>
            
            {/* Existing Subbies */}
            {invites.length > 0 && (
              <div className="space-y-1.5">
                {invites.map((invite: any) => (
                  <div key={invite.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <SubTradeStatusDot status={invite.status} />
                      <span>{invite.recipient_name}</span>
                      <span className="text-muted-foreground">({invite.role})</span>
                    </span>
                    <SubTradeStatusBadge status={invite.status} className="text-xs" />
                  </div>
                ))}
              </div>
            )}

            {/* Add Sub-Contractor Section */}
            <Collapsible open={addSubbieOpen} onOpenChange={setAddSubbieOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Sub-Contractor
                  </span>
                  {addSubbieOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {/* Search Past Sub-Contractors */}
                {!showAddNew && (
                  <Command className="border rounded-md">
                    <CommandInput placeholder="Search sub-contractors..." />
                    <CommandList className="max-h-32">
                      <CommandEmpty>
                        <span className="text-muted-foreground text-sm">
                          {availableSubbies.length === 0 && pastSubbies.length > 0 
                            ? "All sub-contractors already invited" 
                            : "No sub-contractors found"}
                        </span>
                      </CommandEmpty>
                      <CommandGroup>
                        {availableSubbies.map((subbie, index) => (
                          <CommandItem
                            key={index}
                            onSelect={() => handleSelectSubbie(subbie)}
                            disabled={sendInvite.isPending}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{subbie.recipient_name}</span>
                              <span className="text-xs text-muted-foreground">
                                {subbie.role} {subbie.recipient_phone && `• ${subbie.recipient_phone}`}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                )}

                {/* Add New Sub-Contractor Form */}
                {showAddNew ? (
                  <div className="space-y-2 border rounded-md p-3 bg-muted/30">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">New Sub-Contractor</span>
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
                      placeholder="Phone *"
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
                      disabled={sendInvite.isPending}
                      className="w-full"
                    >
                      {sendInvite.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Send Invite
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddNew(true)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Sub-Contractor
                  </Button>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Notes */}
          {details.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Notes</h4>
                <p className="text-sm text-muted-foreground">{details.notes}</p>
              </div>
            </>
          )}

          {/* Actions */}
          <Separator />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" asChild>
              <Link to={`/admin/jobs/${pour.job_id}`}>View Job</Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
