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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
  UserCheck,
  Ban,
  X,
  MessageSquare,
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
  customData?: Record<string, any>;
  storeId?: string;
  staffName?: string;
  userId?: string;
}

interface BlockedDay {
  date: Date;
  reason: string;
}

import { parseLocalDate } from "@/lib/date";

function generateCalendarTimeSlots(startTime: string, endTime: string, durationMins: number): string[] {
  const slots: string[] = [];
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  let current = startH * 60 + startM;
  const end = endH * 60 + endM;
  while (current + durationMins <= end) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
    current += durationMins;
  }
  return slots;
}

function formatCalTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return format(d, "h:mm aa");
}

const statusStyles: Record<string, string> = {
  confirmed: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  completed: "bg-primary/10 text-primary border-primary/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const AREA_CODES = [
  { code: "+1",   label: "+1 (United States / Canada)" },
  { code: "+93",  label: "+93 (Afghanistan)" },
  { code: "+355", label: "+355 (Albania)" },
  { code: "+213", label: "+213 (Algeria)" },
  { code: "+376", label: "+376 (Andorra)" },
  { code: "+244", label: "+244 (Angola)" },
  { code: "+54",  label: "+54 (Argentina)" },
  { code: "+374", label: "+374 (Armenia)" },
  { code: "+297", label: "+297 (Aruba)" },
  { code: "+61",  label: "+61 (Australia)" },
  { code: "+43",  label: "+43 (Austria)" },
  { code: "+994", label: "+994 (Azerbaijan)" },
  { code: "+973", label: "+973 (Bahrain)" },
  { code: "+880", label: "+880 (Bangladesh)" },
  { code: "+375", label: "+375 (Belarus)" },
  { code: "+32",  label: "+32 (Belgium)" },
  { code: "+501", label: "+501 (Belize)" },
  { code: "+229", label: "+229 (Benin)" },
  { code: "+975", label: "+975 (Bhutan)" },
  { code: "+591", label: "+591 (Bolivia)" },
  { code: "+387", label: "+387 (Bosnia and Herzegovina)" },
  { code: "+267", label: "+267 (Botswana)" },
  { code: "+55",  label: "+55 (Brazil)" },
  { code: "+673", label: "+673 (Brunei)" },
  { code: "+359", label: "+359 (Bulgaria)" },
  { code: "+226", label: "+226 (Burkina Faso)" },
  { code: "+257", label: "+257 (Burundi)" },
  { code: "+855", label: "+855 (Cambodia)" },
  { code: "+237", label: "+237 (Cameroon)" },
  { code: "+238", label: "+238 (Cape Verde)" },
  { code: "+236", label: "+236 (Central African Republic)" },
  { code: "+235", label: "+235 (Chad)" },
  { code: "+56",  label: "+56 (Chile)" },
  { code: "+86",  label: "+86 (China)" },
  { code: "+57",  label: "+57 (Colombia)" },
  { code: "+269", label: "+269 (Comoros)" },
  { code: "+242", label: "+242 (Congo)" },
  { code: "+682", label: "+682 (Cook Islands)" },
  { code: "+506", label: "+506 (Costa Rica)" },
  { code: "+385", label: "+385 (Croatia)" },
  { code: "+53",  label: "+53 (Cuba)" },
  { code: "+357", label: "+357 (Cyprus)" },
  { code: "+420", label: "+420 (Czech Republic)" },
  { code: "+45",  label: "+45 (Denmark)" },
  { code: "+253", label: "+253 (Djibouti)" },
  { code: "+1",   label: "+1 (Dominican Republic)" },
  { code: "+593", label: "+593 (Ecuador)" },
  { code: "+20",  label: "+20 (Egypt)" },
  { code: "+503", label: "+503 (El Salvador)" },
  { code: "+240", label: "+240 (Equatorial Guinea)" },
  { code: "+291", label: "+291 (Eritrea)" },
  { code: "+372", label: "+372 (Estonia)" },
  { code: "+251", label: "+251 (Ethiopia)" },
  { code: "+679", label: "+679 (Fiji)" },
  { code: "+358", label: "+358 (Finland)" },
  { code: "+33",  label: "+33 (France)" },
  { code: "+241", label: "+241 (Gabon)" },
  { code: "+220", label: "+220 (Gambia)" },
  { code: "+995", label: "+995 (Georgia)" },
  { code: "+49",  label: "+49 (Germany)" },
  { code: "+233", label: "+233 (Ghana)" },
  { code: "+30",  label: "+30 (Greece)" },
  { code: "+299", label: "+299 (Greenland)" },
  { code: "+502", label: "+502 (Guatemala)" },
  { code: "+224", label: "+224 (Guinea)" },
  { code: "+245", label: "+245 (Guinea-Bissau)" },
  { code: "+592", label: "+592 (Guyana)" },
  { code: "+509", label: "+509 (Haiti)" },
  { code: "+504", label: "+504 (Honduras)" },
  { code: "+852", label: "+852 (Hong Kong)" },
  { code: "+36",  label: "+36 (Hungary)" },
  { code: "+354", label: "+354 (Iceland)" },
  { code: "+91",  label: "+91 (India)" },
  { code: "+62",  label: "+62 (Indonesia)" },
  { code: "+98",  label: "+98 (Iran)" },
  { code: "+964", label: "+964 (Iraq)" },
  { code: "+353", label: "+353 (Ireland)" },
  { code: "+972", label: "+972 (Israel)" },
  { code: "+39",  label: "+39 (Italy)" },
  { code: "+81",  label: "+81 (Japan)" },
  { code: "+962", label: "+962 (Jordan)" },
  { code: "+7",   label: "+7 (Kazakhstan)" },
  { code: "+254", label: "+254 (Kenya)" },
  { code: "+686", label: "+686 (Kiribati)" },
  { code: "+965", label: "+965 (Kuwait)" },
  { code: "+996", label: "+996 (Kyrgyzstan)" },
  { code: "+856", label: "+856 (Laos)" },
  { code: "+371", label: "+371 (Latvia)" },
  { code: "+961", label: "+961 (Lebanon)" },
  { code: "+266", label: "+266 (Lesotho)" },
  { code: "+231", label: "+231 (Liberia)" },
  { code: "+218", label: "+218 (Libya)" },
  { code: "+423", label: "+423 (Liechtenstein)" },
  { code: "+370", label: "+370 (Lithuania)" },
  { code: "+352", label: "+352 (Luxembourg)" },
  { code: "+853", label: "+853 (Macau)" },
  { code: "+389", label: "+389 (Macedonia)" },
  { code: "+261", label: "+261 (Madagascar)" },
  { code: "+265", label: "+265 (Malawi)" },
  { code: "+60",  label: "+60 (Malaysia)" },
  { code: "+960", label: "+960 (Maldives)" },
  { code: "+223", label: "+223 (Mali)" },
  { code: "+356", label: "+356 (Malta)" },
  { code: "+692", label: "+692 (Marshall Islands)" },
  { code: "+222", label: "+222 (Mauritania)" },
  { code: "+230", label: "+230 (Mauritius)" },
  { code: "+52",  label: "+52 (Mexico)" },
  { code: "+691", label: "+691 (Micronesia)" },
  { code: "+373", label: "+373 (Moldova)" },
  { code: "+377", label: "+377 (Monaco)" },
  { code: "+976", label: "+976 (Mongolia)" },
  { code: "+382", label: "+382 (Montenegro)" },
  { code: "+212", label: "+212 (Morocco)" },
  { code: "+258", label: "+258 (Mozambique)" },
  { code: "+95",  label: "+95 (Myanmar)" },
  { code: "+264", label: "+264 (Namibia)" },
  { code: "+674", label: "+674 (Nauru)" },
  { code: "+977", label: "+977 (Nepal)" },
  { code: "+31",  label: "+31 (Netherlands)" },
  { code: "+64",  label: "+64 (New Zealand)" },
  { code: "+505", label: "+505 (Nicaragua)" },
  { code: "+227", label: "+227 (Niger)" },
  { code: "+234", label: "+234 (Nigeria)" },
  { code: "+47",  label: "+47 (Norway)" },
  { code: "+968", label: "+968 (Oman)" },
  { code: "+92",  label: "+92 (Pakistan)" },
  { code: "+680", label: "+680 (Palau)" },
  { code: "+507", label: "+507 (Panama)" },
  { code: "+675", label: "+675 (Papua New Guinea)" },
  { code: "+595", label: "+595 (Paraguay)" },
  { code: "+51",  label: "+51 (Peru)" },
  { code: "+63",  label: "+63 (Philippines)" },
  { code: "+48",  label: "+48 (Poland)" },
  { code: "+351", label: "+351 (Portugal)" },
  { code: "+974", label: "+974 (Qatar)" },
  { code: "+40",  label: "+40 (Romania)" },
  { code: "+7",   label: "+7 (Russia)" },
  { code: "+250", label: "+250 (Rwanda)" },
  { code: "+685", label: "+685 (Samoa)" },
  { code: "+378", label: "+378 (San Marino)" },
  { code: "+239", label: "+239 (Sao Tome and Principe)" },
  { code: "+966", label: "+966 (Saudi Arabia)" },
  { code: "+221", label: "+221 (Senegal)" },
  { code: "+381", label: "+381 (Serbia)" },
  { code: "+248", label: "+248 (Seychelles)" },
  { code: "+232", label: "+232 (Sierra Leone)" },
  { code: "+65",  label: "+65 (Singapore)" },
  { code: "+421", label: "+421 (Slovakia)" },
  { code: "+386", label: "+386 (Slovenia)" },
  { code: "+677", label: "+677 (Solomon Islands)" },
  { code: "+252", label: "+252 (Somalia)" },
  { code: "+27",  label: "+27 (South Africa)" },
  { code: "+82",  label: "+82 (South Korea)" },
  { code: "+34",  label: "+34 (Spain)" },
  { code: "+94",  label: "+94 (Sri Lanka)" },
  { code: "+249", label: "+249 (Sudan)" },
  { code: "+597", label: "+597 (Suriname)" },
  { code: "+268", label: "+268 (Swaziland)" },
  { code: "+46",  label: "+46 (Sweden)" },
  { code: "+41",  label: "+41 (Switzerland)" },
  { code: "+963", label: "+963 (Syria)" },
  { code: "+886", label: "+886 (Taiwan)" },
  { code: "+992", label: "+992 (Tajikistan)" },
  { code: "+255", label: "+255 (Tanzania)" },
  { code: "+66",  label: "+66 (Thailand)" },
  { code: "+228", label: "+228 (Togo)" },
  { code: "+690", label: "+690 (Tokelau)" },
  { code: "+676", label: "+676 (Tonga)" },
  { code: "+216", label: "+216 (Tunisia)" },
  { code: "+90",  label: "+90 (Turkey)" },
  { code: "+993", label: "+993 (Turkmenistan)" },
  { code: "+688", label: "+688 (Tuvalu)" },
  { code: "+256", label: "+256 (Uganda)" },
  { code: "+380", label: "+380 (Ukraine)" },
  { code: "+971", label: "+971 (United Arab Emirates)" },
  { code: "+44",  label: "+44 (United Kingdom)" },
  { code: "+598", label: "+598 (Uruguay)" },
  { code: "+998", label: "+998 (Uzbekistan)" },
  { code: "+678", label: "+678 (Vanuatu)" },
  { code: "+58",  label: "+58 (Venezuela)" },
  { code: "+84",  label: "+84 (Vietnam)" },
  { code: "+967", label: "+967 (Yemen)" },
  { code: "+260", label: "+260 (Zambia)" },
  { code: "+263", label: "+263 (Zimbabwe)" },
];

