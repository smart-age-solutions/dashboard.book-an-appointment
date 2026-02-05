import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

interface BackofficeGuardProps {
  children: React.ReactNode;
}

export function BackofficeGuard({ children }: BackofficeGuardProps) {
  const { isAuthenticated, isBackofficeUser } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isBackofficeUser) {
    // If a client user tries to access backoffice, send them to their dashboard
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
