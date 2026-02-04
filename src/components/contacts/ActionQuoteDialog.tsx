import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Send, Calendar, Package } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/format-currency";

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
}

interface ActionQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteId: string;
  onConverted?: () => void;
}

export function ActionQuoteDialog({
  open,
  onOpenChange,
  quoteId,
  onConverted,
}: ActionQuoteDialogProps) {
  const queryClient = useQueryClient();
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [onsiteContact, setOnsiteContact] = useState<string>("");
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [items, setItems] = useState<QuoteItem[]>([]);

  // Fetch quote details
  const { data: quote, isLoading: isLoadingQuote } = useQuery({
    queryKey: ["pending-quote", quoteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pending_quotes")
        .select("*, linked_rfq:purchase_orders(*), linked_job:jobs(*)")
        .eq("id", quoteId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: open && !!quoteId,
  });

  // Fetch employees for onsite contact
  const { data: employees = [] } = useQuery({
    queryKey: ["employees-for-contact"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!profile?.business_id) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .eq("business_id", profile.business_id);

      return profiles || [];
    },
    enabled: open,
  });

  // Fetch jobs for selection
  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs-for-quote"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!profile?.business_id) return [];

      const { data } = await supabase
        .from("jobs")
        .select("id, name, site_address")
        .eq("business_id", profile.business_id)
        .neq("status", "completed")
        .neq("status", "cancelled")
        .order("created_at", { ascending: false });

      return data || [];
    },
    enabled: open,
  });

  const [selectedJobId, setSelectedJobId] = useState<string>("");

  // Initialize form from linked RFQ data
  useEffect(() => {
    if (quote) {
      const rfq = quote.linked_rfq as any;
      const job = quote.linked_job as any;

      if (rfq?.job_id) {
        setSelectedJobId(rfq.job_id);
      } else if (quote.linked_job_id) {
        setSelectedJobId(quote.linked_job_id);
      }

      if (job?.site_address) {
        setDeliveryAddress(job.site_address);
      } else if (rfq?.delivery_address) {
        setDeliveryAddress(rfq.delivery_address);
      }

      // Parse RFQ items if available
      if (rfq?.items && Array.isArray(rfq.items)) {
        setItems(
          rfq.items.map((item: any, idx: number) => ({
            id: item.id || `item-${idx}`,
            description: item.description || "",
            quantity: item.quantity || 1,
            unit: item.unit || "ea",
            unitPrice: item.unitPrice || undefined,
          }))
        );
      }
    }
  }, [quote]);

  // Update delivery address when job changes
  useEffect(() => {
    if (selectedJobId) {
      const job = jobs.find((j) => j.id === selectedJobId);
      if (job?.site_address) {
        setDeliveryAddress(job.site_address);
      }
    }
  }, [selectedJobId, jobs]);

  // Convert quote to PO mutation
  const convertMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!profile?.business_id) throw new Error("Business not found");

      // Get job's BOQ
      const { data: boq } = await supabase
        .from("job_boq")
        .select("id")
        .eq("job_id", selectedJobId)
        .single();

      if (!boq) throw new Error("Job BOQ not found");

      // Generate PO number
      const { data: existingPOs } = await supabase
        .from("purchase_orders")
        .select("po_number")
        .eq("business_id", profile.business_id)
        .order("created_at", { ascending: false })
        .limit(1);

      let nextNumber = 1;
      if (existingPOs && existingPOs.length > 0) {
        const lastNum = existingPOs[0].po_number.match(/\d+/);
        if (lastNum) {
          nextNumber = parseInt(lastNum[0], 10) + 1;
        }
      }
      const poNumber = `PO-${String(nextNumber).padStart(4, "0")}`;

      // Create purchase order
      const { error: poError } = await supabase.from("purchase_orders").insert({
        business_id: profile.business_id,
        job_id: selectedJobId,
        boq_id: boq.id,
        po_number: poNumber,
        supplier_name: quote?.from_name || quote?.from_email || "Unknown",
        supplier_email: quote?.from_email,
        delivery_address: deliveryAddress,
        notes: notes || null,
        items: items.map((item) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice || 0,
          totalPrice: (item.unitPrice || 0) * item.quantity,
        })),
        status: "sent",
        sent_at: new Date().toISOString(),
        created_by: user.id,
      });

      if (poError) throw poError;

      // Mark quote as converted
      const { error: updateError } = await supabase
        .from("pending_quotes")
        .update({ status: "converted" })
        .eq("id", quoteId);

      if (updateError) throw updateError;

      return { poNumber };
    },
    onSuccess: (data) => {
      toast.success(`Purchase Order ${data.poNumber} created`);
      queryClient.invalidateQueries({ queryKey: ["inbox-history"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      onOpenChange(false);
      onConverted?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create purchase order");
    },
  });

  const handleItemPriceChange = (itemId: string, value: string) => {
    const price = parseFloat(value) || undefined;
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, unitPrice: price } : item
      )
    );
  };

  const calculateTotal = () => {
    return items.reduce(
      (sum, item) => sum + (item.unitPrice || 0) * item.quantity,
      0
    );
  };

  const canSubmit =
    selectedJobId &&
    deliveryDate &&
    deliveryAddress &&
    items.every((item) => item.unitPrice !== undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Convert Quote to Purchase Order
          </DialogTitle>
          <DialogDescription>
            Review the supplier quote and confirm details to create a purchase
            order
          </DialogDescription>
        </DialogHeader>

        {isLoadingQuote ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Quote Info */}
            <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
              <p>
                <strong>From:</strong> {quote?.from_name || quote?.from_email}
              </p>
              <p>
                <strong>Subject:</strong> {quote?.subject || "(No subject)"}
              </p>
              {quote?.linked_rfq && (
                <p className="text-primary">
                  <strong>Linked RFQ:</strong>{" "}
                  {(quote.linked_rfq as any).po_number}
                </p>
              )}
            </div>

            {/* Job Selection */}
            <div className="space-y-2">
              <Label>Job *</Label>
              <Select
                value={selectedJobId}
                onValueChange={setSelectedJobId}
                disabled={!!quote?.linked_rfq}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a job" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Delivery Date */}
            <div className="space-y-2">
              <Label>Delivery Date *</Label>
              <Input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>

            {/* Onsite Contact */}
            <div className="space-y-2">
              <Label>Onsite Contact</Label>
              <Select value={onsiteContact} onValueChange={setOnsiteContact}>
                <SelectTrigger>
                  <SelectValue placeholder="Select contact (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name}
                      {emp.phone && ` (${emp.phone})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Delivery Address */}
            <div className="space-y-2">
              <Label>Delivery Address *</Label>
              <Input
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Site address"
              />
            </div>

            {/* Items Table */}
            {items.length > 0 && (
              <div className="space-y-2">
                <Label>Items from RFQ</Label>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-20 text-right">Qty</TableHead>
                        <TableHead className="w-20">Unit</TableHead>
                        <TableHead className="w-32">Unit Price</TableHead>
                        <TableHead className="w-28 text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.description}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.quantity}
                          </TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unitPrice ?? ""}
                              onChange={(e) =>
                                handleItemPriceChange(item.id, e.target.value)
                              }
                              placeholder="0.00"
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            {item.unitPrice !== undefined
                              ? formatCurrency(item.unitPrice * item.quantity)
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={4} className="text-right font-medium">
                          Total:
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(calculateTotal())}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions..."
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => convertMutation.mutate()}
            disabled={!canSubmit || convertMutation.isPending}
          >
            {convertMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Create Purchase Order
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
