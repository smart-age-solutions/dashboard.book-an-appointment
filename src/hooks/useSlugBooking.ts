import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getBookingPage,
  getAvailability,
  createBooking,
} from "@/lib/bookingApi";
import type {
  BookingStep,
  UserOption,
  CustomerData,
  BookingResult,
} from "@/types/booking";

/**
 * useSlugBooking
 * ─────────────
 * Simplified booking flow: Location → Date & Time → Details → Success
 *
 * - Location step skipped if 0 or 1 stores
 * - Staff is auto-selected (first/default user), never shown to customer
 * - Services are entirely optional; booking works without them
 */
export function useSlugBooking(slug: string) {
  // ── Step ─────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<BookingStep>("location");

  // ── Selections ───────────────────────────────────────────────────────────
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [autoUser, setAutoUser] = useState<UserOption | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [appointmentResult, setAppointmentResult] = useState<BookingResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Fetch booking page (once) ─────────────────────────────────────────────
  const pageQuery = useQuery({
    queryKey: ["booking-page", slug],
    queryFn: () => getBookingPage(slug),
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  // Auto-resolve initial step and auto-select staff when data loads
  useEffect(() => {
    if (!pageQuery.data || step !== "location") return;

    const stores = pageQuery.data.stores ?? [];
    const defaultUserId = pageQuery.data.booking_page?.default_user_id;

    // Auto-pick the default user — never show staff selector to customer
    setAutoUser(defaultUserId ? { id: defaultUserId } : null);

    // Skip location step if 0 or 1 stores
    if (stores.length <= 1) {
      if (stores.length === 1) setSelectedStoreId(stores[0].id);
      setStep("datetime");
    }
    // else stay on "location" so the user can pick a store
  }, [pageQuery.data, step]);

  // ── Fetch availability (per date) ─────────────────────────────────────────
  const availabilityQuery = useQuery({
    queryKey: ["availability", slug, autoUser?.id, selectedDate],
    queryFn: () =>
      getAvailability(
        slug,
        "",        // no service_id needed
        autoUser!.id,
        selectedDate!
      ),
    enabled: !!(autoUser && selectedDate && step === "datetime"),
    retry: 1,
    staleTime: 10_000,
  });

  // ── Booking mutation ──────────────────────────────────────────────────────
  const bookMutation = useMutation({
    mutationFn: (data: CustomerData) => {
      if (!selectedDate || !selectedTime) {
        throw new Error("Please select a date and time");
      }
      const start_time = `${selectedDate}T${selectedTime}:00`;
      const customer_name = [data.first_name, data.last_name].filter(Boolean).join(" ");
      return createBooking(slug, {
        ...(autoUser ? { user_id: autoUser.id } : {}),
        ...(selectedStoreId ? { store_id: selectedStoreId } : {}),
        customer_name,
        customer_email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        title: data.title,
        email: data.email,
        phone_area_code: data.phone_area_code,
        phone: data.phone,
        country_of_residence: data.country_of_residence,
        preferred_communication: data.preferred_communication,
        notes: data.notes,
        accepted_terms: data.accepted_terms,
        consent_communication: data.consent_communication,
        custom_data: data.custom_data,
        start_time,
      } as any);
    },
    onSuccess: (res) => {
      setAppointmentResult(res.appointment);
      setSubmitError(null);
      setStep("success");
    },
    onError: (err: Error) => {
      setSubmitError(err.message);
      if (
        err.message.includes("not available") ||
        err.message.includes("conflict") ||
        err.message.includes("already booked")
      ) {
        setSelectedTime(null);
      }
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

  const selectStore = useCallback((storeId: string) => {
    setSelectedStoreId(storeId);
    setSelectedDate(null);
    setSelectedTime(null);
    setStep("datetime");
  }, []);

  const selectDate = useCallback((date: string) => {
    setSelectedDate(date);
    setSelectedTime(null);
    // stay on datetime step — time slots will load below the calendar
  }, []);

  const selectTime = useCallback((time: string) => {
    setSelectedTime(time);
  }, []);

  const goToForm = useCallback(() => {
    if (selectedDate && selectedTime) setStep("form");
  }, [selectedDate, selectedTime]);

  const goBack = useCallback(() => {
    setSubmitError(null);
    switch (step) {
      case "datetime":
        // Only go back to location if there are multiple stores
        if ((pageQuery.data?.stores?.length ?? 0) > 1) {
          setStep("location");
          setSelectedDate(null);
          setSelectedTime(null);
        }
        break;
      case "form":
        setStep("datetime");
        break;
      default:
        break;
    }
  }, [step, pageQuery.data]);

  const resetBooking = useCallback(() => {
    setStep("location");
    setSelectedDate(null);
    setSelectedTime(null);
    setAppointmentResult(null);
    setSubmitError(null);
    bookMutation.reset();
  }, [bookMutation]);

  // ── Derived helpers ───────────────────────────────────────────────────────
  const stores = pageQuery.data?.stores ?? [];
  const hasMultipleStores = stores.length > 1;

  const stepLabels: { key: BookingStep; label: string }[] = [
    ...(hasMultipleStores ? [{ key: "location" as BookingStep, label: "Location" }] : []),
    { key: "datetime", label: "Date & Time" },
    { key: "form", label: "Details" },
  ];

  const currentStepIndex = stepLabels.findIndex((s) => s.key === step);

  // Build available dates set from page-level slots
  const availableDates = pageQuery.data?.slots
    ? new Set(Object.keys(pageQuery.data.slots))
    : undefined;

  return {
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
    submitBooking: bookMutation.mutate,
    isSubmitting: bookMutation.isPending,
  };
}
