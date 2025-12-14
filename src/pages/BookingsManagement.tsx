import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Phone, Mail, Calendar, MessageSquare, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

type Booking = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  preferred_date: string | null;
  service_type: string;
  status: string;
  message: string | null;
  created_at: string;
};

export default function BookingsManagement() {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndFetchData();
  }, [statusFilter]);

  const checkAuthAndFetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .in("role", ["admin", "staff"])
      .single();

    if (!roleData) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate("/admin");
      return;
    }

    setAuthorized(true);
    await fetchBookings();
    setLoading(false);
  };

  const fetchBookings = async () => {
    let query = supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter as "pending" | "contacted" | "converted" | "cancelled");
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load bookings.",
        variant: "destructive",
      });
    } else {
      setBookings(data || []);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: "pending" | "contacted" | "converted" | "cancelled") => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", bookingId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update booking status.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Status Updated",
        description: "Booking status has been updated successfully.",
      });
      await fetchBookings();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "contacted":
        return "bg-blue-500";
      case "converted":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatServiceType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Booking Requests</CardTitle>
                  <CardDescription>Manage and respond to customer booking requests</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Bookings</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Preferred Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No bookings found
                      </TableCell>
                    </TableRow>
                  ) : (
                    bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-sm">
                            {booking.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <a href={`tel:${booking.phone}`} className="hover:underline">
                                  {booking.phone}
                                </a>
                              </div>
                            )}
                            {booking.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <a href={`mailto:${booking.email}`} className="hover:underline">
                                  {booking.email}
                                </a>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatServiceType(booking.service_type)}</TableCell>
                        <TableCell>
                          {booking.preferred_date ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(booking.preferred_date), "MMM dd, yyyy")}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Not specified</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(booking.created_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedBooking(booking)}
                            >
                              View
                            </Button>
                            <Select
                              value={booking.status}
                              onValueChange={(value) => updateBookingStatus(booking.id, value as "pending" | "contacted" | "converted" | "cancelled")}
                            >
                              <SelectTrigger className="w-[130px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="contacted">Contacted</SelectItem>
                                <SelectItem value="converted">Converted</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {selectedBooking && (
            <Card>
              <CardHeader>
                <CardTitle>Booking Details</CardTitle>
                <CardDescription>Full information for selected booking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-2">Customer Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Name:</strong> {selectedBooking.name}</p>
                      <p><strong>Phone:</strong> {selectedBooking.phone}</p>
                      {selectedBooking.email && (
                        <p><strong>Email:</strong> {selectedBooking.email}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Booking Details</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Service:</strong> {formatServiceType(selectedBooking.service_type)}</p>
                      <p><strong>Status:</strong> <Badge className={getStatusColor(selectedBooking.status)}>{selectedBooking.status}</Badge></p>
                      {selectedBooking.preferred_date && (
                        <p><strong>Preferred Date:</strong> {format(new Date(selectedBooking.preferred_date), "MMMM dd, yyyy")}</p>
                      )}
                      <p><strong>Requested:</strong> {format(new Date(selectedBooking.created_at), "MMMM dd, yyyy 'at' h:mm a")}</p>
                    </div>
                  </div>
                  {selectedBooking.message && (
                    <div className="md:col-span-2">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Customer Message
                      </h3>
                      <p className="text-sm bg-muted p-4 rounded-lg">{selectedBooking.message}</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" onClick={() => setSelectedBooking(null)}>
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
