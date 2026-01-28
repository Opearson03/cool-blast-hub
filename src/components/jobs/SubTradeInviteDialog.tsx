import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSendSubTradeInvite } from "@/hooks/useSubTradeInvites";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Send, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const ROLES = [
  { value: "Pump Operator", label: "Pump Operator" },
  { value: "Digger/Excavation", label: "Digger / Excavation" },
  { value: "Concrete Testing", label: "Concrete Testing" },
  { value: "Finisher", label: "Finisher" },
  { value: "Other", label: "Other" },
];

const formSchema = z
  .object({
    recipient_name: z.string().min(1, "Name is required").max(100),
    role: z.string().min(1, "Role is required"),
    custom_role: z.string().optional(),
    recipient_phone: z.string().optional(),
    recipient_email: z.string().email("Invalid email").optional().or(z.literal("")),
    notes: z.string().max(500).optional(),
  })
  .refine(
    (data) => data.recipient_phone || data.recipient_email,
    {
      message: "At least one contact method is required",
      path: ["recipient_phone"],
    }
  );

type FormData = z.infer<typeof formSchema>;

interface SubTradeInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  pourId: string;
  pourName: string;
  pourDate: string | null;
}

export function SubTradeInviteDialog({
  open,
  onOpenChange,
  jobId,
  pourId,
  pourName,
  pourDate,
}: SubTradeInviteDialogProps) {
  const [selectedRole, setSelectedRole] = useState("");
  const sendInvite = useSendSubTradeInvite();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipient_name: "",
      role: "",
      custom_role: "",
      recipient_phone: "",
      recipient_email: "",
      notes: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    const role = data.role === "Other" && data.custom_role ? data.custom_role : data.role;

    try {
      await sendInvite.mutateAsync({
        job_pour_id: pourId,
        recipient_name: data.recipient_name,
        role,
        recipient_phone: data.recipient_phone || undefined,
        recipient_email: data.recipient_email || undefined,
        notes: data.notes || undefined,
      });

      toast.success("Invite sent successfully");
      form.reset();
      setSelectedRole("");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send invite");
    }
  };

  const watchRole = form.watch("role");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Sub-Trade</DialogTitle>
          <DialogDescription>
            For: {pourName}
            {pourDate && ` — ${format(new Date(pourDate), "EEE, d MMMM")}`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="recipient_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Mike's Pumping" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role *</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedRole(value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchRole === "Other" && (
              <FormField
                control={form.control}
                name="custom_role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specify Role</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Formwork" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="recipient_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      Phone
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="0412 345 678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recipient_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="contact@company.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              At least one contact method is required. SMS and/or email will be sent based on what
              you provide.
            </p>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Access instructions, timing, site constraints..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={sendInvite.isPending}>
                {sendInvite.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Invite
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
