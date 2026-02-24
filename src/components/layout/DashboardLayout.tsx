import { useState } from "react";
import { Sidebar, clientNavigation, backofficeNavigation } from "./Sidebar";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Building2, ArrowRight, Calendar, Menu } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isBackofficeUser } = useAuth();
  const { isImpersonating } = useImpersonation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If backoffice user is on a client page but NOT impersonating, show a guard
  const isClientPage = !window.location.pathname.startsWith("/backoffice");
  const showGuard = isBackofficeUser && !isImpersonating && isClientPage;
  const showClientNav = !isBackofficeUser || isImpersonating;
  const showBackofficeNav = isBackofficeUser;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className={`min-h-screen md:ml-64${isImpersonating ? " pt-10" : ""}`}>
        {/* Mobile header */}
        <header className="flex items-center justify-between gap-3 border-b border-sidebar-border bg-background px-4 py-3 md:hidden">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Open navigation menu"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Calendar className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold md:text-base">SmartAppointment</span>
          </Link>
          <div className="w-9" />
        </header>

        {/* Mobile navigation sheet */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="flex flex-col gap-4 bg-sidebar p-4 text-sidebar-foreground">
            <div className="flex items-center justify-between gap-2">
              <span className="text-base font-semibold md:text-lg">Menu</span>
            </div>
            <nav className="space-y-1">
              {showClientNav &&
                clientNavigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      [
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs md:text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      ].join(" ")
                    }
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </NavLink>
                ))}

              {showBackofficeNav && (
                <>
                  {showClientNav && (
                    <p className="pt-3 text-xs font-semibold uppercase tracking-wider text-sidebar-muted">
                      Backoffice
                    </p>
                  )}
                  {backofficeNavigation.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={({ isActive }) =>
                        [
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs md:text-sm font-medium transition-all duration-200",
                          isActive ? "bg-blue-600 text-white" : "text-blue-200 hover:bg-blue-600/20 hover:text-white",
                        ].join(" ")
                      }
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </NavLink>
                  ))}
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        <div className="p-4 md:p-8">
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
