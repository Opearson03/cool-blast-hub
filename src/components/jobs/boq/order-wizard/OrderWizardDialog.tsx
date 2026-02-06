import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ChevronLeft, ChevronRight, Send, FileQuestion } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { StepIndicator } from "./StepIndicator";
import { TypeStep } from "./TypeStep";
import { ItemsStep } from "./ItemsStep";
import { SupplierStep } from "./SupplierStep";
import { DeliveryStep } from "./DeliveryStep";
import { ReviewStep } from "./ReviewStep";
import { SupplierContactDialog } from "../SupplierContactDialog";

import {
  OrderWizardProps,
  OrderType,
  SendMethod,
  WizardStep,
  SupplierContact,
  InternalContact,
  SiteContactOption,
} from "./types";

const STEPS: WizardStep[] = ["type", "items", "supplier", "delivery", "review"];

export function OrderWizardDialog({
  open,
  onOpenChange,
  boq,
  jobId,
  siteAddress,
  preSelectedItems,
}: OrderWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("type");
  const [completedSteps, setCompletedSteps] = useState<WizardStep[]>([]);
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);

  // Form state
  const [orderType, setOrderType] = useState<OrderType>("po");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [manualSupplier, setManualSupplier] = useState({ name: "", email: "", phone: "" });
  const [saveSupplier, setSaveSupplier] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState(siteAddress);
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>();
  const [siteContactId, setSiteContactId] = useState("");
  const [manualSiteContact, setManualSiteContact] = useState({ name: "", phone: "" });
  const [notes, setNotes] = useState("");
  const sendMethod: SendMethod = "email"; // Email only for supplier communications

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset on open
  useEffect(() => {
    if (open) {
      const unorderedIds = boq.items.filter(item => !item.ordered).map(item => item.id);
      const initialSelection = preSelectedItems?.filter(id => unorderedIds.includes(id)) || unorderedIds;

      setCurrentStep("type");
      setCompletedSteps([]);
      setOrderType("po");
      setSelectedItems(initialSelection);
      setSupplierId("");
      setSelectedSupplierIds([]);
      setManualSupplier({ name: "", email: "", phone: "" });
      setSaveSupplier(false);
      setDeliveryAddress(siteAddress);
      setDeliveryDate(undefined);
      setSiteContactId("");
      setManualSiteContact({ name: "", phone: "" });
      setNotes("");
    }
  }, [open, boq.items, siteAddress, preSelectedItems]);

  // Fetch suppliers
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

  // Fetch internal contacts
  const { data: internalContacts = [] } = useQuery({
    queryKey: ["internal-contacts"],
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
        .from("internal_contacts")
        .select("*")
        .eq("business_id", profile.business_id)
        .order("name");

      if (error) throw error;
      return data as InternalContact[];
    },
    enabled: open,
  });

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ["employees-for-contact"],
    queryFn: async (): Promise<{ id: string; full_name: string | null; phone: string | null }[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.business_id) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .eq("business_id", profile.business_id);

      if (error) throw error;
      return (data || []).filter(p => p.full_name);
    },
    enabled: open,
  });

  const siteContactOptions: SiteContactOption[] = [
    ...internalContacts.map(c => ({ id: c.id, name: c.name, phone: c.phone, type: "internal" as const })),
    ...employees.map(e => ({ id: e.id, name: e.full_name || "Unknown", phone: e.phone, type: "employee" as const })),
  ];

  const selectedSiteContact = siteContactOptions.find(c => c.id === siteContactId);
  const selectedSupplier = suppliers.find(s => s.id === supplierId);
  const selectedSuppliers = suppliers.filter(s => selectedSupplierIds.includes(s.id));

  // Get recipient info
  const getRecipientInfo = () => {
    if (orderType === "quote" && selectedSupplierIds.length > 0) {
      return selectedSuppliers;
    }
    if (supplierId && selectedSupplier) {
      return {
        name: selectedSupplier.name,
        email: selectedSupplier.email,
        phone: selectedSupplier.phone,
      };
    }
    return manualSupplier;
  };

  // Validation
  const getValidationErrors = (): string[] => {
    const errors: string[] = [];

    if (selectedItems.length === 0) {
      errors.push("Select at least one item");
    }

    const isQuote = orderType === "quote";

    if (isQuote) {
      if (selectedSupplierIds.length === 0 && !manualSupplier.name) {
        errors.push("Select or enter at least one supplier");
      }
      // Email is required for all suppliers
      if (selectedSupplierIds.length > 0) {
        if (selectedSuppliers.some(s => !s.email)) {
          errors.push("Some suppliers are missing email addresses");
        }
      } else {
        if (!manualSupplier.email) {
          errors.push("Supplier email is required");
        }
      }
    } else {
      const recipient = supplierId ? selectedSupplier : manualSupplier;
      if (!recipient?.name) {
        errors.push("Supplier name is required");
      }
      if (!deliveryAddress) {
        errors.push("Delivery address is required");
      }
      // Email is required
      if (!recipient?.email) {
        errors.push("Supplier email is required");
      }
    }

    return errors;
  };

  const getSiteContactInfo = () => {
    if (siteContactId && selectedSiteContact) {
      return {
        siteContactId: selectedSiteContact.type === "employee" ? selectedSiteContact.id : null,
        siteContactName: selectedSiteContact.name,
        siteContactPhone: selectedSiteContact.phone,
      };
    }
    return {
      siteContactId: null,
      siteContactName: manualSiteContact.name || null,
      siteContactPhone: manualSiteContact.phone || null,
    };
  };

  // Send mutation
  const sendMutation = useMutation({
    mutationFn: async () => {
      const selectedBOQItems = boq.items.filter(item => selectedItems.includes(item.id));
      const siteContactInfo = getSiteContactInfo();

      if (orderType === "quote" && selectedSupplierIds.length > 0) {
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
                deliveryDate: deliveryDate?.toISOString(),
                ...siteContactInfo,
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
        const recipient = supplierId ? selectedSupplier : manualSupplier;

        const { data, error } = await supabase.functions.invoke("send-purchase-order", {
          body: {
            jobId,
            boqId: boq.id,
            items: selectedBOQItems,
            supplierContactId: supplierId || null,
            supplierName: recipient?.name,
            supplierEmail: recipient?.email,
            supplierPhone: recipient?.phone,
            deliveryAddress,
            deliveryDate: deliveryDate?.toISOString(),
            ...siteContactInfo,
            notes,
            sendMethod,
            orderType,
            saveNewSupplier: !supplierId && saveSupplier ? manualSupplier : null,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        return data;
      }
    },
    onSuccess: (data) => {
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
          ? `PO ${data.poNumber} sent via ${sendMethod}`
          : isMultiSupplier
            ? `Sent to ${selectedSupplierIds.length} suppliers`
            : `Quote request sent via ${sendMethod}`,
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Navigation
  const currentIndex = STEPS.indexOf(currentStep);
  const canGoBack = currentIndex > 0;
  const canGoNext = currentIndex < STEPS.length - 1;
  const isLastStep = currentStep === "review";

  const goToStep = (step: WizardStep) => {
    // Mark current step as completed when moving forward
    if (STEPS.indexOf(step) > currentIndex && !completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }
    setCurrentStep(step);
  };

  const handleNext = () => {
    if (canGoNext) {
      goToStep(STEPS[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    if (canGoBack) {
      goToStep(STEPS[currentIndex - 1]);
    }
  };

  const handleSend = () => {
    const errors = getValidationErrors();
    if (errors.length === 0) {
      sendMutation.mutate();
    }
  };

  // Item handlers
  const toggleItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const selectAllItems = () => {
    setSelectedItems(boq.items.filter(item => !item.ordered).map(item => item.id));
  };

  const deselectAllItems = () => {
    setSelectedItems([]);
  };

  // Supplier handlers
  const toggleSupplier = (id: string) => {
    setSelectedSupplierIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const removeSupplier = (id: string) => {
    setSelectedSupplierIds(prev => prev.filter(s => s !== id));
  };

  const selectedBOQItems = boq.items.filter(item => selectedItems.includes(item.id));
  const validationErrors = isLastStep ? getValidationErrors() : [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
          <StepIndicator
            currentStep={currentStep}
            orderType={orderType}
            completedSteps={completedSteps}
          />

          <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
            <div className="min-h-[200px] pb-4">
              {currentStep === "type" && (
                <TypeStep orderType={orderType} onSelect={setOrderType} />
              )}

              {currentStep === "items" && (
                <ItemsStep
                  items={boq.items}
                  selectedItems={selectedItems}
                  onToggle={toggleItem}
                  onSelectAll={selectAllItems}
                  onDeselectAll={deselectAllItems}
                />
              )}

              {currentStep === "supplier" && (
                <SupplierStep
                  orderType={orderType}
                  suppliers={suppliers}
                  supplierId={supplierId}
                  onSupplierIdChange={setSupplierId}
                  selectedSupplierIds={selectedSupplierIds}
                  onToggleSupplier={toggleSupplier}
                  onRemoveSupplier={removeSupplier}
                  manualSupplier={manualSupplier}
                  onManualSupplierChange={setManualSupplier}
                  saveSupplier={saveSupplier}
                  onSaveSupplierChange={setSaveSupplier}
                  onAddNewSupplier={() => setIsAddingSupplier(true)}
                />
              )}

              {currentStep === "delivery" && (
                <DeliveryStep
                  deliveryAddress={deliveryAddress}
                  onDeliveryAddressChange={setDeliveryAddress}
                  deliveryDate={deliveryDate}
                  onDeliveryDateChange={setDeliveryDate}
                  siteContactId={siteContactId}
                  onSiteContactIdChange={setSiteContactId}
                  manualSiteContact={manualSiteContact}
                  onManualSiteContactChange={setManualSiteContact}
                  internalContacts={internalContacts}
                  notes={notes}
                  onNotesChange={setNotes}
                  isQuote={orderType === "quote"}
                />
              )}

              {currentStep === "review" && (
                <ReviewStep
                  orderType={orderType}
                  selectedItems={selectedBOQItems}
                  supplierId={supplierId}
                  selectedSupplierIds={selectedSupplierIds}
                  suppliers={suppliers}
                  manualSupplier={manualSupplier}
                  deliveryAddress={deliveryAddress}
                  deliveryDate={deliveryDate}
                  siteContactId={siteContactId}
                  siteContactOptions={siteContactOptions}
                  manualSiteContact={manualSiteContact}
                  notes={notes}
                  validationErrors={validationErrors}
                />
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="flex-row justify-between gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={!canGoBack}
              className={!canGoBack ? "invisible" : ""}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>

              {isLastStep ? (
                <Button
                  onClick={handleSend}
                  disabled={validationErrors.length > 0 || sendMutation.isPending}
                >
                  {sendMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : orderType === "quote" ? (
                    <FileQuestion className="w-4 h-4 mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {orderType === "quote" ? "Request Quote" : "Send PO"}
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SupplierContactDialog
        open={isAddingSupplier}
        onOpenChange={setIsAddingSupplier}
        onSuccess={(newSupplier) => {
          if (orderType === "quote") {
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
