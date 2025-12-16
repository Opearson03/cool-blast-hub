import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, CheckCircle, AlertTriangle } from "lucide-react";
import { differenceInDays, isPast, format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Tables } from "@/integrations/supabase/types";

type Equipment = Tables<"equipment">;

interface JobEquipmentTabProps {
  jobId: string;
}

type ServiceStatus = "ok" | "due-soon" | "overdue" | "unknown";

interface EquipmentWithUsage extends Equipment {
  usageCount: number;
  pourDetails: Array<{
    pourId: string;
    pourName: string;
    pourDate: string | null;
  }>;
}

function getServiceStatus(equipment: Equipment): ServiceStatus {
  if (!equipment.next_service_date) return "unknown";
  const nextService = new Date(equipment.next_service_date);
  const daysUntilService = differenceInDays(nextService, new Date());
  if (isPast(nextService)) return "overdue";
  if (daysUntilService <= 14) return "due-soon";
  return "ok";
}

function ServiceStatusBadge({ status }: { status: ServiceStatus }) {
  switch (status) {
    case "ok":
      return (
        <Badge className="bg-success/20 text-success border-success/30">
          <CheckCircle className="w-3 h-3 mr-1" />
          OK
        </Badge>
      );
    case "due-soon":
      return (
        <Badge className="bg-warning/20 text-warning border-warning/30">
          <AlertTriangle className="w-3 h-3 mr-1" />
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
      return <Badge variant="secondary">No Schedule</Badge>;
  }
}

export function JobEquipmentTab({ jobId }: JobEquipmentTabProps) {
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentWithUsage | null>(null);

  // Fetch all pours for this job and their equipment assignments
  const { data: equipmentData = [], isLoading } = useQuery({
    queryKey: ["job-equipment", jobId],
    queryFn: async () => {
      // Get all pours for this job
      const { data: pours, error: poursError } = await supabase
        .from("job_pours")
        .select("id, pour_name, pour_date")
        .eq("job_id", jobId);
      if (poursError) throw poursError;

      if (!pours || pours.length === 0) return [];

      const pourIds = pours.map((p) => p.id);

      // Get equipment assignments for these pours
      const { data: pourEquipment, error: peError } = await supabase
        .from("pour_equipment")
        .select(`
          pour_id,
          equipment:equipment_id (*)
        `)
        .in("pour_id", pourIds);
      if (peError) throw peError;

      // Aggregate equipment with usage counts
      const equipmentMap = new Map<string, EquipmentWithUsage>();

      pourEquipment?.forEach((pe) => {
        const eq = pe.equipment as Equipment | null;
        if (!eq || !eq.id) return;

        const pour = pours.find((p) => p.id === pe.pour_id);
        if (!pour) return;

        if (equipmentMap.has(eq.id)) {
          const existing = equipmentMap.get(eq.id)!;
          existing.usageCount++;
          existing.pourDetails.push({
            pourId: pour.id,
            pourName: pour.pour_name,
            pourDate: pour.pour_date,
          });
        } else {
          equipmentMap.set(eq.id, {
            ...eq,
            usageCount: 1,
            pourDetails: [
              {
                pourId: pour.id,
                pourName: pour.pour_name,
                pourDate: pour.pour_date,
              },
            ],
          });
        }
      });

      return Array.from(equipmentMap.values());
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">Loading equipment...</div>
    );
  }

  if (equipmentData.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Wrench className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No Equipment Assigned</h3>
          <p className="text-muted-foreground">
            Assign equipment to pours in the Pours tab.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Assigned Equipment ({equipmentData.length})</h3>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Equipment</TableHead>
              <TableHead className="hidden sm:table-cell">Serial #</TableHead>
              <TableHead>Used in</TableHead>
              <TableHead>Service Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipmentData.map((equipment) => {
              const status = getServiceStatus(equipment);
              return (
                <TableRow
                  key={equipment.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedEquipment(equipment)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{equipment.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {equipment.serial_number || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {equipment.usageCount} {equipment.usageCount === 1 ? "pour" : "pours"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ServiceStatusBadge status={status} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Equipment Detail Dialog */}
      <Dialog open={!!selectedEquipment} onOpenChange={() => setSelectedEquipment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              {selectedEquipment?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedEquipment?.serial_number && (
              <div>
                <p className="text-sm text-muted-foreground">Serial Number</p>
                <p className="font-medium">{selectedEquipment.serial_number}</p>
              </div>
            )}
            {selectedEquipment && (
              <div>
                <p className="text-sm text-muted-foreground">Service Status</p>
                <div className="mt-1">
                  <ServiceStatusBadge status={getServiceStatus(selectedEquipment)} />
                </div>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Used in {selectedEquipment?.usageCount} {selectedEquipment?.usageCount === 1 ? "pour" : "pours"}
              </p>
              <div className="space-y-2">
                {selectedEquipment?.pourDetails.map((pour) => (
                  <div
                    key={pour.pourId}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                  >
                    <span className="font-medium">{pour.pourName}</span>
                    <span className="text-sm text-muted-foreground">
                      {pour.pourDate
                        ? format(new Date(pour.pourDate), "MMM d, yyyy")
                        : "Not scheduled"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
