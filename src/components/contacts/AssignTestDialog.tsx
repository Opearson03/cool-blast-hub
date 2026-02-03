import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle, FlaskConical, Target, Sparkles, Search, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ConcreteTestInsert = Database["public"]["Tables"]["concrete_tests"]["Insert"];

interface AssignTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testId: string;
  onAssigned: () => void;
}

interface SuggestedMatch {
  jobId: string;
  jobName: string;
  pourId?: string;
  pourName?: string;
  score: number;
  reasons: string[];
}

export function AssignTestDialog({
  open,
  onOpenChange,
  testId,
  onAssigned,
}: AssignTestDialogProps) {
  const queryClient = useQueryClient();
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [selectedPourId, setSelectedPourId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch the test result
  const { data: testResult, isLoading: isLoadingTest } = useQuery({
    queryKey: ["pending-test", testId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pending_test_results")
        .select("*")
        .eq("id", testId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open && !!testId,
  });

  // Fetch jobs
  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs-for-assignment"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!profile?.business_id) return [];

      const { data } = await supabase
        .from("jobs")
        .select("id, name, job_number")
        .eq("business_id", profile.business_id)
        .order("created_at", { ascending: false });

      return data || [];
    },
    enabled: open,
  });

  // Fetch pours for selected job
  const { data: pours = [] } = useQuery({
    queryKey: ["pours-for-job", selectedJobId],
    queryFn: async () => {
      if (!selectedJobId) return [];
      const { data } = await supabase
        .from("job_pours")
        .select("id, pour_name")
        .eq("job_id", selectedJobId)
        .order("pour_date", { ascending: false });
      return data || [];
    },
    enabled: !!selectedJobId,
  });

  // Get suggested matches from extracted data
  const suggestedMatches: SuggestedMatch[] = 
    (testResult?.extracted_data as { suggested_matches?: SuggestedMatch[] })?.suggested_matches || [];
  const topMatch = suggestedMatches[0];

  // Auto-select top match when opening
  useEffect(() => {
    if (topMatch && !selectedJobId) {
      setSelectedJobId(topMatch.jobId);
      if (topMatch.pourId) {
        setSelectedPourId(topMatch.pourId);
      }
    }
  }, [topMatch, selectedJobId]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedJobId("");
      setSelectedPourId("");
      setSearchQuery("");
    }
  }, [open]);

  // Filter jobs based on search
  const filteredJobs = jobs.filter(job => {
    const searchLower = searchQuery.toLowerCase();
    return (
      job.name.toLowerCase().includes(searchLower) ||
      (job.job_number?.toLowerCase().includes(searchLower) ?? false)
    );
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedJobId) throw new Error("Please select a job");

      // Update pending test result status
      const { error: updateError } = await supabase
        .from("pending_test_results")
        .update({
          status: "approved",
          linked_job_id: selectedJobId,
          linked_pour_id: selectedPourId || null,
        })
        .eq("id", testId);

      if (updateError) throw updateError;

      // Create concrete_tests record
      const extractedData = testResult?.extracted_data as {
        test_id?: string;
        test_type?: string;
        pour_date?: string;
        test_date?: string;
        supplier?: string;
        target_mpa?: number;
        actual_mpa?: number;
        sample_count?: number;
        notes?: string;
      } | null;

      const testType = extractedData?.test_type || "cylinder";
      // Valid test types from the database enum
      const validTestTypes = ["14_day", "28_day", "7_day", "air", "cylinder", "other", "slump"];
      const validTestType = validTestTypes.includes(testType) 
        ? (testType as Database["public"]["Enums"]["test_type"])
        : "cylinder";

      const passed = extractedData?.actual_mpa && extractedData?.target_mpa 
        ? extractedData.actual_mpa >= extractedData.target_mpa 
        : null;

      const testData: ConcreteTestInsert = {
        job_id: selectedJobId,
        pour_id: selectedPourId || null,
        test_id: extractedData?.test_id || `TEST-${Date.now()}`,
        test_type: validTestType,
        pour_date: extractedData?.pour_date || null,
        test_date: extractedData?.test_date || null,
        supplier: extractedData?.supplier || null,
        target_strength: extractedData?.target_mpa || null,
        actual_strength: extractedData?.actual_mpa || null,
        sample_count: extractedData?.sample_count || null,
        notes: extractedData?.notes || null,
        lab_report_url: testResult?.lab_report_url || null,
        passed,
      };

      const { error: insertError } = await supabase
        .from("concrete_tests")
        .insert(testData);

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      toast.success("Test result assigned to job");
      queryClient.invalidateQueries({ queryKey: ["inbox-history"] });
      queryClient.invalidateQueries({ queryKey: ["pending-test", testId] });
      onAssigned();
    },
    onError: (error) => {
      console.error("Error assigning test:", error);
      toast.error("Failed to assign test result");
    },
  });

  const handleSelectJob = (jobId: string) => {
    setSelectedJobId(jobId);
    setSelectedPourId("");
  };

  const handleApplySuggestion = (match: SuggestedMatch) => {
    setSelectedJobId(match.jobId);
    if (match.pourId) {
      setSelectedPourId(match.pourId);
    }
  };

  if (isLoadingTest) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Assign Test Result
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 flex flex-col gap-4 py-4 min-h-0">
          {/* Show suggested matches */}
          {suggestedMatches.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Suggested Matches
              </Label>
              <div className="space-y-2">
                {suggestedMatches.slice(0, 3).map((match) => (
                  <button
                    key={`${match.jobId}-${match.pourId}`}
                    onClick={() => handleApplySuggestion(match)}
                    className={cn(
                      "w-full text-left p-2 rounded-md border transition-colors",
                      selectedJobId === match.jobId && 
                      (match.pourId ? selectedPourId === match.pourId : true)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm">{match.jobName}</div>
                      <Badge variant="outline" className="text-xs">
                        <Target className="h-3 w-3 mr-1" />
                        {Math.round(match.score)}%
                      </Badge>
                    </div>
                    {match.pourName && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Pour: {match.pourName}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {match.reasons.join(", ")}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Job selection */}
          <div className="flex-1 flex flex-col min-h-0">
            <Label className="mb-2">Select Job</Label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="flex-1 border rounded-md">
              <div className="p-1">
                {filteredJobs.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No jobs found
                  </div>
                ) : (
                  filteredJobs.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => handleSelectJob(job.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-sm text-sm transition-colors flex items-center justify-between",
                        selectedJobId === job.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      <span className="truncate">
                        {job.job_number ? `${job.job_number} - ` : ""}{job.name}
                      </span>
                      {selectedJobId === job.id && (
                        <CheckCircle className="h-4 w-4 shrink-0 ml-2" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Pour selection */}
          {selectedJobId && pours.length > 0 && (
            <div className="space-y-2">
              <Label>Select Pour (Optional)</Label>
              <ScrollArea className="max-h-32 border rounded-md">
                <div className="p-1">
                  {pours.map((pour) => (
                    <button
                      key={pour.id}
                      onClick={() => setSelectedPourId(pour.id === selectedPourId ? "" : pour.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-sm text-sm transition-colors flex items-center justify-between",
                        selectedPourId === pour.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      <span className="truncate">{pour.pour_name}</span>
                      {selectedPourId === pour.id && (
                        <CheckCircle className="h-4 w-4 shrink-0 ml-2" />
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <SheetFooter className="flex-row gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => assignMutation.mutate()}
            disabled={!selectedJobId || assignMutation.isPending}
          >
            {assignMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Assign
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
