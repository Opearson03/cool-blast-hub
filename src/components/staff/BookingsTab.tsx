import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, isSameDay } from "date-fns";
import { CalendarIcon, CheckCircle, XCircle, Clock, Video, List, CalendarDays, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type BookingStatus = "booked" | "completed" | "cancelled";

interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string;
  quotes_per_week: string | null;
  booking_time: string;
  status: string;
  zoom_link: string | null;
  created_at: string;
  staff_notes: string | null;
}

export function BookingsTab() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<Date>();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["staff-bookings", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("bookings")
        .select("*")
        .order("booking_time", { ascending: true });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Booking[];
    },
  });

  const updateStatus = async (id: string, status: BookingStatus) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update booking");
      return;
    }
    toast.success(`Booking marked as ${status}`);
    queryClient.invalidateQueries({ queryKey: ["staff-bookings"] });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "booked":
        return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600"><Clock className="h-3 w-3 mr-1" />Booked</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case "cancelled":
        return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const bookingsOnDate = (date: Date) =>
    (bookings ?? []).filter((b) => isSameDay(new Date(b.booking_time), date));

  const upcomingBookings = (bookings ?? []).filter(
    (b) => b.status === "booked" && new Date(b.booking_time) >= new Date()
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{upcomingBookings.length}</div>
            <p className="text-sm text-muted-foreground">Upcoming Calls</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">
              {(bookings ?? []).filter((b) => b.status === "completed").length}
            </div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{(bookings ?? []).length}</div>
            <p className="text-sm text-muted-foreground">Total Bookings</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="booked">Booked</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-1 ml-auto">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("calendar")}
          >
            <CalendarDays className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : viewMode === "calendar" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <Calendar
                mode="single"
                selected={calendarDate}
                onSelect={(d) => d && setCalendarDate(d)}
                className="pointer-events-auto"
                modifiers={{
                  hasBooking: (bookings ?? []).map((b) => new Date(b.booking_time)),
                }}
                modifiersClassNames={{
                  hasBooking: "bg-primary/20 font-bold",
                }}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {format(calendarDate, "EEEE, d MMMM yyyy")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bookingsOnDate(calendarDate).length === 0 ? (
                <p className="text-muted-foreground text-sm">No bookings on this date</p>
              ) : (
                <div className="space-y-3">
                  {bookingsOnDate(calendarDate).map((b) => (
                    <div key={b.id} className="border rounded-lg p-3 space-y-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{b.name}</p>
                          <p className="text-sm text-muted-foreground">{b.company}</p>
                        </div>
                        {getStatusBadge(b.status)}
                      </div>
                      <p className="text-sm">
                        {format(new Date(b.booking_time), "HH:mm")} AEST
                      </p>
                      <p className="text-sm text-muted-foreground">{b.email}</p>
                      {b.zoom_link && (
                        <a href={b.zoom_link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                          <Video className="h-3 w-3" /> Zoom
                        </a>
                      )}
                      {b.status === "booked" && (
                        <div className="flex gap-2 pt-2">
                          <Button size="sm" variant="outline" onClick={() => updateStatus(b.id, "completed")}>
                            <CheckCircle className="h-3 w-3 mr-1" /> Complete
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => updateStatus(b.id, "cancelled")}>
                            <XCircle className="h-3 w-3 mr-1" /> Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden md:table-cell">Phone</TableHead>
                    <TableHead className="hidden lg:table-cell">Company</TableHead>
                    <TableHead className="hidden lg:table-cell">Quotes/wk</TableHead>
                    <TableHead>Booking Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Zoom</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(bookings ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        No bookings found
                      </TableCell>
                    </TableRow>
                  ) : (
                    (bookings ?? []).map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.name}</TableCell>
                        <TableCell className="text-sm">{b.email}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{b.phone || "—"}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">{b.company}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">{b.quotes_per_week || "—"}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {format(new Date(b.booking_time), "d MMM yyyy HH:mm")}
                        </TableCell>
                        <TableCell>{getStatusBadge(b.status)}</TableCell>
                        <TableCell>
                          {b.zoom_link ? (
                            <a href={b.zoom_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              <Video className="h-4 w-4" />
                            </a>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          {b.status === "booked" && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => updateStatus(b.id, "completed")}>
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => updateStatus(b.id, "cancelled")}>
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
