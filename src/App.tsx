import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import JobsBookingsManagement from "./pages/JobsBookingsManagement";
import StaffManagementHub from "./pages/StaffManagementHub";
import CustomersManagement from "./pages/CustomersManagement";
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffShifts from "./pages/staff/StaffShifts";
import StaffSWMS from "./pages/staff/StaffSWMS";
import StaffTimesheets from "./pages/staff/StaffTimesheets";
import StaffProfile from "./pages/staff/StaffProfile";
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
          <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><Admin /></ProtectedRoute>} />
          <Route path="/admin/jobs" element={<ProtectedRoute allowedRole="admin"><JobsBookingsManagement /></ProtectedRoute>} />
          <Route path="/admin/staff" element={<ProtectedRoute allowedRole="admin"><StaffManagementHub /></ProtectedRoute>} />
          <Route path="/admin/customers" element={<ProtectedRoute allowedRole="admin"><CustomersManagement /></ProtectedRoute>} />
          
          {/* Staff Routes */}
          <Route path="/staff" element={<ProtectedRoute allowedRole="staff"><StaffDashboard /></ProtectedRoute>} />
          <Route path="/staff/shifts" element={<ProtectedRoute allowedRole="staff"><StaffShifts /></ProtectedRoute>} />
          <Route path="/staff/swms" element={<ProtectedRoute allowedRole="staff"><StaffSWMS /></ProtectedRoute>} />
          <Route path="/staff/timesheets" element={<ProtectedRoute allowedRole="staff"><StaffTimesheets /></ProtectedRoute>} />
          <Route path="/staff/profile" element={<ProtectedRoute allowedRole="staff"><StaffProfile /></ProtectedRoute>} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
