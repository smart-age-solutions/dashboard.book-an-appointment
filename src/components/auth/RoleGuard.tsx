import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

interface RoleGuardProps {
  children: React.ReactNode;
  /** Roles that are allowed to access this route. */
  allowedRoles: string[];
}

/**
 * Guards a route so that only users with one of the specified roles can access it.
 * Assumes the user is already authenticated (use inside ClientPageGuard).
 */
export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user } = useAuth();

  const role = user?.role ?? "staff";

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
