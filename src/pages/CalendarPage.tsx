import { useState, useEffect, useCallback } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  isBefore,
  startOfDay,
} from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  FileText,
  Eye,
  Clock,
  User,
  Ban,
  X,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useStores } from "@/contexts/StoreContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface Appointment {
  id: string;
  title: string; // Personal title (Mr, Mrs)
  first_name: string;
  last_name: string;
  client: string; // Computed for display
  email: string;
  phone: string;
  phone_area_code: string;
  country_of_residence: string;
  preferred_communication: string;
  accepted_terms: boolean;
  consent_communication: boolean;
  notes: string;
  date: Date;
  time: string;
  service: string; // Purpose/Service title
  status: "confirmed" | "pending" | "completed" | "cancelled";
  duration: string;
  storeId?: string;
}

interface BlockedDay {
  date: Date;
  reason: string;
}

import { parseLocalDate } from "@/lib/date";

const statusStyles: Record<string, string> = {
  confirmed: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  completed: "bg-primary/10 text-primary border-primary/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const initialAppointments: Appointment[] = [];

export default function CalendarPage() {
  const { stores } = useStores();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [blockedDays, setBlockedDays] = useState<BlockedDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "", // Personal title
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    phone_area_code: "",
    country_of_residence: "",
    preferred_communication: "email",
    accepted_terms: false,
    consent_communication: false,
    notes: "",
    time: "09:00",
    service: "", // Purpose/Service title
    status: "confirmed" as Appointment["status"],
    duration: "60",
    storeId: "",
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");
      
      const [aptData, overrideData] = await Promise.all([
        api.get("/appointments", { start_date: start, end_date: end, per_page: 100 }),
        api.get("/slots/overrides", { start_date: start, end_date: end, per_page: 100 })
      ]);

      const transformedApts: Appointment[] = aptData.appointments.map((apt: any) => ({
        id: apt.id,
        title: apt.title || "", // Mr/Mrs
        first_name: apt.first_name,
        last_name: apt.last_name || "",
        client: `${apt.first_name} ${apt.last_name || ""}`.trim(),
        email: apt.email,
        phone: apt.phone || "",
        phone_area_code: apt.phone_area_code || "",
        country_of_residence: apt.country_of_residence || "",
        preferred_communication: apt.preferred_communication || "email",
        accepted_terms: apt.accepted_terms || false,
        consent_communication: apt.consent_communication || false,
        notes: apt.notes || "",
        date: parseLocalDate(apt.date),
        time: apt.time,
        service: apt.purpose || "General",
        status: apt.status || "confirmed",
        duration: "60", // Backend doesn't store duration yet
        storeId: apt.store_id
      }));

      // In real backend, block-day marks all slots as blocked. 
      // For the calendar, we'll consider a day blocked if any slot is blocked (simplified)
      // or if we have a specific 'block-day' logic.
      const blocked: BlockedDay[] = overrideData.overrides
        .filter((o: any) => o.is_blocked)
        .map((o: any) => ({
          date: parseLocalDate(o.date),
          reason: "Blocked"
        }));

      setAppointments(transformedApts);
      setBlockedDays(blocked);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const startDay = startOfMonth(currentMonth).getDay();
  const today = startOfDay(new Date());

  const isPastDate = (date: Date) => isBefore(startOfDay(date), today);

  const isBlockedDate = (date: Date) =>
    blockedDays.some((b) => isSameDay(b.date, date));

  const getBlockedReason = (date: Date) =>
    blockedDays.find((b) => isSameDay(b.date, date))?.reason || "";

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter((apt) => isSameDay(apt.date, date));
  };

  const handleBlockDay = async () => {
    if (!selectedDate) return;
    setIsSubmitting(true);
    try {
      await api.post("/slots/override/block-day", {
        date: format(selectedDate, "yyyy-MM-dd")
      });
      toast({
        title: "Blocked",
        description: `${format(selectedDate, "MMMM d")} is now blocked`,
      });
      fetchData();
      setBlockReason("");
      setIsBlockDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnblockDay = async (date: Date) => {
    setIsSubmitting(true);
    try {
      await api.delete("/slots/override/reset-day", {
        date: format(date, "yyyy-MM-dd")
      });
      toast({
        title: "Unblocked",
        description: "Day is now available for appointments",
      });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAppointment = async () => {
    if (!selectedDate || !formData.service || !formData.first_name) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: formData.title,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        phone_area_code: formData.phone_area_code,
        country_of_residence: formData.country_of_residence,
        preferred_communication: formData.preferred_communication,
        accepted_terms: formData.accepted_terms,
        consent_communication: formData.consent_communication,
        date: format(selectedDate, "yyyy-MM-dd"),
        time: formData.time,
        purpose: formData.service,
        status: formData.status,
        notes: formData.notes,
      };

      if (formData.storeId) payload.store_id = formData.storeId;

      if (editingAppointment) {
        await api.put(`/appointments/${editingAppointment.id}`, payload);
        toast({ title: "Updated", description: "Appointment updated successfully" });
      } else {
        await api.post("/appointments", payload);
        toast({ title: "Created", description: "Appointment created successfully" });
      }

      fetchData();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAppointment = (apt: Appointment) => {
    setEditingAppointment(apt);
    setFormData({
      title: apt.title,
      first_name: apt.first_name,
      last_name: apt.last_name,
      email: apt.email,
      phone: apt.phone,
      phone_area_code: apt.phone_area_code,
      country_of_residence: apt.country_of_residence,
      preferred_communication: apt.preferred_communication,
      accepted_terms: apt.accepted_terms,
      consent_communication: apt.consent_communication,
      notes: apt.notes,
      time: apt.time,
      service: apt.service,
      status: apt.status,
      duration: apt.duration,
      storeId: apt.storeId || "",
    });
    setSelectedDate(apt.date);
    setIsDialogOpen(true);
  };

  const handleViewAppointment = (apt: Appointment) => {
    setViewingAppointment(apt);
    setIsViewDialogOpen(true);
  };

  const handleDeleteAppointment = async (id: string) => {
    setIsSubmitting(true);
    try {
      await api.delete(`/appointments/${id}`);
      toast({
        title: "Cancelled",
        description: "Appointment cancelled successfully",
      });
      fetchData();
      setIsViewDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openNewAppointment = (date: Date) => {
    setSelectedDate(date);
    setEditingAppointment(null);
    setFormData({
      title: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      phone_area_code: "",
      country_of_residence: "",
      preferred_communication: "email",
      accepted_terms: false,
      consent_communication: false,
      notes: "",
      time: "09:00",
      service: "",
      status: "confirmed" as Appointment["status"],
      duration: "60",
      storeId: "",
    });
    setIsDialogOpen(true);
  };

  const serviceLabels: Record<string, string> = {
    consultation: "Consultation",
    "custom-design": "Custom Design",
    repair: "Repair & Restoration",
    appraisal: "Appraisal",
    cleaning: "Cleaning & Maintenance",
    engraving: "Engraving",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your jewelry appointments and consultations
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar */}
          <div className="lg:col-span-2 rounded-xl bg-card p-6 card-shadow">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-card-foreground">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-sm font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {isLoading ? (
                <div className="col-span-7 h-96 flex items-center justify-center">
                  <LoadingSpinner size={48} />
                </div>
              ) : (
                <>
                  {Array.from({ length: startDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-24" />
                  ))}
                  {days.map((day) => {
                    const dayAppointments = getAppointmentsForDate(day);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isPast = isPastDate(day);
                    const isBlocked = isBlockedDate(day);
                    return (
                      <div
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          "h-24 rounded-lg border border-border p-2 cursor-pointer transition-all",
                          !isSameMonth(day, currentMonth) && "opacity-50",
                          isToday(day) && "bg-accent",
                          isSelected && "ring-2 ring-primary",
                          isBlocked && "bg-destructive/10 border-destructive/30",
                          isPast
                            ? "opacity-60 cursor-not-allowed bg-muted/30"
                            : "hover:border-primary/50"
                        )}
                      >
                        <div
                          className={cn(
                            "text-sm font-medium mb-1 flex items-center gap-1",
                            isToday(day)
                              ? "text-primary"
                              : isPast
                              ? "text-muted-foreground"
                              : isBlocked
                              ? "text-destructive"
                              : "text-card-foreground"
                          )}
                        >
                          {format(day, "d")}
                          {isBlocked && <Ban className="h-3 w-3" />}
                        </div>
                        <div className="space-y-1 overflow-hidden">
                          {isBlocked ? (
                            <div className="text-xs text-destructive truncate">
                              {getBlockedReason(day) || "Blocked"}
                            </div>
                          ) : (
                            <>
                              {dayAppointments.slice(0, 2).map((apt) => (
                                <div
                                  key={apt.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewAppointment(apt);
                                  }}
                                  className={cn(
                                    "text-xs rounded px-1.5 py-0.5 truncate cursor-pointer",
                                    statusStyles[apt.status] || "bg-primary/10 text-primary",
                                    apt.status === "cancelled" && "opacity-60 line-through"
                                  )}
                                >
                                  {apt.time} {apt.client}
                                </div>
                              ))}
                              {dayAppointments.length > 2 && (
                                <div className="text-xs text-muted-foreground">
                                  +{dayAppointments.length - 2} more
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Selected Date Appointments */}
          <div className="rounded-xl bg-card p-6 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-card-foreground">
                {selectedDate
                  ? format(selectedDate, "MMMM d, yyyy")
                  : "Select a date"}
              </h3>
              {selectedDate && !isPastDate(selectedDate) && (
                <div className="flex gap-2">
                  {isBlockedDate(selectedDate) ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnblockDay(selectedDate)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Unblock
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsBlockDialogOpen(true)}
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Block Day
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openNewAppointment(selectedDate)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <LoadingSpinner className="mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading schedule...</p>
              </div>
            ) : selectedDate ? (
              <div className="space-y-3">
                {isBlockedDate(selectedDate) ? (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex items-center gap-2 text-destructive mb-2">
                      <Ban className="h-4 w-4" />
                      <span className="font-medium">Day Blocked</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getBlockedReason(selectedDate) ||
                        "This day is blocked for appointments"}
                    </p>
                  </div>
                ) : getAppointmentsForDate(selectedDate).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No appointments for this date
                  </p>
                ) : (
                  getAppointmentsForDate(selectedDate).map((apt) => (
                    <div key={apt.id} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-card-foreground">
                            {apt.service}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" /> {apt.client}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {apt.time}
                          </p>
                          <div className="pt-1">
                            <Badge variant="outline" className={cn("text-[10px] h-4 px-1 capitalize", statusStyles[apt.status])}>
                              {apt.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleViewAppointment(apt)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!isPastDate(apt.date) && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditAppointment(apt)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleDeleteAppointment(apt.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Click on a date to view or add appointments
              </p>
            )}
          </div>
        </div>

        {/* View Appointment Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Appointment Details</DialogTitle>
            </DialogHeader>
            {viewingAppointment && (
              <div className="space-y-4 py-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-card-foreground">
                        {viewingAppointment.client}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {viewingAppointment.service}
                      </p>
                    </div>
                    <Badge variant="outline" className={cn("ml-auto capitalize", statusStyles[viewingAppointment.status])}>
                      {viewingAppointment.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Date</p>
                      <p className="font-medium text-card-foreground">
                        {format(viewingAppointment.date, "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Time</p>
                      <p className="font-medium text-card-foreground">
                        {viewingAppointment.time}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">
                      Service
                    </p>
                    <p className="font-medium text-card-foreground">
                      {serviceLabels[viewingAppointment.service] ||
                        viewingAppointment.service}
                    </p>
                  </div>

                  {viewingAppointment.email && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium text-card-foreground">
                          {viewingAppointment.email}
                        </p>
                      </div>
                    </div>
                  )}

                  {viewingAppointment.phone && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="text-sm font-medium text-card-foreground">
                          {viewingAppointment.phone}
                        </p>
                      </div>
                    </div>
                  )}

                  {viewingAppointment.notes && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Notes</p>
                      </div>
                      <p className="text-sm text-card-foreground">
                        {viewingAppointment.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsViewDialogOpen(false)}
                  >
                    Close
                  </Button>
                  {!isPastDate(viewingAppointment.date) && (
                    <>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setIsViewDialogOpen(false);
                          handleEditAppointment(viewingAppointment);
                        }}
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        isLoading={isSubmitting}
                        disabled={viewingAppointment.status === "cancelled"}
                        onClick={() =>
                          handleDeleteAppointment(viewingAppointment.id)
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAppointment ? "Edit Appointment" : "New Appointment"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
                    onChange={(e) => setSelectedDate(e.target.value ? parseLocalDate(e.target.value) : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Select
                    value={formData.time}
                    onValueChange={(v) => setFormData({ ...formData, time: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 8).map(
                        (hour) => (
                          <SelectItem
                            key={hour}
                            value={`${hour.toString().padStart(2, "0")}:00`}
                          >
                            {hour}:00
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Service *</Label>
                  <Input
                    value={formData.service}
                    onChange={(e) =>
                      setFormData({ ...formData, service: e.target.value })
                    }
                    placeholder="e.g., Ring Consultation"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) =>
                      setFormData({ ...formData, status: v as Appointment["status"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1 space-y-2">
                  <Label>Title</Label>
                  <Select
                    value={formData.title}
                    onValueChange={(v) => setFormData({ ...formData, title: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Title" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mr">Mr.</SelectItem>
                      <SelectItem value="Mrs">Mrs.</SelectItem>
                      <SelectItem value="Ms">Ms.</SelectItem>
                      <SelectItem value="Dr">Dr.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name *</Label>
                    <Input
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                      placeholder="e.g., John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData({ ...formData, last_name: e.target.value })
                      }
                      placeholder="e.g., Doe"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="client@email.com"
                  />
                </div>
                <div className="space-y-2">
                   <Label>Duration</Label>
                   <Select
                     value={formData.duration || "60"}
                     onValueChange={(v) => setFormData({ ...formData, duration: v })}
                   >
                     <SelectTrigger>
                       <SelectValue placeholder="Duration" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="15">15 min</SelectItem>
                       <SelectItem value="30">30 min</SelectItem>
                       <SelectItem value="45">45 min</SelectItem>
                       <SelectItem value="60">1 hour</SelectItem>
                       <SelectItem value="90">1.5 hours</SelectItem>
                       <SelectItem value="120">2 hours</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1 space-y-2">
                  <Label>Phone Area Code</Label>
                  <Input
                    value={formData.phone_area_code}
                    onChange={(e) =>
                      setFormData({ ...formData, phone_area_code: e.target.value })
                    }
                    placeholder="+1"
                  />
                </div>
                <div className="col-span-3 space-y-2">
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Country of Residence</Label>
                  <Input
                    value={formData.country_of_residence}
                    onChange={(e) =>
                      setFormData({ ...formData, country_of_residence: e.target.value })
                    }
                    placeholder="USA"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preferred Communication</Label>
                  <Select
                    value={formData.preferred_communication}
                    onValueChange={(v) =>
                      setFormData({ ...formData, preferred_communication: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {stores.length > 1 && (
                  <div className="space-y-2">
                    <Label>Store</Label>
                    <Select
                      value={formData.storeId}
                      onValueChange={(v) => setFormData({ ...formData, storeId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Store" />
                      </SelectTrigger>
                      <SelectContent>
                        {stores.map(store => (
                          <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={formData.accepted_terms}
                  onChange={(e) => setFormData({ ...formData, accepted_terms: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="terms" className="text-sm font-normal">Accepted Terms</Label>
              </div>

              <div className="flex items-center space-x-2 pb-2">
                 <input
                  type="checkbox"
                  id="consent"
                  checked={formData.consent_communication}
                  onChange={(e) => setFormData({ ...formData, consent_communication: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="consent" className="text-sm font-normal">Consent to Communication</Label>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Additional notes about the appointment..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleAddAppointment} isLoading={isSubmitting}>
                  {editingAppointment ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Block Day Dialog */}
        <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Block Day</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Block {selectedDate ? format(selectedDate, "MMMM d, yyyy") : ""}{" "}
                from receiving appointments.
              </p>
              <div className="space-y-2">
                <Label>Reason (optional)</Label>
                <Input
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="e.g., Holiday, Training, etc."
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsBlockDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  variant="destructive"
                  onClick={handleBlockDay}
                  isLoading={isSubmitting}
                >
                  <Ban className="h-4 w-4 mr-1" />
                  Block Day
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
