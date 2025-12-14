import { useQuery } from "@tanstack/react-query";
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
import { FlaskConical, Plus, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
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

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">Loading test results...</div>
    );
  }

  if (tests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FlaskConical className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No Test Results Yet</h3>
          <p className="text-muted-foreground mb-4">
            Record concrete test results for this job
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Test Result
          </Button>
        </CardContent>
      </Card>
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
        <Button size="sm">
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
              <TableHead className="hidden md:table-cell">Test Date</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Actual</TableHead>
              <TableHead>Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tests.map((test) => (
              <TableRow key={test.id}>
                <TableCell className="font-mono text-sm">{test.test_id}</TableCell>
                <TableCell>{testTypeLabels[test.test_type] || test.test_type}</TableCell>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