const COMM_OPTIONS = ["Email", "Phone", "WhatsApp", "SMS"];

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
  const [customDataText, setCustomDataText] = useState("");
  
  const [allUsers, setAllUsers] = useState<{ id: string; name: string }[]>([]);
  const [bookingPages, setBookingPages] = useState<any[]>([]);
  const [selectedBookingPageId, setSelectedBookingPageId] = useState<string>("all");
  const [formData, setFormData] = useState({
    title: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    phone_area_code: "",
    country_of_residence: "",
    preferred_communication: "",
    accepted_terms: false,
    consent_communication: false,
    notes: "",
    time: "09:00",
    service: "",
    status: "confirmed" as Appointment["status"],
    duration: "60",
    storeId: "",
    userId: "",
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");
      
      const params: any = { start_date: start, end_date: end, per_page: 100 };
      if (selectedBookingPageId && selectedBookingPageId !== "all") {
        params.booking_page_id = selectedBookingPageId;
      }
      
      const [aptData, overrideData, pagesRes, usersRes] = await Promise.all([
        api.get("/appointments", params),
        api.get("/slots/overrides", { start_date: start, end_date: end, per_page: 100 }),
        api.get("/booking-pages"),
        api.get("/teams/all-members"),
      ]);

      setBookingPages(pagesRes.booking_pages || []);
      setAllUsers(usersRes.users || []);

      const transformedApts: Appointment[] = aptData.appointments.filter((apt: any) => apt.date).map((apt: any) => ({
        id: apt.id,
        title: apt.title || "", // Mr/Mrs
        first_name: apt.first_name,
        last_name: apt.last_name || "",
        client: `${apt.first_name} ${apt.last_name || ""}`.trim(),
        email: apt.email,
        phone: apt.phone || "",
        phone_area_code: apt.phone_area_code || "",
        country_of_residence: apt.country_of_residence || "",
        preferred_communication: apt.preferred_communication || "",
        accepted_terms: apt.accepted_terms || false,
        consent_communication: apt.consent_communication || false,
        notes: apt.notes || "",
        date: parseLocalDate(apt.date),
        time: apt.time,
        service: apt.purpose || "General",
        status: apt.status || "confirmed",
        duration: "60",
        customData: apt.custom_data || {},
        storeId: apt.store_id,
        staffName: apt.user_name || "",
        userId: apt.user_id || "",
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
  }, [currentMonth, selectedBookingPageId]);

  useEffect(() => {
    fetchData();
  }, [fetchData, selectedBookingPageId]);

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
      const payload: Record<string, string> = { date: format(selectedDate, "yyyy-MM-dd") };
      if (selectedBookingPageId !== "all") payload.booking_page_id = selectedBookingPageId;
      await api.post("/slots/override/block-day", payload);
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
      payload.user_id = formData.userId || null;
      if (formData.duration) payload.duration_minutes = parseInt(formData.duration);

      if (customDataText.trim()) {
        try {
          payload.custom_data = JSON.parse(customDataText);
        } catch (e) {
          toast({ title: "Invalid JSON", description: "Custom Data must be valid JSON", variant: "destructive" });
          setIsSubmitting(false);
          return;
        }
      } else {
        payload.custom_data = {};
      }

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
      userId: apt.userId || "",
    });
    setCustomDataText(apt.customData ? JSON.stringify(apt.customData, null, 2) : "");
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
      preferred_communication: "",
      accepted_terms: false,
      consent_communication: false,
      notes: "",
      time: "09:00",
      service: "",
      status: "confirmed" as Appointment["status"],
      duration: "60",
      storeId: "",
      userId: "",
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
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your jewelry appointments and consultations
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar */}
          <div className="lg:col-span-2 rounded-2xl bg-card p-4 md:p-6 card-shadow">
            {/* Calendar Header */}
            <div className="flex flex-col gap-4 mb-4 md:mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg md:text-xl font-semibold text-card-foreground">
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

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1 block">Filter by Booking Page</Label>
                  <Select value={selectedBookingPageId} onValueChange={setSelectedBookingPageId}>
                    <SelectTrigger className="w-full bg-muted/50">
                      <SelectValue placeholder="All Booking Pages" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Booking Pages</SelectItem>
                      {bookingPages.map(page => (
                        <SelectItem key={page.id} value={page.id}>
                          {page.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {stores.length > 0 && (
                  <div className="w-full sm:w-48">
                    <Label className="text-xs text-muted-foreground mb-1 block">Store Location</Label>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-full bg-muted/50">
                        <SelectValue placeholder="All Stores" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Stores</SelectItem>
                        {stores.map(store => (
                          <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="py-1 text-center text-xs md:text-sm font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1.5 md:gap-2">
              {isLoading ? (
                <div className="col-span-7 h-64 md:h-96 flex items-center justify-center">
                  <LoadingSpinner size={48} />
                </div>
              ) : (
                <>
                  {Array.from({ length: startDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-20 md:h-24" />
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
                          "h-20 md:h-24 rounded-xl border border-border p-1.5 md:p-2 cursor-pointer transition-all bg-background",
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
                            "text-xs md:text-sm font-medium mb-0.5 flex items-center gap-1",
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
                        <div className="space-y-0.5 overflow-hidden">
                          {isBlocked ? (
                            <div className="text-[11px] md:text-xs text-destructive truncate">
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
                                      "text-[11px] md:text-xs rounded px-1 py-0.5 truncate cursor-pointer",
                                    statusStyles[apt.status] || "bg-primary/10 text-primary",
                                    apt.status === "cancelled" && "opacity-60 line-through"
                                  )}
                                >
                                  {apt.time} {apt.client}{apt.staffName ? ` · ${apt.staffName}` : ""}
                                </div>
                              ))}
                              {dayAppointments.length > 2 && (
                                <div className="text-[11px] md:text-xs text-muted-foreground">
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
          <div className="rounded-2xl bg-card p-4 md:p-6 card-shadow">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
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
              <div className="space-y-3 h-full max-h-[640px] overflow-auto">
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
                            <User className="h-3 w-3" /> Client: {apt.client}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {apt.time}
                          </p>
                          {apt.staffName && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <UserCheck className="h-3 w-3" /> Staff: {apt.staffName}
                            </p>
                          )}
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
            <div className="max-h-[600px] overflow-y-auto pr-2">
              {viewingAppointment && (
                <div className="space-y-4 py-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-card-foreground">
                        {viewingAppointment.title ? `${viewingAppointment.title}. ` : ""}{viewingAppointment.client}
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

                  {viewingAppointment.staffName && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Staff Member</p>
                        <p className="text-sm font-medium text-card-foreground">
                          {viewingAppointment.staffName}
                        </p>
                      </div>
                    </div>
                  )}

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

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Preferred Communication</p>
                      <p className="text-sm font-medium text-card-foreground capitalize">
                        {viewingAppointment.preferred_communication}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Country of Residence</p>
                      <p className="text-sm font-medium text-card-foreground">
                        {viewingAppointment.country_of_residence || "Not specified"}
                      </p>
                    </div>
                  </div>

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

                  {viewingAppointment.customData && Object.keys(viewingAppointment.customData).length > 0 && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Custom Data</p>
                      </div>
                      <pre className="text-xs text-card-foreground bg-background/50 p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(viewingAppointment.customData, null, 2)}
                      </pre>
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
            </div>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAppointment ? "Edit Appointment" : "New Appointment"}
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[75vh] overflow-y-auto pr-1 -mr-1">
              <div className="space-y-6 py-2">

                {/* Identity header (edit only) */}
                {editingAppointment && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-card-foreground truncate">{editingAppointment.client}</p>
                      <p className="text-xs text-muted-foreground truncate">{editingAppointment.email}</p>
                    </div>
                    <Badge variant="outline" className={cn("ml-auto capitalize flex-shrink-0", statusStyles[editingAppointment.status])}>
                      {editingAppointment.status}
                    </Badge>
                  </div>
                )}

                {/* ── Customer Information ── */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer Information</p>
                  <Separator />

                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs">Title</Label>
                      <Select value={formData.title} onValueChange={(v) => setFormData({ ...formData, title: v })}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          <SelectItem value="Mr.">Mr.</SelectItem>
                          <SelectItem value="Ms.">Ms.</SelectItem>
                          <SelectItem value="Mrs.">Mrs.</SelectItem>
                          <SelectItem value="Dr.">Dr.</SelectItem>
                          <SelectItem value="Prof.">Prof.</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-5 space-y-1.5">
                      <Label className="text-xs">First Name <span className="text-destructive">*</span></Label>
                      <Input className="h-9" placeholder="John" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} />
                    </div>
                    <div className="col-span-5 space-y-1.5">
                      <Label className="text-xs">Last Name</Label>
                      <Input className="h-9" placeholder="Doe" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Email</Label>
                    <Input className="h-9" type="email" placeholder="client@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-4 space-y-1.5">
                      <Label className="text-xs">Area Code</Label>
                      <Select value={formData.phone_area_code} onValueChange={(v) => setFormData({ ...formData, phone_area_code: v })}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="+1" /></SelectTrigger>
                        <SelectContent>
                          {AREA_CODES.map((a, i) => (
                            <SelectItem key={`${a.code}-${i}`} value={a.code}>{a.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-8 space-y-1.5">
                      <Label className="text-xs">Phone</Label>
                      <Input className="h-9" type="tel" placeholder="555 000 0000" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Country of Residence</Label>
                    <Input className="h-9" placeholder="United States" value={formData.country_of_residence} onChange={(e) => setFormData({ ...formData, country_of_residence: e.target.value })} />
                  </div>
                </div>

                {/* ── Appointment Details ── */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Appointment Details</p>
                  <Separator />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Service / Purpose <span className="text-destructive">*</span></Label>
                      <Input className="h-9" placeholder="e.g., Ring Consultation" value={formData.service} onChange={(e) => setFormData({ ...formData, service: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Status</Label>
                      <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as Appointment["status"] })}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {allUsers.length > 0 && (
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1.5">
                        <UserCheck className="h-3 w-3" /> Assigned Staff
                      </Label>
                      <Select value={formData.userId || "unassigned"} onValueChange={(v) => setFormData({ ...formData, userId: v === "unassigned" ? "" : v })}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Select staff member" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">— Unassigned —</SelectItem>
                          {allUsers.map(user => (
                            <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Date <span className="text-destructive">*</span></Label>
                      <Input className="h-9" type="date"
                        value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
                        onChange={(e) => { setSelectedDate(e.target.value ? parseLocalDate(e.target.value) : null); setFormData(prev => ({ ...prev, time: "09:00" })); }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Time</Label>
                      {(() => {
                        const page = selectedBookingPageId && selectedBookingPageId !== "all"
                          ? bookingPages.find(p => p.id === selectedBookingPageId)
                          : null;
                        if (page && selectedDate) {
                          const jsDay = selectedDate.getDay();
                          const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
                          const dayHour = (page as any).hours?.find((h: any) => h.day_of_week === dayOfWeek && h.is_active);
                          if (dayHour) {
                            const slots = generateCalendarTimeSlots(dayHour.start_time, dayHour.end_time, page.slot_duration_minutes || 60);
                            return (
                              <div className="grid grid-cols-3 gap-1 max-h-28 overflow-y-auto">
                                {slots.map(slot => (
                                  <button key={slot} type="button" onClick={() => setFormData({ ...formData, time: slot })}
                                    className={cn("py-1.5 px-1 rounded-lg text-xs font-medium border-2 transition-colors",
                                      formData.time === slot ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground hover:border-primary/50"
                                    )}>
                                    {formatCalTime(slot)}
                                  </button>
                                ))}
                              </div>
                            );
                          }
                        }
                        return <Input className="h-9" type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} />;
                      })()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Duration</Label>
                      <Select value={formData.duration || "60"} onValueChange={(v) => setFormData({ ...formData, duration: v })}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Duration" /></SelectTrigger>
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
                    {stores.length > 1 && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">Store</Label>
                        <Select value={formData.storeId} onValueChange={(v) => setFormData({ ...formData, storeId: v })}>
                          <SelectTrigger className="h-9"><SelectValue placeholder="Select Store" /></SelectTrigger>
                          <SelectContent>
                            {stores.map(store => (
                              <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Communication ── */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="h-3 w-3" /> Communication
                  </p>
                  <Separator />

                  <div className="space-y-1.5">
                    <Label className="text-xs">Preferred Channels</Label>
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {COMM_OPTIONS.map((value) => {
                        const parts = (formData.preferred_communication || "").split(", ").filter(Boolean);
                        const active = parts.includes(value);
                        return (
                          <button key={value} type="button"
                            onClick={() => { const next = active ? parts.filter(v => v !== value) : [...parts, value]; setFormData({ ...formData, preferred_communication: next.join(", ") }); }}
                            className={cn("px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all",
                              active ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary/50"
                            )}>
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                      <Label className="text-sm font-normal cursor-pointer" htmlFor="cal-terms">Accepted Terms</Label>
                      <Switch id="cal-terms" checked={formData.accepted_terms} onCheckedChange={(v) => setFormData({ ...formData, accepted_terms: v })} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                      <Label className="text-sm font-normal cursor-pointer" htmlFor="cal-consent">Consent to Comms</Label>
                      <Switch id="cal-consent" checked={formData.consent_communication} onCheckedChange={(v) => setFormData({ ...formData, consent_communication: v })} />
                    </div>
                  </div>
                </div>

                {/* ── Notes & Data ── */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes & Data</p>
                  <Separator />

                  <div className="space-y-1.5">
                    <Label className="text-xs">Notes</Label>
                    <Textarea rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes about the appointment..." />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Custom Data (JSON)</Label>
                    <Textarea rows={3} className="font-mono text-xs" placeholder='{"key": "value"}' value={customDataText} onChange={(e) => setCustomDataText(e.target.value)} />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 pb-1">
                  <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleAddAppointment} isLoading={isSubmitting}>
                    {editingAppointment ? "Save Changes" : "Create"}
                  </Button>
                </div>

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
