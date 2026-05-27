/**
 * bookingApi.ts
 * Unauthenticated public API client for the Booking Page flow.
 * No auth token or impersonation headers needed.
 */

import type {
  AvailabilityResponse,
  BookingPageResponse,
  BookingPayload,
  BookingResponse,
} from "@/types/booking";

const BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

async function publicFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed (${res.status})`);
  }

  return data as T;
}

// ─── Endpoints ───────────────────────────────────────────────────────────────

/** Fetch booking page info, services, and users by slug. */
export const getBookingPage = (slug: string) =>
  publicFetch<BookingPageResponse>(`/api/booking-pages/${slug}`);

/** Fetch available time slots for a user + date (service optional).
 *  Pass an empty/falsy userId to get the union of all staff availability. */
export const getAvailability = (
  slug: string,
  serviceId: string | null | undefined,
  userId: string | null | undefined,
  date: string // YYYY-MM-DD
) => {
  const params = new URLSearchParams({ date });
  if (userId) params.set("user_id", userId);
  if (serviceId) params.set("service_id", serviceId);
  return publicFetch<AvailabilityResponse>(
    `/api/booking-pages/${slug}/availability?${params}`
  );
};

/** Submit a new booking. */
export const createBooking = (slug: string, payload: BookingPayload) =>
  publicFetch<BookingResponse>(`/api/booking-pages/${slug}/book`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
