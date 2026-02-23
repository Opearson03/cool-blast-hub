import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, Building2, FileText, MapPin } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface SupplierContact {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  category: string | null;
  notes: string | null;
}

interface SupplierDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: SupplierContact | null;
}

export function SupplierDetailSheet({ open, onOpenChange, supplier }: SupplierDetailSheetProps) {
  const navigate = useNavigate();

  const { data: purchaseOrders = [], isLoading } = useQuery({
    queryKey: ["supplier-pos", supplier?.id, supplier?.name],
    queryFn: async () => {
      if (!supplier) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!profile?.business_id) return [];

      // Match by supplier_contact_id or supplier_name
      let query = supabase
        .from("purchase_orders")
        .select("id, po_number, status, delivery_date, created_at, supplier_name, job_id, items")
        .eq("business_id", profile.business_id)
        .order("created_at", { ascending: false });

      const { data: byId } = await supabase
        .from("purchase_orders")
        .select("id, po_number, status, delivery_date, created_at, supplier_name, job_id, items")
        .eq("business_id", profile.business_id)
        .eq("supplier_contact_id", supplier.id)
        .order("created_at", { ascending: false });

      const { data: byName } = await supabase
        .from("purchase_orders")
        .select("id, po_number, status, delivery_date, created_at, supplier_name, job_id, items")
        .eq("business_id", profile.business_id)
        .ilike("supplier_name", supplier.name)
        .order("created_at", { ascending: false });

      // Merge and deduplicate
      const allPOs = new Map<string, any>();
      for (const po of [...(byId || []), ...(byName || [])]) {
        allPOs.set(po.id, po);
      }

      // Fetch job names for the POs
      const jobIds = [...new Set(Array.from(allPOs.values()).map(po => po.job_id))];
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, name, job_number")
        .in("id", jobIds.length > 0 ? jobIds : ["none"]);

      const jobMap = new Map((jobs || []).map(j => [j.id, j]));

      return Array.from(allPOs.values()).map(po => ({
        ...po,
        job: jobMap.get(po.job_id) || null,
      }));
    },
    enabled: open && !!supplier,
  });

  if (!supplier) return null;

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "sent": return "bg-blue-500/10 text-blue-500";
      case "approved": return "bg-green-500/10 text-green-500";
      case "draft": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl">{supplier.name}</SheetTitle>
          {supplier.company && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              {supplier.company}
            </div>
          )}
          {supplier.category && (
            <Badge variant="secondary">{supplier.category}</Badge>
          )}
        </SheetHeader>

        <div className="space-y-6">
          {/* Contact Actions */}
          <div className="flex gap-2">
            {supplier.phone && (
              <Button variant="outline" size="sm" asChild>
                <a href={`tel:${supplier.phone}`}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </a>
              </Button>
            )}
            {supplier.email && (
              <Button variant="outline" size="sm" asChild>
                <a href={`mailto:${supplier.email}`}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </a>
              </Button>
            )}
          </div>

          {/* Contact Info */}
          <Card>
            <CardContent className="pt-4 space-y-2">
              {supplier.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {supplier.phone}
                </div>
              )}
              {supplier.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {supplier.email}
                </div>
              )}
              {supplier.notes && (
                <p className="text-sm text-muted-foreground">{supplier.notes}</p>
              )}
            </CardContent>
          </Card>

          {/* Purchase Orders Section */}
          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4" />
              Purchase Orders ({purchaseOrders.length})
            </h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
              </div>
            ) : purchaseOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No purchase orders yet</p>
            ) : (
              <div className="space-y-2">
                {purchaseOrders.map((po: any) => (
                  <button
                    key={po.id}
                    onClick={() => {
                      if (po.job?.id) {
                        onOpenChange(false);
                        navigate(`/admin/jobs/${po.job.id}`);
                      }
                    }}
                    className="w-full p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{po.po_number}</span>
                      <Badge className={getStatusColor(po.status)}>
                        {po.status || "draft"}
                      </Badge>
                    </div>
                    {po.job && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {po.job.name}{po.job.job_number && ` • ${po.job.job_number}`}
                      </p>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {po.created_at && format(new Date(po.created_at), "dd MMM yyyy")}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
