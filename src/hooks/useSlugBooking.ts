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
 * Booking flow: Location → Staff (optional) → Date & Time → Details → Success
 *
 * - Location step skipped if 0 or 1 stores
 * - Staff step shown only when booking page has multiple staff members
 * - Customer can select a specific staff member or choose "No preference"
 * - If no preference: availability shows union of all staff; backend auto-assigns
 * - Services are entirely optional; booking works without them
 */
export function useSlugBooking(slug: string) {
  // ── Step ─────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<BookingStep>("location");

  // ── Selections ───────────────────────────────────────────────────────────
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [appointmentResult, setAppointmentResult] = useState<BookingResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Fetch booking page (re-fetches when store changes for store-hours filtering) ──
  const pageQuery = useQuery({
    queryKey: ["booking-page", slug, selectedStoreId ?? ""],
    queryFn: () => getBookingPage(slug, selectedStoreId),
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  // Auto-resolve initial step, populate staff list, skip steps as needed
  useEffect(() => {
    if (!pageQuery.data || step !== "location") return;

    const stores = pageQuery.data.stores ?? [];
    const users = pageQuery.data.users ?? [];

    setAvailableUsers(users);

    const hasMultipleStores = stores.length > 1;
    const hasMultipleStaff = users.length > 1;

    if (!hasMultipleStores) {
      if (stores.length === 1) setSelectedStoreId(stores[0].id);
      setStep(hasMultipleStaff ? "staff" : "datetime");
    }
    // else stay on "location"
  }, [pageQuery.data, step]);

  // ── Fetch availability (per date) ─────────────────────────────────────────
  // When selectedUser is null (no preference), omit user_id — backend returns union.
  // Pass selectedStoreId so backend respects use_store_hours when applicable.
  const availabilityQuery = useQuery({
    queryKey: ["availability", slug, selectedUser?.id ?? "any", selectedDate, selectedStoreId ?? ""],
    queryFn: () =>
      getAvailability(
        slug,
        "",
        selectedUser?.id ?? null,  // null → backend returns union of all staff
        selectedDate!,
        selectedStoreId
      ),
    enabled: !!(selectedDate && step === "datetime"),
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
        // Only include user_id if a specific staff member was selected
        ...(selectedUser ? { user_id: selectedUser.id } : {}),
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
    setStep(availableUsers.length > 1 ? "staff" : "datetime");
  }, [availableUsers.length]);

  const selectUser = useCallback((user: UserOption | null) => {
    setSelectedUser(user);
    setSelectedDate(null);
    setSelectedTime(null);
    setStep("datetime");
  }, []);

  const selectDate = useCallback((date: string) => {
    setSelectedDate(date);
    setSelectedTime(null);
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
      case "staff":
        if ((pageQuery.data?.stores?.length ?? 0) > 1) {
          setStep("location");
        }
        break;
      case "datetime":
        if (availableUsers.length > 1) {
          setStep("staff");
          setSelectedDate(null);
          setSelectedTime(null);
          setSelectedUser(null);
        } else if ((pageQuery.data?.stores?.length ?? 0) > 1) {
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
  }, [step, pageQuery.data, availableUsers.length]);

  const resetBooking = useCallback(() => {
    setStep("location");
    setSelectedUser(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setAppointmentResult(null);
    setSubmitError(null);
    bookMutation.reset();
  }, [bookMutation]);

  // ── Derived helpers ───────────────────────────────────────────────────────
  const stores = pageQuery.data?.stores ?? [];
  const hasMultipleStores = stores.length > 1;
  const hasMultipleStaff = availableUsers.length > 1;

  const stepLabels: { key: BookingStep; label: string }[] = [
    ...(hasMultipleStores ? [{ key: "location" as BookingStep, label: "Location" }] : []),
    ...(hasMultipleStaff ? [{ key: "staff" as BookingStep, label: "Staff" }] : []),
    { key: "datetime", label: "Date & Time" },
    { key: "form", label: "Details" },
  ];

  const currentStepIndex = stepLabels.findIndex((s) => s.key === step);

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
    availableUsers,
    selectedUser,
    selectedDate,
    selectedTime,
    availableDates,
    appointmentResult,
    submitError,
    selectStore,
    selectUser,
    selectDate,
    selectTime,
    goToForm,
    goBack,
    resetBooking,
    submitBooking: bookMutation.mutate,
    isSubmitting: bookMutation.isPending,
  };
}
