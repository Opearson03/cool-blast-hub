import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const pourSchema = z.object({
  pour_name: z.string().min(1, "Pour name is required"),
  pour_date: z.string().optional(),
  scheduled_time: z.string().optional(),
  estimated_m3: z.string().optional(),
  actual_m3: z.string().optional(),
  concrete_supplier: z.string().optional(),
  mpa_strength: z.string().optional(),
  slump: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().default("scheduled"),
});

type PourFormData = z.infer<typeof pourSchema>;

interface PourFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  editPour?: {
    id: string;
    pour_name: string;
    pour_date: string | null;
    scheduled_time: string | null;
    estimated_m3: number | null;
    actual_m3: number | null;
    concrete_supplier: string | null;
    mpa_strength: string | null;
    slump: string | null;
    notes: string | null;
    status: string | null;
  } | null;
}

export function PourFormDialog({
  open,
  onOpenChange,
  jobId,
  editPour,
}: PourFormDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<PourFormData>({
    resolver: zodResolver(pourSchema),
    defaultValues: {
      pour_name: "",
      pour_date: "",
      scheduled_time: "",
      estimated_m3: "",
      actual_m3: "",
      concrete_supplier: "",
      mpa_strength: "",
      slump: "",
      notes: "",
      status: "scheduled",
    },
    values: editPour
      ? {
          pour_name: editPour.pour_name,
          pour_date: editPour.pour_date || "",
          scheduled_time: editPour.scheduled_time?.slice(0, 5) || "",
          estimated_m3: editPour.estimated_m3?.toString() || "",
          actual_m3: editPour.actual_m3?.toString() || "",
          concrete_supplier: editPour.concrete_supplier || "",
          mpa_strength: editPour.mpa_strength || "",
          slump: editPour.slump || "",
          notes: editPour.notes || "",
          status: editPour.status || "scheduled",
        }
      : undefined,
  });

  const mutation = useMutation({
    mutationFn: async (data: PourFormData) => {
      const pourData = {
        job_id: jobId,
        pour_name: data.pour_name,
        pour_date: data.pour_date || null,
        scheduled_time: data.scheduled_time || null,
        estimated_m3: data.estimated_m3 ? parseFloat(data.estimated_m3) : null,
        actual_m3: data.actual_m3 ? parseFloat(data.actual_m3) : null,
        concrete_supplier: data.concrete_supplier || null,
        mpa_strength: data.mpa_strength || null,
        slump: data.slump || null,
        notes: data.notes || null,
        status: data.status,
      };

      if (editPour) {
        const { error } = await supabase
          .from("job_pours")
          .update(pourData)
          .eq("id", editPour.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("job_pours").insert(pourData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-pours", jobId] });
      toast.success(editPour ? "Pour updated" : "Pour created");
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast.error("Failed to save pour");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editPour ? "Edit Pour" : "Add Pour"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <FormField
              control={form.control}
              name="pour_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pour Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Slab Pour 1, Footings" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pour_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pour Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="scheduled_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="estimated_m3"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated m³</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="actual_m3"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actual m³</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="concrete_supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Concrete Supplier</FormLabel>
                  <FormControl>
                    <Input placeholder="Supplier name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mpa_strength"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MPa Strength</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 32" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slump"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slump</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 100mm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : editPour ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
