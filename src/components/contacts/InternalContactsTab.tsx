import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { InternalContactDetailSheet } from "./InternalContactDetailSheet";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreVertical, Pencil, Trash2, Phone, Mail, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ContactFormDialog, ContactType } from "./ContactFormDialog";

interface InternalContact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: string | null;
  notes: string | null;
  created_at: string;
}

export function InternalContactsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<InternalContact | null>(null);
  const [selectedContact, setSelectedContact] = useState<InternalContact | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: businessData } = useQuery({
    queryKey: ["user-business"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.business_id) return null;

      const { data: business } = await supabase
        .from("businesses")
        .select("id, name")
        .eq("id", profile.business_id)
        .maybeSingle();

      return business;
    },
  });

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["internal-contacts", businessData?.id],
    queryFn: async () => {
      if (!businessData?.id) return [];

      const { data, error } = await supabase
        .from("internal_contacts")
        .select("*")
        .eq("business_id", businessData.id)
        .order("name");

      if (error) throw error;
      return data as InternalContact[];
    },
    enabled: !!businessData?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: {
      id?: string;
      name: string;
      phone?: string;
      email?: string;
      trade?: string; // maps to role
      notes?: string;
    }) => {
      if (!businessData?.id) throw new Error("No business found");

      const contactData = {
        name: formData.name,
        phone: formData.phone || null,
        email: formData.email || null,
        role: formData.trade || null,
        notes: formData.notes || null,
      };

      if (formData.id) {
        const { error } = await supabase
          .from("internal_contacts")
          .update(contactData)
          .eq("id", formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("internal_contacts")
          .insert({ ...contactData, business_id: businessData.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: editingContact ? "Contact updated" : "Contact added",
        description: "Internal contact saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["internal-contacts"] });
      setIsFormOpen(false);
      setEditingContact(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("internal_contacts")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Contact deleted",
        description: "Internal contact removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["internal-contacts"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (contact: InternalContact) => {
    setEditingContact(contact);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search internal contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Internal Contact
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredContacts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No internal contacts</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add site contacts, project managers, or other internal team members.
            </p>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Contact
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {filteredContacts.length} Internal Contact{filteredContacts.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Role</TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow 
                    key={contact.id} 
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={() => {
                      setSelectedContact(contact);
                      setDetailOpen(true);
                    }}
                  >
                    <TableCell>
                      <div className="font-medium">{contact.name}</div>
                      {contact.role && (
                        <Badge variant="secondary" className="mt-1 sm:hidden">
                          {contact.role}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {contact.role ? (
                        <Badge variant="outline">{contact.role}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-col gap-1 text-sm">
                        {contact.phone && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </div>
                        )}
                        {contact.email && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </div>
                        )}
                        {!contact.phone && !contact.email && (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(contact)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(contact.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <ContactFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingContact(null);
        }}
        type="internal"
        initialData={editingContact ? {
          id: editingContact.id,
          name: editingContact.name,
          email: editingContact.email || "",
          phone: editingContact.phone || "",
          trade: editingContact.role || "",
          notes: editingContact.notes || "",
          company_name: businessData?.name || "",
        } : {
          name: "",
          company_name: businessData?.name || "",
        }}
        onSave={async (data) => {
          await saveMutation.mutateAsync(data);
        }}
        isPending={saveMutation.isPending}
      />
      <InternalContactDetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        contact={selectedContact}
      />
    </div>
  );
}
