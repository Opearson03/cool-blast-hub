import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Pencil, 
  Check, 
  X,
  Briefcase,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { SubTradeStatusBadge } from "@/components/jobs/SubTradeStatusBadge";
import { ScheduleSubbieDialog } from "@/components/schedule/ScheduleSubbieDialog";
import { toast } from "sonner";
import type { PastSubbie } from "@/hooks/useBusinessSubbies";
import type { SubTradeInvite } from "@/hooks/useSubTradeInvites";

interface SubbieContactDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subbie: PastSubbie | null;
}

const contactSchema = z.object({
  recipient_phone: z.string().optional(),
  recipient_email: z.string().email("Invalid email").optional().or(z.literal("")),
}).refine(
  (data) => data.recipient_phone || data.recipient_email,
  {
    message: "At least one contact method is required",
    path: ["recipient_phone"],
  }
);

type ContactFormData = z.infer<typeof contactSchema>;

export function SubbieContactDetailSheet({ 
  open, 
  onOpenChange, 
  subbie 
}: SubbieContactDetailSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      recipient_phone: subbie?.recipient_phone || "",
      recipient_email: subbie?.recipient_email || "",
    },
  });

  // Reset form when subbie changes
  useState(() => {
    if (subbie) {
      form.reset({
        recipient_phone: subbie.recipient_phone || "",
        recipient_email: subbie.recipient_email || "",
      });
    }
  });

  // Fetch all invites for this subbie across all jobs
  const { data: allInvites = [], isLoading: isLoadingInvites } = useQuery({
    queryKey: ["subbie-all-invites", subbie?.recipient_name, subbie?.role],
    enabled: open && !!subbie,
    queryFn: async () => {
      if (!subbie) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!profile?.business_id) return [];

      const { data, error } = await supabase
        .from("external_invites")
        .select(`
          *,
          job:jobs!inner(id, name, site_address, job_number),
          pour:job_pours!inner(id, pour_name, pour_date, scheduled_time)
        `)
        .eq("business_id", profile.business_id)
        .eq("invite_type", "sub_trade")
        .ilike("recipient_name", subbie.recipient_name)
        .ilike("role", subbie.role)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as (SubTradeInvite & { 
        job: { id: string; name: string; site_address: string; job_number: string | null };
        pour: { id: string; pour_name: string; pour_date: string | null; scheduled_time: string | null };
      })[];
    },
  });

  // Mutation to update contact details across all invites for this subbie
  const updateContactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      if (!subbie) throw new Error("No subbie selected");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!profile?.business_id) throw new Error("No business");

      // Update all invites for this subbie
      const { error } = await supabase
        .from("external_invites")
        .update({
          recipient_phone: data.recipient_phone || null,
          recipient_email: data.recipient_email || null,
        })
        .eq("business_id", profile.business_id)
        .ilike("recipient_name", subbie.recipient_name)
        .ilike("role", subbie.role);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contact details updated");
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["business-subbies"] });
      queryClient.invalidateQueries({ queryKey: ["subbie-all-invites"] });
    },
    onError: (error) => {
      toast.error("Failed to update contact details");
      console.error(error);
    },
  });

  const handleSaveContact = (data: ContactFormData) => {
    updateContactMutation.mutate(data);
  };

  const handleCancelEdit = () => {
    form.reset({
      recipient_phone: subbie?.recipient_phone || "",
      recipient_email: subbie?.recipient_email || "",
    });
    setIsEditing(false);
  };

  // Separate upcoming and past jobs
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingJobs = allInvites.filter(
    (inv) => inv.pour?.pour_date && new Date(inv.pour.pour_date) >= today
  );
  const pastJobs = allInvites.filter(
    (inv) => !inv.pour?.pour_date || new Date(inv.pour.pour_date) < today
  );

  if (!subbie) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {subbie.recipient_name}
              <Badge variant="secondary">{subbie.role}</Badge>
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Contact Details Card */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-sm">Contact Details</h3>
                  {!isEditing ? (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={form.handleSubmit(handleSaveContact)}
                        disabled={updateContactMutation.isPending}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <Form {...form}>
                    <form className="space-y-3">
                      <FormField
                        control={form.control}
                        name="recipient_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Phone</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="04XX XXX XXX" 
                                {...field} 
                                className="h-9"
                              />
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
                            <FormLabel className="text-xs">Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email"
                                placeholder="email@example.com" 
                                {...field} 
                                className="h-9"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                ) : (
                  <div className="space-y-2">
                    {subbie.recipient_phone ? (
                      <a
                        href={`tel:${subbie.recipient_phone}`}
                        className="flex items-center gap-2 text-sm hover:text-primary"
                      >
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {subbie.recipient_phone}
                      </a>
                    ) : (
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        No phone
                      </p>
                    )}
                    {subbie.recipient_email ? (
                      <a
                        href={`mailto:${subbie.recipient_email}`}
                        className="flex items-center gap-2 text-sm hover:text-primary"
                      >
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {subbie.recipient_email}
                      </a>
                    ) : (
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        No email
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assign to Job Button */}
            <Button 
              className="w-full" 
              onClick={() => setAssignDialogOpen(true)}
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Assign to a Job
            </Button>

            <Separator />

            {/* Upcoming Jobs */}
            <div>
              <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Upcoming Jobs ({upcomingJobs.length})
              </h3>
              {isLoadingInvites ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                </div>
              ) : upcomingJobs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming jobs</p>
              ) : (
                <div className="space-y-2">
                  {upcomingJobs.map((invite) => (
                    <Card key={invite.id}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">
                              {invite.pour?.pour_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {invite.job?.name}
                              {invite.job?.job_number && ` • ${invite.job.job_number}`}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              {invite.pour?.pour_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(invite.pour.pour_date), "EEE, d MMM")}
                                </span>
                              )}
                              {invite.pour?.scheduled_time && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {invite.pour.scheduled_time.slice(0, 5)}
                                </span>
                              )}
                            </div>
                            {invite.job?.site_address && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">{invite.job.site_address.split(",")[0]}</span>
                              </p>
                            )}
                          </div>
                          <SubTradeStatusBadge status={invite.status as any} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Past Jobs */}
            {pastJobs.length > 0 && (
              <div>
                <h3 className="font-medium text-sm mb-3 text-muted-foreground">
                  Past Jobs ({pastJobs.length})
                </h3>
                <div className="space-y-2">
                  {pastJobs.slice(0, 5).map((invite) => (
                    <Card key={invite.id} className="opacity-70">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">
                              {invite.pour?.pour_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {invite.job?.name}
                            </p>
                            {invite.pour?.pour_date && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(invite.pour.pour_date), "d MMM yyyy")}
                              </p>
                            )}
                          </div>
                          <SubTradeStatusBadge status={invite.status as any} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {pastJobs.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center">
                      + {pastJobs.length - 5} more past jobs
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ScheduleSubbieDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
      />
    </>
  );
}
