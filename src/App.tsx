import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import Auth from "./pages/Auth";
import Signup from "./pages/Signup";
import SignupSuccess from "./pages/SignupSuccess";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import ResetPassword from "./pages/ResetPassword";
import WaitlistStatus from "./pages/WaitlistStatus";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminJobs from "./pages/admin/AdminJobs";
import AdminJobDetail from "./pages/admin/AdminJobDetail";
import AdminSchedule from "./pages/admin/AdminSchedule";
import AdminCrews from "./pages/admin/AdminCrews";
import AdminEmployees from "./pages/admin/AdminEmployees";
import AdminEquipment from "./pages/admin/AdminEquipment";
import AdminEstimates from "./pages/admin/AdminEstimates";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminContacts from "./pages/admin/AdminContacts";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import EmployeeSchedule from "./pages/employee/EmployeeSchedule";
import EmployeeContacts from "./pages/employee/EmployeeContacts";
import EmployeeProfile from "./pages/employee/EmployeeProfile";
import EmployeeLeave from "./pages/employee/EmployeeLeave";
import StaffAuth from "./pages/staff/StaffAuth";
import StaffDashboard from "./pages/staff/StaffDashboard";
import SignQuote from "./pages/public/SignQuote";
import SignVariation from "./pages/public/SignVariation";
import RespondInvite from "./pages/public/RespondInvite";
import SuppliersLanding from "./pages/suppliers/SuppliersLanding";
import SupplierDashboard from "./pages/suppliers/SupplierDashboard";
import { SupplierProtectedRoute } from "./components/suppliers/SupplierProtectedRoute";
import SubcontractorsLanding from "./pages/subcontractors/SubcontractorsLanding";
import SubcontractorSignup from "./pages/subcontractors/SubcontractorSignup";
import SubcontractorDashboardPage from "./pages/subcontractors/SubcontractorDashboardPage";
import SubcontractorWork from "./pages/subcontractors/SubcontractorWork";
import SubcontractorSchedule from "./pages/subcontractors/SubcontractorSchedule";
import SubcontractorSettings from "./pages/subcontractors/SubcontractorSettings";
import { SubcontractorProtectedRoute } from "./components/subcontractors/SubcontractorProtectedRoute";
import Articles from "./pages/Articles";
import ArticlePage from "./pages/ArticlePage";
import SubcontractorDirectory from "./pages/directory/SubcontractorDirectory";
import SubcontractorProfilePage from "./pages/directory/SubcontractorProfilePage";
import NotFound from "./pages/NotFound";
import AffiliateRegistration from "./pages/AffiliateRegistration";
import AffiliateDashboard from "./pages/AffiliateDashboard";
import Bookings from "./pages/Bookings";
import EOFY from "./pages/EOFY";
import Enterprise from "./pages/Enterprise";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { StaffProtectedRoute } from "./components/staff/StaffProtectedRoute";
import { useNativeCapabilities } from "./hooks/useNativeCapabilities";
import { AuthProvider } from "./contexts/AuthContext";
import { supabase } from "./integrations/supabase/client";

const queryClient = new QueryClient();

