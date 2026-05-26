import { useState } from "react";
import {
  Calendar, Clock, X, Check, Mail, Settings, UserPlus, UserMinus,
  MapPin, Activity, Search, Filter, Palette, ChevronLeft, ChevronRight, User,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { format, formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// ── Config maps ───────────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<string, { icon: typeof Activity; bg: string; text: string; label: string }> = {
  // Appointments
  create_appointment:    { icon: Calendar,  bg: "bg-green-500/10",    text: "text-green-600",        label: "Booked"           },
  appointment_created:   { icon: Calendar,  bg: "bg-green-500/10",    text: "text-green-600",        label: "Booked"           },
  update_appointment:    { icon: Clock,     bg: "bg-blue-500/10",     text: "text-blue-600",         label: "Updated"          },
  appointment_updated:   { icon: Clock,     bg: "bg-blue-500/10",     text: "text-blue-600",         label: "Updated"          },
  cancel_appointment:    { icon: X,         bg: "bg-destructive/10",  text: "text-destructive",      label: "Cancelled"        },
  appointment_cancelled: { icon: X,         bg: "bg-destructive/10",  text: "text-destructive",      label: "Cancelled"        },
  // Auth
  login:                 { icon: Check,     bg: "bg-muted",           text: "text-muted-foreground", label: "Signed in"        },
  login_success:         { icon: Check,     bg: "bg-muted",           text: "text-muted-foreground", label: "Signed in"        },
  login_failed:          { icon: X,         bg: "bg-destructive/10",  text: "text-destructive",      label: "Login failed"     },
  user_registered:       { icon: UserPlus,  bg: "bg-green-500/10",    text: "text-green-600",        label: "Registered"       },
  invitation_accepted:   { icon: Check,     bg: "bg-green-500/10",    text: "text-green-600",        label: "Invite accepted"  },
  password_reset:        { icon: Settings,  bg: "bg-muted",           text: "text-muted-foreground", label: "Password reset"   },
  password_changed:      { icon: Settings,  bg: "bg-muted",           text: "text-muted-foreground", label: "Password changed" },
  // Team / Users
  invite_user:           { icon: UserPlus,  bg: "bg-purple-500/10",   text: "text-purple-600",       label: "User invited"     },
  team_member_invited:   { icon: UserPlus,  bg: "bg-purple-500/10",   text: "text-purple-600",       label: "User invited"     },
  remove_user:           { icon: UserMinus, bg: "bg-orange-500/10",   text: "text-orange-600",       label: "User removed"     },
  team_member_removed:   { icon: UserMinus, bg: "bg-orange-500/10",   text: "text-orange-600",       label: "User removed"     },
  team_member_updated:   { icon: User,      bg: "bg-blue-500/10",     text: "text-blue-600",         label: "User updated"     },
  // Settings (keys kept for prefix fallback in getConfig)
  update_settings:       { icon: Settings,  bg: "bg-yellow-500/10",   text: "text-yellow-600",       label: "Settings"         },
  update_branding:       { icon: Palette,   bg: "bg-pink-500/10",     text: "text-pink-600",         label: "Branding"         },
  // Stores
  create_store:          { icon: MapPin,    bg: "bg-teal-500/10",     text: "text-teal-600",         label: "Location added"   },
  update_store:          { icon: MapPin,    bg: "bg-teal-500/10",     text: "text-teal-600",         label: "Location updated" },
  delete_store:          { icon: MapPin,    bg: "bg-destructive/10",  text: "text-destructive",      label: "Location deleted" },
  // Slots
  slot_override_created: { icon: Clock,     bg: "bg-yellow-500/10",   text: "text-yellow-600",       label: "Slot blocked"     },
  slot_override_deleted: { icon: Clock,     bg: "bg-green-500/10",    text: "text-green-600",        label: "Slot unblocked"   },
  // Email
  send_email:            { icon: Mail,      bg: "bg-indigo-500/10",   text: "text-indigo-600",       label: "Email sent"       },
};

const ENTITY_BADGE: Record<string, { label: string; cls: string }> = {
  appointment: { label: "Appointment", cls: "bg-blue-500/10 text-blue-600 border-blue-200"      },
  user:        { label: "User",        cls: "bg-purple-500/10 text-purple-600 border-purple-200" },
  settings:    { label: "Settings",    cls: "bg-yellow-500/10 text-yellow-600 border-yellow-200" },
  store:       { label: "Location",    cls: "bg-teal-500/10 text-teal-600 border-teal-200"       },
  slot:        { label: "Slot",        cls: "bg-orange-500/10 text-orange-600 border-orange-200" },
  team:        { label: "Team",        cls: "bg-indigo-500/10 text-indigo-600 border-indigo-200" },
  email:       { label: "Email",       cls: "bg-pink-500/10 text-pink-600 border-pink-200"       },
};

function getConfig(action: string) {
  if (ACTION_CONFIG[action]) return ACTION_CONFIG[action];
  if (action.startsWith("settings_updated_")) {
    return action === "settings_updated_branding"
      ? ACTION_CONFIG.update_branding
      : ACTION_CONFIG.update_settings;
  }
  return { icon: Activity, bg: "bg-muted", text: "text-muted-foreground", label: action.replace(/_/g, " ") };
}

function getMessage(log: any): string {
  const actor = log.actor_name || "System";
  const d = log.details || {};

  const customerName = d.client_name || d.customer_name
    || (d.first_name ? `${d.first_name}${d.last_name ? " " + d.last_name : ""}`.trim() : null);
  const service = d.purpose || d.service_name || d.service || "";

  switch (log.action) {
    case "create_appointment":
    case "appointment_created":
      return `${actor} booked appointment${customerName ? ` for ${customerName}` : ""}${service ? ` · ${service}` : ""}`;

    case "update_appointment":
    case "appointment_updated":
      return `${actor} updated appointment${customerName ? ` for ${customerName}` : ""}${service ? ` · ${service}` : ""}`;

    case "cancel_appointment":
    case "appointment_cancelled":
      return `${actor} cancelled appointment${customerName ? ` for ${customerName}` : ""}`;

    case "login":
    case "login_success":
      return `${actor} signed in`;

    case "login_failed":
      return `Failed sign-in attempt${d.email ? ` for ${d.email}` : ""}`;

    case "invite_user":
    case "team_member_invited":
      return `${actor} invited ${d.invited_email || d.email || "a new user"}${d.role ? ` as ${d.role}` : ""}`;

    case "remove_user":
    case "team_member_removed":
      return `${actor} removed ${d.user_name || d.email || "a team member"}`;

    case "team_member_updated":
      return `${actor} updated a team member`;

    case "user_registered":
      return `${actor} registered${d.company_name ? ` (${d.company_name})` : ""}`;

    case "invitation_accepted":
      return `${d.email || actor} accepted their invitation`;

    case "password_reset":
      return `${actor} reset their password`;

    case "password_changed":
      return `${actor} changed their password`;

    case "slot_override_created":
      return `${actor} blocked a time slot`;

    case "slot_override_deleted":
      return `${actor} unblocked a time slot`;

    case "update_settings":
    case "update_branding":
      return `${actor} updated settings`;

    case "create_store":
      return `${actor} added location "${d.store_name || d.name || ""}"`;

    case "update_store":
      return `${actor} updated location "${d.store_name || d.name || ""}"`;

    case "delete_store":
      return `${actor} deleted a location`;

    case "send_email":
      return `Email sent to ${d.to || d.recipient || "recipient"}${d.subject ? ` — "${d.subject}"` : ""}`;

    default:
      if (log.action.startsWith("settings_updated_")) {
        const type = log.action.replace("settings_updated_", "").replace(/_/g, " ");
        return `${actor} updated ${type} settings`;
      }
      return `${actor} · ${log.action.replace(/_/g, " ")}`;
  }
}

function getSubDetails(log: any): string[] {
  const d = log.details || {};
  const lines: string[] = [];

  if (log.entity_type === "appointment") {
    if (d.date) lines.push(`Date: ${format(new Date(d.date), "MMM d, yyyy")}`);
    if (d.slot_time || d.start_time) lines.push(`Time: ${d.slot_time || d.start_time}`);
    if (d.staff_name || d.user_name) lines.push(`Staff: ${d.staff_name || d.user_name}`);
    if (d.email) lines.push(`Email: ${d.email}`);
    if (d.phone) lines.push(`Phone: ${d.phone}`);
    if (d.status) lines.push(`Status: ${d.status}`);
    // appointment_updated stores changes in d.changes
    const changes = d.changes || {};
    if (changes.new_date) lines.push(`New date: ${format(new Date(changes.new_date), "MMM d, yyyy")}`);
    if (changes.old_date) lines.push(`Old date: ${format(new Date(changes.old_date), "MMM d, yyyy")}`);
    if (changes.new_time) lines.push(`New time: ${changes.new_time}`);
    if (changes.old_time) lines.push(`Old time: ${changes.old_time}`);
    if (changes.status) lines.push(`New status: ${changes.status}`);
  }

  if (log.entity_type === "user") {
    if (d.email) lines.push(`Email: ${d.email}`);
    if (d.role) lines.push(`Role: ${d.role}`);
  }

  if (log.action === "update_settings" && d.updated_fields?.length) {
    lines.push(`Fields: ${d.updated_fields.join(", ")}`);
  }

  if (log.entity_id && log.entity_type !== "settings") {
    lines.push(`ID: ${log.entity_id}`);
  }

  return lines;
}

// ── Pagination helper ─────────────────────────────────────────────────────────

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}

