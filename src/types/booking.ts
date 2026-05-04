// ─── Booking Page Data ─────────────────────────────────────────────────────

export interface ServiceOption {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price?: number | null;
}

export interface UserOption {
  id: string;
  name?: string;
  is_default?: boolean;
  priority?: number;
}

export interface BookingPageData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  timezone: string;
  buffer_time_minutes: number;
  company_name: string;
  brand_color: string;
  logo_url?: string | null;
  extra_cc_emails?: string;
  default_user_id?: string | null;
}

export interface BookingPageResponse {
  status: string;
  booking_page: BookingPageData;
  services: ServiceOption[];
  slots?: Record<string, string[]>; // date -> available times
  stores?: Array<{ id: string; name: string; address?: string }>;
  start_date?: string;
  end_date?: string;
  slot_duration?: number;
}

// ─── Availability ───────────────────────────────────────────────────────────

export interface AvailabilityResponse {
  status: string;
  date: string;
  timezone: string;
  user_id: string;
  user_name: string;
  service_id: string;
  service_name: string;
  duration_minutes: number;
  slots: string[]; // ["09:00", "09:30", …]
}

// ─── Booking Payload ────────────────────────────────────────────────────────

export interface BookingPayload {
  service_id?: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  start_time: string; // ISO 8601  e.g. "2026-04-10T14:00:00"
  phone?: string;
  notes?: string;
  accepted_terms?: boolean;
  custom_data?: Record<string, any>;
  country_of_residence?: string;
}

export interface BookingResult {
  id: string;
  booking_page_id: string;
  user_id: string;
  user_name: string;
  service_id: string;
  service_name: string;
  customer_name: string;
  customer_email: string;
  start_time: string;
  end_time: string;
  duration_minutes?: number | null;
  status: string;
  country_of_residence?: string;
  created_at: string;
}

export interface BookingResponse {
  status: string;
  message: string;
  appointment: BookingResult;
}

// ─── Customer Form Data ─────────────────────────────────────────────────────

export interface CustomerData {
  first_name: string;
  last_name?: string;
  title?: string;
  email: string;
  phone_area_code?: string;
  phone?: string;
  country_of_residence?: string;
  preferred_communication?: string;
  notes?: string;
  accepted_terms: boolean;
  consent_communication?: boolean;
  custom_data?: Record<string, any>;
}

// ─── Step Union ─────────────────────────────────────────────────────────────

export type BookingStep =
  | "location"
  | "datetime"
  | "form"
  | "success";

// Legacy steps (kept for any old usages)
export type LegacyBookingStep =
  | "service"
  | "user"
  | "date"
  | "time"
  | "form"
  | "success";
