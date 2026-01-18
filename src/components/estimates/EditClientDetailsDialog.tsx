import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface ClientDetails {
  client_name: string;
  company_name: string | null;
  client_phone: string | null;
  site_address: string;
}

interface EditClientDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientDetails: ClientDetails;
  onSave: (details: ClientDetails) => Promise<void>;
  isSaving: boolean;
}

export function EditClientDetailsDialog({
  open,
  onOpenChange,
  clientDetails,
  onSave,
  isSaving,
}: EditClientDetailsDialogProps) {
  const [formData, setFormData] = useState<ClientDetails>(clientDetails);

  // Reset form when dialog opens or clientDetails change
  useEffect(() => {
    if (open) {
      setFormData(clientDetails);
    }
  }, [open, clientDetails]);

  const handleSave = async () => {
    await onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Client Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="client_name">Client Name *</Label>
            <Input
              id="client_name"
              value={formData.client_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, client_name: e.target.value }))
              }
              placeholder="Enter client name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              value={formData.company_name || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  company_name: e.target.value || null,
                }))
              }
              placeholder="Enter company name (optional)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client_phone">Phone Number</Label>
            <Input
              id="client_phone"
              value={formData.client_phone || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  client_phone: e.target.value || null,
                }))
              }
              placeholder="Enter phone number (optional)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="site_address">Site Address *</Label>
            <Input
              id="site_address"
              value={formData.site_address}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, site_address: e.target.value }))
              }
              placeholder="Enter site address"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !formData.client_name.trim() || !formData.site_address.trim()}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
