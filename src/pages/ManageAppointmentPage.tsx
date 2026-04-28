import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Loader2, AlertCircle, Calendar, Clock, MapPin, User, Mail, Phone, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { CalendarPicker } from "@/components/booking/CalendarPicker";
import { TimeSlotPicker } from "@/components/booking/TimeSlotPicker";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface Appointment {
  id: string;
  date: string;
  time: string;
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  notes?: string;
  purpose?: string;
  status: string;
  customData?: Record<string, any>;
  store_name?: string;
  store_id?: string;
}

interface ClientBranding {
  company_name: string;
  brand_color: string;
  logo_url: string | null;
}

type ManageStep = "view" | "reschedule" | "cancel-confirm" | "done";

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}
function formatTime(t: string) {
  const [h, min] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(min).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export default function ManageAppointmentPage() {
  const { appointmentId: appointmentIdParam } = useParams<{ appointmentId: string }>();
  const [searchParams] = useSearchParams();
  const appointmentId = appointmentIdParam || searchParams.get("appointment_id") || undefined;

  const [appt, setAppt] = useState<Appointment | null>(null);
  const [branding, setBranding] = useState<ClientBranding | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [step, setStep] = useState<ManageStep>("view");
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Record<string, string[]>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const brandColor = branding?.brand_color || "#4f46e5";

  useEffect(() => {
    if (!appointmentId) return;
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/public/appointments/${appointmentId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Appointment not found");
        setAppt(data.appointment);
        setClientId(data.client_id || null);
        setBranding({
          company_name: data.company_name,
          brand_color: data.brand_color || "#4f46e5",
          logo_url: data.logo_url || null,
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [appointmentId]);


  const handleRescheduleClick = async () => {
    if (!appt) return;
    setStep("reschedule");
    setSlotsLoading(true);
    try {
      if (clientId) {
        const params = new URLSearchParams({ range: "2m" });
        if (appt.store_id) params.set("store_id", appt.store_id);
        const res = await fetch(`${API_URL}/public/slots/${clientId}?${params}`);
        const data = await res.json();
        if (res.ok) setAvailableSlots(data.slots || {});
      }
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!appointmentId || !selectedDate || !selectedTime) return;
    setIsActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`${API_URL}/public/appointments/edit/${appointmentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, time: selectedTime }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reschedule");
      setAppt(data.appointment);
      setSuccessMsg("Your appointment has been rescheduled!");
      setStep("done");
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!appointmentId) return;
    setIsActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`${API_URL}/public/appointments/cancel/${appointmentId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel");
      setAppt(data.appointment);
      setSuccessMsg("Your appointment has been cancelled.");
      setStep("done");
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !appt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-sm w-full text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="font-semibold text-gray-800 mb-1">Appointment not found</h2>
          <p className="text-sm text-gray-500">{error || "This appointment does not exist."}</p>
        </div>
      </div>
    );
  }

  const isCancelled = appt.status === "cancelled";
  const statusColor = isCancelled ? "#ef4444" : appt.status === "completed" ? "#22c55e" : brandColor;
  const statusIcon = isCancelled
    ? <XCircle className="w-4 h-4" style={{ color: statusColor }} />
    : <CheckCircle className="w-4 h-4" style={{ color: statusColor }} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4 py-10">
      <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full overflow-hidden">
        <div className="h-2" style={{ backgroundColor: brandColor }} />

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {branding?.logo_url && (
              <img src={branding.logo_url} alt={branding.company_name} className="h-8 object-contain" />
            )}
            <div>
              <h1 className="font-bold text-gray-900">{branding?.company_name}</h1>
              <p className="text-xs text-gray-400">Manage your appointment</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {actionError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {actionError}
            </div>
          )}

          {/* ── DONE ── */}
          {step === "done" && (
            <div className="text-center py-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${brandColor}20` }}
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: brandColor }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{successMsg}</h2>
              <p className="text-sm text-gray-500 mb-6">A confirmation email has been sent to {appt.email}.</p>
              {appt.status !== "cancelled" && (
                <div className="rounded-xl p-4 text-sm text-left space-y-1.5 mb-6" style={{ backgroundColor: `${brandColor}10` }}>
                  <p className="font-medium text-gray-700">📅 {formatDate(appt.date)} at {formatTime(appt.time)}</p>
                  {appt.store_name && <p className="text-gray-600">📍 {appt.store_name}</p>}
                </div>
              )}
              <button
                onClick={() => setStep("view")}
                className="w-full py-3 rounded-xl font-semibold text-sm border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
              >
                Back to Appointment
              </button>
            </div>
          )}

          {/* ── VIEW ── */}
          {step === "view" && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-semibold text-gray-900">Your Appointment</h2>
                  <span
                    className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${statusColor}15`, color: statusColor }}
                  >
                    {statusIcon}
                    {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Appointment details card */}
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{formatDate(appt.date)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700">{formatTime(appt.time)}</span>
                  </div>
                  {appt.store_name && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700">{appt.store_name}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-100 pt-3 space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700">{[appt.first_name, appt.last_name].filter(Boolean).join(" ")}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600">{appt.email}</span>
                    </div>
                    {appt.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-600">{appt.phone}</span>
                      </div>
                    )}
                  </div>
                  {appt.notes && (
                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-xs text-gray-400 mb-1">Notes</p>
                      <p className="text-sm text-gray-600">{appt.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {!isCancelled && appt.status !== "completed" && (
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={handleRescheduleClick}
                    className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90"
                    style={{ backgroundColor: brandColor }}
                  >
                    Reschedule Appointment
                  </button>
                  <button
                    onClick={() => setStep("cancel-confirm")}
                    className="w-full py-3 rounded-xl font-semibold text-sm border-2 border-red-200 text-red-500 hover:bg-red-50 transition-all"
                  >
                    Cancel Appointment
                  </button>
                </div>
              )}
              {isCancelled && (
                <p className="text-center text-sm text-gray-400 py-2">
                  This appointment has been cancelled. To book a new one, contact us directly.
                </p>
              )}
            </div>
          )}

          {/* ── RESCHEDULE ── */}
          {step === "reschedule" && (
            <div className="space-y-5">
              <button
                onClick={() => setStep("view")}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Reschedule</h2>
                <p className="text-sm text-gray-500 mt-0.5">Pick a new date and time</p>
              </div>
              {slotsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : Object.keys(availableSlots).length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Unable to load available slots. Please try again.</p>
                  <button
                    onClick={handleRescheduleClick}
                    className="mt-3 text-sm underline"
                    style={{ color: brandColor }}
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <>
                  <CalendarPicker
                    availableSlots={availableSlots}
                    selectedDate={selectedDate}
                    onSelectDate={(d) => { setSelectedDate(d); setSelectedTime(null); }}
                    brandColor={brandColor}
                  />
                  {selectedDate && (
                    <div className="pt-4 border-t border-gray-100">
                      <TimeSlotPicker
                        slots={availableSlots[selectedDate] || []}
                        selectedTime={selectedTime}
                        onSelect={setSelectedTime}
                        brandColor={brandColor}
                      />
                    </div>
                  )}
                </>
              )}
              <button
                onClick={handleReschedule}
                disabled={!selectedDate || !selectedTime || isActionLoading}
                className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: brandColor }}
              >
                {isActionLoading ? "Rescheduling…" : "Confirm Reschedule"}
              </button>
            </div>
          )}

          {/* ── CANCEL CONFIRM ── */}
          {step === "cancel-confirm" && (
            <div className="space-y-5">
              <button
                onClick={() => setStep("view")}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Cancel Appointment?</h2>
                <p className="text-sm text-gray-500 mb-2">
                  Are you sure you want to cancel your appointment on
                </p>
                <p className="text-sm font-medium text-gray-700 mb-6">
                  {formatDate(appt.date)} at {formatTime(appt.time)}
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={isActionLoading}
                    className="w-full py-3 rounded-xl font-semibold text-white text-sm bg-red-500 hover:bg-red-600 transition-all disabled:opacity-60"
                  >
                    {isActionLoading ? "Cancelling…" : "Yes, Cancel Appointment"}
                  </button>
                  <button
                    onClick={() => setStep("view")}
                    className="w-full py-3 rounded-xl font-semibold text-sm border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    Keep My Appointment
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
