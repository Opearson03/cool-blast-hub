import { BOQItem, JobBOQ } from "../BOQTypes";

export type OrderType = "quote" | "po";
export type SendMethod = "email" | "sms" | "both";

export interface SupplierContact {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  category: string | null;
}

export interface InternalContact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: string | null;
}

export interface SiteContactOption {
  id: string;
  name: string;
  phone: string | null;
  type: "internal" | "employee";
}

export interface OrderWizardData {
  orderType: OrderType;
  selectedItems: string[];
  // Supplier(s)
  supplierId: string;
  selectedSupplierIds: string[];
  manualSupplier: {
    name: string;
    email: string;
    phone: string;
  };
  saveSupplier: boolean;
  // Delivery
  deliveryAddress: string;
  deliveryDate: Date | undefined;
  siteContactId: string;
  manualSiteContact: {
    name: string;
    phone: string;
  };
  // Sending
  notes: string;
  sendMethod: SendMethod;
}

export interface OrderWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boq: JobBOQ;
  jobId: string;
  siteAddress: string;
  preSelectedItems?: string[];
}

export type WizardStep = "type" | "items" | "supplier" | "delivery" | "review";
