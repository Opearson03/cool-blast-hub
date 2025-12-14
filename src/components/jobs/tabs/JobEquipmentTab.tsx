import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, CheckCircle, AlertTriangle } from "lucide-react";
import { differenceInDays, isPast } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Tables } from "@/integrations/supabase/types";

type Equipment = Tables<"equipment">;

interface JobEquipmentTabProps {
  jobId: string;
}

type ServiceStatus = "ok" | "due-soon" | "overdue" | "unknown";

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
  const { data: jobEquipment = [], isLoading } = useQuery({
    queryKey: ["job-equipment", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_equipment")
        .select(`
          id,
          equipment:equipment_id (
            id,
            name,
            serial_number,
            status,
            next_service_date
          )
        `)
        .eq("job_id", jobId);
      if (error) throw error;
      return data as Array<{ id: string; equipment: Equipment }>;
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">Loading equipment...</div>
    );
  }

  if (jobEquipment.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Wrench className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No Equipment Assigned</h3>
          <p className="text-muted-foreground">
            No equipment has been assigned to this job yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Assigned Equipment ({jobEquipment.length})</h3>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Equipment</TableHead>
              <TableHead className="hidden sm:table-cell">Serial #</TableHead>
              <TableHead>Service Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobEquipment.map(({ id, equipment }) => {
              const status = getServiceStatus(equipment);
              return (
                <TableRow key={id}>
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
                    <ServiceStatusBadge status={status} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
