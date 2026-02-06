import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Plus, X, Users, Search, Check } from "lucide-react";
import { OrderType, SupplierContact } from "./types";

interface SupplierStepProps {
  orderType: OrderType;
  suppliers: SupplierContact[];
  // Single supplier (PO)
  supplierId: string;
  onSupplierIdChange: (id: string) => void;
  // Multiple suppliers (Quote)
  selectedSupplierIds: string[];
  onToggleSupplier: (id: string) => void;
  onRemoveSupplier: (id: string) => void;
  // Manual entry
  manualSupplier: { name: string; email: string; phone: string };
  onManualSupplierChange: (supplier: { name: string; email: string; phone: string }) => void;
  saveSupplier: boolean;
  onSaveSupplierChange: (save: boolean) => void;
  // Add new
  onAddNewSupplier: () => void;
}

export function SupplierStep({
  orderType,
  suppliers,
  supplierId,
  onSupplierIdChange,
  selectedSupplierIds,
  onToggleSupplier,
  onRemoveSupplier,
  manualSupplier,
  onManualSupplierChange,
  saveSupplier,
  onSaveSupplierChange,
  onAddNewSupplier,
}: SupplierStepProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const isQuote = orderType === "quote";
  const selectedSuppliers = suppliers.filter(s => selectedSupplierIds.includes(s.id));
  const showManualEntry = isQuote ? selectedSupplierIds.length === 0 : !supplierId;

  // Filter suppliers by search query
  const filteredSuppliers = suppliers.filter(s => {
    const query = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(query) ||
      (s.company?.toLowerCase().includes(query) ?? false) ||
      (s.email?.toLowerCase().includes(query) ?? false)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-lg">
          {isQuote ? "Select Suppliers" : "Select Supplier"}
        </h3>
        <Button variant="outline" size="sm" onClick={onAddNewSupplier}>
          <Plus className="w-4 h-4 mr-1" />
          Add New
        </Button>
      </div>

      {isQuote && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
          <Users className="w-4 h-4 flex-shrink-0" />
          <span>Select multiple suppliers to compare quotes</span>
        </div>
      )}

      {/* Quote: Multi-select suppliers with search */}
      {isQuote && (
        <>
          {selectedSuppliers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedSuppliers.map((supplier) => (
                <Badge
                  key={supplier.id}
                  variant="secondary"
                  className="pl-2 pr-1 py-1.5 flex items-center gap-1"
                >
                  {supplier.name}
                  {supplier.company && (
                    <span className="text-muted-foreground">({supplier.company})</span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 hover:bg-destructive/20"
                    onClick={() => onRemoveSupplier(supplier.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}

          {suppliers.length > 0 && (
            <Command className="border rounded-lg">
              <CommandInput 
                placeholder="Search suppliers..." 
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList className="max-h-[200px]">
                <CommandEmpty>No suppliers found</CommandEmpty>
                <CommandGroup>
                  {filteredSuppliers
                    .filter(s => !selectedSupplierIds.includes(s.id))
                    .map((supplier) => (
                      <CommandItem
                        key={supplier.id}
                        value={`${supplier.name} ${supplier.company || ""}`}
                        onSelect={() => onToggleSupplier(supplier.id)}
                        className="cursor-pointer"
                      >
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
                      </CommandItem>
                    ))}
                  {filteredSuppliers.filter(s => !selectedSupplierIds.includes(s.id)).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      {searchQuery ? "No matching suppliers" : "All suppliers selected"}
                    </p>
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          )}
        </>
      )}

      {/* PO: Single supplier select with search */}
      {!isQuote && (
        <Command className="border rounded-lg">
          <CommandInput 
            placeholder="Search suppliers..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList className="max-h-[200px]">
            <CommandEmpty>No suppliers found</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__manual__"
                onSelect={() => {
                  onSupplierIdChange("");
                  setSearchQuery("");
                }}
                className="cursor-pointer"
              >
                <span className="text-muted-foreground">-- Enter manually --</span>
              </CommandItem>
              {filteredSuppliers.map((supplier) => (
                <CommandItem
                  key={supplier.id}
                  value={`${supplier.name} ${supplier.company || ""}`}
                  onSelect={() => {
                    onSupplierIdChange(supplier.id);
                    setSearchQuery("");
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex-1 min-w-0 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {supplier.name} {supplier.company && `(${supplier.company})`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[supplier.email, supplier.phone].filter(Boolean).join(" • ") || "No contact info"}
                      </p>
                    </div>
                    {supplierId === supplier.id && <Check className="w-4 h-4 text-primary" />}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      )}

      {/* Manual entry */}
      {showManualEntry && (
        <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
          <p className="text-sm font-medium">
            {suppliers.length > 0 ? "Or enter manually:" : "Enter supplier details:"}
          </p>
          <div>
            <Label>Contact Name *</Label>
            <Input
              value={manualSupplier.name}
              onChange={(e) => onManualSupplierChange({ ...manualSupplier, name: e.target.value })}
              placeholder="Sales rep name"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={manualSupplier.email}
                onChange={(e) => onManualSupplierChange({ ...manualSupplier, email: e.target.value })}
                placeholder="email@supplier.com"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                type="tel"
                value={manualSupplier.phone}
                onChange={(e) => onManualSupplierChange({ ...manualSupplier, phone: e.target.value })}
                placeholder="0400 000 000"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={saveSupplier}
              onCheckedChange={(checked) => onSaveSupplierChange(checked === true)}
            />
            <span className="text-sm">Save this supplier for future use</span>
          </label>
        </div>
      )}

      {suppliers.length === 0 && !manualSupplier.name && (
        <p className="text-sm text-muted-foreground">
          No saved suppliers. Add a new one or enter details above.
        </p>
      )}
    </div>
  );
}
