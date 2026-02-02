import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Phone, ChevronRight, Clock, Send, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, isToday, isTomorrow, differenceInDays } from "date-fns";
import { PendingInviteActionSheet } from "./PendingInviteActionSheet";

interface PendingInvite {
  id: string;
  recipient_name: string;
  recipient_phone: string | null;
  recipient_email: string | null;
  role: string;
  status: string;
  sent_at: string | null;
  pour_date: string;
  pour_name: string;
  job_name: string;
  job_id: string;
  job_pour_id: string;
}

interface PendingSubbieInvitesWidgetProps {
  businessId: string;
}

const statusIcons: Record<string, typeof Send> = {
  sent: Send,
  viewed: Eye,
  drafted: Clock,
};

const statusLabels: Record<string, string> = {
  sent: "Sent",
  viewed: "Viewed",
  drafted: "Draft",
};

export function PendingSubbieInvitesWidget({ businessId }: PendingSubbieInvitesWidgetProps) {
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvite, setSelectedInvite] = useState<PendingInvite | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const fetchPendingInvites = async () => {
      const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
      const weekAhead = format(addDays(new Date(), 7), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("external_invites")
        .select(`
          id,
          recipient_name,
          recipient_phone,
          recipient_email,
          role,
          status,
          sent_at,
          job_pour_id,
          job_pour:job_pours!inner(id, pour_date, pour_name),
          job:jobs!inner(id, name, business_id)
        `)
        .eq("business_id", businessId)
        .in("status", ["sent", "viewed", "drafted"])
        .gte("job_pour.pour_date", tomorrow)
        .lte("job_pour.pour_date", weekAhead)
        .order("job_pour(pour_date)", { ascending: true });

      if (error) {
        console.error("Error fetching pending invites:", error);
      } else if (data) {
        const mapped = data.map((invite: any) => ({
          id: invite.id,
          recipient_name: invite.recipient_name,
          recipient_phone: invite.recipient_phone,
          recipient_email: invite.recipient_email,
          role: invite.role,
          status: invite.status,
          sent_at: invite.sent_at,
          pour_date: invite.job_pour.pour_date,
          pour_name: invite.job_pour.pour_name,
          job_name: invite.job.name,
          job_id: invite.job.id,
          job_pour_id: invite.job_pour_id,
        }));
        setInvites(mapped);
      }
      setLoading(false);
    };

    if (businessId) {
      fetchPendingInvites();
    }
  }, [businessId]);

  const handleInviteClick = (invite: PendingInvite) => {
    setSelectedInvite(invite);
    setSheetOpen(true);
  };

  const handleActionComplete = () => {
    // Refetch invites after action
    const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
    const weekAhead = format(addDays(new Date(), 7), "yyyy-MM-dd");
    
    supabase
      .from("external_invites")
      .select(`
        id,
        recipient_name,
        recipient_phone,
        recipient_email,
        role,
        status,
        sent_at,
        job_pour_id,
        job_pour:job_pours!inner(id, pour_date, pour_name),
        job:jobs!inner(id, name, business_id)
      `)
      .eq("business_id", businessId)
      .in("status", ["sent", "viewed", "drafted"])
      .gte("job_pour.pour_date", tomorrow)
      .lte("job_pour.pour_date", weekAhead)
      .order("job_pour(pour_date)", { ascending: true })
      .then(({ data }) => {
        if (data) {
          const mapped = data.map((invite: any) => ({
            id: invite.id,
            recipient_name: invite.recipient_name,
            recipient_phone: invite.recipient_phone,
            recipient_email: invite.recipient_email,
            role: invite.role,
            status: invite.status,
            sent_at: invite.sent_at,
            pour_date: invite.job_pour.pour_date,
            pour_name: invite.job_pour.pour_name,
            job_name: invite.job.name,
            job_id: invite.job.id,
            job_pour_id: invite.job_pour_id,
          }));
          setInvites(mapped);
        }
      });
  };

  // Group invites by day
  const tomorrowInvites = invites.filter((i) => isTomorrow(new Date(i.pour_date)));
  const laterInvites = invites.filter((i) => !isTomorrow(new Date(i.pour_date)) && !isToday(new Date(i.pour_date)));

  // Group later invites by date
  const groupedLater = laterInvites.reduce<Record<string, PendingInvite[]>>((acc, invite) => {
    const date = invite.pour_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(invite);
    return acc;
  }, {});

  const getDaysUntilLabel = (dateStr: string) => {
    const days = differenceInDays(new Date(dateStr), new Date());
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `${days} days`;
  };

  const renderInviteItem = (invite: PendingInvite) => {
    const StatusIcon = statusIcons[invite.status] || Send;
    
    return (
      <div
        key={invite.id}
        onClick={() => handleInviteClick(invite)}
        className="flex items-center justify-between gap-2 py-2 border-b last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded transition-colors cursor-pointer"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{invite.recipient_name}</span>
            <Badge variant="outline" className="text-xs shrink-0">
              {invite.role}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {invite.pour_name} • {invite.job_name}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge 
            variant="secondary" 
            className="text-xs flex items-center gap-1"
          >
            <StatusIcon className="h-3 w-3" />
            {statusLabels[invite.status]}
          </Badge>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-warning" />
            Subcontractors Awaiting Response
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invites.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            Subcontractors Awaiting Response
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">All sub-contractors have responded</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-warning" />
            Subcontractors Awaiting Response
            <Badge variant="secondary" className="ml-1">
              {invites.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tomorrow section */}
          {tomorrowInvites.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-destructive">Tomorrow</span>
                <Badge variant="destructive" className="text-xs">
                  {tomorrowInvites.length} pending
                </Badge>
              </div>
              <div className="bg-destructive/10 rounded-lg p-3 border border-destructive/30">
                {tomorrowInvites.map(renderInviteItem)}
              </div>
            </div>
          )}

          {/* This week section */}
          {Object.keys(groupedLater).length > 0 && (
            <div>
              <span className="text-sm font-medium text-muted-foreground mb-2 block">
                This Week ({laterInvites.length} more)
              </span>
              <div className="space-y-2">
                {Object.entries(groupedLater).map(([date, dateInvites]) => (
                  <div key={date} className="bg-muted/30 rounded-lg p-3 border">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium">
                        {format(new Date(date), "EEEE, MMM d")}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {getDaysUntilLabel(date)}
                      </Badge>
                    </div>
                    {dateInvites.map(renderInviteItem)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <PendingInviteActionSheet
        invite={selectedInvite}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onActionComplete={handleActionComplete}
      />
    </>
  );
}