// ── Page component ────────────────────────────────────────────────────────────

const PER_PAGE = 20;

export default function ActivityPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const queryParams: Record<string, any> = { page, per_page: PER_PAGE };
  if (actionFilter !== "all") queryParams.action = actionFilter;
  if (entityFilter !== "all") queryParams.entity_type = entityFilter;
  if (startDate) queryParams.start_date = startDate;
  if (endDate) queryParams.end_date = endDate;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["activity-logs-page", queryParams],
    queryFn: () => api.get("/auth/activity-logs", queryParams),
    staleTime: 1000 * 30,
  });

  const logs: any[] = data?.logs ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.total_pages ?? 1;
  const totalItems = pagination?.total_items ?? 0;

  function resetFilters() {
    setActionFilter("all");
    setEntityFilter("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  }

  function changePage(p: number) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const hasFilters = actionFilter !== "all" || entityFilter !== "all" || startDate || endDate;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Activity Log</h1>
            <p className="text-muted-foreground text-sm">Full history of actions taken in your account</p>
          </div>
          {totalItems > 0 && (
            <Badge variant="outline" className="ml-auto">{totalItems.toLocaleString()} entries</Badge>
          )}
        </div>

        {/* Filters */}
        <div className="rounded-xl bg-card border border-border p-4 space-y-3">
          <div className="flex flex-wrap gap-3">
            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
              <SelectTrigger className="w-44">
                <Filter className="h-4 w-4 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="appointment_created">Appointment Booked</SelectItem>
                <SelectItem value="appointment_updated">Appointment Updated</SelectItem>
                <SelectItem value="appointment_cancelled">Appointment Cancelled</SelectItem>
                <SelectItem value="team_member_invited">User Invited</SelectItem>
                <SelectItem value="team_member_removed">User Removed</SelectItem>
                <SelectItem value="settings_updated">Settings Updated</SelectItem>
                <SelectItem value="settings_updated_branding">Branding Updated</SelectItem>
                <SelectItem value="slot_override_created">Slot Blocked</SelectItem>
                <SelectItem value="slot_override_deleted">Slot Unblocked</SelectItem>
                <SelectItem value="login_success">Sign-in</SelectItem>
                <SelectItem value="login_failed">Failed Sign-in</SelectItem>
                <SelectItem value="create_store">Location Added</SelectItem>
                <SelectItem value="update_store">Location Updated</SelectItem>
                <SelectItem value="delete_store">Location Deleted</SelectItem>
              </SelectContent>
            </Select>

            <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(1); }}>
              <SelectTrigger className="w-40">
                <Search className="h-4 w-4 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="appointment">Appointment</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
                <SelectItem value="store">Location</SelectItem>
                <SelectItem value="slot">Slot</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="w-36 text-sm"
                placeholder="From"
              />
              <span className="text-muted-foreground text-sm">–</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="w-36 text-sm"
                placeholder="To"
              />
            </div>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <LoadingSpinner size={32} />
            </div>
          ) : isError ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              Failed to load activity logs.
            </div>
          ) : logs.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              No activity found for the selected filters.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {logs.map((log: any) => {
                const cfg = getConfig(log.action);
                const Icon = cfg.icon;
                const entityBadge = log.entity_type ? ENTITY_BADGE[log.entity_type] : null;
                const subDetails = getSubDetails(log);
                const isExpanded = expandedId === log.id;

                return (
                  <div key={log.id} className="hover:bg-muted/30 transition-colors">
                    <button
                      className="w-full text-left px-5 py-4"
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${cfg.bg} ${cfg.text}`}>
                          <Icon className="h-4 w-4" />
                        </div>

                        {/* Main content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-card-foreground">
                              {getMessage(log)}
                            </span>
                            {entityBadge && (
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 font-medium ${entityBadge.cls}`}>
                                {entityBadge.label}
                              </Badge>
                            )}
                            {log.actor_type === "backoffice" && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-blue-500/10 text-blue-600 border-blue-200">
                                Admin
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(log.created_at), "MMM d, yyyy · HH:mm")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                            </span>
                            {log.actor_name && log.actor_name !== "System" && (
                              <span className="text-xs text-muted-foreground">by {log.actor_name}</span>
                            )}
                          </div>
                        </div>

                        {/* Action badge label */}
                        <div className="hidden sm:block shrink-0">
                          <code className="text-[10px] bg-muted px-2 py-1 rounded text-muted-foreground">
                            {log.action}
                          </code>
                        </div>
                      </div>
                    </button>

                    {/* Expanded detail panel */}
                    {isExpanded && subDetails.length > 0 && (
                      <div className="px-5 pb-4 ml-12">
                        <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                          {subDetails.map((line, i) => {
                            const [key, ...rest] = line.split(": ");
                            return (
                              <div key={i} className="flex items-baseline gap-1.5">
                                <span className="text-xs font-medium text-muted-foreground w-14 shrink-0">{key}</span>
                                <span className="text-xs text-card-foreground break-all">{rest.join(": ")}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages} · {totalItems.toLocaleString()} total
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => changePage(page - 1)}
                disabled={!pagination?.has_prev}
                className="h-8 px-2"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Previous</span>
              </Button>

              {getPageNumbers(page, totalPages).map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-sm">…</span>
                ) : (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => changePage(p as number)}
                    className="h-8 w-8 p-0 text-sm"
                  >
                    {p}
                  </Button>
                )
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => changePage(page + 1)}
                disabled={!pagination?.has_next}
                className="h-8 px-2"
              >
                <span className="hidden sm:inline mr-1">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
