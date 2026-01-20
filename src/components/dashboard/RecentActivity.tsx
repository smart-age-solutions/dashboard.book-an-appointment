import { useState, useEffect } from "react";
import { Calendar, Check, X, Mail, Settings, UserPlus, UserMinus, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

export function RecentActivity() {
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const data = await api.get("/auth/activity-logs", { per_page: 5 });
        setActivities(data.logs);
      } catch (error) {
        console.error("Failed to fetch activity logs", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const getIcon = (action: string) => {
    switch (action) {
      case "create_appointment": return Calendar;
      case "update_appointment": return Clock;
      case "cancel_appointment": return X;
      case "login": return Check;
      case "invite_user": return UserPlus;
      case "remove_user": return UserMinus;
      case "update_settings": return Settings;
      default: return Check;
    }
  };

  const getMessage = (log: any) => {
    const actor = log.actor_id || "System";
    switch (log.action) {
      case "create_appointment": return `New appointment booked by ${log.details.client_name || "a client"}`;
      case "update_appointment": return `Appointment updated: ${log.details.appointment_id}`;
      case "cancel_appointment": return `Appointment cancelled`;
      case "login": return `User logged in`;
      case "update_settings": return `Settings updated: ${log.details.updated_fields?.join(", ")}`;
      default: return log.action.replace("_", " ");
    }
  };

  return (
    <div className="rounded-xl bg-card card-shadow animate-slide-in">
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-lg font-semibold text-card-foreground">
          Recent Activity
        </h3>
      </div>
      <div className="divide-y divide-border">
        {isLoading ? (
          <div className="px-6 py-4 text-sm text-muted-foreground italic">Loading activity...</div>
        ) : activities.length === 0 ? (
          <div className="px-6 py-4 text-sm text-muted-foreground italic">No recent activity</div>
        ) : (
          activities.map((activity) => {
            const Icon = getIcon(activity.action);
            return (
              <div
                key={activity.id}
                className="flex items-start gap-4 px-6 py-4 transition-colors hover:bg-muted/50"
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    activity.action.includes("cancel")
                      ? "bg-destructive/10 text-destructive"
                      : activity.action.includes("create")
                      ? "bg-success/10 text-success"
                      : "bg-accent text-accent-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-card-foreground">{getMessage(activity)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
