import { memo } from "react";
import { Link } from "react-router-dom";
import {
  Calendar, Clock, X, Check, Mail, Settings, UserPlus, UserMinus,
  MapPin, Activity, ChevronRight, Palette,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatDistanceToNow, format } from "date-fns";
import { useQuery } from "@tanstack/react-query";

const ACTION_CONFIG: Record<string, { icon: typeof Activity; bg: string; text: string }> = {
  create_appointment:    { icon: Calendar,   bg: "bg-green-500/10",      text: "text-green-600"      },
  appointment_created:   { icon: Calendar,   bg: "bg-green-500/10",      text: "text-green-600"      },
  update_appointment:    { icon: Clock,      bg: "bg-blue-500/10",       text: "text-blue-600"       },
  appointment_updated:   { icon: Clock,      bg: "bg-blue-500/10",       text: "text-blue-600"       },
  cancel_appointment:    { icon: X,          bg: "bg-destructive/10",    text: "text-destructive"    },
  appointment_cancelled: { icon: X,          bg: "bg-destructive/10",    text: "text-destructive"    },
  login:                 { icon: Check,      bg: "bg-muted",             text: "text-muted-foreground"},
  login_success:         { icon: Check,      bg: "bg-muted",             text: "text-muted-foreground"},
  login_failed:          { icon: X,          bg: "bg-destructive/10",    text: "text-destructive"    },
  invite_user:           { icon: UserPlus,   bg: "bg-purple-500/10",     text: "text-purple-600"     },
  remove_user:           { icon: UserMinus,  bg: "bg-orange-500/10",     text: "text-orange-600"     },
  update_settings:       { icon: Settings,   bg: "bg-yellow-500/10",     text: "text-yellow-600"     },
  update_branding:       { icon: Palette,    bg: "bg-pink-500/10",       text: "text-pink-600"       },
  create_store:          { icon: MapPin,     bg: "bg-teal-500/10",       text: "text-teal-600"       },
  update_store:          { icon: MapPin,     bg: "bg-teal-500/10",       text: "text-teal-600"       },
  delete_store:          { icon: MapPin,     bg: "bg-destructive/10",    text: "text-destructive"    },
  send_email:            { icon: Mail,       bg: "bg-indigo-500/10",     text: "text-indigo-600"     },
};

const ENTITY_BADGE: Record<string, { label: string; cls: string }> = {
  appointment: { label: "Appointment", cls: "bg-blue-500/10 text-blue-600 border-blue-200"    },
  user:        { label: "User",        cls: "bg-purple-500/10 text-purple-600 border-purple-200" },
  settings:    { label: "Settings",    cls: "bg-yellow-500/10 text-yellow-600 border-yellow-200" },
  store:       { label: "Location",    cls: "bg-teal-500/10 text-teal-600 border-teal-200"     },
  slot:        { label: "Slot",        cls: "bg-orange-500/10 text-orange-600 border-orange-200" },
  team:        { label: "Team",        cls: "bg-indigo-500/10 text-indigo-600 border-indigo-200" },
  email:       { label: "Email",       cls: "bg-pink-500/10 text-pink-600 border-pink-200"     },
};

function getConfig(action: string) {
  return ACTION_CONFIG[action] ?? { icon: Activity, bg: "bg-muted", text: "text-muted-foreground" };
}

function getMessage(log: any): string {
  const actor = log.actor_name || "System";
  const d = log.details || {};

  const customerName = d.client_name || d.customer_name || d.first_name
    ? `${d.first_name || ""}${d.last_name ? " " + d.last_name : ""}`.trim() || d.client_name || d.customer_name
    : null;
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
      return `${actor} invited ${d.email || "a new user"}${d.role ? ` as ${d.role}` : ""}`;

    case "remove_user":
      return `${actor} removed ${d.user_name || d.email || "a user"}`;

    case "update_settings": {
      const fields: string[] = d.updated_fields || [];
      return fields.length
        ? `${actor} updated settings: ${fields.slice(0, 2).join(", ")}${fields.length > 2 ? ` +${fields.length - 2} more` : ""}`
        : `${actor} updated settings`;
    }

    case "update_branding":
      return `${actor} updated company branding`;

    case "create_store":
      return `${actor} added location "${d.store_name || d.name || ""}"`;

    case "update_store":
      return `${actor} updated location "${d.store_name || d.name || ""}"`;

    case "delete_store":
      return `${actor} deleted a location`;

    case "send_email":
      return `Email sent to ${d.to || d.recipient || "recipient"}${d.subject ? ` — ${d.subject}` : ""}`;

    default:
      return `${actor} · ${log.action.replace(/_/g, " ")}`;
  }
}

function getSubDetail(log: any): string | null {
  const d = log.details || {};
  if (log.entity_type === "appointment" && (d.date || d.slot_time || d.start_time)) {
    const date = d.date ? format(new Date(d.date), "MMM d, yyyy") : "";
    const time = d.slot_time || d.start_time || "";
    const staff = d.staff_name || d.user_name || "";
    return [date, time, staff ? `with ${staff}` : ""].filter(Boolean).join(" · ");
  }
  if (log.entity_type === "user" && d.email) return d.email;
  if (log.action === "update_settings" && d.updated_fields?.length > 2) {
    return `All fields: ${d.updated_fields.join(", ")}`;
  }
  return null;
}

export const RecentActivity = memo(function RecentActivity() {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activity-logs"],
    queryFn: async () => {
      const data = await api.get("/auth/activity-logs", { per_page: 8 });
      return data.logs;
    },
    staleTime: 1000 * 60 * 1,
  });

  return (
    <div className="rounded-xl bg-card card-shadow animate-slide-in flex flex-col">
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-card-foreground">Recent Activity</h3>
        <Link
          to="/activity"
          className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
        >
          View all <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="divide-y divide-border flex-1">
        {isLoading ? (
          <div className="px-6 py-4 text-sm text-muted-foreground italic">Loading activity…</div>
        ) : activities.length === 0 ? (
          <div className="px-6 py-4 text-sm text-muted-foreground italic">No recent activity</div>
        ) : (
          activities.map((log: any) => {
            const cfg = getConfig(log.action);
            const Icon = cfg.icon;
            const entityBadge = log.entity_type ? ENTITY_BADGE[log.entity_type] : null;
            const subDetail = getSubDetail(log);

            return (
              <div
                key={log.id}
                className="flex items-start gap-3 px-6 py-3.5 transition-colors hover:bg-muted/50"
              >
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cfg.bg} ${cfg.text}`}>
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm text-card-foreground leading-snug">{getMessage(log)}</p>
                    {entityBadge && (
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 font-medium ${entityBadge.cls}`}>
                        {entityBadge.label}
                      </Badge>
                    )}
                  </div>

                  {subDetail && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{subDetail}</p>
                  )}

                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </p>
                    {log.actor_type === "backoffice" && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-blue-500/10 text-blue-600 border-blue-200">
                        Admin
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {activities.length > 0 && (
        <div className="border-t border-border px-6 py-3">
          <Link
            to="/activity"
            className="flex items-center justify-center gap-1.5 text-sm text-primary hover:underline font-medium"
          >
            View all activity <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
});
