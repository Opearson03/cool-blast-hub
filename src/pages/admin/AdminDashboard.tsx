import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Users, Calendar, AlertTriangle } from "lucide-react";

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Jobs Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" /> Active Crews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" /> This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-warning">0</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Welcome to PourHub! Start by setting up your business, adding employees, and creating your first job.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
