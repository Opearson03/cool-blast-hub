import { useState } from "react";
import { useClients, useCreateClient, useUpdateClient, useDeleteClient, Client } from "@/hooks/useClients";
import { ContactList, ContactListItem } from "./ContactList";
import { ContactFormDialog } from "./ContactFormDialog";

export function ClientsTab() {
  const { data: clients = [], isLoading } = useClients();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const handleAdd = () => {
    setEditingClient(null);
    setDialogOpen(true);
  };

  const handleEdit = (contact: ContactListItem) => {
    const client = clients.find((c) => c.id === contact.id);
    if (client) {
      setEditingClient(client);
      setDialogOpen(true);
    }
  };

  const handleDelete = (id: string) => {
    deleteClient.mutate(id);
  };

  const handleSave = async (data: any) => {
    if (editingClient?.id) {
      await updateClient.mutateAsync({
        id: editingClient.id,
        name: data.name,
        company_name: data.company_name || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        notes: data.notes || null,
      });
    } else {
      await createClient.mutateAsync({
        name: data.name,
        company_name: data.company_name || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        notes: data.notes || null,
      });
    }
    setDialogOpen(false);
    setEditingClient(null);
  };

  const contactList: ContactListItem[] = clients.map((c) => ({
    id: c.id,
    name: c.name,
    company_name: c.company_name,
    email: c.email,
    phone: c.phone,
    address: c.address,
    notes: c.notes,
  }));

  return (
    <>
      <ContactList
        type="client"
        contacts={contactList}
        isLoading={isLoading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ContactFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingClient(null);
        }}
        type="client"
        initialData={editingClient ? {
          id: editingClient.id,
          name: editingClient.name,
          company_name: editingClient.company_name || undefined,
          email: editingClient.email || undefined,
          phone: editingClient.phone || undefined,
          address: editingClient.address || undefined,
          notes: editingClient.notes || undefined,
        } : undefined}
        onSave={handleSave}
        isPending={createClient.isPending || updateClient.isPending}
      />
    </>
  );
}
