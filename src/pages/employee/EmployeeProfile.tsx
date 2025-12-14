import { EmployeeLayout } from "@/components/layout/EmployeeLayout";

export default function EmployeeProfile() {
  return (
    <EmployeeLayout>
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      <p className="text-muted-foreground">Profile settings coming soon.</p>
    </EmployeeLayout>
  );
}
