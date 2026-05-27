import { memo, useState } from "react";
import { Clock, User, Mail, Phone, FileText, Building2, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { format, isToday, isTomorrow } from "date-fns";
import { parseLocalDate } from "@/lib/date";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useImpersonation } from "@/contexts/ImpersonationContext";

const statusStyles: Record<string, string> = {
  confirmed: "bg-success/10 text-success border-success/20",
  pending:   "bg-warning/10 text-warning border-warning/20",
  completed: "bg-primary/10 text-primary border-primary/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

export const UpcomingAppointments = memo(function UpcomingAppointments() {
  const [selected, setSelected] = useState<any | null>(null);
  const { isImpersonating } = useImpersonation();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["upcoming-appointments", isImpersonating],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const data = await api.get("/appointments", {
        start_date: today,
        per_page: 10,
        sort: "date_asc",
      });
      return (data.appointments as any[]).filter(
        (a) => a.status !== "cancelled" && a.status !== "completed"
      );
    },
    staleTime: 1000 * 60 * 2,
  });

  const getDateLabel = (dateStr: string) => {
    const d = parseLocalDate(dateStr);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "MMM d, yyyy");
  };

  return (
    <>
      <div className="rounded-xl bg-card card-shadow animate-slide-in">
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-lg font-semibold text-card-foreground">Upcoming Appointments</h3>
        </div>
        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="px-6 py-4 text-sm text-muted-foreground italic">Loading appointments...</div>
          ) : appointments.length === 0 ? (
            <div className="px-6 py-4 text-sm text-muted-foreground italic">No upcoming appointments</div>
          ) : (
            appointments.map((appointment: any) => (
              <div
                key={appointment.id}
                onClick={() => setSelected(appointment)}
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/50 cursor-pointer"
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
                      {appointment.purpose || appointment.service}
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
                    variant="outline"
                    className={cn("capitalize", statusStyles[appointment.status])}
                  >
                    {appointment.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Appointment Details Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="max-h-[600px] overflow-y-auto pr-2">
              <div className="space-y-4 py-2">

                {/* Header */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-card-foreground">
                      {selected.title ? `${selected.title} ` : ""}{selected.first_name} {selected.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{selected.purpose || selected.service || "—"}</p>
                  </div>
                  <Badge variant="outline" className={cn("ml-auto capitalize", statusStyles[selected.status])}>
                    {selected.status}
                  </Badge>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Date</p>
                    </div>
                    <p className="font-medium text-card-foreground">
                      {selected.date ? getDateLabel(selected.date) : "—"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Time</p>
                    </div>
                    <p className="font-medium text-card-foreground">{selected.time || "—"}</p>
                  </div>
                </div>

                {/* Duration */}
                {selected.duration_minutes && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Duration</p>
                    </div>
                    <p className="font-medium text-card-foreground">{selected.duration_minutes} min</p>
                  </div>
                )}

                {/* Email */}
                {selected.email && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium text-card-foreground">{selected.email}</p>
                    </div>
                  </div>
                )}

                {/* Phone */}
                {selected.phone && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium text-card-foreground">
                        {selected.phone_area_code ? `${selected.phone_area_code} ` : ""}{selected.phone}
                      </p>
                    </div>
                  </div>
                )}

                {/* Staff */}
                {selected.user_name && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Staff</p>
                      <p className="text-sm font-medium text-card-foreground">{selected.user_name}</p>
                    </div>
                  </div>
                )}

                {/* Country */}
                {selected.country_of_residence && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Country of Residence</p>
                      <p className="text-sm font-medium text-card-foreground">{selected.country_of_residence}</p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selected.notes && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Notes</p>
                    </div>
                    <p className="text-sm text-card-foreground">{selected.notes}</p>
                  </div>
                )}

                {/* Custom Data */}
                {selected.custom_data && Object.keys(selected.custom_data).length > 0 && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Custom Data</p>
                    </div>
                    <pre className="text-xs text-card-foreground bg-background/50 p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(selected.custom_data, null, 2)}
                    </pre>
                  </div>
                )}

              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
});
