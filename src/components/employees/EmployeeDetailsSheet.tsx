import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays, isPast } from "date-fns";
import { Phone, Pencil, Plus, Trash2, AlertTriangle, Check, Loader2, FileImage } from "lucide-react";
import { TicketFormDialog } from "./TicketFormDialog";
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

type Employee = {
  id: string;
  full_name: string;
  phone: string | null;
  position: string | null;
  hourly_rate: number | null;
  avatar_url?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
};

type Ticket = {
  id: string;
  employee_id: string;
  ticket_type: string;
  ticket_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  notes: string | null;
  document_url: string | null;
};

interface EmployeeDetailsSheetProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmployeeDetailsSheet({ employee, open, onOpenChange }: EmployeeDetailsSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ phone: "", position: "", hourly_rate: "" });
  const [isTicketFormOpen, setIsTicketFormOpen] = useState(false);
  const [editTicket, setEditTicket] = useState<Ticket | null>(null);
  const [deleteTicketId, setDeleteTicketId] = useState<string | null>(null);
  const [viewingTicketPhoto, setViewingTicketPhoto] = useState<Ticket | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tickets = [] } = useQuery({
    queryKey: ["employee-tickets", employee?.id],
    queryFn: async () => {
      if (!employee) return [];
      const { data, error } = await supabase
        .from("employee_tickets")
        .select("*")
        .eq("employee_id", employee.id)
        .order("expiry_date", { ascending: true });
      if (error) throw error;
      return data as Ticket[];
    },
    enabled: !!employee,
  });

  const updateEmployee = useMutation({
    mutationFn: async () => {
      if (!employee) return;
      const { error } = await supabase
        .from("profiles")
        .update({
          phone: editData.phone || null,
          position: editData.position || null,
          hourly_rate: editData.hourly_rate ? parseFloat(editData.hourly_rate) : null,
        })
        .eq("id", employee.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast({ title: "Employee updated" });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteTicket = useMutation({
    mutationFn: async (ticketId: string) => {
      const { error } = await supabase.from("employee_tickets").delete().eq("id", ticketId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-tickets"] });
      toast({ title: "Ticket deleted" });
      setDeleteTicketId(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (isPast(new Date(expiryDate))) return "expired";
    if (days <= 30) return "expiring";
    return "valid";
  };

  const handleStartEdit = () => {
    if (employee) {
      setEditData({
        phone: employee.phone || "",
        position: employee.position || "",
        hourly_rate: employee.hourly_rate?.toString() || "",
      });
      setIsEditing(true);
    }
  };

  if (!employee) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={employee.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {employee.full_name.split(" ").map(n => n[0]).join("").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <SheetTitle className="text-xl">{employee.full_name}</SheetTitle>
            </div>
          </SheetHeader>

          <Tabs defaultValue="details" className="mt-4">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="tickets">Tickets</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      placeholder="0400 000 000"
                      className="touch-target"
                    />
                  </div>
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={editData.position}
                      onChange={(e) => setEditData({ ...editData, position: e.target.value })}
                      placeholder="e.g., Concreter, Supervisor"
                      className="touch-target"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                    <Input
                      id="hourly_rate"
                      type="number"
                      step="0.01"
                      value={editData.hourly_rate}
                      onChange={(e) => setEditData({ ...editData, hourly_rate: e.target.value })}
                      placeholder="0.00"
                      className="touch-target"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 touch-target"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => updateEmployee.mutate()}
                      disabled={updateEmployee.isPending}
                      className="flex-1 touch-target"
                    >
                      {updateEmployee.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {employee.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{employee.phone}</span>
                      </div>
                    )}
                    {employee.position && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">Position</p>
                        <p className="font-medium">{employee.position}</p>
                      </div>
                    )}
                    {employee.hourly_rate && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">Hourly Rate</p>
                        <p className="font-medium">${employee.hourly_rate.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                  <Button variant="outline" onClick={handleStartEdit} className="w-full touch-target">
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Details
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="tickets" className="space-y-4 mt-4">
              <Button
                onClick={() => {
                  setEditTicket(null);
                  setIsTicketFormOpen(true);
                }}
                className="w-full touch-target"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Ticket/Certification
              </Button>

              {tickets.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No tickets or certifications recorded.
                </p>
              ) : (
                <div className="space-y-3">
                  {tickets.map((ticket) => {
                    const status = getExpiryStatus(ticket.expiry_date);
                    return (
                      <div
                        key={ticket.id}
                        className="p-3 border rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{ticket.ticket_type}</p>
                            {ticket.ticket_number && (
                              <p className="text-sm text-muted-foreground">
                                #{ticket.ticket_number}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {ticket.document_url && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary"
                                onClick={() => setViewingTicketPhoto(ticket)}
                                title="View photo"
                              >
                                <FileImage className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditTicket(ticket);
                                setIsTicketFormOpen(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => setDeleteTicketId(ticket.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {ticket.expiry_date && (
                          <div className="mt-2">
                            <Badge
                              variant={status === "valid" ? "secondary" : "destructive"}
                              className="text-xs"
                            >
                              {status === "expired" && <AlertTriangle className="w-3 h-3 mr-1" />}
                              {status === "valid" && <Check className="w-3 h-3 mr-1" />}
                              Expires: {format(new Date(ticket.expiry_date), "d MMM yyyy")}
                            </Badge>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Ticket Form Dialog */}
      <TicketFormDialog
        open={isTicketFormOpen}
        onOpenChange={setIsTicketFormOpen}
        employeeId={employee.id}
        editTicket={editTicket}
      />

      {/* Delete Ticket Confirmation */}
      <AlertDialog open={!!deleteTicketId} onOpenChange={(open) => !open && setDeleteTicketId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this ticket/certification?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTicketId && deleteTicket.mutate(deleteTicketId)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Ticket Photo Dialog */}
      <Dialog open={!!viewingTicketPhoto} onOpenChange={(open) => !open && setViewingTicketPhoto(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingTicketPhoto?.ticket_type}</DialogTitle>
          </DialogHeader>
          {viewingTicketPhoto?.document_url && (
            <div className="flex justify-center">
              <img
                src={viewingTicketPhoto.document_url}
                alt={viewingTicketPhoto.ticket_type}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
