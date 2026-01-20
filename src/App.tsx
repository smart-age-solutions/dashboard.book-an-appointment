import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ImpersonationProvider } from "@/contexts/ImpersonationContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import Dashboard from "./pages/Dashboard";
import CalendarPage from "./pages/CalendarPage";
import AppointmentsPage from "./pages/AppointmentsPage";

import EmailTemplatesPage from "./pages/EmailTemplatesPage";
import UsersPage from "./pages/UsersPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import BackofficePage from "./pages/BackofficePage";
import BackofficeLogsPage from "./pages/BackofficeLogsPage";
import BackofficeInvitationPage from "./pages/BackofficeInvitationPage";
import InvitationAcceptPage from "./pages/InvitationAcceptPage";
import NotFound from "./pages/NotFound";

import { ClientPageGuard } from "@/components/auth/ClientPageGuard";

const queryClient = new QueryClient();

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
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/invitation/accept" element={<InvitationAcceptPage />} />
                
                {/* Protected Client Routes */}
                <Route path="/" element={<ClientPageGuard><Dashboard /></ClientPageGuard>} />
                <Route path="/calendar" element={<ClientPageGuard><CalendarPage /></ClientPageGuard>} />
                <Route path="/appointments" element={<ClientPageGuard><AppointmentsPage /></ClientPageGuard>} />
                <Route path="/email-templates" element={<ClientPageGuard><EmailTemplatesPage /></ClientPageGuard>} />
                <Route path="/users" element={<ClientPageGuard><UsersPage /></ClientPageGuard>} />
                <Route path="/settings" element={<ClientPageGuard><SettingsPage /></ClientPageGuard>} />
                
                {/* Backoffice Routes */}
                <Route path="/backoffice" element={<BackofficePage />} />
                <Route path="/backoffice/logs" element={<BackofficeLogsPage />} />
                <Route path="/backoffice/invite" element={<BackofficeInvitationPage />} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </StoreProvider>
        </ImpersonationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
