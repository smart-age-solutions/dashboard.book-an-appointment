import { useAuth } from "@/contexts/AuthContext";
import { useAdminMode } from "@/contexts/AdminModeContext";
import { Navigate } from "react-router-dom";

interface RoleGuardProps {
  children: React.ReactNode;
  /**
   * Roles that are allowed to access this route.
   * "owner" always passes regardless — it is the highest-privilege role.
   * Role hierarchy (highest → lowest): owner > admin > manager > member / staff
   */
  allowedRoles: string[];
}

/**
 * Guards a route so that only users with one of the specified roles can access it.
 * Assumes the user is already authenticated (use inside ClientPageGuard).
 *
 * "owner" is a super-role: it always has access to every route, no matter
 * what allowedRoles specifies.
 */
export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user } = useAuth();
  const { isAdminMode } = useAdminMode();

  // Backoffice users have no role field; grant full access while in Admin Mode
  const role = isAdminMode ? "owner" : ((user as any)?.role ?? "staff");

  // Owner always has full access — highest privilege role in a client workspace.
  const hasAccess = role === "owner" || allowedRoles.includes(role);

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
