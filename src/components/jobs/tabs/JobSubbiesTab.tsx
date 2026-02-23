import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Phone, Mail, ChevronRight, UserPlus, Search } from "lucide-react";
import { SubTradeStatusBadge } from "@/components/jobs/SubTradeStatusBadge";
import { SubbieDetailSheet } from "@/components/jobs/SubbieDetailSheet";
import { ScheduleSubbieDialog } from "@/components/schedule/ScheduleSubbieDialog";
import type { SubTradeInvite } from "@/hooks/useSubTradeInvites";

interface JobSubbiesTabProps {
  jobId: string;
}

interface SubbieDirectory {
  recipient_name: string;
  recipient_phone: string | null;
  recipient_email: string | null;
  role: string;
  latestStatus: SubTradeInvite["status"];
  inviteCount: number;
}

export function JobSubbiesTab({ jobId }: JobSubbiesTabProps) {
  const [selectedSubbie, setSelectedSubbie] = useState<SubbieDirectory | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  // Fetch all invites for this job
  const { data: invites = [], isLoading } = useQuery({
    queryKey: ["sub-trade-invites-job", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("external_invites")
        .select("*")
        .eq("job_id", jobId)
        .eq("invite_type", "sub_trade")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SubTradeInvite[];
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">Loading sub-contractors...</div>
    );
  }

  // Deduplicate subbies by name + role, keeping latest status and contact info
  const subbieMap = new Map<string, SubbieDirectory>();
  
  for (const invite of invites) {
    const key = `${invite.recipient_name.toLowerCase().trim()}-${invite.role.toLowerCase().trim()}`;
    const existing = subbieMap.get(key);
    
    if (!existing) {
      subbieMap.set(key, {
        recipient_name: invite.recipient_name,
        recipient_phone: invite.recipient_phone,
        recipient_email: invite.recipient_email,
        role: invite.role,
        latestStatus: invite.status as SubTradeInvite["status"],
        inviteCount: 1,
      });
    } else {
      existing.inviteCount += 1;
      // Update contact info if missing
      if (!existing.recipient_phone && invite.recipient_phone) {
        existing.recipient_phone = invite.recipient_phone;
      }
      if (!existing.recipient_email && invite.recipient_email) {
        existing.recipient_email = invite.recipient_email;
      }
    }
  }

  const subbies = Array.from(subbieMap.values());

  if (subbies.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Sub-Contractors Yet</h3>
            <p className="text-muted-foreground mb-4">
              Invite sub-contractors to help coordinate your job
            </p>
            <div className="flex gap-2 justify-center">
              <Button asChild variant="outline">
                <Link to="/admin/directory">
                  <Search className="w-4 h-4 mr-2" />
                  Find in Directory
                </Link>
              </Button>
              <Button onClick={() => setInviteDialogOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Sub-Contractor
              </Button>
            </div>
          </CardContent>
        </Card>
        <ScheduleSubbieDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          preselectedJobId={jobId}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex justify-end gap-2 mb-4">
        <Button asChild variant="outline">
          <Link to="/admin/directory">
            <Search className="w-4 h-4 mr-2" />
            Find in Directory
          </Link>
        </Button>
        <Button onClick={() => setInviteDialogOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Sub-Contractor
        </Button>
      </div>
      <div className="space-y-2">
        {subbies.map((subbie, index) => (
          <Card
            key={index}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setSelectedSubbie(subbie)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">{subbie.recipient_name}</span>
                    <span className="text-sm text-muted-foreground">({subbie.role})</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {subbie.recipient_phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{subbie.recipient_phone}</span>
                      </span>
                    )}
                    {subbie.recipient_email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[200px]">{subbie.recipient_email}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {subbie.inviteCount > 1 && (
                    <span className="text-xs text-muted-foreground">
                      {subbie.inviteCount} pours
                    </span>
                  )}
                  <SubTradeStatusBadge status={subbie.latestStatus} />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <SubbieDetailSheet
        open={!!selectedSubbie}
        onOpenChange={(open) => !open && setSelectedSubbie(null)}
        jobId={jobId}
        subbie={selectedSubbie}
      />

      <ScheduleSubbieDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        preselectedJobId={jobId}
      />
    </>
  );
}