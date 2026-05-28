import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ImpersonationProvider } from "@/contexts/ImpersonationContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const AppointmentsPage = lazy(() => import("./pages/AppointmentsPage"));
const EmailTemplatesPage = lazy(() => import("./pages/EmailTemplatesPage"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const BackofficePage = lazy(() => import("./pages/BackofficePage"));
const BackofficeRegisterClientPage = lazy(() => import("./pages/BackofficeRegisterClientPage"));
const BackofficeUsersPage = lazy(() => import("./pages/BackofficeUsersPage"));
const BackofficeLogsPage = lazy(() => import("./pages/BackofficeLogsPage"));
const BackofficeInvitationPage = lazy(() => import("./pages/BackofficeInvitationPage"));
const InvitationAcceptPage = lazy(() => import("./pages/InvitationAcceptPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const BookingPage = lazy(() => import("./pages/BookingPage"));
const SlugBookingPage = lazy(() => import("./pages/SlugBookingPage"));
const ManageAppointmentPage = lazy(() => import("./pages/ManageAppointmentPage"));
const BookingPagesPage = lazy(() => import("./pages/BookingPagesPage"));
const CustomersPage = lazy(() => import("./pages/CustomersPage"));
const ActivityPage = lazy(() => import("./pages/ActivityPage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

import { ClientPageGuard } from "@/components/auth/ClientPageGuard";
import { BackofficeGuard } from "@/components/auth/BackofficeGuard";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ImpersonationProvider>
          <StoreProvider>
            <Toaster />
            <Sonner />
            <ImpersonationBanner />
            <BrowserRouter>
              <ErrorBoundary>
              <Suspense fallback={
                <div className="flex h-screen items-center justify-center bg-background">
                  <LoadingSpinner size={48} />
                </div>
              }>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/invitation/accept" element={<InvitationAcceptPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />

                  {/* Public Booking Routes (no auth required) */}
                  <Route path="/book/:slug" element={<SlugBookingPage />} />
                  <Route path="/book/:slug/manage" element={<ManageAppointmentPage />} />
                  <Route path="/booking/:clientId" element={<BookingPage />} />
                  <Route path="/manage/:appointmentId" element={<ManageAppointmentPage />} />
                  
                  {/* Protected Client Routes */}
                  <Route path="/" element={<ClientPageGuard><Dashboard /></ClientPageGuard>} />
                  <Route path="/calendar" element={<ClientPageGuard><CalendarPage /></ClientPageGuard>} />
                  <Route path="/appointments" element={<ClientPageGuard><AppointmentsPage /></ClientPageGuard>} />
                  <Route path="/customers" element={<ClientPageGuard><RoleGuard allowedRoles={["owner", "admin", "manager"]}><CustomersPage /></RoleGuard></ClientPageGuard>} />
                  <Route path="/booking-pages" element={<ClientPageGuard><RoleGuard allowedRoles={["owner", "admin", "manager"]}><BookingPagesPage /></RoleGuard></ClientPageGuard>} />
                  <Route path="/email-templates" element={<ClientPageGuard><RoleGuard allowedRoles={["owner", "admin", "manager"]}><EmailTemplatesPage /></RoleGuard></ClientPageGuard>} />
                  <Route path="/users" element={<ClientPageGuard><RoleGuard allowedRoles={["owner", "admin"]}><UsersPage /></RoleGuard></ClientPageGuard>} />
                  <Route path="/settings" element={<ClientPageGuard><RoleGuard allowedRoles={["owner", "admin"]}><SettingsPage /></RoleGuard></ClientPageGuard>} />
                  <Route path="/activity" element={<ClientPageGuard><RoleGuard allowedRoles={["owner", "admin", "manager"]}><ActivityPage /></RoleGuard></ClientPageGuard>} />
                  <Route path="/help" element={<ClientPageGuard><HelpPage /></ClientPageGuard>} />
                  
                  {/* Backoffice Routes */}
                  <Route path="/backoffice" element={<BackofficeGuard><BackofficePage /></BackofficeGuard>} />
                  <Route path="/backoffice/clients/new" element={<BackofficeGuard><BackofficeRegisterClientPage /></BackofficeGuard>} />
                  <Route path="/backoffice/users" element={<BackofficeGuard><BackofficeUsersPage /></BackofficeGuard>} />
                  <Route path="/backoffice/logs" element={<BackofficeGuard><BackofficeLogsPage /></BackofficeGuard>} />
                  <Route path="/backoffice/invite" element={<BackofficeGuard><BackofficeInvitationPage /></BackofficeGuard>} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              </ErrorBoundary>
            </BrowserRouter>
          </StoreProvider>
        </ImpersonationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
