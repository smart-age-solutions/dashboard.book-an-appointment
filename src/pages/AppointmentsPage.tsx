import { useState } from "react";
import { format, subDays } from "date-fns";
import { Search, Filter, MoreHorizontal, Eye, Edit2, Trash2, X, User, Mail, Clock, Calendar, Phone, FileText, Building2, Plus, UserCheck, MessageSquare, Download } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useStores } from "@/contexts/StoreContext";
import { api, getAuthHeaders } from "@/lib/api";
import { useEffect } from "react";
import { parseLocalDate } from "@/lib/date";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface Appointment {
  id: string;
  client: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  title: string;
  phone_area_code: string;
  country_of_residence: string;
  preferred_communication: string;
  accepted_terms: boolean;
  consent_communication: boolean;
  service: string;
  date: Date;
  time: string;
  status: "confirmed" | "pending" | "completed" | "cancelled";
  duration: string;
  notes: string;
  customData?: Record<string, any>;
  storeId: string;
  staffName?: string;
  userId?: string;
}

interface BookingPageHour {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface BookingPageOption {
  id: string;
  name: string;
  slug: string;
  slot_duration_minutes: number;
  hours: BookingPageHour[];
}

function generateTimeSlots(startTime: string, endTime: string, durationMins: number): string[] {
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

function formatTimeSlot(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return format(d, "h:mm aa");
}

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

const statusStyles: Record<string, string> = {
  confirmed: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  completed: "bg-primary/10 text-primary border-primary/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function AppointmentsPage() {
  const { stores } = useStores();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [customDataText, setCustomDataText] = useState("");
  const [editFormData, setEditFormData] = useState<Partial<Appointment & { first_name: string; last_name: string; userId: string }>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const perPage = 50;

  const [allUsers, setAllUsers] = useState<{ id: string; name: string }[]>([]);

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "xlsx">("csv");
  const [exportPeriod, setExportPeriod] = useState<"all" | "7d" | "30d" | "custom">("all");
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const [bookingPages, setBookingPages] = useState<BookingPageOption[]>([]);
  const [newApptBookingPageId, setNewApptBookingPageId] = useState("");
  const [newApptTimeSlots, setNewApptTimeSlots] = useState<string[]>([]);

  const [newAppointment, setNewAppointment] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    phone_area_code: "",
    title: "",
    date: "",
    time: "",
    purpose: "",
    notes: "",
    country_of_residence: "",
    store_id: "",
    custom_data: "",
    duration: "60",
    user_id: "",
    preferred_communication: "",
    accepted_terms: false,
    consent_communication: false,
  });

  const resetNewAppointment = () => {
    setNewAppointment({
      first_name: "", last_name: "", email: "", phone: "",
      phone_area_code: "", title: "", date: "", time: "",
      purpose: "", notes: "", country_of_residence: "", store_id: "", custom_data: "",
      duration: "60", user_id: "",
      preferred_communication: "",
      accepted_terms: false,
      consent_communication: false,
    });
    setNewApptBookingPageId("");
    setNewApptTimeSlots([]);
  };

