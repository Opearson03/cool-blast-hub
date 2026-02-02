import { useState, useMemo } from "react";
import { useBusinessSubbies, PastSubbie } from "@/hooks/useBusinessSubbies";
import { useSendBatchSubTradeInvite } from "@/hooks/useSubTradeInvites";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Users, Phone, Mail, Loader2, UserPlus, Check, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const SUBBIE_ROLES = [
  "Pump Operator",
  "Concrete Tester",
  "Finisher",
  "Labourer",
  "Formworker",
  "Steel Fixer",
  "Excavator Operator",
  "Bobcat Operator",
  "Other",
];

interface Pour {
  id: string;
  pour_name: string;
  estimated_m3: number | null;
  pour_date: string | null;
}

interface SubbieSelectionStepProps {
  pours: Pour[];
  pourDates: Record<string, Date | null>;
  jobId: string;
}

export function SubbieSelectionStep({ pours, pourDates, jobId }: SubbieSelectionStepProps) {
  const [wantsToAddSubbies, setWantsToAddSubbies] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubbie, setSelectedSubbie] = useState<PastSubbie | null>(null);
  const [selectedPourIds, setSelectedPourIds] = useState<string[]>([]);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [invitedSubbies, setInvitedSubbies] = useState<Set<string>>(new Set());
  const [isAddNewDialogOpen, setIsAddNewDialogOpen] = useState(false);
  const [newSubbie, setNewSubbie] = useState({
    name: "",
    phone: "",
    email: "",
    role: "",
  });
  const [newSubbiePourIds, setNewSubbiePourIds] = useState<string[]>([]);

  const { data: subbies = [], isLoading } = useBusinessSubbies();
  const sendBatchInvite = useSendBatchSubTradeInvite();

  // Group subbies by trade/role
  const subbiesByTrade = useMemo(() => {
    const filtered = subbies.filter((s) => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
        s.recipient_name.toLowerCase().includes(query) ||
        s.role.toLowerCase().includes(query) ||
        s.recipient_phone?.toLowerCase().includes(query) ||
        s.recipient_email?.toLowerCase().includes(query)
      );
    });

    const grouped: Record<string, PastSubbie[]> = {};
    for (const subbie of filtered) {
      const role = subbie.role || "Other";
      if (!grouped[role]) grouped[role] = [];
      grouped[role].push(subbie);
    }

    // Sort roles alphabetically
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [subbies, searchQuery]);

  const handleSelectSubbie = (subbie: PastSubbie) => {
    setSelectedSubbie(subbie);
    setSelectedPourIds([]);
    setIsInviteDialogOpen(true);
  };

  const togglePourSelection = (pourId: string) => {
    setSelectedPourIds((prev) =>
      prev.includes(pourId) ? prev.filter((id) => id !== pourId) : [...prev, pourId]
    );
  };

  const handleInviteSubbie = async () => {
    if (!selectedSubbie || selectedPourIds.length === 0) return;

    try {
      // Send batch invite for all selected pours at once
      await sendBatchInvite.mutateAsync({
        job_pour_ids: selectedPourIds,
        recipient_name: selectedSubbie.recipient_name,
        role: selectedSubbie.role,
        recipient_phone: selectedSubbie.recipient_phone || undefined,
        recipient_email: selectedSubbie.recipient_email || undefined,
      });

      // Mark as invited
      setInvitedSubbies((prev) => {
        const updated = new Set(prev);
        updated.add(`${selectedSubbie.recipient_name}-${selectedSubbie.role}`);
        return updated;
      });

      toast.success(
        `Invited ${selectedSubbie.recipient_name} to ${selectedPourIds.length} pour${selectedPourIds.length > 1 ? "s" : ""}`
      );
      setIsInviteDialogOpen(false);
      setSelectedSubbie(null);
      setSelectedPourIds([]);
    } catch (error: any) {
      toast.error(error.message || "Failed to send invites");
    }
  };

  const handleOpenAddNew = () => {
    setNewSubbie({ name: "", phone: "", email: "", role: "" });
    setNewSubbiePourIds([]);
    setIsAddNewDialogOpen(true);
  };

  const toggleNewSubbiePourSelection = (pourId: string) => {
    setNewSubbiePourIds((prev) =>
      prev.includes(pourId) ? prev.filter((id) => id !== pourId) : [...prev, pourId]
    );
  };

  const handleInviteNewSubbie = async () => {
    if (!newSubbie.name.trim() || !newSubbie.role || newSubbiePourIds.length === 0) return;

    try {
      // Send batch invite for new subbie
      await sendBatchInvite.mutateAsync({
        job_pour_ids: newSubbiePourIds,
        recipient_name: newSubbie.name.trim(),
        role: newSubbie.role,
        recipient_phone: newSubbie.phone.trim() || undefined,
        recipient_email: newSubbie.email.trim() || undefined,
      });

      setInvitedSubbies((prev) => {
        const updated = new Set(prev);
        updated.add(`${newSubbie.name.trim()}-${newSubbie.role}`);
        return updated;
      });

      toast.success(
        `Invited ${newSubbie.name} to ${newSubbiePourIds.length} pour${newSubbiePourIds.length > 1 ? "s" : ""}`
      );
      setIsAddNewDialogOpen(false);
      setNewSubbie({ name: "", phone: "", email: "", role: "" });
      setNewSubbiePourIds([]);
    } catch (error: any) {
      toast.error(error.message || "Failed to send invites");
    }
  };

  // Initial prompt state
  if (wantsToAddSubbies === null) {
    return (
      <div className="space-y-6 py-4">
        <div className="text-center space-y-2">
          <Users className="w-12 h-12 mx-auto text-muted-foreground" />
          <h3 className="text-lg font-medium">Would you like to add sub-contractors?</h3>
          <p className="text-sm text-muted-foreground">
            Invite pump operators, testers, finishers and other trades to your pours.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full"
            onClick={() => setWantsToAddSubbies(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Yes, add sub-contractors
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={() => setWantsToAddSubbies(false)}
          >
            Skip for now
          </Button>
        </div>
      </div>
    );
  }

  // User chose "No" / Skip
  if (wantsToAddSubbies === false) {
    return (
      <div className="space-y-4 py-4">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Check className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="font-medium text-foreground">No worries!</p>
            <p className="text-sm mt-1">
            You can always invite sub-contractors later from the job details.
            </p>
            <Button
              variant="link"
              className="mt-2"
              onClick={() => setWantsToAddSubbies(true)}
            >
              Changed your mind? Add sub-contractors now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User chose "Yes" - show searchable list
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search sub-contractors by name, trade, phone or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Add New Button */}
      <Button
        variant="outline"
        className="w-full"
        onClick={handleOpenAddNew}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add New Sub-Contractor
      </Button>

      {/* Subbie List by Trade */}
      <div className="space-y-4 max-h-[35vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : subbiesByTrade.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>
                {searchQuery
                  ? "No sub-contractors match your search."
                  : "No previous sub-contractors found."}
              </p>
              <p className="text-xs mt-2">
                Use the button above to add a new sub-contractor.
              </p>
            </CardContent>
          </Card>
        ) : (
          subbiesByTrade.map(([trade, tradeSubbies]) => (
            <div key={trade}>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {trade}
              </h4>
              <div className="space-y-2">
                {tradeSubbies.map((subbie) => {
                  const key = `${subbie.recipient_name}-${subbie.role}`;
                  const isInvited = invitedSubbies.has(key);

                  return (
                    <Card
                      key={key}
                      className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                        isInvited ? "border-green-500/50 bg-green-500/5" : ""
                      }`}
                      onClick={() => !isInvited && handleSelectSubbie(subbie)}
                    >
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{subbie.recipient_name}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            {subbie.recipient_phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {subbie.recipient_phone}
                              </span>
                            )}
                            {subbie.recipient_email && (
                              <span className="flex items-center gap-1 truncate">
                                <Mail className="w-3 h-3" />
                                {subbie.recipient_email}
                              </span>
                            )}
                          </div>
                        </div>
                        {isInvited ? (
                          <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                            <Check className="w-3 h-3 mr-1" />
                            Invited
                          </Badge>
                        ) : (
                          <Button size="sm" variant="ghost">
                            <UserPlus className="w-4 h-4" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pour Selection Dialog (existing subbie) */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite {selectedSubbie?.recipient_name}</DialogTitle>
            <DialogDescription>
              Select which pours you'd like to invite this {selectedSubbie?.role.toLowerCase()} to.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4 max-h-[40vh] overflow-y-auto">
            {pours.map((pour) => {
              const date = pourDates[pour.id];
              return (
                <div
                  key={pour.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => togglePourSelection(pour.id)}
                >
                  <Checkbox
                    id={`pour-${pour.id}`}
                    checked={selectedPourIds.includes(pour.id)}
                    onCheckedChange={() => togglePourSelection(pour.id)}
                  />
                  <Label
                    htmlFor={`pour-${pour.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <span className="font-medium">{pour.pour_name}</span>
                    {date && (
                      <span className="text-muted-foreground text-sm ml-2">
                        — {format(date, "EEE, d MMM")}
                      </span>
                    )}
                    {pour.estimated_m3 && (
                      <span className="text-muted-foreground text-sm ml-2">
                        ({pour.estimated_m3}m³)
                      </span>
                    )}
                  </Label>
                </div>
              );
            })}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsInviteDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteSubbie}
              disabled={selectedPourIds.length === 0 || sendBatchInvite.isPending}
              className="w-full sm:w-auto"
            >
              {sendBatchInvite.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              Invite to {selectedPourIds.length} pour{selectedPourIds.length !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Sub-Contractor Dialog */}
      <Dialog open={isAddNewDialogOpen} onOpenChange={setIsAddNewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Sub-Contractor</DialogTitle>
            <DialogDescription>
              Enter the sub-contractor's details and select which pours to invite them to.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[50vh] overflow-y-auto">
            {/* Subbie Details */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="new-subbie-name">Name *</Label>
                <Input
                  id="new-subbie-name"
                  placeholder="e.g. John Smith"
                  value={newSubbie.name}
                  onChange={(e) => setNewSubbie((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-subbie-role">Trade / Role *</Label>
                <Select
                  value={newSubbie.role}
                  onValueChange={(value) => setNewSubbie((prev) => ({ ...prev, role: value }))}
                >
                  <SelectTrigger id="new-subbie-role">
                    <SelectValue placeholder="Select a trade..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBBIE_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-subbie-phone">Phone</Label>
                <Input
                  id="new-subbie-phone"
                  type="tel"
                  placeholder="e.g. 0412 345 678"
                  value={newSubbie.phone}
                  onChange={(e) => setNewSubbie((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-subbie-email">Email</Label>
                <Input
                  id="new-subbie-email"
                  type="email"
                  placeholder="e.g. john@example.com"
                  value={newSubbie.email}
                  onChange={(e) => setNewSubbie((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>

            {/* Pour Selection */}
            <div className="space-y-2 pt-2 border-t">
              <Label>Invite to Pours *</Label>
              <div className="space-y-2">
                {pours.map((pour) => {
                  const date = pourDates[pour.id];
                  return (
                    <div
                      key={pour.id}
                      className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => toggleNewSubbiePourSelection(pour.id)}
                    >
                      <Checkbox
                        id={`new-pour-${pour.id}`}
                        checked={newSubbiePourIds.includes(pour.id)}
                        onCheckedChange={() => toggleNewSubbiePourSelection(pour.id)}
                      />
                      <Label
                        htmlFor={`new-pour-${pour.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <span className="font-medium">{pour.pour_name}</span>
                        {date && (
                          <span className="text-muted-foreground text-sm ml-2">
                            — {format(date, "EEE, d MMM")}
                          </span>
                        )}
                        {pour.estimated_m3 && (
                          <span className="text-muted-foreground text-sm ml-2">
                            ({pour.estimated_m3}m³)
                          </span>
                        )}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAddNewDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteNewSubbie}
              disabled={
                !newSubbie.name.trim() ||
                !newSubbie.role ||
                newSubbiePourIds.length === 0 ||
                sendBatchInvite.isPending
              }
              className="w-full sm:w-auto"
            >
              {sendBatchInvite.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              Add & Invite to {newSubbiePourIds.length} pour{newSubbiePourIds.length !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
