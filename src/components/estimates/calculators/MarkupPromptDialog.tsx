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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MapPin, PenTool } from "lucide-react";

interface MarkupPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType: string; // e.g., "area", "pier", "footing"
  onMarkOnPlans: () => void;
  onEnterManually: () => void;
  dontAskAgain: boolean;
  onDontAskAgainChange: (checked: boolean) => void;
}

export function MarkupPromptDialog({
  open,
  onOpenChange,
  itemType,
  onMarkOnPlans,
  onEnterManually,
  dontAskAgain,
  onDontAskAgainChange,
}: MarkupPromptDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Mark up on plans?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            Would you like to measure this {itemType} on the building plans for accurate dimensions?
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="flex items-center space-x-2 py-2">
          <Checkbox
            id="dont-ask-again"
            checked={dontAskAgain}
            onCheckedChange={(checked) => onDontAskAgainChange(checked === true)}
          />
          <Label htmlFor="dont-ask-again" className="text-sm text-muted-foreground cursor-pointer">
            Don't ask me again for this quote
          </Label>
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel onClick={onEnterManually} className="gap-2">
            <PenTool className="w-4 h-4" />
            Enter manually
          </AlertDialogCancel>
          <AlertDialogAction onClick={onMarkOnPlans} className="gap-2">
            <MapPin className="w-4 h-4" />
            Mark on plans
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
