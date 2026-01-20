import { useAuth } from "@/contexts/AuthContext";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

interface ClientPageGuardProps {
  children: React.ReactNode;
}

/**
 * Guard component for routes that require a client context.
 * If a backoffice user is logged in but NOT impersonating, it stops
 * the page from mounting (preventing 403 API errors) and
 * DashboardLayout will handle showing the "Impersonation Required" UI.
 */
export function ClientPageGuard({ children }: ClientPageGuardProps) {
  const { isBackofficeUser } = useAuth();
  const { isImpersonating } = useImpersonation();

  // If backoffice user is NOT impersonating, don't render children
  // DashboardLayout will detect this state and show the guard UI.
  if (isBackofficeUser && !isImpersonating) {
    // We return the children wrapped in DashboardLayout so the Layout 
    // itself can show the guard, but the children (the actual page logic) 
    // are NOT mounted.
    return <DashboardLayout>{null}</DashboardLayout>;
  }

  return <>{children}</>;
}
