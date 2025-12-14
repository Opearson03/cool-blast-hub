import { EmployeeLayout } from "@/components/layout/EmployeeLayout";

export default function EmployeeJobs() {
  return (
    <EmployeeLayout>
      <h1 className="text-2xl font-bold mb-6">My Jobs</h1>
      <p className="text-muted-foreground">Your assigned jobs will appear here.</p>
    </EmployeeLayout>
  );
}
