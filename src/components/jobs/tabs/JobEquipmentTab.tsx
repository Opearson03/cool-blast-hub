import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wrench, Plus, CheckCircle, AlertTriangle } from "lucide-react";
import { differenceInDays, isPast } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Equipment = Tables<"equipment">;
type JobEquipment = Tables<"job_equipment">;

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

export function JobEquipmentTab({ jobId }: JobEquipmentTabProps) {
  const { data: jobEquipment = [], isLoading } = useQuery({
    queryKey: ["job-equipment", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_equipment")
        .select(`
          id,
          equipment_id,
          equipment:equipment_id (*)
        `)
        .eq("job_id", jobId);
      if (error) throw error;
      return data as (JobEquipment & { equipment: Equipment })[];
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
          <p className="text-muted-foreground mb-4">
            Assign equipment and plant to this job
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Assign Equipment
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Assigned Equipment</h3>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Assign Equipment
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {jobEquipment.map(({ id, equipment }) => {
          const status = getServiceStatus(equipment);
          return (
            <Card key={id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Wrench className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{equipment.name}</p>
                      {equipment.serial_number && (
                        <p className="text-sm text-muted-foreground">
                          S/N: {equipment.serial_number}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    {status === "ok" && (
                      <Badge className="bg-success/20 text-success border-success/30">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        OK
                      </Badge>
                    )}
                    {status === "due-soon" && (
                      <Badge className="bg-warning/20 text-warning border-warning/30">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Due Soon
                      </Badge>
                    )}
                    {status === "overdue" && (
                      <Badge variant="destructive">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Overdue
                      </Badge>
                    )}
                    {status === "unknown" && (
                      <Badge variant="secondary">No Schedule</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
