import { format, parseISO } from "date-fns";
import { Calendar, Clock, User, CheckCircle2 } from "lucide-react";
import type { BookingResult } from "@/types/booking";

interface BookingConfirmationProps {
  appointment: BookingResult;
  companyName: string;
  logoUrl?: string | null;
  brandColor: string;
  timezone?: string;
  onBookAnother: () => void;
}

function formatTime(isoOrHHMM: string): string {
  try {
    if (isoOrHHMM.includes("T")) {
      return format(parseISO(isoOrHHMM), "h:mm aa");
    }
    const [h, m] = isoOrHHMM.split(":");
    return format(new Date(2000, 0, 1, Number(h), Number(m)), "h:mm aa");
  } catch {
    return isoOrHHMM;
  }
}

function formatDate(isoOrDate: string): string {
  try {
    if (isoOrDate.includes("T")) {
      return format(parseISO(isoOrDate), "EEEE, MMMM d, yyyy");
    }
    return format(parseISO(isoOrDate + "T00:00:00"), "EEEE, MMMM d, yyyy");
  } catch {
    return isoOrDate;
  }
}

export function BookingConfirmation({
  appointment,
  companyName,
  logoUrl,
  brandColor,
  timezone,
  onBookAnother,
}: BookingConfirmationProps) {
  return (
    <div className="text-center">
      {/* Animated success icon */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 animate-[scale-in_0.4s_ease-out]"
        style={{ backgroundColor: `${brandColor}15` }}
      >
        <CheckCircle2
          className="w-10 h-10 transition-all"
          style={{ color: brandColor }}
          strokeWidth={1.5}
        />
      </div>

      {logoUrl && (
        <img
          src={logoUrl}
          alt={companyName}
          className="h-7 mx-auto mb-3 object-contain"
        />
      )}

      <h1 className="text-2xl font-bold text-gray-900 mb-1.5">
        You're confirmed! 🎉
      </h1>
      <p className="text-sm text-gray-500 mb-1">
        <span className="font-medium text-gray-700">{companyName}</span> has received your booking.
      </p>
      <p className="text-sm text-gray-400 mb-6">
        A confirmation email is on its way to{" "}
        <span className="font-medium text-gray-600">{appointment.customer_email}</span>.
      </p>

      {/* Summary card */}
      <div
        className="rounded-2xl p-5 text-sm text-left space-y-3 mb-6"
        style={{ backgroundColor: `${brandColor}08` }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${brandColor}20` }}
          >
            <span className="text-base">📋</span>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Service</p>
            <p className="font-semibold text-gray-800">{appointment.service_name}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${brandColor}20` }}
          >
            <User className="w-4 h-4" style={{ color: brandColor }} />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Staff</p>
            <p className="font-semibold text-gray-800">{appointment.user_name}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${brandColor}20` }}
          >
            <Calendar className="w-4 h-4" style={{ color: brandColor }} />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Date</p>
            <p className="font-semibold text-gray-800">{formatDate(appointment.start_time)}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${brandColor}20` }}
          >
            <Clock className="w-4 h-4" style={{ color: brandColor }} />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Time</p>
            <p className="font-semibold text-gray-800">
              {formatTime(appointment.start_time)}
              {timezone && (
                <span className="text-gray-400 font-normal text-xs ml-1.5">
                  ({timezone.replace("_", " ")})
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onBookAnother}
        className="w-full py-3.5 rounded-xl font-bold text-sm border-2 border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-[0.98] transition-all"
      >
        Book Another Appointment
      </button>
    </div>
  );
}
