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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Send, Mail, MessageSquare, FileQuestion, X, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BOQItem, BOQ_CATEGORIES, JobBOQ } from "./BOQTypes";
import { SupplierContactDialog } from "./SupplierContactDialog";

interface SendPurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boq: JobBOQ;
  jobId: string;
  siteAddress: string;
  preSelectedItems?: string[];
}

interface SupplierContact {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  category: string | null;
}

type OrderType = "quote" | "po";

export function SendPurchaseOrderDialog({
  open,
  onOpenChange,
  boq,
  jobId,
  siteAddress,
  preSelectedItems,
}: SendPurchaseOrderDialogProps) {
  const [orderType, setOrderType] = useState<OrderType>("po");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  // For PO: single supplier ID
  const [supplierId, setSupplierId] = useState<string>("");
  // For Quote: multiple supplier IDs
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
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
      // Use pre-selected items if provided, otherwise default to all unordered items
      const unorderedIds = boq.items.filter(item => !item.ordered).map(item => item.id);
      const initialSelection = preSelectedItems && preSelectedItems.length > 0
        ? preSelectedItems.filter(id => unorderedIds.includes(id))
        : unorderedIds;
      setSelectedItems(initialSelection);
      setDeliveryAddress(siteAddress);
      setSupplierId("");
      setSelectedSupplierIds([]);
      setManualSupplier({ name: "", email: "", phone: "" });
      setNotes("");
      setSendMethod("email");
      setSaveSupplier(false);
      setOrderType("po");
    }
  }, [open, boq.items, siteAddress, preSelectedItems]);

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

  const toggleSupplierSelection = (supplierId: string) => {
    setSelectedSupplierIds(prev =>
      prev.includes(supplierId)
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  const removeSelectedSupplier = (supplierId: string) => {
    setSelectedSupplierIds(prev => prev.filter(id => id !== supplierId));
  };

  // Get selected suppliers for display
  const selectedSuppliers = suppliers.filter(s => selectedSupplierIds.includes(s.id));

  const sendMutation = useMutation({
    mutationFn: async () => {
      const selectedBOQItems = boq.items.filter(item => selectedItems.includes(item.id));
      
      if (orderType === "quote" && selectedSupplierIds.length > 0) {
        // Send quote requests to multiple suppliers in parallel
        const results = await Promise.all(
          selectedSupplierIds.map(async (supId) => {
            const supplier = suppliers.find(s => s.id === supId);
            if (!supplier) return null;

            const { data, error } = await supabase.functions.invoke("send-purchase-order", {
              body: {
                jobId,
                boqId: boq.id,
                items: selectedBOQItems,
                supplierContactId: supId,
                supplierName: supplier.name,
                supplierEmail: supplier.email,
                supplierPhone: supplier.phone,
                deliveryAddress,
                notes,
                sendMethod,
                orderType: "quote",
                saveNewSupplier: null,
              },
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);
            return data;
          })
        );
        return { count: results.length };
      } else {
        // Single supplier PO or quote
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
            orderType,
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
      }
    },
    onSuccess: (data) => {
      // Only mark as ordered if sending a PO (not a quote request)
      if (orderType === "po") {
        const updatedItems = boq.items.map(item => {
          if (selectedItems.includes(item.id)) {
            return { ...item, ordered: true, orderedAt: new Date().toISOString() };
          }
          return item;
        });

        supabase
          .from("job_boq")
          .update({ items: JSON.parse(JSON.stringify(updatedItems)) })
          .eq("id", boq.id)
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ["job-boq", jobId] });
            queryClient.invalidateQueries({ queryKey: ["supplier-contacts"] });
          });
      } else {
        queryClient.invalidateQueries({ queryKey: ["supplier-contacts"] });
      }

      const isMultiSupplier = orderType === "quote" && selectedSupplierIds.length > 1;
      
      toast({
        title: orderType === "po" ? "Purchase Order Sent" : "Quote Request Sent",
        description: orderType === "po" 
          ? `PO ${data.poNumber} sent successfully via ${sendMethod}`
          : isMultiSupplier 
            ? `Quote request sent to ${selectedSupplierIds.length} suppliers via ${sendMethod}`
            : `Quote request sent successfully via ${sendMethod}`,
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: orderType === "po" ? "Error sending PO" : "Error sending quote request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const canSend = () => {
    if (selectedItems.length === 0) return false;
    
    if (orderType === "quote") {
      // For quotes: need at least one selected supplier OR manual supplier with name
      if (selectedSupplierIds.length === 0 && !manualSupplier.name) return false;
      
      // Check send method requirements for multi-supplier
      if (selectedSupplierIds.length > 0) {
        const suppliersToCheck = selectedSuppliers;
        if (sendMethod === "email" && suppliersToCheck.some(s => !s.email)) return false;
        if (sendMethod === "sms" && suppliersToCheck.some(s => !s.phone)) return false;
        if (sendMethod === "both" && suppliersToCheck.some(s => !s.email || !s.phone)) return false;
      } else {
        // Manual supplier checks
        if (sendMethod === "email" && !manualSupplier.email) return false;
        if (sendMethod === "sms" && !manualSupplier.phone) return false;
        if (sendMethod === "both" && (!manualSupplier.email || !manualSupplier.phone)) return false;
      }
      return true;
    }
    
    // For PO: original logic
    if (!recipientName) return false;
    if (!deliveryAddress) return false;
    if (sendMethod === "email" && !recipientEmail) return false;
    if (sendMethod === "sms" && !recipientPhone) return false;
    if (sendMethod === "both" && (!recipientEmail || !recipientPhone)) return false;
    return true;
  };

  const isQuote = orderType === "quote";

  // Check if any selected supplier is missing required contact info
  const getMissingContactInfo = () => {
    if (!isQuote || selectedSupplierIds.length === 0) return null;
    
    const missing: string[] = [];
    selectedSuppliers.forEach(s => {
      if (sendMethod === "email" && !s.email) missing.push(`${s.name} (no email)`);
      if (sendMethod === "sms" && !s.phone) missing.push(`${s.name} (no phone)`);
      if (sendMethod === "both" && (!s.email || !s.phone)) {
        const missingFields = [];
        if (!s.email) missingFields.push("email");
        if (!s.phone) missingFields.push("phone");
        missing.push(`${s.name} (no ${missingFields.join("/")})`);
      }
    });
    return missing.length > 0 ? missing : null;
  };

  const missingContactInfo = getMissingContactInfo();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isQuote ? (
                <>
                  <FileQuestion className="w-5 h-5" />
                  Request Quote
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Purchase Order
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[65vh] pr-4">
            <div className="space-y-6">
              {/* Order Type Toggle */}
              <Tabs value={orderType} onValueChange={(v) => setOrderType(v as OrderType)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="quote" className="flex items-center gap-2">
                    <FileQuestion className="w-4 h-4" />
                    Request Quote
                  </TabsTrigger>
                  <TabsTrigger value="po" className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Send PO
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {isQuote && (
                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md space-y-1">
                  <p>Request a quote from one or more suppliers for pricing on selected items.</p>
                  <p className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">Tip:</span> Select multiple suppliers to compare quotes.
                  </p>
                </div>
              )}

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

              {/* Supplier Selection - Multi-select for Quotes */}
              {isQuote ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Select Suppliers</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingSupplier(true)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add New
                    </Button>
                  </div>

                  {/* Selected suppliers badges */}
                  {selectedSuppliers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedSuppliers.map((supplier) => (
                        <Badge
                          key={supplier.id}
                          variant="secondary"
                          className="pl-2 pr-1 py-1 flex items-center gap-1"
                        >
                          {supplier.name}
                          {supplier.company && (
                            <span className="text-muted-foreground">({supplier.company})</span>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 ml-1 hover:bg-destructive/20"
                            onClick={() => removeSelectedSupplier(supplier.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Supplier list for selection */}
                  {suppliers.length > 0 ? (
                    <Card>
                      <CardContent className="p-3 max-h-48 overflow-y-auto space-y-1">
                        {suppliers
                          .filter(s => !selectedSupplierIds.includes(s.id))
                          .map((supplier) => (
                            <div
                              key={supplier.id}
                              className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                              onClick={() => toggleSupplierSelection(supplier.id)}
                            >
                              <Checkbox
                                checked={selectedSupplierIds.includes(supplier.id)}
                                onCheckedChange={() => toggleSupplierSelection(supplier.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">
                                  {supplier.name}
                                  {supplier.company && (
                                    <span className="text-muted-foreground ml-1">({supplier.company})</span>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {[supplier.email, supplier.phone].filter(Boolean).join(" • ") || "No contact info"}
                                </p>
                              </div>
                            </div>
                          ))}
                        {suppliers.filter(s => !selectedSupplierIds.includes(s.id)).length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-2">
                            All suppliers selected
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No saved suppliers. Add one above or enter details manually below.
                    </p>
                  )}

                  {/* Manual supplier entry for quotes (only if no suppliers selected) */}
                  {selectedSupplierIds.length === 0 && (
                    <div className="space-y-3 pl-4 border-l-2">
                      <p className="text-sm font-medium text-muted-foreground">Or enter manually:</p>
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
              ) : (
                /* Original single-supplier selection for PO */
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
              )}

              {/* Delivery Address - only show for PO */}
              {!isQuote && (
                <div className="space-y-2">
                  <Label className="text-base font-medium">Delivery Address</Label>
                  <Textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter delivery address..."
                    rows={2}
                  />
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-base font-medium">
                  {isQuote ? "Message (optional)" : "Notes (optional)"}
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isQuote 
                    ? "Any specific requirements or questions for the supplier..."
                    : "Delivery instructions, special requirements..."
                  }
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

                {/* Show missing contact info warnings */}
                {missingContactInfo && (
                  <div className="text-sm text-destructive space-y-1">
                    <p className="font-medium">Missing contact info:</p>
                    {missingContactInfo.map((msg, i) => (
                      <p key={i}>• {msg}</p>
                    ))}
                  </div>
                )}

                {!isQuote && (
                  <>
                    {(sendMethod === "email" || sendMethod === "both") && !recipientEmail && (
                      <p className="text-sm text-destructive">Email required for this method</p>
                    )}
                    {(sendMethod === "sms" || sendMethod === "both") && !recipientPhone && (
                      <p className="text-sm text-destructive">Phone required for this method</p>
                    )}
                  </>
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
              ) : isQuote ? (
                <FileQuestion className="w-4 h-4 mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {isQuote 
                ? selectedSupplierIds.length > 1 
                  ? `Request Quote (${selectedSupplierIds.length} suppliers)` 
                  : "Request Quote"
                : "Send Purchase Order"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SupplierContactDialog
        open={isAddingSupplier}
        onOpenChange={setIsAddingSupplier}
        onSuccess={(newSupplier) => {
          if (isQuote) {
            setSelectedSupplierIds(prev => [...prev, newSupplier.id]);
          } else {
            setSupplierId(newSupplier.id);
          }
          queryClient.invalidateQueries({ queryKey: ["supplier-contacts"] });
        }}
      />
    </>
  );
}
