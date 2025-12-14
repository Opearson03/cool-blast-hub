import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { FileText, Briefcase, Users, Calendar } from "lucide-react";

interface Activity {
  id: string;
  type: "booking" | "job" | "swms" | "timesheet";
  title: string;
  description: string;
  timestamp: string;
  status?: string;
}

export const RecentActivity = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      const activities: Activity[] = [];

      // Fetch recent bookings
      const { data: bookings } = await supabase
        .from("bookings")
        .select("id, name, service_type, status, created_at")
        .order("created_at", { ascending: false })
        .limit(3);

      bookings?.forEach((booking) => {
        activities.push({
          id: booking.id,
          type: "booking",
          title: `New booking: ${booking.name}`,
          description: booking.service_type,
          timestamp: booking.created_at || "",
          status: booking.status,
        });
      });

      // Fetch recent jobs
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, title, status, created_at")
        .order("created_at", { ascending: false })
        .limit(3);

      jobs?.forEach((job) => {
        activities.push({
          id: job.id,
          type: "job",
          title: `Job created: ${job.title}`,
          description: `Status: ${job.status}`,
          timestamp: job.created_at || "",
          status: job.status,
        });
      });

      // Fetch recent SWMS
      const { data: swms } = await supabase
        .from("swms_documents")
        .select("id, title, status, created_at")
        .order("created_at", { ascending: false })
        .limit(2);

      swms?.forEach((swms) => {
        activities.push({
          id: swms.id,
          type: "swms",
          title: `SWMS created: ${swms.title}`,
          description: `Status: ${swms.status}`,
          timestamp: swms.created_at || "",
          status: swms.status || undefined,
        });
      });

      // Sort all activities by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setActivities(activities.slice(0, 8));
    } catch (error) {
      console.error("Error fetching recent activity:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "booking":
        return Calendar;
      case "job":
        return Briefcase;
      case "swms":
        return FileText;
      default:
        return Users;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates across the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="h-8 w-8 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates across the system</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = getIcon(activity.type);
              return (
                <div key={activity.id} className="flex gap-3 items-start">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                      {activity.status && (
                        <Badge variant="outline" className="text-xs">
                          {activity.status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.timestamp).toLocaleDateString()} at{" "}
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
