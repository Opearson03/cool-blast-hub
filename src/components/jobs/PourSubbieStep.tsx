import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, UserPlus } from "lucide-react";
import { useBusinessSubbies, type PastSubbie } from "@/hooks/useBusinessSubbies";
import { SubTradeInviteDialog } from "./SubTradeInviteDialog";

interface PourSubbieStepProps {
  jobId: string;
  pourId: string;
  pourName: string;
  pourDate: string | null;
  selectedSubbies: PastSubbie[];
  onSelectedSubbiesChange: (subbies: PastSubbie[]) => void;
  onBack: () => void;
  onComplete: () => void;
  isSubmitting: boolean;
}

export function PourSubbieStep({
  jobId,
  pourId,
  pourName,
  pourDate,
  selectedSubbies,
  onSelectedSubbiesChange,
  onBack,
  onComplete,
  isSubmitting,
}: PourSubbieStepProps) {
  const { data: pastSubbies = [], isLoading } = useBusinessSubbies();
  const [showNewSubbieDialog, setShowNewSubbieDialog] = useState(false);

  const toggleSubbie = (subbie: PastSubbie) => {
    const key = `${subbie.recipient_name}-${subbie.role}`;
    const exists = selectedSubbies.some(
      (s) => `${s.recipient_name}-${s.role}` === key
    );
    if (exists) {
      onSelectedSubbiesChange(
        selectedSubbies.filter((s) => `${s.recipient_name}-${s.role}` !== key)
      );
    } else {
      onSelectedSubbiesChange([...selectedSubbies, subbie]);
    }
  };

  const isSelected = (subbie: PastSubbie) => {
    const key = `${subbie.recipient_name}-${subbie.role}`;
    return selectedSubbies.some(
      (s) => `${s.recipient_name}-${s.role}` === key
    );
  };

  return (
    <div className="space-y-4">
      {/* Explanation */}
      <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-3">
        <MessageSquare className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">
          Invite subbies and we'll send them a text with a link to confirm their availability.
        </p>
      </div>

      {/* Past subbies list */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Previously Used Subbies</h4>
        
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
        ) : pastSubbies.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No previous subbies found. Add your first one below.
          </p>
        ) : (
          <div className="max-h-[280px] overflow-y-auto space-y-1">
            {pastSubbies.map((subbie, idx) => {
              const key = `${subbie.recipient_name}-${subbie.role}-${idx}`;
              const checked = isSelected(subbie);
              return (
                <label
                  key={key}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    checked
                      ? "bg-primary/10 border-primary"
                      : "bg-background hover:bg-muted/50 border-border"
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleSubbie(subbie)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {subbie.recipient_name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {subbie.recipient_phone || subbie.recipient_email || "No contact"}
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {subbie.role}
                  </Badge>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Add new subbie button */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => setShowNewSubbieDialog(true)}
      >
        <UserPlus className="w-4 h-4 mr-2" />
        Add New Subbie
      </Button>

      {/* Selected count */}
      {selectedSubbies.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          {selectedSubbies.length} subbie{selectedSubbies.length !== 1 ? "s" : ""} selected
        </p>
      )}

      {/* Action buttons */}
      <div className="flex justify-between gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          onClick={onComplete}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Creating..."
            : selectedSubbies.length > 0
            ? `Create & Invite ${selectedSubbies.length}`
            : "Skip & Create"}
        </Button>
      </div>

      {/* New subbie dialog - opens the existing SubTradeInviteDialog */}
      <SubTradeInviteDialog
        open={showNewSubbieDialog}
        onOpenChange={setShowNewSubbieDialog}
        jobId={jobId}
        pourId={pourId}
        pourName={pourName}
        pourDate={pourDate}
      />
    </div>
  );
}
