import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Mail, 
  FileText, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ExternalLink,
  FlaskConical,
  Building2,
  Eye,
  Sparkles,
  Target,
  MapPin
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface PendingTestResultsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  preselectedJobId?: string;
}

interface SuggestedMatch {
  jobId: string;
  jobName: string;
  pourId?: string;
  pourName?: string;
  score: number;
  reasons: string[];
}

interface PendingTestResult {
  id: string;
  business_id: string;
  from_email: string;
  subject: string | null;
  received_at: string;
  lab_report_url: string | null;
  extracted_data: {
    test_id?: string | null;
    test_type?: string | null;
    pour_date?: string | null;
    test_date?: string | null;
    supplier?: string | null;
    target_mpa?: number | null;
    actual_mpa?: number | null;
    sample_count?: number | null;
    notes?: string | null;
    note?: string;
    docket_number?: string | null;
    batch_ticket?: string | null;
    sample_ref?: string | null;
    project_ref?: string | null;
    job_number?: string | null;
    site_address?: string | null;
    project_name?: string | null;
    suggested_matches?: SuggestedMatch[];
  };
  status: 'pending' | 'approved' | 'rejected';
  linked_job_id: string | null;
  linked_pour_id: string | null;
  match_confidence?: number | null;
  match_status?: string | null;
  created_at: string;
}

interface Job {
  id: string;
  name: string;
  job_number: string | null;
  site_address: string;
}

interface Pour {
  id: string;
  pour_name: string;
  pour_date: string | null;
}

