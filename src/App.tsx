import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminJobs from "./pages/admin/AdminJobs";
import AdminJobDetail from "./pages/admin/AdminJobDetail";
import AdminSchedule from "./pages/admin/AdminSchedule";
import AdminCrews from "./pages/admin/AdminCrews";
import AdminEmployees from "./pages/admin/AdminEmployees";
import AdminEquipment from "./pages/admin/AdminEquipment";
import AdminSettings from "./pages/admin/AdminSettings";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import EmployeeJobs from "./pages/employee/EmployeeJobs";
import EmployeeProfile from "./pages/employee/EmployeeProfile";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/jobs" element={<ProtectedRoute allowedRole="admin"><AdminJobs /></ProtectedRoute>} />
          <Route path="/admin/jobs/:id" element={<ProtectedRoute allowedRole="admin"><AdminJobDetail /></ProtectedRoute>} />
          <Route path="/admin/schedule" element={<ProtectedRoute allowedRole="admin"><AdminSchedule /></ProtectedRoute>} />
          <Route path="/admin/crews" element={<ProtectedRoute allowedRole="admin"><AdminCrews /></ProtectedRoute>} />
          <Route path="/admin/employees" element={<ProtectedRoute allowedRole="admin"><AdminEmployees /></ProtectedRoute>} />
          <Route path="/admin/equipment" element={<ProtectedRoute allowedRole="admin"><AdminEquipment /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute allowedRole="admin"><AdminSettings /></ProtectedRoute>} />
          
          {/* Employee Routes */}
          <Route path="/employee" element={<ProtectedRoute allowedRole="staff"><EmployeeDashboard /></ProtectedRoute>} />
          <Route path="/employee/jobs" element={<ProtectedRoute allowedRole="staff"><EmployeeJobs /></ProtectedRoute>} />
          <Route path="/employee/profile" element={<ProtectedRoute allowedRole="staff"><EmployeeProfile /></ProtectedRoute>} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
