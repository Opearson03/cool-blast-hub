import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EmployeeLayout } from "@/components/layout/EmployeeLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Phone, Search, User } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Tables } from "@/integrations/supabase/types";

export default function EmployeeContacts() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadBusinessId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .maybeSingle();

      setBusinessId(profile?.business_id || null);
    };
    loadBusinessId();
  }, []);

  const { data: colleagues = [], isLoading } = useQuery({
    queryKey: ["team-contacts", businessId],
    queryFn: async () => {
      if (!businessId) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, position, emergency_contact_name, emergency_contact_phone")
        .eq("business_id", businessId)
        .order("full_name");

      if (error) throw error;
      return data as Tables<"profiles">[];
    },
    enabled: !!businessId,
  });

  const filteredColleagues = useMemo(() => {
    if (!search.trim()) return colleagues;
    const lower = search.toLowerCase();
    return colleagues.filter(
      (c) =>
        c.full_name.toLowerCase().includes(lower) ||
        c.position?.toLowerCase().includes(lower)
    );
  }, [colleagues, search]);

  const getInitials = (name: string) => {
    const [first, second] = name.split(" ");
    if (first && second) return `${first[0]}${second[0]}`.toUpperCase();
    return (first?.[0] || "").toUpperCase();
  };

  return (
    <EmployeeLayout>
      <div className="space-y-4 pb-20">
        <h1 className="text-xl font-bold">Team Contacts</h1>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or position..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredColleagues.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              {search ? "No contacts match your search" : "No team members found"}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredColleagues.map((colleague) => (
              <Card key={colleague.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(colleague.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{colleague.full_name}</p>
                      {colleague.position && (
                        <p className="text-sm text-muted-foreground">{colleague.position}</p>
                      )}
                      {colleague.phone && (
                        <a
                          href={`tel:${colleague.phone}`}
                          className="flex items-center gap-1.5 text-sm text-primary mt-1"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          {colleague.phone}
                        </a>
                      )}
                    </div>
                  </div>

                  {(colleague.emergency_contact_name || colleague.emergency_contact_phone) && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1">Emergency Contact</p>
                      <div className="flex items-center justify-between text-sm">
                        <span>{colleague.emergency_contact_name || "—"}</span>
                        {colleague.emergency_contact_phone && (
                          <a
                            href={`tel:${colleague.emergency_contact_phone}`}
                            className="text-primary"
                          >
                            {colleague.emergency_contact_phone}
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}
