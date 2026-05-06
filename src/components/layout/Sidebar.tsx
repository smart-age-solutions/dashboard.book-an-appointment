import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Calendar, List, Mail, Users, Settings, Building2, FileText, LogOut, PlusCircle, UserCog, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useImpersonation } from "@/contexts/ImpersonationContext";

/**
 * Role hierarchy for sidebar nav visibility.
 * Higher number = more privileges.
 * owner > admin > manager > staff (and member)
 */
const ROLE_ORDER: Record<string, number> = {
  staff:   0,
  member:  0, // alias for staff
  manager: 1,
  admin:   2,
  owner:   3, // highest privilege — can see everything
};

function hasMinRole(userRole: string | undefined, minRole: string): boolean {
  // owner always passes
  if (userRole === "owner") return true;
  const userLevel = ROLE_ORDER[userRole ?? "staff"] ?? 0;
  const minLevel  = ROLE_ORDER[minRole]            ?? 0;
  return userLevel >= minLevel;
}

export const clientNavigation = [
  { name: "Dashboard",       href: "/",               icon: LayoutDashboard, minRole: "staff"   },
  { name: "Calendar",        href: "/calendar",        icon: Calendar,        minRole: "staff"   },
  { name: "Appointments",    href: "/appointments",    icon: List,            minRole: "staff"   },
  { name: "Booking Pages",   href: "/booking-pages",   icon: FileText,        minRole: "manager" },
  { name: "Email Templates", href: "/email-templates", icon: Mail,            minRole: "manager" },
  { name: "Activity",        href: "/activity",        icon: Activity,        minRole: "manager" },
  { name: "Users",           href: "/users",           icon: Users,           minRole: "admin"   },
  { name: "Settings",        href: "/settings",        icon: Settings,        minRole: "admin"   },
];

export const backofficeNavigation = [
  { name: "Client Management", href: "/backoffice",      icon: Building2 },
  { name: "Register Client",   href: "/backoffice/clients/new", icon: PlusCircle },
  { name: "Global Users",      href: "/backoffice/users", icon: UserCog },
  { name: "Global Logs",       href: "/backoffice/logs", icon: FileText },
];

export function Sidebar() {
  const location = useLocation();
  const { user, isBackofficeUser, logout } = useAuth();
  const { isImpersonating } = useImpersonation();
  const navigate = useNavigate();
  // Cast to any because AuthContext union type doesn't surface .role directly on BackofficeUser
  const userRole: string = (user as any)?.role ?? "staff";

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":   return "bg-purple-500/20 text-purple-400";
      case "admin":   return "bg-blue-500/20 text-blue-400";
      case "manager": return "bg-teal-500/20 text-teal-400";
      default:        return "bg-sidebar-accent text-sidebar-muted";
    }
  };

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
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border hidden md:block">
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
              {clientNavigation.filter(item => hasMinRole(userRole, item.minRole)).map((item) => {
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
              {userRole && (
                <span className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold capitalize ${getRoleBadgeColor(userRole)}`}>
                  {userRole}
                </span>
              )}
            </div>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
