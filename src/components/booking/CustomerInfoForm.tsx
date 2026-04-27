import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Calendar, Clock, User } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { CustomerData } from "@/types/booking";

const schema = z.object({
  customer_name: z.string().min(2, "Name must be at least 2 characters"),
  customer_email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  country_of_residence: z.string().optional(),
  notes: z.string().optional(),
  accepted_terms: z.boolean().optional(),
});

interface CustomerInfoFormProps {
  onSubmit: (data: CustomerData) => void;
  isLoading: boolean;
  brandColor: string;
  // Summary for the confirmation header
  serviceName: string;
  userName: string;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:MM
  timezone?: string;
}

function formatSummaryTime(hhmm: string): string {
  try {
    const [h, m] = hhmm.split(":");
    const d = new Date(2000, 0, 1, Number(h), Number(m));
    return format(d, "h:mm aa");
  } catch {
    return hhmm;
  }
}

export function CustomerInfoForm({
  onSubmit,
  isLoading,
  brandColor,
  serviceName,
  userName,
  date,
  time,
  timezone,
}: CustomerInfoFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerData>({
    resolver: zodResolver(schema),
  });

  const displayDate = date
    ? format(parseISO(date + "T00:00:00"), "EEEE, MMMM d, yyyy")
    : "";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Your Details</h2>
        <p className="text-sm text-gray-500 mt-0.5">Almost there! Fill in your information below.</p>
      </div>

      {/* Booking summary card */}
      <div
        className="rounded-xl p-4 text-sm space-y-1.5"
        style={{ backgroundColor: `${brandColor}08`, borderLeft: `3px solid ${brandColor}` }}
      >
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <span className="text-base">📋</span>
          {serviceName}
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <User className="w-3.5 h-3.5 flex-shrink-0" style={{ color: brandColor }} />
          With {userName}
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: brandColor }} />
          {displayDate}
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: brandColor }} />
          {formatSummaryTime(time)}
          {timezone && (
            <span className="text-[10px] text-gray-400 ml-1">
              ({timezone.replace("_", " ")})
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name <span className="text-red-400">*</span>
          </label>
          <input
            {...register("customer_name")}
            type="text"
            placeholder="John Doe"
            autoComplete="name"
            className={`w-full px-3.5 py-2.5 rounded-xl border-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all
              ${errors.customer_name
                ? "border-red-300 focus:border-red-400"
                : "border-gray-200 focus:border-gray-400"
              }`}
            style={
              !errors.customer_name
                ? { "--tw-ring-color": brandColor } as React.CSSProperties
                : {}
            }
          />
          {errors.customer_name && (
            <p className="text-xs text-red-500 mt-1">{errors.customer_name.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address <span className="text-red-400">*</span>
          </label>
          <input
            {...register("customer_email")}
            type="email"
            placeholder="john@example.com"
            autoComplete="email"
            className={`w-full px-3.5 py-2.5 rounded-xl border-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all
              ${errors.customer_email
                ? "border-red-300 focus:border-red-400"
                : "border-gray-200 focus:border-gray-400"
              }`}
          />
          {errors.customer_email && (
            <p className="text-xs text-red-500 mt-1">{errors.customer_email.message}</p>
          )}
        </div>

        {/* Phone (optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone <span className="text-gray-400 font-normal text-xs">(optional)</span>
          </label>
          <input
            {...register("phone")}
            type="tel"
            placeholder="+1 555 000 0000"
            autoComplete="tel"
            className="w-full px-3.5 py-2.5 rounded-xl border-2 border-gray-200 focus:border-gray-400 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all"
          />
        </div>

        {/* Country of Residence (optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country of Residence <span className="text-gray-400 font-normal text-xs">(optional)</span>
          </label>
          <input
            {...register("country_of_residence")}
            type="text"
            placeholder="e.g. USA"
            autoComplete="country-name"
            className="w-full px-3.5 py-2.5 rounded-xl border-2 border-gray-200 focus:border-gray-400 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all"
          />
        </div>

        {/* Notes (optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes <span className="text-gray-400 font-normal text-xs">(optional)</span>
          </label>
          <textarea
            {...register("notes")}
            rows={2}
            placeholder="Anything we should know?"
            className="w-full px-3.5 py-2.5 rounded-xl border-2 border-gray-200 focus:border-gray-400 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ backgroundColor: brandColor }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Confirming your booking…
            </>
          ) : (
            "Confirm Booking"
          )}
        </button>
      </form>
    </div>
  );
}
