import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  ChevronRight, 
  Phone, 
  Mail, 
  Search,
  UserPlus
} from "lucide-react";
import { useBusinessSubbies, type PastSubbie } from "@/hooks/useBusinessSubbies";
import { SubbieContactDetailSheet } from "@/components/dashboard/SubbieContactDetailSheet";
import { ScheduleSubbieDialog } from "@/components/schedule/ScheduleSubbieDialog";

export function SubbiesTab() {
  const { data: subbies = [], isLoading } = useBusinessSubbies();
  const [selectedSubbie, setSelectedSubbie] = useState<PastSubbie | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Group subbies by role
  const groupedSubbies = useMemo(() => {
    const filtered = searchQuery
      ? subbies.filter(
          (s) =>
            s.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.recipient_phone?.includes(searchQuery) ||
            s.recipient_email?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : subbies;

    const groups: Record<string, PastSubbie[]> = {};
    for (const subbie of filtered) {
      const role = subbie.role || "Other";
      if (!groups[role]) {
        groups[role] = [];
      }
      groups[role].push(subbie);
    }

    // Sort roles alphabetically
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [subbies, searchQuery]);

  const totalSubbies = subbies.length;

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          {totalSubbies > 3 && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subbies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
          <Button onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Subbie
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : totalSubbies === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No subcontractors yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Invite subbies to jobs to build your contact list
              </p>
            </CardContent>
          </Card>
        ) : groupedSubbies.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No subbies match your search
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {groupedSubbies.map(([role, roleSubbies]) => (
              <div key={role}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-sm">
                    {role}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ({roleSubbies.length})
                  </span>
                </div>
                <div className="grid gap-2">
                  {roleSubbies.map((subbie, index) => (
                    <button
                      key={`${subbie.recipient_name}-${subbie.role}-${index}`}
                      className="w-full flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left"
                      onClick={() => setSelectedSubbie(subbie)}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {subbie.recipient_name}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          {subbie.recipient_phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {subbie.recipient_phone}
                            </span>
                          )}
                          {subbie.recipient_email && (
                            <span className="flex items-center gap-1 truncate max-w-[200px]">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate">{subbie.recipient_email}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SubbieContactDetailSheet
        open={!!selectedSubbie}
        onOpenChange={(open) => !open && setSelectedSubbie(null)}
        subbie={selectedSubbie}
      />

      <ScheduleSubbieDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />
    </>
  );
}
