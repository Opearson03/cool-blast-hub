import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users,
  Building2,
  Truck,
  ChevronRight,
  Phone,
  Mail,
  Search,
  Plus,
  Pencil,
  Trash2,
  MapPin,
} from "lucide-react";
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
import type { ContactType } from "./ContactFormDialog";

export interface ContactListItem {
  id: string;
  name: string;
  company_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  trade?: string | null;
  category?: string | null;
  notes?: string | null;
}

interface ContactListProps {
  type: ContactType;
  contacts: ContactListItem[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (contact: ContactListItem) => void;
  onDelete: (id: string) => void;
  onSelect?: (contact: ContactListItem) => void;
  groupBy?: "trade" | "category";
}

const TYPE_CONFIG = {
  client: {
    emptyIcon: Users,
    emptyText: "No clients yet",
    emptySubtext: "Add clients to quickly prefill their details in quotes",
    searchPlaceholder: "Search clients...",
    addLabel: "Add Client",
    deleteTitle: "Delete Client",
  },
  subcontractor: {
    emptyIcon: Building2,
    emptyText: "No subcontractors yet",
    emptySubtext: "Add your regular subbies for easy scheduling",
    searchPlaceholder: "Search subcontractors...",
    addLabel: "Add Subcontractor",
    deleteTitle: "Delete Subcontractor",
  },
  supplier: {
    emptyIcon: Truck,
    emptyText: "No suppliers yet",
    emptySubtext: "Add supplier contacts for purchase orders",
    searchPlaceholder: "Search suppliers...",
    addLabel: "Add Supplier",
    deleteTitle: "Delete Supplier",
  },
};

export function ContactList({
  type,
  contacts,
  isLoading,
  onAdd,
  onEdit,
  onDelete,
  onSelect,
  groupBy,
}: ContactListProps) {
  const config = TYPE_CONFIG[type];
  const EmptyIcon = config.emptyIcon;
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteContact, setDeleteContact] = useState<ContactListItem | null>(null);

  const filteredContacts = useMemo(() => {
    if (!searchQuery) return contacts;
    const query = searchQuery.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.company_name?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.phone?.includes(query) ||
        c.trade?.toLowerCase().includes(query) ||
        c.category?.toLowerCase().includes(query)
    );
  }, [contacts, searchQuery]);

  const groupedContacts = useMemo(() => {
    if (!groupBy) return null;

    const groups: Record<string, ContactListItem[]> = {};
    for (const contact of filteredContacts) {
      const key = (groupBy === "trade" ? contact.trade : contact.category) || "Other";
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(contact);
    }

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredContacts, groupBy]);

  const handleDelete = (contact: ContactListItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteContact(contact);
  };

  const handleEdit = (contact: ContactListItem, e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(contact);
  };

  const renderContactCard = (contact: ContactListItem) => (
    <div
      key={contact.id}
      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={() => onSelect?.(contact)}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium">{contact.name}</p>
          {contact.company_name && (
            <Badge variant="outline" className="text-xs">
              <Building2 className="h-3 w-3 mr-1" />
              {contact.company_name}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className="flex items-center gap-1 hover:text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="h-3 w-3" />
              {contact.phone}
            </a>
          )}
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="flex items-center gap-1 hover:text-foreground truncate max-w-[200px]"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{contact.email}</span>
            </a>
          )}
          {contact.address && (
            <span className="flex items-center gap-1 truncate max-w-[200px]">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{contact.address}</span>
            </span>
          )}
        </div>
        {contact.notes && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {contact.notes}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => handleEdit(contact, e)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => handleDelete(contact, e)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          {contacts.length > 3 && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={config.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            {config.addLabel}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : contacts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <EmptyIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">{config.emptyText}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {config.emptySubtext}
              </p>
            </CardContent>
          </Card>
        ) : filteredContacts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No matches found
            </CardContent>
          </Card>
        ) : groupedContacts ? (
          <div className="space-y-6">
            {groupedContacts.map(([group, groupContacts]) => (
              <div key={group}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-sm">
                    {group}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ({groupContacts.length})
                  </span>
                </div>
                <div className="grid gap-2">
                  {groupContacts.map(renderContactCard)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-2">
            {filteredContacts.map(renderContactCard)}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteContact} onOpenChange={(open) => !open && setDeleteContact(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{config.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteContact?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteContact) onDelete(deleteContact.id);
                setDeleteContact(null);
              }}
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
