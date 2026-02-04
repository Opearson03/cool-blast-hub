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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UserPlus, Users, Building2, Truck } from "lucide-react";

export type ContactType = "client" | "subcontractor" | "supplier" | "internal";

interface ContactFormData {
  id?: string;
  name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  trade?: string;
  category?: string;
  notes?: string;
}

interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: ContactType;
  initialData?: ContactFormData;
  onSave: (data: ContactFormData) => Promise<void>;
  isPending?: boolean;
}

const TRADE_OPTIONS = [
  "Laborer",
  "Formworker",
  "Steel Fixer",
  "Concrete Finisher",
  "Machine Operator",
  "Pump Operator",
  "Carpenter",
  "Other",
];

const SUPPLIER_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "concrete", label: "Concrete" },
  { value: "reinforcement", label: "Reinforcement" },
  { value: "formwork", label: "Formwork" },
  { value: "finishing", label: "Finishing" },
  { value: "other", label: "Other" },
];

const TYPE_CONFIG = {
  client: {
    title: "Client",
    icon: Users,
    showAddress: true,
    showTrade: false,
    showCategory: false,
    showRole: false,
  },
  subcontractor: {
    title: "Subcontractor",
    icon: Building2,
    showAddress: false,
    showTrade: true,
    showCategory: false,
    showRole: false,
  },
  supplier: {
    title: "Supplier",
    icon: Truck,
    showAddress: false,
    showTrade: false,
    showCategory: true,
    showRole: false,
  },
  internal: {
    title: "Internal Contact",
    icon: Users,
    showAddress: false,
    showTrade: false,
    showCategory: false,
    showRole: true,
  },
};

export function ContactFormDialog({
  open,
  onOpenChange,
  type,
  initialData,
  onSave,
  isPending = false,
}: ContactFormDialogProps) {
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    company_name: "",
    email: "",
    phone: "",
    address: "",
    trade: "",
    category: "general",
    notes: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        name: initialData.name || "",
        company_name: initialData.company_name || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        address: initialData.address || "",
        trade: initialData.trade || "",
        category: initialData.category || "general",
        notes: initialData.notes || "",
      });
    } else {
      setFormData({
        name: "",
        company_name: "",
        email: "",
        phone: "",
        address: "",
        trade: "",
        category: "general",
        notes: "",
      });
    }
  }, [initialData, open]);

  const handleSubmit = async () => {
    await onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            {initialData?.id ? `Edit ${config.title}` : `Add ${config.title}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Smith"
            />
          </div>

          <div>
            <Label>Company</Label>
            <Input
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              placeholder="ABC Company"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Phone</Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0400 000 000"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
          </div>

          {config.showAddress && (
            <div>
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St, Sydney NSW"
              />
            </div>
          )}

          {config.showTrade && (
            <div>
              <Label>Trade</Label>
              <Select
                value={formData.trade || ""}
                onValueChange={(v) => setFormData({ ...formData, trade: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trade" />
                </SelectTrigger>
                <SelectContent>
                  {TRADE_OPTIONS.map((trade) => (
                    <SelectItem key={trade} value={trade}>
                      {trade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {config.showCategory && (
            <div>
              <Label>Category</Label>
              <Select
                value={formData.category || "general"}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPLIER_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {config.showRole && (
            <div>
              <Label>Role</Label>
              <Input
                value={formData.trade || ""}
                onChange={(e) => setFormData({ ...formData, trade: e.target.value })}
                placeholder="e.g. Site Supervisor, Project Manager"
              />
            </div>
          )}

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.name || isPending}
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {initialData?.id ? "Update" : "Add"} {config.title}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
