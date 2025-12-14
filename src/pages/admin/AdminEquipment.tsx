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
import { Plus, Search, Pencil, Trash2, Wrench, AlertTriangle, CheckCircle } from "lucide-react";
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
  const [formOpen, setFormOpen] = useState(false);
  const [editEquipment, setEditEquipment] = useState<Equipment | null>(null);
  const [deleteEquipment, setDeleteEquipment] = useState<Equipment | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: equipment, isLoading } = useQuery({
    queryKey: ["equipment"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", userData.user?.id)
        .single();

      const { data, error } = await supabase
        .from("equipment")
        .select("*")
        .eq("business_id", profile?.business_id)
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

  const filteredEquipment = equipment?.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.serial_number?.toLowerCase().includes(search.toLowerCase())
  );

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
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Total Items</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-success">{stats.ok}</div>
              <p className="text-sm text-muted-foreground">Service OK</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-warning">{stats.dueSoon}</div>
              <p className="text-sm text-muted-foreground">Due Soon</p>
            </CardContent>
          </Card>
          <Card>
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
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Serial #</TableHead>
                  <TableHead className="hidden md:table-cell">Last Service</TableHead>
                  <TableHead>Service Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipment?.map((item) => {
                  const status = getServiceStatus(item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground md:hidden">
                            {item.serial_number || "—"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {item.serial_number || "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
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
                            onClick={() => handleEdit(item)}
                            className="touch-target"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteEquipment(item)}
                            className="touch-target text-destructive hover:text-destructive"
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
