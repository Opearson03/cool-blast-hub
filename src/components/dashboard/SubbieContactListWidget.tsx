import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { SubbieContactDetailSheet } from "./SubbieContactDetailSheet";
import { ScheduleSubbieDialog } from "@/components/schedule/ScheduleSubbieDialog";

export function SubbieContactListWidget() {
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
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Sub-Contractor Contacts
              {totalSubbies > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {totalSubbies}
                </Badge>
              )}
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setInviteDialogOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          {totalSubbies > 3 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sub-contractors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : totalSubbies === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No sub-contractors yet</p>
              <p className="text-xs mt-1">Invite sub-contractors to jobs to build your contact list</p>
            </div>
          ) : groupedSubbies.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">No sub-contractors match your search</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedSubbies.map(([role, roleSubbies]) => (
                <div key={role}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {role}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      ({roleSubbies.length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {roleSubbies.map((subbie, index) => (
                      <button
                        key={`${subbie.recipient_name}-${subbie.role}-${index}`}
                        className="w-full flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left"
                        onClick={() => setSelectedSubbie(subbie)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">
                            {subbie.recipient_name}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                            {subbie.recipient_phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {subbie.recipient_phone}
                              </span>
                            )}
                            {subbie.recipient_email && (
                              <span className="flex items-center gap-1 truncate max-w-[160px]">
                                <Mail className="h-3 w-3 shrink-0" />
                                <span className="truncate">{subbie.recipient_email}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
