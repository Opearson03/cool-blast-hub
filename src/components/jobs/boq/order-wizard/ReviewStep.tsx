import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Mail, MessageSquare, Package, MapPin, CalendarIcon, User, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { BOQItem, BOQ_CATEGORIES } from "../BOQTypes";
import { OrderType, SendMethod, SupplierContact, SiteContactOption } from "./types";

interface ReviewStepProps {
  orderType: OrderType;
  selectedItems: BOQItem[];
  // Supplier info
  supplierId: string;
  selectedSupplierIds: string[];
  suppliers: SupplierContact[];
  manualSupplier: { name: string; email: string; phone: string };
  // Delivery info
  deliveryAddress: string;
  deliveryDate: Date | undefined;
  siteContactId: string;
  siteContactOptions: SiteContactOption[];
  manualSiteContact: { name: string; phone: string };
  notes: string;
  // Send method
  sendMethod: SendMethod;
  onSendMethodChange: (method: SendMethod) => void;
  // Validation
  validationErrors: string[];
}

export function ReviewStep({
  orderType,
  selectedItems,
  supplierId,
  selectedSupplierIds,
  suppliers,
  manualSupplier,
  deliveryAddress,
  deliveryDate,
  siteContactId,
  siteContactOptions,
  manualSiteContact,
  notes,
  sendMethod,
  onSendMethodChange,
  validationErrors,
}: ReviewStepProps) {
  const isQuote = orderType === "quote";
  const selectedSuppliers = suppliers.filter(s => selectedSupplierIds.includes(s.id));
  const singleSupplier = suppliers.find(s => s.id === supplierId);
  const selectedSiteContact = siteContactOptions.find(c => c.id === siteContactId);

  const getSupplierDisplay = () => {
    if (isQuote) {
      if (selectedSuppliers.length > 0) {
        return selectedSuppliers.map(s => s.name).join(", ");
      }
      return manualSupplier.name || "Not specified";
    }
    return singleSupplier?.name || manualSupplier.name || "Not specified";
  };

  const getSiteContactDisplay = () => {
    if (selectedSiteContact) {
      return selectedSiteContact.name;
    }
    return manualSiteContact.name || "Not specified";
  };

  return (
    <div className="space-y-5">
      <h3 className="font-medium text-lg">Review & Send</h3>

      {validationErrors.length > 0 && (
        <Card className="border-destructive">
          <CardContent className="p-3 space-y-1">
            {validationErrors.map((error, i) => (
              <p key={i} className="text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Order Type */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Type</span>
            <Badge variant={isQuote ? "secondary" : "default"}>
              {isQuote ? "Quote Request" : "Purchase Order"}
            </Badge>
          </div>

          <Separator />

          {/* Items */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Items ({selectedItems.length})</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1 pl-6">
              {selectedItems.slice(0, 3).map(item => (
                <p key={item.id} className="truncate">
                  • {item.quantity} {item.unit} - {item.description}
                </p>
              ))}
              {selectedItems.length > 3 && (
                <p className="text-xs">+ {selectedItems.length - 3} more items</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Supplier */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Supplier</span>
            </div>
            <span className="text-sm text-right max-w-[60%] truncate">
              {getSupplierDisplay()}
              {isQuote && selectedSuppliers.length > 1 && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {selectedSuppliers.length} suppliers
                </Badge>
              )}
            </span>
          </div>

          <Separator />

          {/* Delivery Address */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Delivery</span>
            </div>
            <span className="text-sm text-right text-muted-foreground max-w-[60%]">
              {deliveryAddress || "Not specified"}
            </span>
          </div>

          {/* Delivery Date */}
          {deliveryDate && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Date</span>
              </div>
              <span className="text-sm">{format(deliveryDate, "PPP")}</span>
            </div>
          )}

          {/* Site Contact */}
          {(siteContactId || manualSiteContact.name) && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Site Contact</span>
                <span className="text-sm">{getSiteContactDisplay()}</span>
              </div>
            </>
          )}

          {/* Notes */}
          {notes && (
            <>
              <Separator />
              <div>
                <span className="text-sm font-medium block mb-1">Notes</span>
                <p className="text-sm text-muted-foreground">{notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Send Method */}
      <div className="space-y-3 pb-4">
        <Label className="text-base font-medium">Send via</Label>
        <RadioGroup
          value={sendMethod}
          onValueChange={(v) => onSendMethodChange(v as SendMethod)}
          className="flex gap-4"
        >
          <label className="flex items-center gap-2 cursor-pointer">
            <RadioGroupItem value="email" />
            <Mail className="w-4 h-4" />
            <span>Email</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <RadioGroupItem value="sms" />
            <MessageSquare className="w-4 h-4" />
            <span>SMS</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <RadioGroupItem value="both" />
            <span>Both</span>
          </label>
        </RadioGroup>
      </div>
    </div>
  );
}
