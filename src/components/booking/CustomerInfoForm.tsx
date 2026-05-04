import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Calendar, Clock, User } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { CustomerData } from "@/types/booking";

const TITLES = ["Mr.", "Ms.", "Mrs.", "Dr.", "Prof."];

const AREA_CODES = [
  { code: "+1",  label: "+1 (US/CA)" },
  { code: "+44", label: "+44 (UK)" },
  { code: "+61", label: "+61 (AU)" },
  { code: "+33", label: "+33 (FR)" },
  { code: "+49", label: "+49 (DE)" },
  { code: "+34", label: "+34 (ES)" },
  { code: "+39", label: "+39 (IT)" },
  { code: "+55", label: "+55 (BR)" },
  { code: "+52", label: "+52 (MX)" },
  { code: "+57", label: "+57 (CO)" },
  { code: "+54", label: "+54 (AR)" },
  { code: "+56", label: "+56 (CL)" },
  { code: "+81", label: "+81 (JP)" },
  { code: "+86", label: "+86 (CN)" },
  { code: "+91", label: "+91 (IN)" },
  { code: "+971", label: "+971 (AE)" },
  { code: "+966", label: "+966 (SA)" },
];

const COMM_OPTIONS = [
  { value: "Email",    label: "Email" },
  { value: "Phone",    label: "Phone" },
  { value: "WhatsApp", label: "WhatsApp" },
  { value: "SMS",      label: "SMS" },
];

const schema = z.object({
  title: z.string().optional(),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().optional(),
  email: z.string().email("Please enter a valid email address"),
  phone_area_code: z.string().optional(),
  phone: z.string().optional(),
  country_of_residence: z.string().optional(),
  preferred_communication: z.string().optional(),
  notes: z.string().optional(),
  accepted_terms: z.boolean().refine((v) => v === true, "You must accept the terms to continue"),
  consent_communication: z.boolean().optional(),
});

interface CustomerInfoFormProps {
  onSubmit: (data: CustomerData) => void;
  isLoading: boolean;
  brandColor: string;
  serviceName: string;
  userName: string;
  date: string;
  time: string;
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

const inputClass = (hasError?: boolean) =>
  `w-full px-3.5 py-2.5 rounded-xl border-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all ${
    hasError
      ? "border-red-300 focus:border-red-400"
      : "border-gray-200 focus:border-gray-400"
  }`;

const selectClass = (hasError?: boolean) =>
  `w-full px-3.5 py-2.5 rounded-xl border-2 text-sm text-gray-900 bg-white outline-none transition-all appearance-none ${
    hasError
      ? "border-red-300 focus:border-red-400"
      : "border-gray-200 focus:border-gray-400"
  }`;

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
    watch,
    setValue,
    formState: { errors },
  } = useForm<CustomerData>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone_area_code: "+1",
      accepted_terms: false,
      consent_communication: false,
    },
  });

  const preferred = watch("preferred_communication") ?? "";
  const commValues = preferred ? preferred.split(", ").filter(Boolean) : [];

  const toggleComm = (value: string) => {
    const next = commValues.includes(value)
      ? commValues.filter((v) => v !== value)
      : [...commValues, value];
    setValue("preferred_communication", next.join(", "));
  };

  const displayDate = date
    ? format(parseISO(date + "T00:00:00"), "EEEE, MMMM d, yyyy")
    : "";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Your Details</h2>
        <p className="text-sm text-gray-500 mt-0.5">Almost there! Fill in your information below.</p>
      </div>

      {/* Booking summary */}
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

        {/* Title + First name + Last name */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <select {...register("title")} className={selectClass()}>
              <option value="">—</option>
              {TITLES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-red-400">*</span>
            </label>
            <input
              {...register("first_name")}
              type="text"
              placeholder="Jane"
              autoComplete="given-name"
              className={inputClass(!!errors.first_name)}
            />
            {errors.first_name && (
              <p className="text-xs text-red-500 mt-1">{errors.first_name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input
              {...register("last_name")}
              type="text"
              placeholder="Doe"
              autoComplete="family-name"
              className={inputClass()}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            {...register("email")}
            type="email"
            placeholder="jane@example.com"
            autoComplete="email"
            className={inputClass(!!errors.email)}
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Phone area code + phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone <span className="text-gray-400 font-normal text-xs">(optional)</span>
          </label>
          <div className="flex gap-2">
            <select
              {...register("phone_area_code")}
              className={`w-36 flex-shrink-0 ${selectClass()}`}
            >
              {AREA_CODES.map((a) => (
                <option key={a.code} value={a.code}>{a.label}</option>
              ))}
            </select>
            <input
              {...register("phone")}
              type="tel"
              placeholder="555 000 0000"
              autoComplete="tel-national"
              className={inputClass()}
            />
          </div>
        </div>

        {/* Country of residence */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country of Residence <span className="text-gray-400 font-normal text-xs">(optional)</span>
          </label>
          <input
            {...register("country_of_residence")}
            type="text"
            placeholder="United States"
            autoComplete="country-name"
            className={inputClass()}
          />
        </div>

        {/* Preferred communication */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Communication <span className="text-gray-400 font-normal text-xs">(optional)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {COMM_OPTIONS.map(({ value, label }) => {
              const active = commValues.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleComm(value)}
                  className="px-3.5 py-1.5 rounded-full text-sm font-medium border-2 transition-all"
                  style={
                    active
                      ? { backgroundColor: brandColor, borderColor: brandColor, color: "#fff" }
                      : { backgroundColor: "#fff", borderColor: "#e5e7eb", color: "#374151" }
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
          <input type="hidden" {...register("preferred_communication")} />
        </div>

        {/* Notes */}
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

        {/* Consent + Terms */}
        <div className="space-y-2.5 pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              {...register("consent_communication")}
              type="checkbox"
              className="mt-0.5 w-4 h-4 rounded flex-shrink-0 accent-current"
              style={{ accentColor: brandColor }}
            />
            <span className="text-xs text-gray-600">
              I agree to receive communications about my appointment via my preferred channels.
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              {...register("accepted_terms")}
              type="checkbox"
              className="mt-0.5 w-4 h-4 rounded flex-shrink-0"
              style={{ accentColor: brandColor }}
            />
            <span className="text-xs text-gray-600">
              I accept the <span className="underline">terms and conditions</span>. <span className="text-red-400">*</span>
            </span>
          </label>
          {errors.accepted_terms && (
            <p className="text-xs text-red-500">{errors.accepted_terms.message}</p>
          )}
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
