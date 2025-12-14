import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, User } from "lucide-react";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { format } from "date-fns";

interface JobAssignment {
  id: string;
  role_on_job: string | null;
  jobs: {
    id: string;
    title: string;
    scheduled_date: string | null;
    scheduled_time: string | null;
    location: string | null;
    description: string | null;
    special_requirements: string | null;
    status: string;
    customers: {
      contact_name: string;
      phone: string | null;
    } | null;
  };
}

export default function StaffShifts() {
  const [shifts, setShifts] = useState<JobAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("job_assignments")
      .select(`
        id,
        role_on_job,
        jobs (
          id,
          title,
          scheduled_date,
          scheduled_time,
          location,
          description,
          special_requirements,
          status,
          customers (
            contact_name,
            phone
          )
        )
      `)
      .eq("staff_id", session.user.id)
      .order("jobs(scheduled_date)", { ascending: true });

    if (!error && data) {
      setShifts(data as JobAssignment[]);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: "bg-blue-500",
      in_progress: "bg-yellow-500",
      completed: "bg-green-500",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  if (loading) {
    return (
      <StaffLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </StaffLayout>
    );
  }

  const upcomingShifts = shifts.filter(
    (s) => s.jobs.scheduled_date && new Date(s.jobs.scheduled_date) >= new Date()
  );
  const pastShifts = shifts.filter(
    (s) => s.jobs.scheduled_date && new Date(s.jobs.scheduled_date) < new Date()
  );

  return (
    <StaffLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Shifts</h1>
          <p className="text-muted-foreground mt-1">
            View your job assignments and schedule
          </p>
        </div>

        {/* Upcoming Shifts */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Upcoming Shifts</h2>
          {upcomingShifts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No upcoming shifts scheduled
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {upcomingShifts.map((shift) => (
                <Card key={shift.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{shift.jobs.title}</CardTitle>
                        <CardDescription>
                          {shift.jobs.customers?.contact_name}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(shift.jobs.status)}>
                        {shift.jobs.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {shift.jobs.scheduled_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {format(new Date(shift.jobs.scheduled_date), "EEEE, MMMM d, yyyy")}
                        </span>
                      </div>
                    )}
                    {shift.jobs.scheduled_time && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{shift.jobs.scheduled_time}</span>
                      </div>
                    )}
                    {shift.jobs.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{shift.jobs.location}</span>
                      </div>
                    )}
                    {shift.role_on_job && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>Role: {shift.role_on_job}</span>
                      </div>
                    )}
                    {shift.jobs.description && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">
                          {shift.jobs.description}
                        </p>
                      </div>
                    )}
                    {shift.jobs.special_requirements && (
                      <div className="pt-2">
                        <Badge variant="outline">Special Requirements</Badge>
                        <p className="text-sm mt-1">{shift.jobs.special_requirements}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Past Shifts */}
        {pastShifts.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Past Shifts</h2>
            <div className="grid gap-4">
              {pastShifts.slice(0, 5).map((shift) => (
                <Card key={shift.id} className="opacity-75">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{shift.jobs.title}</CardTitle>
                        {shift.jobs.scheduled_date && (
                          <CardDescription>
                            {format(new Date(shift.jobs.scheduled_date), "MMM d, yyyy")}
                          </CardDescription>
                        )}
                      </div>
                      <Badge className={getStatusColor(shift.jobs.status)}>
                        {shift.jobs.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
