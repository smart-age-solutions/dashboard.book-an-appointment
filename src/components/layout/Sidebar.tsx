import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  List,
  Mail,
  Users,
  Settings,
  
  Building2,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useImpersonation } from "@/contexts/ImpersonationContext";

const clientNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Appointments", href: "/appointments", icon: List },
  { name: "Email Templates", href: "/email-templates", icon: Mail },
  { name: "Users", href: "/users", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

const backofficeNavigation = [
  { name: "Client Management", href: "/backoffice", icon: Building2 },
  { name: "Global Logs", href: "/backoffice/logs", icon: FileText },
];

export function Sidebar() {
  const location = useLocation();
  const { user, isBackofficeUser } = useAuth();
  const { isImpersonating } = useImpersonation();

  const getInitials = (name?: string) => {
    if (!name) return "??";
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  // Show client navigation when:
  // 1. User is a client
  // 2. Backoffice user is impersonating a client
  const showClientNav = !isBackofficeUser || isImpersonating;
  const showBackofficeNav = isBackofficeUser;

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
              <Calendar className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-sidebar-foreground">
              SmartAppointment
            </span>
          </NavLink>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {/* Client Navigation - shown for clients or during impersonation */}
          {showClientNav && (
            <>
              {clientNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </NavLink>
                );
              })}
            </>
          )}

          {/* Backoffice Navigation - only for backoffice users */}
          {showBackofficeNav && (
            <>
              {showClientNav && <div className="my-4 border-t border-sidebar-border" />}
              <p className="px-3 py-1 text-xs font-semibold uppercase text-sidebar-muted tracking-wider">
                Backoffice
              </p>
              {backofficeNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-blue-500 hover:bg-blue-600/20 hover:text-blue-400"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </NavLink>
                );
              })}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-foreground text-sm font-medium">
              {getInitials(user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-sidebar-muted truncate">
                {user?.email || ""}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
