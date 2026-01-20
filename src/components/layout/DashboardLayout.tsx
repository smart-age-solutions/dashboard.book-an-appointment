import { Sidebar } from "./Sidebar";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Building2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isBackofficeUser } = useAuth();
  const { isImpersonating } = useImpersonation();

  // If backoffice user is on a client page but NOT impersonating, show a guard
  const isClientPage = !window.location.pathname.startsWith("/backoffice");
  const showGuard = isBackofficeUser && !isImpersonating && isClientPage;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className={`ml-64 min-h-screen ${isImpersonating ? "pt-10" : ""}`}>
        <div className="p-8">
          {showGuard ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Impersonation Required</h2>
              <p className="text-muted-foreground mb-8 text-balance">
                You are currently logged in as a Backoffice administrator. To view or manage client data, please select a client from the management portal.
              </p>
              <Button asChild size="lg" className="w-full">
                <Link to="/backoffice">
                  Go to Client Management
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
}
