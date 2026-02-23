import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface UserEntry {
  id: string;
  full_name: string;
  email: string;
  last_sign_in_at: string | null;
  created_at: string;
  business_id: string | null;
  business_name: string | null;
  subscription_exempt: boolean;
  subscription_status: string | null;
  role: string | null;
  estimates_created: number;
  estimates_sent: number;
}

export function UsersTable() {
  const { data: users, isLoading } = useQuery({
    queryKey: ["staff-all-users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_all_users_for_staff");
      if (error) throw error;
      return data as UserEntry[];
    },
    staleTime: 60000,
  });

  const exportToCsv = () => {
    if (!users?.length) return;

    const headers = ["Name", "Email", "Business", "Role", "Subscription Status", "Quotes Created", "Quotes Sent", "Last Login", "Joined"];
    const rows = users.map((user) => [
      user.full_name || "",
      user.email,
      user.business_name || "No Business",
      user.role || "No Role",
      getSubscriptionLabel(user),
      String(user.estimates_created ?? 0),
      String(user.estimates_sent ?? 0),
      user.last_sign_in_at ? format(new Date(user.last_sign_in_at), "yyyy-MM-dd HH:mm") : "Never",
      format(new Date(user.created_at), "yyyy-MM-dd HH:mm"),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `users-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const getSubscriptionLabel = (user: UserEntry): string => {
    if (user.role === "pourhub_staff") return "Staff";
    if (!user.business_id) return "No Business";
    if (user.subscription_exempt) return "Demo";
    if (!user.subscription_status) return "No Subscription";
    return user.subscription_status === "active" ? "Paid" : "Trial";
  };

  const getSubscriptionBadgeVariant = (user: UserEntry): "default" | "secondary" | "destructive" | "outline" => {
    if (user.role === "pourhub_staff") return "default";
    if (!user.business_id) return "outline";
    if (user.subscription_exempt) return "secondary";
    if (!user.subscription_status) return "destructive";
    return user.subscription_status === "active" ? "default" : "secondary";
  };

  const getRoleBadgeVariant = (role: string | null): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case "admin": return "default";
      case "staff": return "secondary";
      case "pourhub_staff": return "destructive";
      default: return "outline";
    }
  };

  const getRoleLabel = (role: string | null): string => {
    switch (role) {
      case "admin": return "Admin";
      case "staff": return "Staff";
      case "pourhub_staff": return "PourHub Staff";
      default: return "No Role";
    }
  };

  const formatLastLogin = (lastSignIn: string | null): string => {
    if (!lastSignIn) return "Never";
    try {
      return formatDistanceToNow(new Date(lastSignIn), { addSuffix: true });
    } catch {
      return "Unknown";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {users?.length ?? 0} users with login access
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={exportToCsv} disabled={!users?.length}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : users?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No users found
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                   <TableHead className="hidden md:table-cell">Business</TableHead>
                   <TableHead>Role</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead className="hidden md:table-cell">Quotes Created</TableHead>
                   <TableHead className="hidden md:table-cell">Quotes Sent</TableHead>
                   <TableHead>
                     <div className="flex items-center gap-1">
                       <Clock className="h-4 w-4" />
                       Last Login
                     </div>
                   </TableHead>
                   <TableHead className="hidden md:table-cell">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.full_name || "Unnamed"}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {user.business_name || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSubscriptionBadgeVariant(user)}>
                        {getSubscriptionLabel(user)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {user.estimates_created ? user.estimates_created : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {user.estimates_sent ? user.estimates_sent : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <span className={user.last_sign_in_at ? "" : "text-muted-foreground"}>
                        {formatLastLogin(user.last_sign_in_at)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {format(new Date(user.created_at), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
