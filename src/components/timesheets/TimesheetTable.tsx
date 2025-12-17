import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format, differenceInMinutes, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { Search, MapPin, CheckCircle, AlertCircle, Pencil, Clock } from "lucide-react";
import { EditTimesheetDialog } from "./EditTimesheetDialog";

interface TimesheetTableProps {
  businessId: string;
}

interface Timesheet {
  id: string;
  employee_id: string;
  pour_id: string | null;
  clock_in: string;
  clock_out: string | null;
  clock_in_latitude: number | null;
  clock_in_longitude: number | null;
  clock_out_latitude: number | null;
  clock_out_longitude: number | null;
  status: string;
  notes: string | null;
  edited_by: string | null;
  edited_at: string | null;
  profiles: { full_name: string };
  job_pours: { pour_name: string; jobs: { name: string; site_address: string } } | null;
}

export function TimesheetTable({ businessId }: TimesheetTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("this_week");
  const [editingTimesheet, setEditingTimesheet] = useState<Timesheet | null>(null);

  const getDateRange = () => {
    const now = new Date();
    switch (dateFilter) {
      case "this_week":
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      case "last_week":
        const lastWeek = subWeeks(now, 1);
        return { start: startOfWeek(lastWeek, { weekStartsOn: 1 }), end: endOfWeek(lastWeek, { weekStartsOn: 1 }) };
      case "last_2_weeks":
        return { start: startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      default:
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    }
  };

  const { data: timesheets = [], isLoading } = useQuery({
    queryKey: ["admin-timesheets", businessId, dateFilter],
    queryFn: async () => {
      const { start, end } = getDateRange();
      const { data, error } = await supabase
        .from("timesheets")
        .select(`
          *,
          profiles!timesheets_employee_id_fkey(full_name),
          job_pours(pour_name, jobs(name, site_address))
        `)
        .eq("business_id", businessId)
        .gte("clock_in", start.toISOString())
        .lte("clock_in", end.toISOString())
        .order("clock_in", { ascending: false });

      if (error) throw error;
      return data as Timesheet[];
    },
    enabled: !!businessId,
  });

  const filteredTimesheets = timesheets.filter((ts) =>
    ts.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ts.job_pours?.pour_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ts.job_pours?.jobs?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateDuration = (clockIn: string, clockOut: string | null) => {
    if (!clockOut) return "In progress";
    const mins = differenceInMinutes(new Date(clockOut), new Date(clockIn));
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const totalHours = filteredTimesheets.reduce((acc, ts) => {
    if (!ts.clock_out) return acc;
    return acc + differenceInMinutes(new Date(ts.clock_out), new Date(ts.clock_in));
  }, 0);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Hours</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {Math.floor(totalHours / 60)}h {totalHours % 60}m
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Entries</span>
            </div>
            <p className="text-2xl font-bold mt-1">{filteredTimesheets.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by employee or job..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this_week">This Week</SelectItem>
            <SelectItem value="last_week">Last Week</SelectItem>
            <SelectItem value="last_2_weeks">Last 2 Weeks</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filteredTimesheets.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No timesheet entries found for the selected period.
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Job/Pour</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTimesheets.map((ts) => (
                <TableRow key={ts.id}>
                  <TableCell className="font-medium">{ts.profiles?.full_name}</TableCell>
                  <TableCell>{format(new Date(ts.clock_in), "EEE, d MMM")}</TableCell>
                  <TableCell>{format(new Date(ts.clock_in), "h:mm a")}</TableCell>
                  <TableCell>
                    {ts.clock_out ? format(new Date(ts.clock_out), "h:mm a") : (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{calculateDuration(ts.clock_in, ts.clock_out)}</TableCell>
                  <TableCell>
                    {ts.clock_in_latitude ? (
                      <Badge variant="outline" className="text-xs">
                        <MapPin className="h-3 w-3 mr-1" />
                        GPS
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        No GPS
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">
                    {ts.job_pours ? (
                      <span className="text-sm">{ts.job_pours.pour_name}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingTimesheet(ts)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <EditTimesheetDialog
        open={!!editingTimesheet}
        onOpenChange={(open) => !open && setEditingTimesheet(null)}
        timesheet={editingTimesheet}
        businessId={businessId}
      />
    </div>
  );
}