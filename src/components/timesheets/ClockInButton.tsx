import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNativeCapabilities } from "@/hooks/useNativeCapabilities";
import { Clock, MapPin, Play, Square, Loader2, Coffee } from "lucide-react";
import { format, differenceInSeconds } from "date-fns";

interface ClockInButtonProps {
  userId: string;
  businessId: string;
}

interface ActiveTimesheet {
  id: string;
  clock_in: string;
  break_start: string | null;
  break_end: string | null;
  pour_id: string | null;
  pour?: {
    pour_name: string;
    job_pours?: {
      jobs?: {
        name: string;
        site_address: string;
      };
    };
  };
}

export function ClockInButton({ userId, businessId }: ClockInButtonProps) {
  const [elapsedTime, setElapsedTime] = useState<string>("00:00:00");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getCurrentLocation } = useNativeCapabilities();

  // Fetch active timesheet
  const { data: activeTimesheet, isLoading } = useQuery({
    queryKey: ["active-timesheet", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timesheets")
        .select(`
          id,
          clock_in,
          break_start,
          break_end,
          pour_id,
          job_pours(
            pour_name,
            jobs(name, site_address)
          )
        `)
        .eq("employee_id", userId)
        .eq("status", "active")
        .maybeSingle();

      if (error) throw error;
      return data as ActiveTimesheet | null;
    },
    enabled: !!userId,
  });

  // Fetch today's pour for this user
  const { data: todaysPour } = useQuery({
    queryKey: ["todays-pour", userId],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("pour_employees")
        .select(`
          pour_id,
          job_pours!inner(
            id,
            pour_name,
            pour_date,
            jobs(name, site_address)
          )
        `)
        .eq("employee_id", userId)
        .eq("job_pours.pour_date", today)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!userId && !activeTimesheet,
  });

  const isOnBreak = activeTimesheet?.break_start && !activeTimesheet?.break_end;

  // Update elapsed time
  useEffect(() => {
    if (!activeTimesheet) {
      setElapsedTime("00:00:00");
      return;
    }

    const updateTimer = () => {
      const seconds = differenceInSeconds(new Date(), new Date(activeTimesheet.clock_in));
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      setElapsedTime(
        `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeTimesheet]);

  const clockIn = useMutation({
    mutationFn: async () => {
      let latitude: number | null = null;
      let longitude: number | null = null;

      try {
        const position = await getCurrentLocation();
        if (position) {
          latitude = position.latitude;
          longitude = position.longitude;
        }
      } catch (e) {
        console.log("Could not get location:", e);
      }

      const { error } = await supabase.from("timesheets").insert({
        business_id: businessId,
        employee_id: userId,
        clock_in: new Date().toISOString(),
        clock_in_latitude: latitude,
        clock_in_longitude: longitude,
        pour_id: todaysPour?.pour_id || null,
        status: "active",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-timesheet"] });
      queryClient.invalidateQueries({ queryKey: ["my-timesheets"] });
      toast({ title: "Clocked in successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const clockOut = useMutation({
    mutationFn: async () => {
      if (!activeTimesheet) throw new Error("No active timesheet");

      let latitude: number | null = null;
      let longitude: number | null = null;

      try {
        const position = await getCurrentLocation();
        if (position) {
          latitude = position.latitude;
          longitude = position.longitude;
        }
      } catch (e) {
        console.log("Could not get location:", e);
      }

      const { error } = await supabase
        .from("timesheets")
        .update({
          clock_out: new Date().toISOString(),
          clock_out_latitude: latitude,
          clock_out_longitude: longitude,
          status: "completed",
        })
        .eq("id", activeTimesheet.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-timesheet"] });
      queryClient.invalidateQueries({ queryKey: ["my-timesheets"] });
      toast({ title: "Clocked out successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const startBreak = useMutation({
    mutationFn: async () => {
      if (!activeTimesheet) throw new Error("No active timesheet");

      const { error } = await supabase
        .from("timesheets")
        .update({ break_start: new Date().toISOString() })
        .eq("id", activeTimesheet.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-timesheet"] });
      toast({ title: "Break started" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const endBreak = useMutation({
    mutationFn: async () => {
      if (!activeTimesheet) throw new Error("No active timesheet");

      const { error } = await supabase
        .from("timesheets")
        .update({ break_end: new Date().toISOString() })
        .eq("id", activeTimesheet.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-timesheet"] });
      toast({ title: "Break ended" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (activeTimesheet) {
    const pour = activeTimesheet.pour as any;
    return (
      <Card className={isOnBreak ? "border-amber-500/50 bg-amber-500/5" : "border-green-500/50 bg-green-500/5"}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Badge variant="outline" className={isOnBreak ? "bg-amber-500/20 text-amber-600 border-amber-500/30" : "bg-green-500/20 text-green-600 border-green-500/30"}>
              {isOnBreak ? (
                <>
                  <Coffee className="h-3 w-3 mr-1" />
                  On Break
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3 mr-1" />
                  Clocked In
                </>
              )}
            </Badge>
            <span className={`text-2xl font-mono font-bold ${isOnBreak ? "text-amber-600" : "text-green-600"}`}>{elapsedTime}</span>
          </div>

          {pour?.jobs && (
            <div className="mb-3 text-sm">
              <p className="font-medium">{pour.pour_name}</p>
              <p className="text-muted-foreground">{pour.jobs.name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" />
                {pour.jobs.site_address}
              </p>
            </div>
          )}

          <p className="text-xs text-muted-foreground mb-3">
            Started at {format(new Date(activeTimesheet.clock_in), "h:mm a")}
          </p>

          <div className="flex gap-2">
            {isOnBreak ? (
              <Button
                onClick={() => endBreak.mutate()}
                disabled={endBreak.isPending}
                variant="outline"
                className="flex-1 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
              >
                {endBreak.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Coffee className="h-4 w-4 mr-2" />
                )}
                End Break
              </Button>
            ) : (
              <Button
                onClick={() => startBreak.mutate()}
                disabled={startBreak.isPending || !!activeTimesheet.break_end}
                variant="outline"
                className="flex-1"
              >
                {startBreak.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Coffee className="h-4 w-4 mr-2" />
                )}
                {activeTimesheet.break_end ? "Break Taken" : "Start Break"}
              </Button>
            )}
            <Button
              onClick={() => clockOut.mutate()}
              disabled={clockOut.isPending || isOnBreak}
              variant="destructive"
              className="flex-1"
            >
              {clockOut.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Square className="h-4 w-4 mr-2" />
              )}
              Clock Out
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-medium">Ready to start?</p>
            <p className="text-sm text-muted-foreground">
              {todaysPour
                ? `Assigned to: ${(todaysPour as any).job_pours?.pour_name}`
                : "No scheduled pour today"}
            </p>
          </div>
          <Clock className="h-8 w-8 text-muted-foreground" />
        </div>

        <Button
          onClick={() => clockIn.mutate()}
          disabled={clockIn.isPending}
          className="w-full"
          size="lg"
        >
          {clockIn.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          Clock In
        </Button>
      </CardContent>
    </Card>
  );
}