const AppContent = () => {
  const queryClientInstance = useQueryClient();
  
  // Initialize native capabilities (push notifications, geolocation)
  useNativeCapabilities();
  
  // Clear ALL cached queries when auth state changes to prevent cross-business data leakage
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        queryClientInstance.clear();
      }
    });
    
    return () => subscription.unsubscribe();
  }, [queryClientInstance]);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/signup/success" element={<SignupSuccess />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsConditions />} />
      <Route path="/waitlist-status" element={<WaitlistStatus />} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/jobs" element={<ProtectedRoute allowedRole="admin"><AdminJobs /></ProtectedRoute>} />
      <Route path="/admin/jobs/:id" element={<ProtectedRoute allowedRole="admin"><AdminJobDetail /></ProtectedRoute>} />
      <Route path="/admin/schedule" element={<ProtectedRoute allowedRole="admin"><AdminSchedule /></ProtectedRoute>} />
      {/* Hidden for now - keeping code for future: */}
      {/* <Route path="/admin/crews" element={<ProtectedRoute allowedRole="admin"><AdminCrews /></ProtectedRoute>} /> */}
      {/* <Route path="/admin/employees" element={<ProtectedRoute allowedRole="admin"><AdminEmployees /></ProtectedRoute>} /> */}
      {/* <Route path="/admin/equipment" element={<ProtectedRoute allowedRole="admin"><AdminEquipment /></ProtectedRoute>} /> */}
      <Route path="/admin/estimates" element={<ProtectedRoute allowedRole="admin"><AdminEstimates /></ProtectedRoute>} />
      <Route path="/admin/contacts" element={<ProtectedRoute allowedRole="admin"><AdminContacts /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute allowedRole="admin"><AdminSettings /></ProtectedRoute>} />
      
      {/* Employee Routes - Hidden for now - keeping code for future: */}
      {/* <Route path="/employee" element={<ProtectedRoute allowedRole="staff"><EmployeeDashboard /></ProtectedRoute>} /> */}
      {/* <Route path="/employee/schedule" element={<ProtectedRoute allowedRole="staff"><EmployeeSchedule /></ProtectedRoute>} /> */}
      {/* <Route path="/employee/leave" element={<ProtectedRoute allowedRole="staff"><EmployeeLeave /></ProtectedRoute>} /> */}
      {/* <Route path="/employee/contacts" element={<ProtectedRoute allowedRole="staff"><EmployeeContacts /></ProtectedRoute>} /> */}
      {/* <Route path="/employee/profile" element={<ProtectedRoute allowedRole="staff"><EmployeeProfile /></ProtectedRoute>} /> */}
      
      {/* Staff Routes - accessible via staff.pourhub.com.au or /staff path */}
      <Route path="/staff" element={<StaffAuth />} />
      <Route path="/staff/dashboard" element={<StaffProtectedRoute><StaffDashboard /></StaffProtectedRoute>} />
      
      {/* Supplier Routes - accessible via suppliers.pourhub.com.au or /suppliers path */}
      <Route path="/suppliers" element={<SuppliersLanding />} />
      <Route path="/suppliers/dashboard" element={<SupplierProtectedRoute><SupplierDashboard /></SupplierProtectedRoute>} />
      
      {/* Subcontractor Routes */}
      <Route path="/sub-contractors" element={<SubcontractorsLanding />} />
      <Route path="/sub-contractors/signup" element={<SubcontractorSignup />} />
      <Route path="/sub-contractors/dashboard" element={<SubcontractorProtectedRoute><SubcontractorDashboardPage /></SubcontractorProtectedRoute>} />
      <Route path="/sub-contractors/work" element={<SubcontractorProtectedRoute><SubcontractorWork /></SubcontractorProtectedRoute>} />
      <Route path="/sub-contractors/schedule" element={<SubcontractorProtectedRoute><SubcontractorSchedule /></SubcontractorProtectedRoute>} />
      <Route path="/sub-contractors/settings" element={<SubcontractorProtectedRoute><SubcontractorSettings /></SubcontractorProtectedRoute>} />
      
      {/* Articles */}
      <Route path="/articles" element={<Articles />} />
      <Route path="/articles/:slug" element={<ArticlePage />} />
      
      {/* Admin Directory */}
      <Route path="/admin/directory" element={<ProtectedRoute allowedRole="admin"><SubcontractorDirectory /></ProtectedRoute>} />
      <Route path="/admin/directory/:id" element={<ProtectedRoute allowedRole="admin"><SubcontractorProfilePage /></ProtectedRoute>} />
      
      {/* Public Signing Routes - no auth required */}
      <Route path="/sign/quote/:token" element={<SignQuote />} />
      <Route path="/sign/variation/:token" element={<SignVariation />} />
      <Route path="/i/:token" element={<RespondInvite />} />
      
      {/* Affiliate Routes */}
      <Route path="/affiliates" element={<AffiliateRegistration />} />
      <Route path="/affiliates/dashboard" element={<AffiliateDashboard />} />

      {/* Booking Route */}
      <Route path="/bookings" element={<Bookings />} />
      <Route path="/eofy" element={<EOFY />} />
      <Route path="/enterprise" element={<Enterprise />} />

      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
