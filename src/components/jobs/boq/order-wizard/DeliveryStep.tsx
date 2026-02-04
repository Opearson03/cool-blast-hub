import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, MapPin, UserCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { InternalContact, SiteContactOption } from "./types";

interface DeliveryStepProps {
  deliveryAddress: string;
  onDeliveryAddressChange: (address: string) => void;
  deliveryDate: Date | undefined;
  onDeliveryDateChange: (date: Date | undefined) => void;
  siteContactId: string;
  onSiteContactIdChange: (id: string) => void;
  manualSiteContact: { name: string; phone: string };
  onManualSiteContactChange: (contact: { name: string; phone: string }) => void;
  internalContacts: InternalContact[];
  employees: { id: string; full_name: string | null; phone: string | null }[];
  notes: string;
  onNotesChange: (notes: string) => void;
  isQuote: boolean;
}

export function DeliveryStep({
  deliveryAddress,
  onDeliveryAddressChange,
  deliveryDate,
  onDeliveryDateChange,
  siteContactId,
  onSiteContactIdChange,
  manualSiteContact,
  onManualSiteContactChange,
  internalContacts,
  employees,
  notes,
  onNotesChange,
  isQuote,
}: DeliveryStepProps) {
  const siteContactOptions: SiteContactOption[] = [
    ...internalContacts.map(c => ({ id: c.id, name: c.name, phone: c.phone, type: "internal" as const })),
    ...employees.map(e => ({ id: e.id, name: e.full_name || "Unknown", phone: e.phone, type: "employee" as const })),
  ];

  return (
    <div className="space-y-5">
      <h3 className="font-medium text-lg">Delivery Details</h3>

      {/* Delivery Address */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4" />
          Delivery Address
        </Label>
        <Textarea
          value={deliveryAddress}
          onChange={(e) => onDeliveryAddressChange(e.target.value)}
          placeholder="Enter delivery address..."
          rows={2}
        />
      </div>

      {/* Delivery Date */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <CalendarIcon className="w-4 h-4" />
          Delivery Date
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !deliveryDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {deliveryDate ? format(deliveryDate, "PPP") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={deliveryDate}
              onSelect={onDeliveryDateChange}
              initialFocus
              disabled={(date) => date < new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Site Contact */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <UserCircle className="w-4 h-4" />
          Site Contact
        </Label>
        <Select
          value={siteContactId || "__manual__"}
          onValueChange={(v) => {
            if (v === "__manual__") {
              onSiteContactIdChange("");
            } else {
              onSiteContactIdChange(v);
              onManualSiteContactChange({ name: "", phone: "" });
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select site contact..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__manual__">-- Enter manually --</SelectItem>
            {internalContacts.length > 0 && (
              <>
                <SelectItem value="__header_internal__" disabled className="text-xs font-semibold text-muted-foreground">
                  Internal Contacts
                </SelectItem>
                {internalContacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} {c.role && `(${c.role})`}
                  </SelectItem>
                ))}
              </>
            )}
            {employees.length > 0 && (
              <>
                <SelectItem value="__header_employees__" disabled className="text-xs font-semibold text-muted-foreground">
                  Employees
                </SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.full_name}
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>

        {!siteContactId && (
          <div className="grid grid-cols-2 gap-3 p-3 border rounded-lg bg-muted/30">
            <div>
              <Label className="text-xs">Contact Name</Label>
              <Input
                value={manualSiteContact.name}
                onChange={(e) => onManualSiteContactChange({ ...manualSiteContact, name: e.target.value })}
                placeholder="Site supervisor"
              />
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input
                type="tel"
                value={manualSiteContact.phone}
                onChange={(e) => onManualSiteContactChange({ ...manualSiteContact, phone: e.target.value })}
                placeholder="0400 000 000"
              />
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label>{isQuote ? "Message (optional)" : "Notes (optional)"}</Label>
        <Textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder={isQuote
            ? "Any requirements or questions for the supplier..."
            : "Delivery instructions, special requirements..."
          }
          rows={2}
        />
      </div>
    </div>
  );
}