  const handleCreateAppointment = async () => {
    if (!newAppointment.first_name || !newAppointment.email || !newAppointment.date || !newAppointment.time) {
      toast({ title: "Missing Fields", description: "First name, email, date, and time are required.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: any = {
        first_name: newAppointment.first_name,
        last_name: newAppointment.last_name || undefined,
        email: newAppointment.email,
        phone: newAppointment.phone || undefined,
        phone_area_code: newAppointment.phone_area_code || undefined,
        title: newAppointment.title || undefined,
        date: newAppointment.date,
        time: newAppointment.time,
        purpose: newAppointment.purpose || undefined,
        notes: newAppointment.notes || undefined,
        country_of_residence: newAppointment.country_of_residence || undefined,
      };
      if (newAppointment.store_id) payload.store_id = newAppointment.store_id;
      if (newAppointment.user_id) payload.user_id = newAppointment.user_id;
      if (newAppointment.duration) payload.duration_minutes = parseInt(newAppointment.duration);
      if (newAppointment.preferred_communication) payload.preferred_communication = newAppointment.preferred_communication;
      payload.accepted_terms = newAppointment.accepted_terms;
      payload.consent_communication = newAppointment.consent_communication;

      if (newAppointment.custom_data.trim()) {
        try {
          payload.custom_data = JSON.parse(newAppointment.custom_data);
        } catch (e) {
          toast({ title: "Invalid JSON", description: "Custom Data must be valid JSON", variant: "destructive" });
          setIsSubmitting(false);
          return;
        }
      }

      await api.post("/appointments", payload);
      toast({ title: "Created", description: "Appointment created successfully." });
      setIsCreateDialogOpen(false);
      resetNewAppointment();
      fetchAppointments(currentPage);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchAppointments = async (page = 1) => {
    setIsLoading(true);
    try {
      const params: any = {
        page,
        per_page: perPage
      };
      if (statusFilter !== "all") params.status = statusFilter;
      
      const data = await api.get("/appointments", params);
      
      // Transform backend format to frontend format
      const transformed: Appointment[] = data.appointments.map((apt: any) => ({
        id: apt.id,
        first_name: apt.first_name,
        last_name: apt.last_name || "",
        client: `${apt.first_name} ${apt.last_name || ""}`.trim(),
        email: apt.email,
        phone: apt.phone || "",
        title: apt.title || "",
        phone_area_code: apt.phone_area_code || "",
        country_of_residence: apt.country_of_residence || "",
        preferred_communication: apt.preferred_communication || "",
        accepted_terms: apt.accepted_terms || false,
        consent_communication: apt.consent_communication || false,
        service: apt.purpose || "General",
        date: parseLocalDate(apt.date),
        time: apt.time,
        status: apt.status,
        duration: apt.duration_minutes != null ? String(apt.duration_minutes) : "60",
        notes: apt.notes || "",
        customData: apt.custom_data || {},
        storeId: apt.store_id || "",
        staffName: apt.user_name || "",
        userId: apt.user_id || "",
      }));
      
      setAppointments(transformed);
      setTotalPages(data.pagination?.total_pages || 1);
      setTotalItems(data.pagination?.total_items || 0);
      setCurrentPage(data.pagination?.page || 1);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments(1);
    api.get("/booking-pages").then((res: any) => {
      setBookingPages(res.booking_pages || []);
    }).catch(() => {});
    api.get("/teams/all-members").then((res: any) => {
      setAllUsers(res.users || []);
    }).catch(() => {});
  }, [statusFilter]);

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch = apt.client.toLowerCase().includes(search.toLowerCase()) ||
      apt.email.toLowerCase().includes(search.toLowerCase()) ||
      apt.service.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const handleViewDetails = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setEditFormData({
      client: apt.client,
      first_name: apt.first_name,
      last_name: apt.last_name,
      email: apt.email,
      phone: apt.phone,
      title: apt.title,
      phone_area_code: apt.phone_area_code,
      country_of_residence: apt.country_of_residence,
      preferred_communication: apt.preferred_communication,
      accepted_terms: apt.accepted_terms,
      consent_communication: apt.consent_communication,
      service: apt.service,
      date: apt.date,
      time: apt.time,
      duration: apt.duration,
      status: apt.status,
      notes: apt.notes,
      storeId: apt.storeId,
      userId: apt.userId,
    });
    setCustomDataText(apt.customData ? JSON.stringify(apt.customData, null, 2) : "");
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedAppointment) return;

    setIsSubmitting(true);
    try {
      const payload: any = {};
      if (editFormData.first_name) payload.first_name = editFormData.first_name;
      if (editFormData.last_name !== undefined) payload.last_name = editFormData.last_name;
      if (editFormData.email) payload.email = editFormData.email;
      if (editFormData.phone) payload.phone = editFormData.phone;
      if (editFormData.service) payload.purpose = editFormData.service;
      if (editFormData.status) payload.status = editFormData.status;
      if (editFormData.notes !== undefined) payload.notes = editFormData.notes;
      if (editFormData.storeId) payload.store_id = editFormData.storeId;
      payload.user_id = editFormData.userId || null;
      if (editFormData.title) payload.title = editFormData.title;
      if (editFormData.phone_area_code) payload.phone_area_code = editFormData.phone_area_code;
      if (editFormData.country_of_residence) payload.country_of_residence = editFormData.country_of_residence;
      if (editFormData.preferred_communication) payload.preferred_communication = editFormData.preferred_communication;
      payload.accepted_terms = editFormData.accepted_terms;
      payload.consent_communication = editFormData.consent_communication;
      if (editFormData.date) payload.date = format(editFormData.date, "yyyy-MM-dd");
      if (editFormData.time) payload.time = editFormData.time;
      if (editFormData.duration) payload.duration_minutes = parseInt(editFormData.duration);

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

      await api.put(`/appointments/${selectedAppointment.id}`, payload);
      
      toast({ title: "Updated", description: "Appointment updated successfully" });
      setIsEditDialogOpen(false);
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (apt: Appointment) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/appointments/${apt.id}`);
      toast({ title: "Cancelled", description: "Appointment has been cancelled" });
      setIsViewDialogOpen(false);
      fetchAppointments();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const computeSlotsForNewAppt = (pageId: string, dateStr: string) => {
    if (!pageId || !dateStr) { setNewApptTimeSlots([]); return; }
    const page = bookingPages.find(p => p.id === pageId);
    if (!page) { setNewApptTimeSlots([]); return; }
    const jsDay = new Date(dateStr + "T00:00:00").getDay(); // 0=Sun
    const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1; // convert to Mon=0 ... Sun=6
    const dayHour = page.hours?.find(h => h.day_of_week === dayOfWeek && h.is_active);
    if (!dayHour) { setNewApptTimeSlots([]); return; }
    setNewApptTimeSlots(generateTimeSlots(dayHour.start_time, dayHour.end_time, page.slot_duration_minutes || 60));
  };

  const getStoreName = (storeId: string) => {
    const store = stores.find(s => s.id === storeId);
    return store?.name || "Unknown Store";
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

      const params = new URLSearchParams({ format: exportFormat });
      if (exportPeriod === "7d") {
        params.set("start_date", format(subDays(new Date(), 7), "yyyy-MM-dd"));
      } else if (exportPeriod === "30d") {
        params.set("start_date", format(subDays(new Date(), 30), "yyyy-MM-dd"));
      } else if (exportPeriod === "custom") {
        if (exportStartDate) params.set("start_date", exportStartDate);
        if (exportEndDate) params.set("end_date", exportEndDate);
      }
      if (statusFilter !== "all") params.set("status", statusFilter);

      const headers = getAuthHeaders();

      const res = await fetch(`${API_URL}/appointments/export?${params.toString()}`, { headers });
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `appointments.${exportFormat}`;
      a.click();
      URL.revokeObjectURL(url);
      setIsExportDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
            <p className="mt-1 text-muted-foreground">
              View and manage all your appointments
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsExportDialogOpen(true)}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => { resetNewAppointment(); setIsCreateDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search appointments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block rounded-xl bg-card card-shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Client</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24">
                    <div className="flex items-center justify-center">
                      <LoadingSpinner />
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No appointments found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAppointments.map((apt) => (
                  <TableRow key={apt.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div>
                        <p className="font-medium text-card-foreground">{apt.client}</p>
                        <p className="text-sm text-muted-foreground">{apt.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-card-foreground">{apt.service}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {apt.staffName ? (
                        <span className="inline-flex items-center gap-1">
                          <UserCheck className="h-3 w-3" />
                          {apt.staffName}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-card-foreground">{format(apt.date, "MMM d, yyyy")}</p>
                        <p className="text-sm text-muted-foreground">{apt.time}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{apt.duration}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("capitalize", statusStyles[apt.status])}>
                        {apt.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(apt)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(apt)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {apt.status !== "cancelled" && apt.status !== "completed" && (
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleCancel(apt)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Cancel
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile List */}
        <div className="space-y-3 md:hidden">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center rounded-xl bg-card card-shadow">
              <LoadingSpinner />
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="rounded-xl bg-card card-shadow p-4 text-center text-sm text-muted-foreground">
              No appointments found
            </div>
          ) : (
            filteredAppointments.map((apt) => (
              <div
                key={apt.id}
                className="rounded-xl bg-card card-shadow p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-semibold text-card-foreground">{apt.client}</p>
                    <p className="text-xs text-muted-foreground">{apt.email}</p>
                  </div>
                  <Badge variant="outline" className={cn("capitalize", statusStyles[apt.status])}>
                    {apt.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(apt.date, "MMM d, yyyy")}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {apt.time}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {apt.service}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {apt.duration}
                  </span>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleViewDetails(apt)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(apt)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  {apt.status !== "cancelled" && apt.status !== "completed" && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleCancel(apt)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
          <p>
            Showing {filteredAppointments.length} of {totalItems} appointments
          </p>
          <div className="flex gap-2 items-center self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAppointments(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
            >
              Previous
            </Button>
            <div className="flex items-center px-4 font-medium text-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAppointments(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        </div>

        {/* View Details Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Appointment Details</DialogTitle>
            </DialogHeader>
            <div className="max-h-[600px] overflow-y-auto pr-2">
              {selectedAppointment && (
                <div className="space-y-4 py-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-card-foreground">
                      {selectedAppointment.title ? `${selectedAppointment.title}. ` : ""}{selectedAppointment.client}
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedAppointment.service}</p>
                  </div>
                  <Badge variant="outline" className={cn("ml-auto capitalize", statusStyles[selectedAppointment.status])}>
                    {selectedAppointment.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Date</p>
                    </div>
                    <p className="font-medium text-card-foreground">{format(selectedAppointment.date, "MMM d, yyyy")}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Time</p>
                    </div>
                    <p className="font-medium text-card-foreground">{selectedAppointment.time}</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Duration</p>
                  </div>
                  <p className="font-medium text-card-foreground">{selectedAppointment.duration}</p>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium text-card-foreground">{selectedAppointment.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium text-card-foreground">{selectedAppointment.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Preferred Communication</p>
                    <p className="text-sm font-medium text-card-foreground capitalize">{selectedAppointment.preferred_communication}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Country of Residence</p>
                    <p className="text-sm font-medium text-card-foreground">{selectedAppointment.country_of_residence || "Not specified"}</p>
                  </div>
                </div>

                {stores.length > 1 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Store</p>
                      <p className="text-sm font-medium text-card-foreground">{getStoreName(selectedAppointment.storeId)}</p>
                    </div>
                  </div>
                )}

                {selectedAppointment.notes && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Notes</p>
                    </div>
                    <p className="text-sm text-card-foreground">{selectedAppointment.notes}</p>
                  </div>
                )}

                {selectedAppointment.customData && Object.keys(selectedAppointment.customData).length > 0 && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Custom Data</p>
                    </div>
                    <div className="space-y-1">
                      {Object.entries(selectedAppointment.customData).map(([key, value]) => (
                        <p key={key} className="text-sm text-card-foreground">
                          <span className="font-medium capitalize">{key.replace(/_/g, " ")}</span>
                          {": "}
                          {String(value)}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setIsViewDialogOpen(false)}>
                    Close
                  </Button>
                  {selectedAppointment.status !== "cancelled" && selectedAppointment.status !== "completed" && (
                    <Button 
                      variant="destructive" 
                      className="flex-1" 
                      isLoading={isSubmitting}
                      onClick={() => {
                        handleCancel(selectedAppointment);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  )}
                  <Button className="flex-1" onClick={() => {
                    setIsViewDialogOpen(false);
                    handleEdit(selectedAppointment);
                  }}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
            )}
          </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Appointment</DialogTitle>
            </DialogHeader>

            <div className="max-h-[75vh] overflow-y-auto pr-1 -mr-1">
              <div className="space-y-6 py-2">

                {/* Identity header */}
                {selectedAppointment && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-card-foreground truncate">{selectedAppointment.client}</p>
                      <p className="text-xs text-muted-foreground truncate">{selectedAppointment.email}</p>
                    </div>
                    <Badge variant="outline" className={cn("ml-auto capitalize flex-shrink-0", statusStyles[selectedAppointment.status])}>
                      {selectedAppointment.status}
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
                      <Select
                        value={editFormData.title || ""}
                        onValueChange={(v) => setEditFormData({ ...editFormData, title: v })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
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
                      <Label className="text-xs">First Name</Label>
                      <Input
                        className="h-9"
                        value={editFormData.first_name || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                      />
                    </div>
                    <div className="col-span-5 space-y-1.5">
                      <Label className="text-xs">Last Name</Label>
                      <Input
                        className="h-9"
                        value={editFormData.last_name || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Email</Label>
                    <Input
                      className="h-9"
                      type="email"
                      value={editFormData.email || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-4 space-y-1.5">
                      <Label className="text-xs">Area Code</Label>
                      <Select
                        value={editFormData.phone_area_code || ""}
                        onValueChange={(v) => setEditFormData({ ...editFormData, phone_area_code: v })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="+1" />
                        </SelectTrigger>
                        <SelectContent>
                          {AREA_CODES.map((a) => (
                            <SelectItem key={a.code} value={a.code}>{a.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-8 space-y-1.5">
                      <Label className="text-xs">Phone</Label>
                      <Input
                        className="h-9"
                        type="tel"
                        value={editFormData.phone || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                        placeholder="555 000 0000"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Country of Residence</Label>
                    <Input
                      className="h-9"
                      value={editFormData.country_of_residence || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, country_of_residence: e.target.value })}
                      placeholder="United States"
                    />
                  </div>
                </div>

                {/* ── Appointment Details ── */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Appointment Details</p>
                  <Separator />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Service / Purpose</Label>
                      <Input
                        className="h-9"
                        value={editFormData.service || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, service: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Status</Label>
                      <Select
                        value={editFormData.status}
                        onValueChange={(v) => setEditFormData({ ...editFormData, status: v as Appointment["status"] })}
                      >
                        <SelectTrigger className="h-9">
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

                  {allUsers.length > 0 && (
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1.5">
                        <UserCheck className="h-3 w-3" /> Assigned Staff
                      </Label>
                      <Select
                        value={editFormData.userId || "unassigned"}
                        onValueChange={(v) => setEditFormData({ ...editFormData, userId: v === "unassigned" ? "" : v })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select staff member" />
                        </SelectTrigger>
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
                      <Label className="text-xs">Date</Label>
                      <Input
                        className="h-9"
                        type="date"
                        value={editFormData.date ? format(editFormData.date, "yyyy-MM-dd") : ""}
                        onChange={(e) => {
                          const newDate = e.target.value ? parseLocalDate(e.target.value) : undefined;
                          setEditFormData({ ...editFormData, date: newDate });
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Time</Label>
                      <Input
                        className="h-9"
                        type="time"
                        value={editFormData.time || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Duration</Label>
                      <Select
                        value={editFormData.duration || "60"}
                        onValueChange={(v) => setEditFormData({ ...editFormData, duration: v })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
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
                    {stores.length > 1 && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">Store</Label>
                        <Select
                          value={editFormData.storeId}
                          onValueChange={(v) => setEditFormData({ ...editFormData, storeId: v })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
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
                        const parts = (editFormData.preferred_communication || "").split(", ").filter(Boolean);
                        const active = parts.includes(value);
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => {
                              const next = active ? parts.filter(v => v !== value) : [...parts, value];
                              setEditFormData({ ...editFormData, preferred_communication: next.join(", ") });
                            }}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all",
                              active
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background border-border text-muted-foreground hover:border-primary/50"
                            )}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                      <Label className="text-sm font-normal cursor-pointer" htmlFor="edit-terms">
                        Accepted Terms
                      </Label>
                      <Switch
                        id="edit-terms"
                        checked={editFormData.accepted_terms || false}
                        onCheckedChange={(v) => setEditFormData({ ...editFormData, accepted_terms: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                      <Label className="text-sm font-normal cursor-pointer" htmlFor="edit-consent">
                        Consent to Comms
                      </Label>
                      <Switch
                        id="edit-consent"
                        checked={editFormData.consent_communication || false}
                        onCheckedChange={(v) => setEditFormData({ ...editFormData, consent_communication: v })}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Notes & Data ── */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes & Data</p>
                  <Separator />

                  <div className="space-y-1.5">
                    <Label className="text-xs">Notes</Label>
                    <Textarea
                      rows={3}
                      value={editFormData.notes || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                      placeholder="Any additional notes..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Custom Data (JSON)</Label>
                    <Textarea
                      rows={3}
                      className="font-mono text-xs"
                      placeholder='{"source": "instagram"}'
                      value={customDataText}
                      onChange={(e) => setCustomDataText(e.target.value)}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 pb-1">
                  <Button variant="outline" className="flex-1" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleSaveEdit} isLoading={isSubmitting}>
                    Save Changes
                  </Button>
                </div>

              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Export Dialog */}
        <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Export Appointments</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-2">

              {/* Format */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Format</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["csv", "xlsx"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setExportFormat(f)}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-lg border-2 py-2.5 text-sm font-medium transition-all",
                        exportFormat === f
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      <FileText className="h-4 w-4" />
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Period */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Period</Label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: "all",    label: "All time"    },
                    { value: "7d",     label: "Last 7 days" },
                    { value: "30d",    label: "Last 30 days"},
                    { value: "custom", label: "Custom range"},
                  ] as const).map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setExportPeriod(value)}
                      className={cn(
                        "rounded-lg border-2 py-2 text-sm font-medium transition-all",
                        exportPeriod === value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {exportPeriod === "custom" && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="space-y-1">
                      <Label className="text-xs">From</Label>
                      <Input type="date" className="h-8 text-xs" value={exportStartDate} onChange={(e) => setExportStartDate(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">To</Label>
                      <Input type="date" className="h-8 text-xs" value={exportEndDate} onChange={(e) => setExportEndDate(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>

              {statusFilter !== "all" && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                  Filter applied: <span className="font-medium capitalize">{statusFilter}</span> appointments only
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setIsExportDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleExport} isLoading={isExporting}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Appointment Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>New Appointment</DialogTitle>
            </DialogHeader>
            <div className="max-h-[75vh] overflow-y-auto pr-1 -mr-1">
              <div className="space-y-6 py-2">

                {/* ── Customer Information ── */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer Information</p>
                  <Separator />

                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs">Title</Label>
                      <Select value={newAppointment.title} onValueChange={(v) => setNewAppointment({ ...newAppointment, title: v })}>
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
                      <Input className="h-9" placeholder="John" value={newAppointment.first_name} onChange={(e) => setNewAppointment({ ...newAppointment, first_name: e.target.value })} />
                    </div>
                    <div className="col-span-5 space-y-1.5">
                      <Label className="text-xs">Last Name</Label>
                      <Input className="h-9" placeholder="Doe" value={newAppointment.last_name} onChange={(e) => setNewAppointment({ ...newAppointment, last_name: e.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Email <span className="text-destructive">*</span></Label>
                    <Input className="h-9" type="email" placeholder="john@example.com" value={newAppointment.email} onChange={(e) => setNewAppointment({ ...newAppointment, email: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-4 space-y-1.5">
                      <Label className="text-xs">Area Code</Label>
                      <Select value={newAppointment.phone_area_code} onValueChange={(v) => setNewAppointment({ ...newAppointment, phone_area_code: v })}>
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
                      <Input className="h-9" type="tel" placeholder="555 000 0000" value={newAppointment.phone} onChange={(e) => setNewAppointment({ ...newAppointment, phone: e.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Country of Residence</Label>
                    <Input className="h-9" placeholder="United States" value={newAppointment.country_of_residence} onChange={(e) => setNewAppointment({ ...newAppointment, country_of_residence: e.target.value })} />
                  </div>
                </div>

                {/* ── Appointment Details ── */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Appointment Details</p>
                  <Separator />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Service / Purpose</Label>
                      <Input className="h-9" placeholder="Consultation" value={newAppointment.purpose} onChange={(e) => setNewAppointment({ ...newAppointment, purpose: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Duration</Label>
                      <Select value={newAppointment.duration} onValueChange={(v) => setNewAppointment({ ...newAppointment, duration: v })}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
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

                  {allUsers.length > 0 && (
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1.5">
                        <UserCheck className="h-3 w-3" /> Assigned Staff
                      </Label>
                      <Select value={newAppointment.user_id || "unassigned"} onValueChange={(v) => setNewAppointment({ ...newAppointment, user_id: v === "unassigned" ? "" : v })}>
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

                  {bookingPages.length > 0 && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Booking Page (for time slots)</Label>
                      <Select value={newApptBookingPageId} onValueChange={(v) => { setNewApptBookingPageId(v); computeSlotsForNewAppt(v, newAppointment.date); setNewAppointment(prev => ({ ...prev, time: "" })); }}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="None (manual time)" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None (manual time)</SelectItem>
                          {bookingPages.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Date <span className="text-destructive">*</span></Label>
                      <Input className="h-9" type="date" value={newAppointment.date} onChange={(e) => { setNewAppointment({ ...newAppointment, date: e.target.value, time: "" }); computeSlotsForNewAppt(newApptBookingPageId, e.target.value); }} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Time <span className="text-destructive">*</span></Label>
                      {newApptBookingPageId && newApptBookingPageId !== "none" && newAppointment.date ? (
                        newApptTimeSlots.length > 0 ? (
                          <div className="grid grid-cols-3 gap-1.5 max-h-32 overflow-y-auto">
                            {newApptTimeSlots.map(slot => (
                              <button key={slot} type="button" onClick={() => setNewAppointment({ ...newAppointment, time: slot })}
                                className={cn("py-1.5 px-1 rounded-lg text-xs font-medium border-2 transition-colors",
                                  newAppointment.time === slot ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground hover:border-primary/50"
                                )}>
                                {formatTimeSlot(slot)}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground pt-2">No slots available for this day</p>
                        )
                      ) : (
                        <Input className="h-9" type="time" value={newAppointment.time} onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })} />
                      )}
                    </div>
                  </div>

                  {stores.length > 0 && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Store</Label>
                      <Select value={newAppointment.store_id} onValueChange={(v) => setNewAppointment({ ...newAppointment, store_id: v })}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Select store" /></SelectTrigger>
                        <SelectContent>
                          {stores.map(store => (
                            <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
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
                        const parts = (newAppointment.preferred_communication || "").split(", ").filter(Boolean);
                        const active = parts.includes(value);
                        return (
                          <button key={value} type="button"
                            onClick={() => { const next = active ? parts.filter(v => v !== value) : [...parts, value]; setNewAppointment({ ...newAppointment, preferred_communication: next.join(", ") }); }}
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
                      <Label className="text-sm font-normal cursor-pointer" htmlFor="new-terms">Accepted Terms</Label>
                      <Switch id="new-terms" checked={newAppointment.accepted_terms} onCheckedChange={(v) => setNewAppointment({ ...newAppointment, accepted_terms: v })} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                      <Label className="text-sm font-normal cursor-pointer" htmlFor="new-consent">Consent to Comms</Label>
                      <Switch id="new-consent" checked={newAppointment.consent_communication} onCheckedChange={(v) => setNewAppointment({ ...newAppointment, consent_communication: v })} />
                    </div>
                  </div>
                </div>

                {/* ── Notes & Data ── */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes & Data</p>
                  <Separator />

                  <div className="space-y-1.5">
                    <Label className="text-xs">Notes</Label>
                    <Textarea rows={3} placeholder="Any additional notes..." value={newAppointment.notes} onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })} />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Custom Data (JSON)</Label>
                    <Textarea rows={3} className="font-mono text-xs" placeholder='{"source": "instagram"}' value={newAppointment.custom_data} onChange={(e) => setNewAppointment({ ...newAppointment, custom_data: e.target.value })} />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 pb-1">
                  <Button variant="outline" className="flex-1" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleCreateAppointment} isLoading={isSubmitting}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Appointment
                  </Button>
                </div>

              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
