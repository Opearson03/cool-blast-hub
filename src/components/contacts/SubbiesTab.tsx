import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubcontractors, useCreateSubcontractor, useUpdateSubcontractor, useDeleteSubcontractor, Subcontractor } from "@/hooks/useSubcontractors";
import { useBusinessSubbies } from "@/hooks/useBusinessSubbies";
import { ContactList, ContactListItem } from "./ContactList";
import { ContactFormDialog } from "./ContactFormDialog";
import { SubbieContactDetailSheet } from "@/components/dashboard/SubbieContactDetailSheet";
import type { PastSubbie } from "@/hooks/useBusinessSubbies";

export function SubbiesTab() {
  const { data: subcontractors = [], isLoading: isLoadingSubcontractors } = useSubcontractors();
  const { data: pastSubbies = [], isLoading: isLoadingPastSubbies } = useBusinessSubbies();
  const createSubcontractor = useCreateSubcontractor();
  const updateSubcontractor = useUpdateSubcontractor();
  const deleteSubcontractor = useDeleteSubcontractor();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubcontractor, setEditingSubcontractor] = useState<Subcontractor | null>(null);
  const [selectedSubbie, setSelectedSubbie] = useState<PastSubbie | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Merge saved subcontractors with past subbies from invites (deduplicated)
  const mergedContacts = useMemo(() => {
    const contactMap = new Map<string, ContactListItem>();

    for (const s of subcontractors) {
      const key = `${s.name.toLowerCase().trim()}-${(s.trade || "").toLowerCase().trim()}`;
      contactMap.set(key, {
        id: s.id,
        name: s.name,
        company_name: s.company_name,
        email: s.email,
        phone: s.phone,
        trade: s.trade,
        notes: s.notes,
        isSaved: true,
      });
    }

    for (const ps of pastSubbies) {
      const key = `${ps.recipient_name.toLowerCase().trim()}-${ps.role.toLowerCase().trim()}`;
      if (!contactMap.has(key)) {
        contactMap.set(key, {
          id: `invite-${key}`,
          name: ps.recipient_name,
          email: ps.recipient_email,
          phone: ps.recipient_phone,
          trade: ps.role,
          isSaved: false,
        });
      }
    }

    return Array.from(contactMap.values());
  }, [subcontractors, pastSubbies]);

  const handleAdd = () => {
    setEditingSubcontractor(null);
    setDialogOpen(true);
  };

  const handleEdit = (contact: ContactListItem) => {
    if (!contact.isSaved) {
      setEditingSubcontractor(null);
      setDialogOpen(true);
      setTimeout(() => {}, 0);
    } else {
      const subcontractor = subcontractors.find((s) => s.id === contact.id);
      if (subcontractor) {
        setEditingSubcontractor(subcontractor);
        setDialogOpen(true);
      }
    }
  };

  const handleDelete = (id: string) => {
    if (!id.startsWith("invite-")) {
      deleteSubcontractor.mutate(id);
    }
  };

  const handleSelect = (contact: ContactListItem) => {
    setSelectedSubbie({
      recipient_name: contact.name,
      role: contact.trade || "",
      recipient_email: contact.email || null,
      recipient_phone: contact.phone || null,
      lastUsed: "",
    });
    setDetailOpen(true);
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

  const isLoading = isLoadingSubcontractors || isLoadingPastSubbies;

  return (
    <>
      <ContactList
        type="subcontractor"
        contacts={mergedContacts}
        isLoading={isLoading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSelect={handleSelect}
        groupBy="trade"
        extraAction={
          <Button asChild variant="outline" size="sm" className="gap-1.5 w-full sm:w-auto">
            <Link to="/admin/directory">
              <Search className="h-4 w-4" />
              Search Directory
            </Link>
          </Button>
        }
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

      <SubbieContactDetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        subbie={selectedSubbie}
      />
    </>
  );
}
