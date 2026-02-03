import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, FlaskConical, Target, Sparkles } from "lucide-react";
import { toast } from "sonner";

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
    }
  }, [open]);

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

  const handleApplySuggestion = (match: SuggestedMatch) => {
    setSelectedJobId(match.jobId);
    if (match.pourId) {
      setSelectedPourId(match.pourId);
    }
  };

  if (isLoadingTest) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Assign Test Result
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
                    className={`w-full text-left p-2 rounded-md border transition-colors ${
                      selectedJobId === match.jobId && 
                      (match.pourId ? selectedPourId === match.pourId : true)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted"
                    }`}
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

          {/* Manual selection */}
          <div className="space-y-2">
            <Label>Job</Label>
            <Select value={selectedJobId} onValueChange={(v) => {
              setSelectedJobId(v);
              setSelectedPourId("");
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select a job" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.job_number ? `${job.job_number} - ` : ""}{job.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedJobId && pours.length > 0 && (
            <div className="space-y-2">
              <Label>Pour (Optional)</Label>
              <Select value={selectedPourId} onValueChange={setSelectedPourId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a pour" />
                </SelectTrigger>
                <SelectContent>
                  {pours.map((pour) => (
                    <SelectItem key={pour.id} value={pour.id}>
                      {pour.pour_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}