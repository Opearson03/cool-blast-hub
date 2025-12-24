import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { format, differenceInMinutes, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { Search, MapPin, CheckCircle, AlertCircle, Pencil, Clock, ChevronDown, Coffee, Check, AlertTriangle } from "lucide-react";
import { EditTimesheetDialog } from "./EditTimesheetDialog";
import { toast } from "sonner";

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
  break_start: string | null;
  break_end: string | null;
  break_applied_by: string | null;
  status: string;
  notes: string | null;
  edited_by: string | null;
  edited_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  auto_clocked_out: boolean | null;
  profiles: { full_name: string };
  job_pours: { pour_name: string; jobs: { name: string; site_address: string } } | null;
}

interface GroupedTimesheets {
  [employeeId: string]: {
    employeeName: string;
    timesheets: Timesheet[];
    totalMinutes: number;
    approvedMinutes: number;
    breakMinutes: number;
  };
}

export function TimesheetTable({ businessId }: TimesheetTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("this_week");
  const [editingTimesheet, setEditingTimesheet] = useState<Timesheet | null>(null);
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

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

  const approveTimesheet = useMutation({
    mutationFn: async (timesheetId: string) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("timesheets")
        .update({
          approved_by: userData.user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", timesheetId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-timesheets"] });
      toast.success("Timesheet approved");
    },
    onError: () => {
      toast.error("Failed to approve timesheet");
    },
  });

  // Group timesheets by employee
  const groupedTimesheets: GroupedTimesheets = timesheets
    .filter((ts) =>
      ts.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ts.job_pours?.pour_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ts.job_pours?.jobs?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .reduce((acc, ts) => {
      const empId = ts.employee_id;
      if (!acc[empId]) {
        acc[empId] = {
          employeeName: ts.profiles?.full_name || "Unknown",
          timesheets: [],
          totalMinutes: 0,
          approvedMinutes: 0,
          breakMinutes: 0,
        };
      }
      acc[empId].timesheets.push(ts);
      
      if (ts.clock_out) {
        const workMins = differenceInMinutes(new Date(ts.clock_out), new Date(ts.clock_in));
        let breakMins = 0;
        if (ts.break_start && ts.break_end) {
          breakMins = differenceInMinutes(new Date(ts.break_end), new Date(ts.break_start));
        }
        const netMins = workMins - breakMins;
        acc[empId].totalMinutes += netMins;
        acc[empId].breakMinutes += breakMins;
        if (ts.approved_at) {
          acc[empId].approvedMinutes += netMins;
        }
      }
      
      return acc;
    }, {} as GroupedTimesheets);

  const calculateDuration = (clockIn: string, clockOut: string | null, breakStart?: string | null, breakEnd?: string | null) => {
    if (!clockOut) return "In progress";
    let mins = differenceInMinutes(new Date(clockOut), new Date(clockIn));
    if (breakStart && breakEnd) {
      mins -= differenceInMinutes(new Date(breakEnd), new Date(breakStart));
    }
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const toggleEmployee = (empId: string) => {
    const newExpanded = new Set(expandedEmployees);
    if (newExpanded.has(empId)) {
      newExpanded.delete(empId);
    } else {
      newExpanded.add(empId);
    }
    setExpandedEmployees(newExpanded);
  };

  const totalApprovedHours = Object.values(groupedTimesheets).reduce((acc, g) => acc + g.approvedMinutes, 0);
  const totalEntries = timesheets.filter(ts => 
    ts.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ts.job_pours?.pour_name?.toLowerCase().includes(searchQuery.toLowerCase())
  ).length;

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
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Approved Hours</span>
            </div>
            <p className="text-2xl font-bold mt-1">{formatHours(totalApprovedHours)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Entries</span>
            </div>
            <p className="text-2xl font-bold mt-1">{totalEntries}</p>
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

      {/* Grouped by Employee */}
      {Object.keys(groupedTimesheets).length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No timesheet entries found for the selected period.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {Object.entries(groupedTimesheets)
            .sort((a, b) => a[1].employeeName.localeCompare(b[1].employeeName))
            .map(([empId, group]) => (
              <Collapsible
                key={empId}
                open={expandedEmployees.has(empId)}
                onOpenChange={() => toggleEmployee(empId)}
              >
                <Card>
                  <CollapsibleTrigger asChild>
                    <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ChevronDown className={`h-4 w-4 transition-transform ${expandedEmployees.has(empId) ? "rotate-180" : ""}`} />
                          <div>
                            <p className="font-medium">{group.employeeName}</p>
                            <p className="text-sm text-muted-foreground">{group.timesheets.length} entries</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatHours(group.approvedMinutes)}</p>
                          <p className="text-xs text-muted-foreground">
                            {group.totalMinutes > group.approvedMinutes && (
                              <span className="text-amber-500">{formatHours(group.totalMinutes - group.approvedMinutes)} pending</span>
                            )}
                          </p>
                          {group.breakMinutes > 0 && (
                            <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                              <Coffee className="h-3 w-3" />
                              {formatHours(group.breakMinutes)} breaks
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t divide-y">
                      {group.timesheets.map((ts) => (
                        <div key={ts.id} className={`p-4 flex items-center justify-between hover:bg-muted/30 ${ts.auto_clocked_out ? 'bg-red-500/5 border-l-4 border-l-red-500' : ''}`}>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{format(new Date(ts.clock_in), "EEE, d MMM")}</span>
                              {ts.auto_clocked_out && (
                                <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30 text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Auto Clocked Out
                                </Badge>
                              )}
                              {ts.status === "active" && (
                                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">
                                  Active
                                </Badge>
                              )}
                              {ts.approved_at ? (
                                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">
                                  <Check className="h-3 w-3 mr-1" />
                                  Approved
                                </Badge>
                              ) : ts.clock_out && (
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs">
                                  Pending
                                </Badge>
                              )}
                              {ts.edited_at && (
                                <Badge variant="outline" className="text-xs">Edited</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <span>{format(new Date(ts.clock_in), "h:mm a")}</span>
                              <span>→</span>
                              <span>{ts.clock_out ? format(new Date(ts.clock_out), "h:mm a") : "—"}</span>
                              {ts.break_start && ts.break_end && (
                                <span className="flex items-center gap-1 text-amber-500">
                                  <Coffee className="h-3 w-3" />
                                  {differenceInMinutes(new Date(ts.break_end), new Date(ts.break_start))}m break
                                </span>
                              )}
                            </div>
                            {ts.job_pours && (
                              <p className="text-xs text-muted-foreground">{ts.job_pours.pour_name}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-medium">{calculateDuration(ts.clock_in, ts.clock_out, ts.break_start, ts.break_end)}</p>
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
                            </div>
                            {ts.clock_out && !ts.approved_at && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  approveTimesheet.mutate(ts.id);
                                }}
                                disabled={approveTimesheet.isPending}
                                className="text-green-600 border-green-500/30 hover:bg-green-500/10"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTimesheet(ts);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
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