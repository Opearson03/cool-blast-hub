import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Plus, Send, Mail, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BOQItem, BOQ_CATEGORIES, JobBOQ } from "./BOQTypes";
import { SupplierContactDialog } from "./SupplierContactDialog";

interface SendPurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boq: JobBOQ;
  jobId: string;
  siteAddress: string;
}

interface SupplierContact {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  category: string | null;
}

export function SendPurchaseOrderDialog({
  open,
  onOpenChange,
  boq,
  jobId,
  siteAddress,
}: SendPurchaseOrderDialogProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [supplierId, setSupplierId] = useState<string>("");
  const [manualSupplier, setManualSupplier] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [deliveryAddress, setDeliveryAddress] = useState(siteAddress);
  const [notes, setNotes] = useState("");
  const [sendMethod, setSendMethod] = useState<"email" | "sms" | "both">("email");
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [saveSupplier, setSaveSupplier] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      const unorderedIds = boq.items.filter(item => !item.ordered).map(item => item.id);
      setSelectedItems(unorderedIds);
      setDeliveryAddress(siteAddress);
      setSupplierId("");
      setManualSupplier({ name: "", email: "", phone: "" });
      setNotes("");
      setSendMethod("email");
      setSaveSupplier(false);
    }
  }, [open, boq.items, siteAddress]);

  // Fetch supplier contacts
  const { data: suppliers = [] } = useQuery({
    queryKey: ["supplier-contacts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.business_id) return [];

      const { data, error } = await supabase
        .from("supplier_contacts")
        .select("*")
        .eq("business_id", profile.business_id)
        .order("name");

      if (error) throw error;
      return data as SupplierContact[];
    },
    enabled: open,
  });

  const selectedSupplier = suppliers.find(s => s.id === supplierId);
  const recipientEmail = supplierId ? selectedSupplier?.email : manualSupplier.email;
  const recipientPhone = supplierId ? selectedSupplier?.phone : manualSupplier.phone;
  const recipientName = supplierId ? selectedSupplier?.name : manualSupplier.name;

  const unorderedItems = boq.items.filter(item => !item.ordered);

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const selectAll = () => {
    setSelectedItems(unorderedItems.map(item => item.id));
  };

  const deselectAll = () => {
    setSelectedItems([]);
  };

  const sendMutation = useMutation({
    mutationFn: async () => {
      const selectedBOQItems = boq.items.filter(item => selectedItems.includes(item.id));
      
      const { data, error } = await supabase.functions.invoke("send-purchase-order", {
        body: {
          jobId,
          boqId: boq.id,
          items: selectedBOQItems,
          supplierContactId: supplierId || null,
          supplierName: recipientName,
          supplierEmail: recipientEmail,
          supplierPhone: recipientPhone,
          deliveryAddress,
          notes,
          sendMethod,
          saveNewSupplier: !supplierId && saveSupplier ? {
            name: manualSupplier.name,
            email: manualSupplier.email,
            phone: manualSupplier.phone,
          } : null,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: (data) => {
      // Update local BOQ items to mark as ordered
      const updatedItems = boq.items.map(item => {
        if (selectedItems.includes(item.id)) {
          return { ...item, ordered: true, orderedAt: new Date().toISOString() };
        }
        return item;
      });

      // Update the BOQ in database
      supabase
        .from("job_boq")
        .update({ items: JSON.parse(JSON.stringify(updatedItems)) })
        .eq("id", boq.id)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["job-boq", jobId] });
          queryClient.invalidateQueries({ queryKey: ["supplier-contacts"] });
        });

      toast({
        title: "Purchase Order Sent",
        description: `PO ${data.poNumber} sent successfully via ${sendMethod}`,
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error sending PO",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const canSend = () => {
    if (selectedItems.length === 0) return false;
    if (!recipientName) return false;
    if (!deliveryAddress) return false;
    if (sendMethod === "email" && !recipientEmail) return false;
    if (sendMethod === "sms" && !recipientPhone) return false;
    if (sendMethod === "both" && (!recipientEmail || !recipientPhone)) return false;
    return true;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Send Purchase Order
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[65vh] pr-4">
            <div className="space-y-6">
              {/* Item Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Select Items</Label>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={selectAll}>
                      Select All
                    </Button>
                    <Button variant="ghost" size="sm" onClick={deselectAll}>
                      Clear
                    </Button>
                  </div>
                </div>
                
                {unorderedItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    All items have already been ordered.
                  </p>
                ) : (
                  <div className="space-y-2 border rounded-lg p-3">
                    {unorderedItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 py-2 border-b last:border-0"
                      >
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={() => toggleItem(item.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} {item.unit} • {BOQ_CATEGORIES[item.category]?.label}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Supplier Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Supplier</Label>
                
                <div className="flex gap-2">
                  <Select value={supplierId || "__manual__"} onValueChange={(v) => {
                    const newValue = v === "__manual__" ? "" : v;
                    setSupplierId(newValue);
                    if (newValue) setManualSupplier({ name: "", email: "", phone: "" });
                  }}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a saved supplier..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__manual__">-- Enter manually --</SelectItem>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name} {supplier.company && `(${supplier.company})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsAddingSupplier(true)}
                    title="Add new supplier"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {!supplierId && (
                  <div className="space-y-3 pl-4 border-l-2">
                    <div>
                      <Label>Contact Name *</Label>
                      <Input
                        value={manualSupplier.name}
                        onChange={(e) => setManualSupplier(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Sales rep name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={manualSupplier.email}
                          onChange={(e) => setManualSupplier(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="email@supplier.com"
                        />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input
                          type="tel"
                          value={manualSupplier.phone}
                          onChange={(e) => setManualSupplier(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="0400 000 000"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={saveSupplier}
                        onCheckedChange={(checked) => setSaveSupplier(checked === true)}
                      />
                      <Label className="text-sm font-normal">Save this supplier for future use</Label>
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Address */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Delivery Address</Label>
                <Textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter delivery address..."
                  rows={2}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Delivery instructions, special requirements..."
                  rows={2}
                />
              </div>

              {/* Send Method */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Send via</Label>
                <RadioGroup
                  value={sendMethod}
                  onValueChange={(v) => setSendMethod(v as typeof sendMethod)}
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="email" id="email" />
                    <Label htmlFor="email" className="flex items-center gap-1 cursor-pointer">
                      <Mail className="w-4 h-4" /> Email
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="sms" id="sms" />
                    <Label htmlFor="sms" className="flex items-center gap-1 cursor-pointer">
                      <MessageSquare className="w-4 h-4" /> SMS
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="both" id="both" />
                    <Label htmlFor="both" className="cursor-pointer">Both</Label>
                  </div>
                </RadioGroup>

                {(sendMethod === "email" || sendMethod === "both") && !recipientEmail && (
                  <p className="text-sm text-destructive">Email required for this method</p>
                )}
                {(sendMethod === "sms" || sendMethod === "both") && !recipientPhone && (
                  <p className="text-sm text-destructive">Phone required for this method</p>
                )}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => sendMutation.mutate()}
              disabled={!canSend() || sendMutation.isPending}
            >
              {sendMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Purchase Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SupplierContactDialog
        open={isAddingSupplier}
        onOpenChange={setIsAddingSupplier}
        onSuccess={(newSupplier) => {
          setSupplierId(newSupplier.id);
          queryClient.invalidateQueries({ queryKey: ["supplier-contacts"] });
        }}
      />
    </>
  );
}
