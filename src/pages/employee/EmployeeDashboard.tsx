import { EmployeeLayout } from "@/components/layout/EmployeeLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EmployeeDashboard() {
  return (
    <EmployeeLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Dashboard</h1>
        <Card>
          <CardHeader>
            <CardTitle>Today's Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No jobs assigned for today.</p>
          </CardContent>
        </Card>
      </div>
    </EmployeeLayout>
  );
}
