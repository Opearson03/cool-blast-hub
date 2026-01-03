import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EquipmentFormDialog } from "@/components/equipment/EquipmentFormDialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, Wrench, AlertTriangle, CheckCircle, RotateCcw, Calendar } from "lucide-react";
import { format, differenceInDays, isPast, addDays } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Equipment = Tables<"equipment">;

type ServiceStatus = "ok" | "due-soon" | "overdue" | "unknown";

function getServiceStatus(equipment: Equipment): ServiceStatus {
  if (!equipment.next_service_date) return "unknown";
  
  const nextService = new Date(equipment.next_service_date);
  const today = new Date();
  const daysUntilService = differenceInDays(nextService, today);

  if (isPast(nextService)) return "overdue";
  if (daysUntilService <= 14) return "due-soon";
  return "ok";
}

function ServiceStatusBadge({ status }: { status: ServiceStatus }) {
  switch (status) {
    case "ok":
      return (
        <Badge className="bg-success/20 text-success border-success/30 hover:bg-success/30">
          <CheckCircle className="w-3 h-3 mr-1" />
          OK
        </Badge>
      );
    case "due-soon":
      return (
        <Badge className="bg-warning/20 text-warning border-warning/30 hover:bg-warning/30">
          <Wrench className="w-3 h-3 mr-1" />
          Due Soon
        </Badge>
      );
    case "overdue":
      return (
        <Badge variant="destructive">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Overdue
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          No Schedule
        </Badge>
      );
  }
}

export default function AdminEquipment() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editEquipment, setEditEquipment] = useState<Equipment | null>(null);
  const [deleteEquipment, setDeleteEquipment] = useState<Equipment | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: equipment, isLoading } = useQuery({
    queryKey: ["equipment"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        throw new Error("You must be logged in to view equipment");
      }

      // Try to resolve business from profile first (staff users)
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", userId)
        .maybeSingle();

      let businessId = profile?.business_id as string | null | undefined;

      // If no profile business found, fall back to business where user is the owner (admin users)
      if (!businessId) {
        const { data: business } = await supabase
          .from("businesses")
          .select("id")
          .eq("owner_id", userId)
          .maybeSingle();

        businessId = business?.id;
      }

      if (!businessId) {
        throw new Error("Could not find your business record. Please contact support.");
      }

      const { data, error } = await supabase
        .from("equipment")
        .select("*")
        .eq("business_id", businessId)
        .order("name");

      if (error) throw error;
      return data as Equipment[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("equipment").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast({ title: "Equipment deleted" });
      setDeleteEquipment(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const serviceMutation = useMutation({
    mutationFn: async (item: Equipment) => {
      const today = new Date();
      const nextServiceDate = item.service_interval_days 
        ? addDays(today, item.service_interval_days)
        : null;
      
      const { error } = await supabase
        .from("equipment")
        .update({
          last_service_date: format(today, "yyyy-MM-dd"),
          next_service_date: nextServiceDate ? format(nextServiceDate, "yyyy-MM-dd") : null,
        })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast({ title: "Equipment marked as serviced" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredEquipment = equipment?.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.serial_number?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || getServiceStatus(item) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (item: Equipment) => {
    setEditEquipment(item);
    setFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditEquipment(null);
  };

  // Stats
  const stats = {
    total: equipment?.length || 0,
    ok: equipment?.filter((e) => getServiceStatus(e) === "ok").length || 0,
    dueSoon: equipment?.filter((e) => getServiceStatus(e) === "due-soon").length || 0,
    overdue: equipment?.filter((e) => getServiceStatus(e) === "overdue").length || 0,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Equipment Register</h1>
            <p className="text-muted-foreground">Manage plant and equipment</p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="touch-target">
            <Plus className="w-4 h-4 mr-2" />
            Add Equipment
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card
            className={`cursor-pointer transition-colors hover:border-primary/50 ${statusFilter === "all" ? "ring-2 ring-primary" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Total Items</p>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-colors hover:border-success/50 ${statusFilter === "ok" ? "ring-2 ring-success" : ""}`}
            onClick={() => setStatusFilter("ok")}
          >
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-success">{stats.ok}</div>
              <p className="text-sm text-muted-foreground">Service OK</p>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-colors hover:border-warning/50 ${statusFilter === "due-soon" ? "ring-2 ring-warning" : ""}`}
            onClick={() => setStatusFilter("due-soon")}
          >
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-warning">{stats.dueSoon}</div>
              <p className="text-sm text-muted-foreground">Due Soon</p>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-colors hover:border-destructive/50 ${statusFilter === "overdue" ? "ring-2 ring-destructive" : ""}`}
            onClick={() => setStatusFilter("overdue")}
          >
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
              <p className="text-sm text-muted-foreground">Overdue</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search equipment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 touch-target"
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : filteredEquipment?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Wrench className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No equipment found</h3>
              <p className="text-muted-foreground mb-4">
                {search ? "Try a different search term" : "Add your first equipment item"}
              </p>
              {!search && (
                <Button onClick={() => setFormOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Equipment
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Mobile: Card layout */}
            <div className="sm:hidden space-y-3">
              {filteredEquipment?.map((item) => {
                const status = getServiceStatus(item);
                return (
                  <Card key={item.id}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <h4 className="font-semibold truncate">{item.name}</h4>
                          {item.serial_number && (
                            <p className="text-sm text-muted-foreground">S/N: {item.serial_number}</p>
                          )}
                        </div>
                        <ServiceStatusBadge status={status} />
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        {item.last_service_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Last: {format(new Date(item.last_service_date), "d MMM yyyy")}</span>
                          </div>
                        )}
                        {item.next_service_date && status !== "unknown" && (
                          <span className={status === "overdue" ? "text-destructive" : status === "due-soon" ? "text-warning" : ""}>
                            {status === "overdue" ? "Was due" : "Due"}: {format(new Date(item.next_service_date), "d MMM")}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-1 pt-2 border-t border-border/50">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => serviceMutation.mutate(item)}
                          disabled={serviceMutation.isPending}
                          className="text-success hover:text-success"
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Service
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteEquipment(item)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Desktop: Table layout */}
            <Card className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Serial #</TableHead>
                    <TableHead>Last Service</TableHead>
                    <TableHead>Service Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEquipment?.map((item) => {
                    const status = getServiceStatus(item);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.serial_number || "—"}</TableCell>
                        <TableCell>
                          {item.last_service_date
                            ? format(new Date(item.last_service_date), "dd MMM yyyy")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <ServiceStatusBadge status={status} />
                          {item.next_service_date && status !== "unknown" && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {status === "overdue"
                                ? `Was due ${format(new Date(item.next_service_date), "dd MMM")}`
                                : `Due ${format(new Date(item.next_service_date), "dd MMM")}`}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => serviceMutation.mutate(item)}
                              disabled={serviceMutation.isPending}
                              className="text-success hover:text-success hover:bg-success/10"
                              title="Mark as Serviced"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(item)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteEquipment(item)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </>
        )}
      </div>

      {/* Form Dialog */}
      <EquipmentFormDialog
        open={formOpen}
        onOpenChange={handleFormClose}
        editEquipment={editEquipment}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteEquipment} onOpenChange={() => setDeleteEquipment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Equipment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteEquipment?.name}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="touch-target">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteEquipment && deleteMutation.mutate(deleteEquipment.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 touch-target"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
