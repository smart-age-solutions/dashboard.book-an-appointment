import { useAuth } from "@/contexts/AuthContext";
import { useAdminMode } from "@/contexts/AdminModeContext";
import { Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

interface ClientPageGuardProps {
  children: React.ReactNode;
}

/**
 * Guard component for routes that require a client context.
 * If a backoffice user is logged in but NOT in Admin Mode for a client,
 * it stops the page from mounting (preventing 403 API errors) and
 * DashboardLayout will handle showing the "Admin Mode Required" UI.
 */
export function ClientPageGuard({ children }: ClientPageGuardProps) {
  const { isAuthenticated, isBackofficeUser } = useAuth();
  const { isAdminMode } = useAdminMode();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If backoffice user is NOT in Admin Mode, don't render children.
  // DashboardLayout will detect this state and show the guard UI.
  if (isBackofficeUser && !isAdminMode) {
    // We return the children wrapped in DashboardLayout so the Layout
    // itself can show the guard, but the children (the actual page logic)
    // are NOT mounted.
    return <DashboardLayout>{null}</DashboardLayout>;
  }

  return <>{children}</>;
}
