import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Phone, Mail, Building2, ChevronRight, Users } from "lucide-react";
import { ClientDetailSheet } from "./ClientDetailSheet";

export interface Client {
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  company_name: string | null;
  estimate_count: number;
  job_count: number;
}

export function ClientsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!profile?.business_id) return [];

      // Get unique clients from estimates
      const { data: estimates } = await supabase
        .from("estimates")
        .select("client_name, client_email, client_phone, company_name, status")
        .eq("business_id", profile.business_id);

      if (!estimates) return [];

      // Get jobs to count how many jobs each client has
      const { data: jobs } = await supabase
        .from("jobs")
        .select("builder_client")
        .eq("business_id", profile.business_id);

      // Group by unique client (name + email combination)
      const clientMap = new Map<string, Client>();
      
      for (const est of estimates) {
        const key = `${est.client_name}|${est.client_email || ""}`;
        const existing = clientMap.get(key);
        
        if (existing) {
          existing.estimate_count++;
          if (est.status === "accepted") {
            existing.job_count++;
          }
        } else {
          clientMap.set(key, {
            client_name: est.client_name,
            client_email: est.client_email,
            client_phone: est.client_phone,
            company_name: est.company_name,
            estimate_count: 1,
            job_count: est.status === "accepted" ? 1 : 0,
          });
        }
      }

      return Array.from(clientMap.values()).sort((a, b) => 
        a.client_name.localeCompare(b.client_name)
      );
    },
  });

  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients;
    const query = searchQuery.toLowerCase();
    return clients.filter(
      (c) =>
        c.client_name.toLowerCase().includes(query) ||
        c.client_email?.toLowerCase().includes(query) ||
        c.company_name?.toLowerCase().includes(query) ||
        c.client_phone?.includes(query)
    );
  }, [clients, searchQuery]);

  return (
    <>
      <div className="space-y-4">
        {clients.length > 3 && (
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : clients.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No clients yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Clients will appear here when you create quotes
              </p>
            </CardContent>
          </Card>
        ) : filteredClients.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No clients match your search
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filteredClients.map((client, index) => (
              <button
                key={`${client.client_name}-${client.client_email}-${index}`}
                onClick={() => setSelectedClient(client)}
                className="w-full flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{client.client_name}</p>
                    {client.company_name && (
                      <Badge variant="outline" className="text-xs">
                        <Building2 className="h-3 w-3 mr-1" />
                        {client.company_name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    {client.client_phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {client.client_phone}
                      </span>
                    )}
                    {client.client_email && (
                      <span className="flex items-center gap-1 truncate max-w-[200px]">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate">{client.client_email}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <Badge variant="secondary">
                      {client.estimate_count} {client.estimate_count === 1 ? "quote" : "quotes"}
                    </Badge>
                    {client.job_count > 0 && (
                      <Badge variant="default">
                        {client.job_count} {client.job_count === 1 ? "job" : "jobs"}
                      </Badge>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      <ClientDetailSheet
        open={!!selectedClient}
        onOpenChange={(open) => !open && setSelectedClient(null)}
        client={selectedClient}
      />
    </>
  );
}
