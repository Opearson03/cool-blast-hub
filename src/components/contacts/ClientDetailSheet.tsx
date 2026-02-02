import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, Building2, FileText, Briefcase, MapPin } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import type { Client } from "@/hooks/useClients";

interface ClientDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

export function ClientDetailSheet({ open, onOpenChange, client }: ClientDetailSheetProps) {
  const navigate = useNavigate();

  const { data: estimates = [] } = useQuery({
    queryKey: ["client-estimates", client?.name, client?.email],
    queryFn: async () => {
      if (!client) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!profile?.business_id) return [];

      let query = supabase
        .from("estimates")
        .select("id, estimate_number, site_address, status, total_amount, created_at")
        .eq("business_id", profile.business_id)
        .eq("client_name", client.name)
        .order("created_at", { ascending: false });

      if (client.email) {
        query = query.eq("client_email", client.email);
      }

      const { data } = await query;
      return data || [];
    },
    enabled: open && !!client,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["client-jobs", client?.name],
    queryFn: async () => {
      if (!client) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!profile?.business_id) return [];

      const { data } = await supabase
        .from("jobs")
        .select("id, name, job_number, site_address, status, created_at")
        .eq("business_id", profile.business_id)
        .eq("builder_client", client.name)
        .order("created_at", { ascending: false });

      return data || [];
    },
    enabled: open && !!client,
  });

  if (!client) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-500/10 text-green-500";
      case "sent":
        return "bg-blue-500/10 text-blue-500";
      case "draft":
        return "bg-muted text-muted-foreground";
      case "rejected":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl">{client.name}</SheetTitle>
          {client.company_name && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              {client.company_name}
            </div>
          )}
        </SheetHeader>

        <div className="space-y-6">
          {/* Contact Actions */}
          <div className="flex gap-2">
            {client.phone && (
              <Button variant="outline" size="sm" asChild>
                <a href={`tel:${client.phone}`}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </a>
              </Button>
            )}
            {client.email && (
              <Button variant="outline" size="sm" asChild>
                <a href={`mailto:${client.email}`}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </a>
              </Button>
            )}
          </div>

          {/* Contact Info */}
          <Card>
            <CardContent className="pt-4 space-y-2">
              {client.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {client.phone}
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {client.email}
                </div>
              )}
              {client.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {client.address}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quotes Section */}
          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4" />
              Quotes ({estimates.length})
            </h3>
            {estimates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No quotes yet</p>
            ) : (
              <div className="space-y-2">
                {estimates.map((est) => (
                  <button
                    key={est.id}
                    onClick={() => {
                      onOpenChange(false);
                      navigate("/admin/estimates");
                    }}
                    className="w-full p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {est.estimate_number || "Draft"}
                      </span>
                      <Badge className={getStatusColor(est.status)}>
                        {est.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {est.site_address}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(est.created_at), "dd MMM yyyy")}
                      </span>
                      {est.total_amount != null && (
                        <span className="text-sm font-medium">
                          ${est.total_amount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Jobs Section */}
          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Briefcase className="h-4 w-4" />
              Jobs ({jobs.length})
            </h3>
            {jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No jobs yet</p>
            ) : (
              <div className="space-y-2">
                {jobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => {
                      onOpenChange(false);
                      navigate(`/admin/jobs/${job.id}`);
                    }}
                    className="w-full p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{job.name}</span>
                      <Badge variant="outline">{job.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {job.site_address}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(job.created_at!), "dd MMM yyyy")}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
