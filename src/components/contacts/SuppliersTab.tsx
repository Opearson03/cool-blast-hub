import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Truck, 
  ChevronRight, 
  Phone, 
  Mail, 
  Search,
  Plus,
  Pencil,
  Trash2,
  Building2
} from "lucide-react";
import { toast } from "sonner";
import { SupplierContactDialog } from "@/components/jobs/boq/SupplierContactDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SupplierContact {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  category: string | null;
  notes: string | null;
}

export function SuppliersTab() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierContact | null>(null);
  const [deleteSupplier, setDeleteSupplier] = useState<SupplierContact | null>(null);

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["supplier-contacts"],
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
        .from("supplier_contacts")
        .select("*")
        .eq("business_id", profile.business_id)
        .order("name");

      return (data as SupplierContact[]) || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("supplier_contacts")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-contacts"] });
      toast.success("Supplier deleted");
      setDeleteSupplier(null);
    },
    onError: () => {
      toast.error("Failed to delete supplier");
    },
  });

  // Group suppliers by category
  const groupedSuppliers = useMemo(() => {
    const filtered = searchQuery
      ? suppliers.filter(
          (s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.phone?.includes(searchQuery) ||
            s.email?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : suppliers;

    const groups: Record<string, SupplierContact[]> = {};
    for (const supplier of filtered) {
      const category = supplier.category || "General";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(supplier);
    }

    // Sort categories alphabetically
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [suppliers, searchQuery]);

  const handleEdit = (supplier: SupplierContact, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSupplier(supplier);
    setDialogOpen(true);
  };

  const handleDelete = (supplier: SupplierContact, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteSupplier(supplier);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          {suppliers.length > 3 && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search suppliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
          <Button onClick={() => {
            setEditingSupplier(null);
            setDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : suppliers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Truck className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No suppliers yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add supplier contacts for purchase orders
              </p>
            </CardContent>
          </Card>
        ) : groupedSuppliers.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No suppliers match your search
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {groupedSuppliers.map(([category, categorySuppliers]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-sm">
                    {category}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ({categorySuppliers.length})
                  </span>
                </div>
                <div className="grid gap-2">
                  {categorySuppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{supplier.name}</p>
                          {supplier.company && (
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {supplier.company}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          {supplier.phone && (
                            <a 
                              href={`tel:${supplier.phone}`}
                              className="flex items-center gap-1 hover:text-foreground"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Phone className="h-3 w-3" />
                              {supplier.phone}
                            </a>
                          )}
                          {supplier.email && (
                            <a 
                              href={`mailto:${supplier.email}`}
                              className="flex items-center gap-1 hover:text-foreground truncate max-w-[200px]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate">{supplier.email}</span>
                            </a>
                          )}
                        </div>
                        {supplier.notes && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {supplier.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleEdit(supplier, e)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDelete(supplier, e)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SupplierContactDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingSupplier(null);
        }}
        initialData={editingSupplier ? {
          id: editingSupplier.id,
          name: editingSupplier.name,
          company: editingSupplier.company || undefined,
          phone: editingSupplier.phone || undefined,
          email: editingSupplier.email || undefined,
          category: editingSupplier.category || undefined,
          notes: editingSupplier.notes || undefined,
        } : undefined}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["supplier-contacts"] });
          setDialogOpen(false);
          setEditingSupplier(null);
        }}
      />

      <AlertDialog open={!!deleteSupplier} onOpenChange={(open) => !open && setDeleteSupplier(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteSupplier?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteSupplier && deleteMutation.mutate(deleteSupplier.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
