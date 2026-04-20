import { useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { useSlugBooking } from "@/hooks/useSlugBooking";
import { StepProgressBar } from "@/components/booking/StepProgressBar";
import { SlugCalendarPicker } from "@/components/booking/SlugCalendarPicker";
import { SlugTimeSlotPicker } from "@/components/booking/SlugTimeSlotPicker";
import { CustomerInfoForm } from "@/components/booking/CustomerInfoForm";
import { BookingConfirmation } from "@/components/booking/BookingConfirmation";
import { StoreSelector } from "@/components/booking/StoreSelector";

/**
 * SlugBookingPage — /book/:slug
 *
 * Simplified public booking flow:
 *   1. Location    (skipped if 0 or 1 stores)
 *   2. Date & Time (calendar + time slots on same screen)
 *   3. Details     (customer form)
 *   4. Success
 */
export default function SlugBookingPage() {
  const { slug } = useParams<{ slug: string }>();

  const {
    pageQuery,
    availabilityQuery,
    step,
    stepLabels,
    currentStepIndex,
    stores,
    selectedStoreId,
    selectedDate,
    selectedTime,
    availableDates,
    appointmentResult,
    submitError,
    selectStore,
    selectDate,
    selectTime,
    goToForm,
    goBack,
    resetBooking,
    submitBooking,
    isSubmitting,
  } = useSlugBooking(slug ?? "");

  const page = pageQuery.data?.booking_page;
  const brandColor = page?.brand_color || "#4f46e5";

  // ── Full-page loading ─────────────────────────────────────────────────────
  if (pageQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  // ── Error / not found ─────────────────────────────────────────────────────
  if (pageQuery.isError || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-4" />
          <h2 className="font-bold text-gray-800 text-lg mb-2">Page Not Found</h2>
          <p className="text-sm text-gray-500">
            {pageQuery.error instanceof Error
              ? pageQuery.error.message
              : "This booking page doesn't exist or is no longer active."}
          </p>
        </div>
      </div>
    );
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (step === "success" && appointmentResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4 py-10">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full overflow-hidden">
          <div className="h-1.5 w-full" style={{ backgroundColor: brandColor }} />
          <div className="p-6">
            <BookingConfirmation
              appointment={appointmentResult}
              companyName={page.company_name}
              logoUrl={page.logo_url}
              brandColor={brandColor}
              timezone={page.timezone}
              onBookAnother={resetBooking}
            />
          </div>
        </div>
      </div>
    );
  }

  const selectedStoreName = stores.find((s) => s.id === selectedStoreId)?.name;
  const timeSlotsForDate = selectedDate
    ? (availabilityQuery.data?.slots ?? [])
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4 py-10">
      <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full overflow-hidden">

        {/* Brand bar */}
        <div className="h-1.5 w-full" style={{ backgroundColor: brandColor }} />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {page.logo_url && (
              <img
                src={page.logo_url}
                alt={page.company_name}
                className="h-8 object-contain flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <h1 className="font-bold text-gray-900 truncate">{page.company_name}</h1>
              <p className="text-xs text-gray-400 truncate">{page.name}</p>
            </div>
          </div>

          <StepProgressBar
            steps={stepLabels}
            currentIndex={currentStepIndex}
            brandColor={brandColor}
          />
        </div>

        {/* Step content */}
        <div className="p-6">
          {submitError && (
            <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* ── Step 1: Location ── */}
          {step === "location" && (
            <div className="space-y-5">
              {/* <h2 className="text-xl font-bold text-gray-900">Select a Location</h2> */}
              <StoreSelector
                stores={stores}
                selectedStoreId={selectedStoreId}
                onSelect={(id) => selectStore(id)}
                brandColor={brandColor}
              />
            </div>
          )}

          {/* ── Step 2: Date & Time ── */}
          {step === "datetime" && (
            <div className="space-y-5">
              {selectedStoreName && (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  📍 {selectedStoreName}
                </p>
              )}

              <SlugCalendarPicker
                selectedDate={selectedDate}
                onSelectDate={selectDate}
                brandColor={brandColor}
                availableDates={availableDates}
              />

              {selectedDate && (
                <SlugTimeSlotPicker
                  slots={timeSlotsForDate}
                  selectedTime={selectedTime}
                  onSelect={selectTime}
                  brandColor={brandColor}
                  isLoading={availabilityQuery.isLoading || availabilityQuery.isFetching}
                  isError={availabilityQuery.isError}
                  date={selectedDate}
                  timezone={availabilityQuery.data?.timezone ?? page.timezone}
                />
              )}

              <div className="flex gap-3 pt-2">
                {stores.length > 1 && (
                  <BackButton onClick={goBack} label="Back" />
                )}
                <button
                  onClick={goToForm}
                  disabled={!selectedDate || !selectedTime}
                  className="flex-1 py-3 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: brandColor }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Details form ── */}
          {step === "form" && selectedDate && selectedTime && (
            <div className="space-y-4">
              <CustomerInfoForm
                onSubmit={submitBooking}
                isLoading={isSubmitting}
                brandColor={brandColor}
                serviceName={page.name}
                userName=""
                date={selectedDate}
                time={selectedTime}
                timezone={page.timezone}
              />
              <BackButton onClick={goBack} label="Change date/time" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Shared back button ────────────────────────────────────────────────────────
function BackButton({ onClick, label = "Back" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors pt-1"
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
