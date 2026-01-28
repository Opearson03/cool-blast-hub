import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Phone, Mail } from "lucide-react";
import { SubTradeStatusBadge } from "@/components/jobs/SubTradeStatusBadge";
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
      <div className="text-center py-8 text-muted-foreground">Loading subbies...</div>
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
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No Subbies Yet</h3>
          <p className="text-muted-foreground">
            Subbies invited to pours on this job will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {subbies.map((subbie, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium truncate">{subbie.recipient_name}</span>
                  <span className="text-sm text-muted-foreground">({subbie.role})</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {subbie.recipient_phone && (
                    <a 
                      href={`tel:${subbie.recipient_phone}`} 
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>{subbie.recipient_phone}</span>
                    </a>
                  )}
                  {subbie.recipient_email && (
                    <a 
                      href={`mailto:${subbie.recipient_email}`} 
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[200px]">{subbie.recipient_email}</span>
                    </a>
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
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}