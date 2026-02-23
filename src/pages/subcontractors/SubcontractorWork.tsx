import { useState } from "react";
import { SubcontractorLayout } from "@/components/layout/SubcontractorLayout";
import { useSubcontractorInvites, SubcontractorInvite } from "@/hooks/useSubcontractorInvites";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Loader2,
  Briefcase,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Check,
  X,
  Inbox,
} from "lucide-react";

export default function SubcontractorWork() {
  const { data: invites, isLoading } = useSubcontractorInvites();
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleRespond = async (invite: SubcontractorInvite, response: "accepted" | "declined") => {
    setRespondingId(invite.id);
    try {
      const { error } = await supabase.functions.invoke("subcontractor-respond-invite", {
        body: { invite_id: invite.id, response },
      });
      if (error) throw error;

      toast({
        title: response === "accepted" ? "Work Accepted" : "Work Declined",
        description: `${invite.pour_name} has been ${response}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["subcontractor-invites"] });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to respond to invite.",
        variant: "destructive",
      });
    } finally {
      setRespondingId(null);
    }
  };

  const pending = invites?.filter((i) => i.status === "sent" || i.status === "drafted" || i.status === "viewed") || [];
  const accepted = invites?.filter((i) => i.status === "accepted") || [];
  const declined = invites?.filter((i) => i.status === "declined") || [];

  const InviteCard = ({ invite, showActions }: { invite: SubcontractorInvite; showActions: boolean }) => (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-foreground">{invite.pour_name}</h3>
            <p className="text-sm text-muted-foreground">{invite.job_name}</p>
          </div>
          <Badge variant="outline">{invite.role}</Badge>
        </div>

        <div className="space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0" />
            <span>{invite.business_name}</span>
          </div>
          {invite.pour_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>{format(new Date(invite.pour_date), "EEE, MMM d yyyy")}</span>
            </div>
          )}
          {(invite.start_time || invite.scheduled_time) && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0" />
              <span>{invite.start_time || invite.scheduled_time}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{invite.site_address}</span>
          </div>
        </div>

        {invite.notes && (
          <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">{invite.notes}</p>
        )}

        {showActions && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => handleRespond(invite, "accepted")}
              disabled={respondingId === invite.id}
            >
              {respondingId === invite.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => handleRespond(invite, "declined")}
              disabled={respondingId === invite.id}
            >
              <X className="h-4 w-4 mr-1" />
              Decline
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12 text-muted-foreground">
      <Inbox className="h-10 w-10 mx-auto mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );

  return (
    <SubcontractorLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Briefcase className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">My Work</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="pending">
            <TabsList className="w-full">
              <TabsTrigger value="pending" className="flex-1">
                Pending {pending.length > 0 && `(${pending.length})`}
              </TabsTrigger>
              <TabsTrigger value="accepted" className="flex-1">
                Accepted {accepted.length > 0 && `(${accepted.length})`}
              </TabsTrigger>
              <TabsTrigger value="declined" className="flex-1">
                Declined {declined.length > 0 && `(${declined.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-3 mt-4">
              {pending.length === 0 ? (
                <EmptyState message="No pending invites" />
              ) : (
                pending.map((inv) => <InviteCard key={inv.id} invite={inv} showActions />)
              )}
            </TabsContent>

            <TabsContent value="accepted" className="space-y-3 mt-4">
              {accepted.length === 0 ? (
                <EmptyState message="No accepted work yet" />
              ) : (
                accepted.map((inv) => <InviteCard key={inv.id} invite={inv} showActions={false} />)
              )}
            </TabsContent>

            <TabsContent value="declined" className="space-y-3 mt-4">
              {declined.length === 0 ? (
                <EmptyState message="No declined invites" />
              ) : (
                declined.map((inv) => <InviteCard key={inv.id} invite={inv} showActions={false} />)
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </SubcontractorLayout>
  );
}
