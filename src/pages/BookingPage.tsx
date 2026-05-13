import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { StoreSelector } from "@/components/booking/StoreSelector";
import { CalendarPicker } from "@/components/booking/CalendarPicker";
import { TimeSlotPicker } from "@/components/booking/TimeSlotPicker";
import { BookingForm, type BookingFormData } from "@/components/booking/BookingForm";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface StoreOption {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface ClientInfo {
  company_name: string;
  brand_color: string;
  logo_url: string | null;
}

type Step = "store" | "datetime" | "form" | "success";

export default function BookingPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("store");
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Record<string, string[]>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdAppointmentId, setCreatedAppointmentId] = useState<string | null>(null);

  const brandColor = clientInfo?.brand_color || "#4f46e5";

  // Fetch stores
  useEffect(() => {
    if (!clientId) return;
    const fetchStores = async () => {
      try {
        const bookingPageId = searchParams.get("booking_page_id");
        const bookingPageSlug = searchParams.get("slug") || searchParams.get("booking_page_slug");
        const storeParams = new URLSearchParams();
        if (bookingPageId) storeParams.set("booking_page_id", bookingPageId);
        else if (bookingPageSlug) storeParams.set("booking_page_slug", bookingPageSlug);
        const storeQuery = storeParams.toString() ? `?${storeParams}` : "";
        const res = await fetch(`${API_URL}/public/stores/${clientId}${storeQuery}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load");

        setClientInfo({
          company_name: data.company_name,
          brand_color: data.stores?.[0]?.brand_color || "#4f46e5",
          logo_url: null,
        });

        // Fetch client branding separately via a slots call to get brand info
        const slotsRes = await fetch(`${API_URL}/public/slots/${clientId}?range=1m`);
        const slotsData = await slotsRes.json();
        if (slotsRes.ok) {
          setClientInfo({
            company_name: slotsData.company_name,
            brand_color: slotsData.brand_color || "#4f46e5",
            logo_url: slotsData.logo_url || null,
          });
        }

        setStores(data.stores || []);

        // Auto-skip store step if 0 or 1 stores
        if (!data.stores || data.stores.length === 0) {
          setStep("datetime");
        } else if (data.stores.length === 1) {
          setSelectedStoreId(data.stores[0].id);
          setStep("datetime");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load booking page");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStores();
  }, [clientId]);

  // Fetch slots when store is chosen or step moves to datetime
  const fetchSlots = useCallback(async () => {
    if (!clientId) return;
    setIsSlotsLoading(true);
    try {
      const params = new URLSearchParams({ range: "12m" });
      if (selectedStoreId) params.set("store_id", selectedStoreId);
      const res = await fetch(`${API_URL}/public/slots/${clientId}?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load slots");
      setAvailableSlots(data.slots || {});
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSlotsLoading(false);
    }
  }, [clientId, selectedStoreId]);

  useEffect(() => {
    if (step === "datetime") fetchSlots();
  }, [step, fetchSlots]);

  const handleStoreSelect = (id: string) => {
    setSelectedStoreId(id);
  };

  const handleStoreNext = () => {
    setStep("datetime");
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleDateTimeNext = () => {
    if (selectedDate && selectedTime) setStep("form");
  };

  const handleFormSubmit = async (data: BookingFormData) => {
    if (!clientId || !selectedDate || !selectedTime) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/public/appointments/${clientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          date: selectedDate,
          time: selectedTime,
          store_id: selectedStoreId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create appointment");
      setCreatedAppointmentId(json.appointment_id);
      setStep("success");
    } catch (err: any) {
      setError(err.message || "Failed to book appointment");
      // If slot is no longer available, refresh slots and go back
      if (err.message && (
        err.message.includes("no longer available") || 
        err.message.includes("not available") ||
        err.message.includes("being processed")
      )) {
        fetchSlots();
        setStep("datetime");
        setSelectedTime(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedStoreName = stores.find(s => s.id === selectedStoreId)?.name;
  const timeSlotsForDate = selectedDate ? (availableSlots[selectedDate] || []) : [];

  const stepIndex = { store: 0, datetime: 1, form: 2, success: 3 };
  const stepLabels = ["Location", "Date & Time", "Details"];
  const stepsToShow = stores.length > 1 ? stepLabels : ["Date & Time", "Details"];
  const currentStepIndex = stores.length > 1 ? stepIndex[step] : stepIndex[step] - 1;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error && !clientInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-sm w-full text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="font-semibold text-gray-800 mb-1">Unable to load</h2>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  // ── SUCCESS SCREEN ──────────────────────────────────────────────
  if (step === "success" && createdAppointmentId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full overflow-hidden">
          <div className="h-2" style={{ backgroundColor: brandColor }} />
          <div className="p-8 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${brandColor}20` }}
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: brandColor }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            {clientInfo?.logo_url && (
              <img src={clientInfo.logo_url} alt={clientInfo.company_name} className="h-8 mx-auto mb-4 object-contain" />
            )}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">You're confirmed! 🎉</h1>
            <p className="text-gray-500 text-sm mb-2">
              {clientInfo?.company_name} has received your booking request.
            </p>
            <p className="text-gray-500 text-sm mb-6">A confirmation email has been sent to your inbox.</p>
            <div className="rounded-xl p-4 text-sm text-left space-y-1.5 mb-6" style={{ backgroundColor: `${brandColor}10` }}>
              <p className="font-medium text-gray-700">📅 {selectedDate} at {selectedTime}</p>
              {selectedStoreName && <p className="text-gray-600">📍 {selectedStoreName}</p>}
            </div>
            <button
              onClick={() => navigate(`/manage/${createdAppointmentId}`)}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90"
              style={{ backgroundColor: brandColor }}
            >
              Manage My Appointment
            </button>
            <button
              onClick={() => { setStep("store"); setSelectedDate(null); setSelectedTime(null); setCreatedAppointmentId(null); }}
              className="w-full mt-3 py-3 rounded-xl font-semibold text-sm border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
            >
              Book Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4 py-10">
      <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full overflow-hidden">
        {/* Top brand bar */}
        <div className="h-2" style={{ backgroundColor: brandColor }} />

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {clientInfo?.logo_url && (
              <img src={clientInfo.logo_url} alt={clientInfo.company_name} className="h-8 object-contain" />
            )}
            <div>
              <h1 className="font-bold text-gray-900">{clientInfo?.company_name}</h1>
              <p className="text-xs text-gray-400">Book an appointment</p>
            </div>
          </div>

          {/* Step indicator */}
          {step !== "success" && (
            <div className="mt-4 flex items-center gap-2">
              {stepsToShow.map((label, i) => {
                const done = i < currentStepIndex;
                const active = i === currentStepIndex;
                return (
                  <div key={label} className="flex items-center gap-2 flex-1">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                        style={{
                          backgroundColor: done || active ? brandColor : "#e5e7eb",
                          color: done || active ? "white" : "#9ca3af",
                        }}
                      >
                        {done ? "✓" : i + 1}
                      </div>
                      <span className={`text-xs font-medium ${active ? "text-gray-800" : "text-gray-400"}`}>{label}</span>
                    </div>
                    {i < stepsToShow.length - 1 && (
                      <div className="flex-1 h-px" style={{ backgroundColor: done ? brandColor : "#e5e7eb" }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Step content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* ── STEP 1: Store Selector ── */}
          {step === "store" && stores.length > 1 && (
            <div className="space-y-5">
              <StoreSelector
                stores={stores}
                selectedStoreId={selectedStoreId}
                onSelect={handleStoreSelect}
                brandColor={brandColor}
              />
              <button
                onClick={handleStoreNext}
                disabled={!selectedStoreId}
                className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: brandColor }}
              >
                Continue
              </button>
            </div>
          )}

          {/* ── STEP 2: Date & Time ── */}
          {step === "datetime" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Pick a Date & Time</h2>
                {selectedStoreName && <p className="text-sm text-gray-500 mt-0.5">📍 {selectedStoreName}</p>}
              </div>
              {isSlotsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <>
                  <CalendarPicker
                    availableSlots={availableSlots}
                    selectedDate={selectedDate}
                    onSelectDate={handleDateSelect}
                    brandColor={brandColor}
                  />
                  {selectedDate && (
                    <div className="pt-4 border-t border-gray-100">
                      <TimeSlotPicker
                        slots={timeSlotsForDate}
                        selectedTime={selectedTime}
                        onSelect={setSelectedTime}
                        brandColor={brandColor}
                      />
                    </div>
                  )}
                </>
              )}
              <div className="flex gap-3 pt-2">
                {stores.length > 1 && (
                  <button
                    onClick={() => setStep("store")}
                    className="flex items-center gap-1.5 py-3 px-4 rounded-xl font-semibold text-sm border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                )}
                <button
                  onClick={handleDateTimeNext}
                  disabled={!selectedDate || !selectedTime}
                  className="flex-1 py-3 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: brandColor }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Customer Form ── */}
          {step === "form" && selectedDate && selectedTime && (
            <div className="space-y-4">
              <button
                onClick={() => setStep("datetime")}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Change date/time
              </button>
              <BookingForm
                onSubmit={handleFormSubmit}
                isLoading={isSubmitting}
                brandColor={brandColor}
                date={selectedDate}
                time={selectedTime}
                storeName={selectedStoreName}
                companyName={clientInfo?.company_name || ""}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
