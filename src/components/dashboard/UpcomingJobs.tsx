import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, MapPin, Phone, Mail, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Job {
  id: string;
  title: string;
  job_number: string;
  scheduled_date: string;
  scheduled_time: string | null;
  location: string | null;
  quoted_amount: number | null;
  status: string;
  customers: {
    contact_name: string;
  } | null;
}

interface Booking {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  service_type: string;
  preferred_date: string | null;
  message: string | null;
  created_at: string;
}

export const UpcomingJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch upcoming jobs
      const { data: jobsData } = await supabase
        .from("jobs")
        .select(`
          id,
          title,
          job_number,
          scheduled_date,
          scheduled_time,
          location,
          quoted_amount,
          status,
          customers (
            contact_name
          )
        `)
        .not("scheduled_date", "is", null)
        .gte("scheduled_date", new Date().toISOString().split("T")[0])
        .order("scheduled_date", { ascending: true })
        .limit(5);

      // Fetch pending bookings
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);

      setJobs(jobsData as Job[] || []);
      setBookings(bookingsData as Booking[] || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Jobs & Pending Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Jobs & Pending Bookings</CardTitle>
        <CardDescription>Next 5 scheduled jobs and recent booking requests</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upcoming Jobs Column */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Upcoming Jobs</h3>
              <Link to="/admin/jobs">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
            {jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming jobs scheduled</p>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <Link
                    key={job.id}
                    to={`/admin/jobs`}
                    className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-sm">{job.title}</h4>
                        <p className="text-xs text-muted-foreground">{job.job_number}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {job.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(job.scheduled_date).toLocaleDateString()}
                        {job.scheduled_time && ` at ${job.scheduled_time}`}
                      </div>
                      {job.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.location}
                        </div>
                      )}
                      {job.quoted_amount && (
                        <div className="flex items-center gap-1 font-semibold text-primary">
                          <DollarSign className="h-3 w-3" />
                          ${job.quoted_amount.toLocaleString()}
                        </div>
                      )}
                      {job.customers && (
                        <div className="text-xs">
                          Customer: {job.customers.contact_name}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Pending Bookings Column */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Pending Booking Requests</h3>
              <Link to="/admin/jobs">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
            {bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending booking requests</p>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <Link
                    key={booking.id}
                    to={`/admin/jobs`}
                    className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-sm">{booking.name}</h4>
                        <Badge variant="outline" className="text-xs capitalize">
                          {booking.service_type}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {booking.phone}
                      </div>
                      {booking.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {booking.email}
                        </div>
                      )}
                      {booking.preferred_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(booking.preferred_date).toLocaleDateString()}
                        </div>
                      )}
                      {booking.message && (
                        <div className="flex items-start gap-1 mt-2">
                          <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <p className="line-clamp-2">{booking.message}</p>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
