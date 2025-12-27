import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EmployeeLayout } from "@/components/layout/EmployeeLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfilePictureUpload } from "@/components/employees/ProfilePictureUpload";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Phone,
  Shield,
  AlertTriangle,
  Plus,
  Loader2,
  Calendar,
  FileText,
  Pencil,
  Trash2,
  ImageIcon,
  Lock,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { EmployeeTicketFormDialog } from "@/components/employee/EmployeeTicketFormDialog";
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
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles"> & {
  avatar_url?: string | null;
};
type Ticket = Tables<"employee_tickets">;

export default function EmployeeProfile() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [ticketFormOpen, setTicketFormOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [deletingTicket, setDeletingTicket] = useState<Ticket | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [phone, setPhone] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || null);
    };
    loadUser();
  }, []);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["my-profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!userId,
  });

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ["my-tickets", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("employee_tickets")
        .select("*")
        .eq("employee_id", userId)
        .order("expiry_date", { ascending: true });
      if (error) throw error;
      return data as Ticket[];
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (profile) {
      setPhone(profile.phone || "");
      setEmergencyName(profile.emergency_contact_name || "");
      setEmergencyPhone(profile.emergency_contact_phone || "");
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({
          phone: phone || null,
          emergency_contact_name: emergencyName || null,
          emergency_contact_phone: emergencyPhone || null,
        })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      toast({ title: "Profile updated" });
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
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
      toast({ title: "Ticket deleted" });
      setDeletingTicket(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Password updated successfully" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return { label: "No expiry", variant: "secondary" as const };
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (days < 0) return { label: "Expired", variant: "destructive" as const };
    if (days <= 30) return { label: `${days}d left`, variant: "destructive" as const };
    if (days <= 90) return { label: `${days}d left`, variant: "warning" as const };
    return { label: format(new Date(expiryDate), "d MMM yyyy"), variant: "secondary" as const };
  };

  const getInitials = (name: string) => {
    const [first, second] = name.split(" ");
    if (first && second) return `${first[0]}${second[0]}`.toUpperCase();
    return (first?.[0] || "").toUpperCase();
  };

  if (profileLoading) {
    return (
      <EmployeeLayout>
        <div className="space-y-4 pb-20">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-48 w-full" />
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="space-y-4 pb-20">
        <h1 className="text-xl font-bold">My Profile</h1>

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="tickets">Tickets & Licences</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            {/* Profile Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-4">
                  <ProfilePictureUpload
                    userId={userId || ""}
                    currentUrl={profile?.avatar_url}
                    fullName={profile?.full_name || ""}
                    size="lg"
                    editable={true}
                  />
                  <div>
                    <CardTitle>{profile?.full_name}</CardTitle>
                    {profile?.position && (
                      <p className="text-sm text-muted-foreground">{profile.position}</p>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Contact Details */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contact Details
                </CardTitle>
                {!isEditing && (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0400 000 000"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => updateProfile.mutate()}
                        disabled={updateProfile.isPending}
                        className="flex-1"
                      >
                        {updateProfile.isPending && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Phone</span>
                      <span className="text-sm font-medium">{profile?.phone || "—"}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Emergency Contact
                </CardTitle>
                {!isEditing && (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="emergencyName">Contact Name</Label>
                      <Input
                        id="emergencyName"
                        value={emergencyName}
                        onChange={(e) => setEmergencyName(e.target.value)}
                        placeholder="Jane Doe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergencyPhone">Contact Phone</Label>
                      <Input
                        id="emergencyPhone"
                        type="tel"
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                        placeholder="0400 000 000"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Name</span>
                      <span className="text-sm font-medium">
                        {profile?.emergency_contact_name || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Phone</span>
                      <span className="text-sm font-medium">
                        {profile?.emergency_contact_phone || "—"}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Security */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Account Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleChangePassword}
                  disabled={changingPassword || !newPassword || !confirmPassword}
                >
                  {changingPassword ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4 mr-2" />
                  )}
                  Change Password
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
              </p>
              <Button size="sm" onClick={() => setTicketFormOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Ticket
              </Button>
            </div>

            {ticketsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No tickets or licences added yet</p>
                  <Button className="mt-4" onClick={() => setTicketFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Your First Ticket
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => {
                  const status = getExpiryStatus(ticket.expiry_date);
                  return (
                    <Card key={ticket.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{ticket.ticket_type}</span>
                              <Badge
                                variant={status.variant === "warning" ? "outline" : status.variant}
                                className={
                                  status.variant === "warning"
                                    ? "border-yellow-500 text-yellow-600 bg-yellow-500/10"
                                    : ""
                                }
                              >
                                {status.variant === "destructive" && (
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                )}
                                {status.label}
                              </Badge>
                            </div>
                            {ticket.ticket_number && (
                              <p className="text-sm text-muted-foreground mt-1">
                                #{ticket.ticket_number}
                              </p>
                            )}
                            {ticket.document_url && (
                              <a
                                href={ticket.document_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm text-primary mt-2"
                              >
                                <ImageIcon className="h-3.5 w-3.5" />
                                View Document
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingTicket(ticket);
                                setTicketFormOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingTicket(ticket)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Ticket Form Dialog */}
      <EmployeeTicketFormDialog
        open={ticketFormOpen}
        onOpenChange={(open) => {
          setTicketFormOpen(open);
          if (!open) setEditingTicket(null);
        }}
        employeeId={userId || ""}
        editTicket={editingTicket}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingTicket} onOpenChange={() => setDeletingTicket(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {deletingTicket?.ticket_type} ticket. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTicket && deleteTicket.mutate(deletingTicket.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </EmployeeLayout>
  );
}
