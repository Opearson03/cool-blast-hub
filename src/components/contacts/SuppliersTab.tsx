import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ContactList, ContactListItem } from "./ContactList";
import { ContactFormDialog } from "./ContactFormDialog";

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierContact | null>(null);

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

  const createMutation = useMutation({
    mutationFn: async (data: Omit<SupplierContact, "id">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!profile?.business_id) throw new Error("No business found");

      const { data: supplier, error } = await supabase
        .from("supplier_contacts")
        .insert({
          business_id: profile.business_id,
          ...data,
        })
        .select()
        .single();

      if (error) throw error;
      return supplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-contacts"] });
      toast.success("Supplier added");
    },
    onError: (error) => {
      toast.error("Failed to add supplier: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<SupplierContact> & { id: string }) => {
      const { data: supplier, error } = await supabase
        .from("supplier_contacts")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return supplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-contacts"] });
      toast.success("Supplier updated");
    },
    onError: (error) => {
      toast.error("Failed to update supplier: " + error.message);
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
    },
    onError: () => {
      toast.error("Failed to delete supplier");
    },
  });

  const handleAdd = () => {
    setEditingSupplier(null);
    setDialogOpen(true);
  };

  const handleEdit = (contact: ContactListItem) => {
    const supplier = suppliers.find((s) => s.id === contact.id);
    if (supplier) {
      setEditingSupplier(supplier);
      setDialogOpen(true);
    }
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleSave = async (data: any) => {
    if (editingSupplier?.id) {
      await updateMutation.mutateAsync({
        id: editingSupplier.id,
        name: data.name,
        company: data.company_name || null,
        phone: data.phone || null,
        email: data.email || null,
        category: data.category || null,
        notes: data.notes || null,
      });
    } else {
      await createMutation.mutateAsync({
        name: data.name,
        company: data.company_name || null,
        phone: data.phone || null,
        email: data.email || null,
        category: data.category || null,
        notes: data.notes || null,
      });
    }
    setDialogOpen(false);
    setEditingSupplier(null);
  };

  const contactList: ContactListItem[] = suppliers.map((s) => ({
    id: s.id,
    name: s.name,
    company_name: s.company,
    email: s.email,
    phone: s.phone,
    category: s.category,
    notes: s.notes,
  }));

  return (
    <>
      <ContactList
        type="supplier"
        contacts={contactList}
        isLoading={isLoading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        groupBy="category"
      />

      <ContactFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingSupplier(null);
        }}
        type="supplier"
        initialData={editingSupplier ? {
          id: editingSupplier.id,
          name: editingSupplier.name,
          company_name: editingSupplier.company || undefined,
          email: editingSupplier.email || undefined,
          phone: editingSupplier.phone || undefined,
          category: editingSupplier.category || undefined,
          notes: editingSupplier.notes || undefined,
        } : undefined}
        onSave={handleSave}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </>
  );
}
