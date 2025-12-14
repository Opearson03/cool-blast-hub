import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FlaskConical, Plus, CheckCircle, XCircle, AlertTriangle, Pencil, Trash2, FileText, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { TestResultFormDialog } from "@/components/jobs/TestResultFormDialog";
import type { Tables } from "@/integrations/supabase/types";

type ConcreteTest = Tables<"concrete_tests">;

interface JobTestResultsTabProps {
  jobId: string;
}

const testTypeLabels: Record<string, string> = {
  "7_day": "7-Day",
  "28_day": "28-Day",
  slump: "Slump",
  cylinder: "Cylinder",
  air: "Air Content",
  other: "Other",
};

export function JobTestResultsTab({ jobId }: JobTestResultsTabProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editTest, setEditTest] = useState<ConcreteTest | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: tests = [], isLoading } = useQuery({
    queryKey: ["concrete-tests", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("concrete_tests")
        .select("*")
        .eq("job_id", jobId)
        .order("test_date", { ascending: false });
      if (error) throw error;
      return data as ConcreteTest[];
    },
  });

  const { data: pours = [] } = useQuery({
    queryKey: ["job-pours", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_pours")
        .select("id, pour_name")
        .eq("job_id", jobId);
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("concrete_tests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["concrete-tests", jobId] });
      toast.success("Test result deleted");
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Failed to delete test result");
    },
  });

  const getPourName = (pourId: string | null) => {
    if (!pourId) return null;
    const pour = pours.find((p) => p.id === pourId);
    return pour?.pour_name || null;
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">Loading test results...</div>
    );
  }

  if (tests.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="py-12 text-center">
            <FlaskConical className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Test Results Yet</h3>
            <p className="text-muted-foreground mb-4">
              Record concrete test results for this job
            </p>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Test Result
            </Button>
          </CardContent>
        </Card>
        <TestResultFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          jobId={jobId}
        />
      </>
    );
  }

  // Calculate stats
  const passedTests = tests.filter((t) => t.passed === true).length;
  const failedTests = tests.filter((t) => t.passed === false).length;
  const pendingTests = tests.filter((t) => t.passed === null).length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Concrete Test Results</h3>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Test
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto text-success mb-1" />
            <div className="text-2xl font-bold text-success">{passedTests}</div>
            <p className="text-xs text-muted-foreground">Passed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <XCircle className="w-6 h-6 mx-auto text-destructive mb-1" />
            <div className="text-2xl font-bold text-destructive">{failedTests}</div>
            <p className="text-xs text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto text-warning mb-1" />
            <div className="text-2xl font-bold text-warning">{pendingTests}</div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Test ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="hidden md:table-cell">Pour</TableHead>
              <TableHead className="hidden md:table-cell">Test Date</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Actual</TableHead>
              <TableHead>Result</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tests.map((test) => {
              const pourName = getPourName((test as any).pour_id);
              return (
                <TableRow key={test.id}>
                  <TableCell className="font-mono text-sm">{test.test_id}</TableCell>
                  <TableCell>{testTypeLabels[test.test_type] || test.test_type}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {pourName ? (
                      <Badge variant="outline" className="text-xs">
                        {pourName}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {test.test_date ? format(new Date(test.test_date), "d MMM yyyy") : "—"}
                  </TableCell>
                  <TableCell>{test.target_strength ? `${test.target_strength} MPa` : "—"}</TableCell>
                  <TableCell>{test.actual_strength ? `${test.actual_strength} MPa` : "—"}</TableCell>
                  <TableCell>
                    {test.passed === true && (
                      <Badge className="bg-success/20 text-success border-success/30">Pass</Badge>
                    )}
                    {test.passed === false && (
                      <Badge variant="destructive">Fail</Badge>
                    )}
                    {test.passed === null && (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {test.lab_report_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                        >
                          <a href={test.lab_report_url} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-4 w-4 text-primary" />
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditTest(test);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeleteId(test.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <TestResultFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditTest(null);
        }}
        jobId={jobId}
        editTest={editTest}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Test Result?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this test result and any associated lab report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
