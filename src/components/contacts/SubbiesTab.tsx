import { useState } from "react";
import { useSubcontractors, useCreateSubcontractor, useUpdateSubcontractor, useDeleteSubcontractor, Subcontractor } from "@/hooks/useSubcontractors";
import { ContactList, ContactListItem } from "./ContactList";
import { ContactFormDialog } from "./ContactFormDialog";

export function SubbiesTab() {
  const { data: subcontractors = [], isLoading } = useSubcontractors();
  const createSubcontractor = useCreateSubcontractor();
  const updateSubcontractor = useUpdateSubcontractor();
  const deleteSubcontractor = useDeleteSubcontractor();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubcontractor, setEditingSubcontractor] = useState<Subcontractor | null>(null);

  const handleAdd = () => {
    setEditingSubcontractor(null);
    setDialogOpen(true);
  };

  const handleEdit = (contact: ContactListItem) => {
    const subcontractor = subcontractors.find((s) => s.id === contact.id);
    if (subcontractor) {
      setEditingSubcontractor(subcontractor);
      setDialogOpen(true);
    }
  };

  const handleDelete = (id: string) => {
    deleteSubcontractor.mutate(id);
  };

  const handleSave = async (data: any) => {
    if (editingSubcontractor?.id) {
      await updateSubcontractor.mutateAsync({
        id: editingSubcontractor.id,
        name: data.name,
        company_name: data.company_name || null,
        email: data.email || null,
        phone: data.phone || null,
        trade: data.trade || null,
        notes: data.notes || null,
      });
    } else {
      await createSubcontractor.mutateAsync({
        name: data.name,
        company_name: data.company_name || null,
        email: data.email || null,
        phone: data.phone || null,
        trade: data.trade || null,
        notes: data.notes || null,
      });
    }
    setDialogOpen(false);
    setEditingSubcontractor(null);
  };

  const contactList: ContactListItem[] = subcontractors.map((s) => ({
    id: s.id,
    name: s.name,
    company_name: s.company_name,
    email: s.email,
    phone: s.phone,
    trade: s.trade,
    notes: s.notes,
  }));

  return (
    <>
      <ContactList
        type="subcontractor"
        contacts={contactList}
        isLoading={isLoading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        groupBy="trade"
      />

      <ContactFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingSubcontractor(null);
        }}
        type="subcontractor"
        initialData={editingSubcontractor ? {
          id: editingSubcontractor.id,
          name: editingSubcontractor.name,
          company_name: editingSubcontractor.company_name || undefined,
          email: editingSubcontractor.email || undefined,
          phone: editingSubcontractor.phone || undefined,
          trade: editingSubcontractor.trade || undefined,
          notes: editingSubcontractor.notes || undefined,
        } : undefined}
        onSave={handleSave}
        isPending={createSubcontractor.isPending || updateSubcontractor.isPending}
      />
    </>
  );
}