export function PendingTestResultsSheet({
  open,
  onOpenChange,
  businessId,
  preselectedJobId
}: PendingTestResultsSheetProps) {
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(preselectedJobId || null);
  const [selectedPourId, setSelectedPourId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch pending test results
  const { data: pendingResults = [], isLoading } = useQuery({
    queryKey: ["pending-test-results", businessId, preselectedJobId],
    queryFn: async () => {
      let query = supabase
        .from("pending_test_results")
        .select("*")
        .eq("business_id", businessId)
        .eq("status", "pending")
        .order("received_at", { ascending: false });
      
      // If preselectedJobId is provided, also include job-matched results for this job
      if (preselectedJobId) {
        query = supabase
          .from("pending_test_results")
          .select("*")
          .eq("business_id", businessId)
          .eq("status", "pending")
          .or(`match_status.eq.pending,matched_job_id.eq.${preselectedJobId}`)
          .order("received_at", { ascending: false });
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as PendingTestResult[];
    },
    enabled: open
  });

  // Fetch jobs for linking (with site_address for suggested matches)
  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs-for-linking", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, name, job_number, site_address")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Job[];
    },
    enabled: open
  });

  // Fetch pours for selected job (with pour_date for display)
  const { data: pours = [] } = useQuery({
    queryKey: ["pours-for-job", selectedJobId],
    queryFn: async () => {
      if (!selectedJobId) return [];
      
      const { data, error } = await supabase
        .from("job_pours")
        .select("id, pour_name, pour_date")
        .eq("job_id", selectedJobId);
      
      if (error) throw error;
      return data as Pour[];
    },
    enabled: !!selectedJobId
  });

  // Generate suggested matches based on extracted data
  const getSuggestedMatches = (result: PendingTestResult): SuggestedMatch[] => {
    const matches: SuggestedMatch[] = [];
    const extracted = result.extracted_data;
    
    if (!extracted) return matches;
    
    for (const job of jobs) {
      let score = 0;
      const reasons: string[] = [];
      
      // Job number match
      if (extracted.job_number && job.job_number) {
        const jobNumNorm = job.job_number.toLowerCase().replace(/[^a-z0-9]/g, '');
        const extractedNumNorm = extracted.job_number.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (jobNumNorm === extractedNumNorm || jobNumNorm.includes(extractedNumNorm)) {
          score += 50;
          reasons.push(`Job # matched: ${job.job_number}`);
        }
      }
      
      // Address match (simple word overlap)
      if (extracted.site_address && job.site_address) {
        const extractedWords = extracted.site_address.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        const jobWords = job.site_address.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        const overlap = extractedWords.filter(w => jobWords.some(jw => jw.includes(w) || w.includes(jw))).length;
        if (overlap >= 2) {
          score += 30;
          reasons.push('Address partially matched');
        }
      }
      
      if (score > 0) {
        matches.push({
          jobId: job.id,
          jobName: job.name,
          score,
          reasons
        });
      }
    }
    
    return matches.sort((a, b) => b.score - a.score).slice(0, 3);
  };

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (result: PendingTestResult) => {
      if (!selectedJobId) throw new Error("Please select a job");

      const extracted = result.extracted_data;
      const testId = extracted.test_id || `AUTO-${Date.now()}`;
      
      // Check if this test_id + pour_id combination already exists
      // This prevents duplicate entries from the same test result
      const duplicateCheckQuery = supabase
        .from("concrete_tests")
        .select("id, test_id")
        .eq("job_id", selectedJobId)
        .eq("test_id", testId);
      
      // If pour is selected, check for that specific pour
      if (selectedPourId) {
        duplicateCheckQuery.eq("pour_id", selectedPourId);
      }
      
      const { data: existingTests } = await duplicateCheckQuery;
      
      if (existingTests && existingTests.length > 0) {
        // Test already exists - just mark this pending result as approved without creating duplicate
        const { error: updateError } = await supabase
          .from("pending_test_results")
          .update({
            status: "approved",
            linked_job_id: selectedJobId,
            linked_pour_id: selectedPourId,
            approved_at: new Date().toISOString()
          })
          .eq("id", result.id);

        if (updateError) throw updateError;
        
        // Return early - don't create duplicate concrete_tests entry
        return { skippedDuplicate: true };
      }
      
      // Determine test_type with proper type casting
      const testType = extracted.test_type as "7_day" | "28_day" | "slump" | "cylinder" | "air" | "other" || "other";
      
      // Create the concrete test record
      const { error: testError } = await supabase
        .from("concrete_tests")
        .insert([{
          job_id: selectedJobId,
          pour_id: selectedPourId || null,
          test_id: testId,
          test_type: testType,
          pour_date: extracted.pour_date || null,
          test_date: extracted.test_date || null,
          supplier: extracted.supplier || null,
          target_strength: extracted.target_mpa || null,
          actual_strength: extracted.actual_mpa || null,
          sample_count: extracted.sample_count || null,
          notes: extracted.notes || null,
          lab_report_url: result.lab_report_url,
          passed: extracted.actual_mpa && extracted.target_mpa 
            ? extracted.actual_mpa >= extracted.target_mpa 
            : null
        }]);

      if (testError) throw testError;

      // Update pending result status
      const { error: updateError } = await supabase
        .from("pending_test_results")
        .update({
          status: "approved",
          linked_job_id: selectedJobId,
          linked_pour_id: selectedPourId,
          approved_at: new Date().toISOString()
        })
        .eq("id", result.id);

      if (updateError) throw updateError;
      
      return { skippedDuplicate: false };
    },
    onSuccess: (data) => {
      if (data?.skippedDuplicate) {
        toast.success("Test result already exists - marked as approved");
      } else {
        toast.success("Test result approved and linked to job");
      }
      queryClient.invalidateQueries({ queryKey: ["pending-test-results"] });
      queryClient.invalidateQueries({ queryKey: ["concrete-tests"] });
      setSelectedResultId(null);
      setSelectedJobId(preselectedJobId || null);
      setSelectedPourId(null);
    },
    onError: (error) => {
      toast.error("Failed to approve: " + error.message);
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async (resultId: string) => {
      const { error } = await supabase
        .from("pending_test_results")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason || null
        })
        .eq("id", resultId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Test result rejected");
      queryClient.invalidateQueries({ queryKey: ["pending-test-results"] });
      setSelectedResultId(null);
      setRejectionReason("");
    },
    onError: (error) => {
      toast.error("Failed to reject: " + error.message);
    }
  });

  const selectedResult = pendingResults.find(r => r.id === selectedResultId);

  const testTypeLabels: Record<string, string> = {
    "7_day": "7-Day",
    "14_day": "14-Day",
    "28_day": "28-Day",
    slump: "Slump",
    cylinder: "Cylinder",
    air: "Air Content",
    other: "Other",
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Pending Test Results
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : pendingResults.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No pending results</h3>
              <p className="text-sm text-muted-foreground">
                Results emailed to your business address will appear here
              </p>
            </div>
          ) : selectedResult ? (
            // Detail view
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedResultId(null)}
              >
                ← Back to list
              </Button>

              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{selectedResult.subject || "(No subject)"}</p>
                      <p className="text-sm text-muted-foreground">{selectedResult.from_email}</p>
                    </div>
                    <Badge variant="secondary">
                      {format(new Date(selectedResult.received_at), "d MMM HH:mm")}
                    </Badge>
                  </div>

                  {selectedResult.lab_report_url && (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setPreviewUrl(selectedResult.lab_report_url)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View in App
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={selectedResult.lab_report_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  )}

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <FlaskConical className="w-4 h-4" />
                      Extracted Data
                    </h4>
                    
                    {selectedResult.extracted_data.note ? (
                      <p className="text-sm text-muted-foreground italic">
                        {selectedResult.extracted_data.note}
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Test ID:</span>
                          <p className="font-medium">{selectedResult.extracted_data.test_id || "—"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Type:</span>
                          <p className="font-medium">
                            {selectedResult.extracted_data.test_type 
                              ? testTypeLabels[selectedResult.extracted_data.test_type] || selectedResult.extracted_data.test_type
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Target MPa:</span>
                          <p className="font-medium">{selectedResult.extracted_data.target_mpa || "—"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Actual MPa:</span>
                          <p className="font-medium">{selectedResult.extracted_data.actual_mpa || "—"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Test Date:</span>
                          <p className="font-medium">
                            {selectedResult.extracted_data.test_date 
                              ? format(new Date(selectedResult.extracted_data.test_date), "d MMM yyyy")
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Pour Date:</span>
                          <p className="font-medium">
                            {selectedResult.extracted_data.pour_date 
                              ? format(new Date(selectedResult.extracted_data.pour_date), "d MMM yyyy")
                              : "—"}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Supplier:</span>
                          <p className="font-medium">{selectedResult.extracted_data.supplier || "—"}</p>
                        </div>
                        {selectedResult.extracted_data.docket_number && (
                          <div>
                            <span className="text-muted-foreground">Docket #:</span>
                            <p className="font-medium">{selectedResult.extracted_data.docket_number}</p>
                          </div>
                        )}
                        {selectedResult.extracted_data.site_address && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              Site Address:
                            </span>
                            <p className="font-medium text-xs">{selectedResult.extracted_data.site_address}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Suggested Matches Section */}
                  {(() => {
                    const suggestions = getSuggestedMatches(selectedResult);
                    if (suggestions.length === 0) return null;
                    
                    return (
                      <>
                        <div className="space-y-3">
                          <h4 className="font-medium flex items-center gap-2 text-primary">
                            <Sparkles className="w-4 h-4" />
                            Suggested Matches
                          </h4>
                          
                          <div className="space-y-2">
                            {suggestions.map((match, idx) => (
                              <button
                                key={match.jobId}
                                onClick={() => {
                                  setSelectedJobId(match.jobId);
                                  if (match.pourId) setSelectedPourId(match.pourId);
                                }}
                                className={`w-full text-left p-2 rounded-md border transition-colors ${
                                  selectedJobId === match.jobId 
                                    ? 'border-primary bg-primary/10' 
                                    : 'border-border hover:bg-muted/50'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-sm">{match.jobName}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    <Target className="w-3 h-3 mr-1" />
                                    {match.score}%
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {match.reasons.map((reason, i) => (
                                    <span key={i} className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                      {reason}
                                    </span>
                                  ))}
                                </div>
                                {match.pourName && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    → Pour: {match.pourName}
                                  </p>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <Separator />
                      </>
                    );
                  })()}

                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Link to Job
                    </h4>

                    <div>
                      <Label>Job *</Label>
                      <Select value={selectedJobId || ""} onValueChange={setSelectedJobId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a job" />
                        </SelectTrigger>
                        <SelectContent>
                          {jobs.map(job => (
                            <SelectItem key={job.id} value={job.id}>
                              {job.job_number ? `${job.job_number} - ` : ""}{job.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedJobId && (
                      <div>
                        <Label>Pour (optional)</Label>
                        <Select 
                          value={selectedPourId || "none"} 
                          onValueChange={(val) => setSelectedPourId(val === "none" ? null : val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Link to a specific pour" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No specific pour</SelectItem>
                            {pours.map(pour => (
                              <SelectItem key={pour.id} value={pour.id}>
                                {pour.pour_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {pours.length === 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            No pours found for this job
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => approveMutation.mutate(selectedResult)}
                      disabled={!selectedJobId || approveMutation.isPending}
                      className="flex-1"
                    >
                      {approveMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => rejectMutation.mutate(selectedResult.id)}
                      disabled={rejectMutation.isPending}
                    >
                      {rejectMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            // List view
            <div className="space-y-3">
              {pendingResults.map(result => (
                <Card 
                  key={result.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedResultId(result.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">
                          {result.subject || "(No subject)"}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {result.from_email}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(result.received_at), "d MMM yyyy HH:mm")}
                          {result.lab_report_url && (
                            <>
                              <span>•</span>
                              <FileText className="w-3 h-3" />
                              PDF attached
                            </>
                          )}
                        </div>
                      </div>
                      {result.extracted_data.test_id && (
                        <Badge variant="outline" className="shrink-0">
                          {result.extracted_data.test_id}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>

      {/* PDF Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Lab Report
              </span>
              {previewUrl && (
                <Button variant="ghost" size="sm" asChild>
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in New Tab
                  </a>
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {previewUrl && (
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title="Lab Report Preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
