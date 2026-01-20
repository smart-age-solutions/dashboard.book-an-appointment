import { useState, useEffect } from "react";
import { Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { format, isToday, isTomorrow } from "date-fns";
import { parseLocalDate } from "@/lib/date";

export function UpcomingAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const today = format(new Date(), "yyyy-MM-dd");
        const data = await api.get("/appointments", { start_date: today, per_page: 5 });
        setAppointments(data.appointments);
      } catch (error) {
        console.error("Failed to fetch upcoming appointments", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const getDateLabel = (dateStr: string) => {
    const d = parseLocalDate(dateStr);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "MMM d, yyyy");
  };

  return (
    <div className="rounded-xl bg-card card-shadow animate-slide-in">
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-lg font-semibold text-card-foreground">
          Upcoming Appointments
        </h3>
      </div>
      <div className="divide-y divide-border">
        {isLoading ? (
          <div className="px-6 py-4 text-sm text-muted-foreground italic">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="px-6 py-4 text-sm text-muted-foreground italic">No upcoming appointments</div>
        ) : (
          appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                  <User className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="font-medium text-card-foreground">
                    {appointment.first_name} {appointment.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {appointment.purpose}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-card-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {appointment.time}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getDateLabel(appointment.date)}
                  </p>
                </div>
                <Badge
                  variant={
                    appointment.status === "confirmed" ? "default" : "secondary"
                  }
                  className={
                    appointment.status === "confirmed"
                      ? "bg-success text-success-foreground"
                      : ""
                  }
                >
                  {appointment.status}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
