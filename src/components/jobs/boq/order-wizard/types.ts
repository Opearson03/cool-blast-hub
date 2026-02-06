import { BOQItem, JobBOQ } from "../BOQTypes";

export type OrderType = "quote" | "po";
export type SendMethod = "email"; // SMS removed - email only for supplier communications

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

export interface JobPlan {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
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
  // Plans (for RFQ)
  includePlans: boolean;
  selectedPlanIds: string[];
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
