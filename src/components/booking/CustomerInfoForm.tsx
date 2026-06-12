import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Calendar, Clock, User } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { CustomerData } from "@/types/booking";

const TITLES = ["Mr.", "Ms.", "Mrs.", "Dr.", "Prof."];

const AREA_CODES = [
  { code: "+1",   label: "+1 (United States / Canada)" },
  { code: "+93",  label: "+93 (Afghanistan)" },
  { code: "+355", label: "+355 (Albania)" },
  { code: "+213", label: "+213 (Algeria)" },
  { code: "+376", label: "+376 (Andorra)" },
  { code: "+244", label: "+244 (Angola)" },
  { code: "+54",  label: "+54 (Argentina)" },
  { code: "+374", label: "+374 (Armenia)" },
  { code: "+297", label: "+297 (Aruba)" },
  { code: "+61",  label: "+61 (Australia)" },
  { code: "+43",  label: "+43 (Austria)" },
  { code: "+994", label: "+994 (Azerbaijan)" },
  { code: "+973", label: "+973 (Bahrain)" },
  { code: "+880", label: "+880 (Bangladesh)" },
  { code: "+375", label: "+375 (Belarus)" },
  { code: "+32",  label: "+32 (Belgium)" },
  { code: "+501", label: "+501 (Belize)" },
  { code: "+229", label: "+229 (Benin)" },
  { code: "+975", label: "+975 (Bhutan)" },
  { code: "+591", label: "+591 (Bolivia)" },
  { code: "+387", label: "+387 (Bosnia and Herzegovina)" },
  { code: "+267", label: "+267 (Botswana)" },
  { code: "+55",  label: "+55 (Brazil)" },
  { code: "+673", label: "+673 (Brunei)" },
  { code: "+359", label: "+359 (Bulgaria)" },
  { code: "+226", label: "+226 (Burkina Faso)" },
  { code: "+257", label: "+257 (Burundi)" },
  { code: "+855", label: "+855 (Cambodia)" },
  { code: "+237", label: "+237 (Cameroon)" },
  { code: "+238", label: "+238 (Cape Verde)" },
  { code: "+236", label: "+236 (Central African Republic)" },
  { code: "+235", label: "+235 (Chad)" },
  { code: "+56",  label: "+56 (Chile)" },
  { code: "+86",  label: "+86 (China)" },
  { code: "+57",  label: "+57 (Colombia)" },
  { code: "+269", label: "+269 (Comoros)" },
  { code: "+242", label: "+242 (Congo)" },
  { code: "+682", label: "+682 (Cook Islands)" },
  { code: "+506", label: "+506 (Costa Rica)" },
  { code: "+385", label: "+385 (Croatia)" },
  { code: "+53",  label: "+53 (Cuba)" },
  { code: "+357", label: "+357 (Cyprus)" },
  { code: "+420", label: "+420 (Czech Republic)" },
  { code: "+45",  label: "+45 (Denmark)" },
  { code: "+253", label: "+253 (Djibouti)" },
  { code: "+1",   label: "+1 (Dominican Republic)" },
  { code: "+593", label: "+593 (Ecuador)" },
  { code: "+20",  label: "+20 (Egypt)" },
  { code: "+503", label: "+503 (El Salvador)" },
  { code: "+240", label: "+240 (Equatorial Guinea)" },
  { code: "+291", label: "+291 (Eritrea)" },
  { code: "+372", label: "+372 (Estonia)" },
  { code: "+251", label: "+251 (Ethiopia)" },
  { code: "+679", label: "+679 (Fiji)" },
  { code: "+358", label: "+358 (Finland)" },
  { code: "+33",  label: "+33 (France)" },
  { code: "+241", label: "+241 (Gabon)" },
  { code: "+220", label: "+220 (Gambia)" },
  { code: "+995", label: "+995 (Georgia)" },
  { code: "+49",  label: "+49 (Germany)" },
  { code: "+233", label: "+233 (Ghana)" },
  { code: "+30",  label: "+30 (Greece)" },
  { code: "+299", label: "+299 (Greenland)" },
  { code: "+502", label: "+502 (Guatemala)" },
  { code: "+224", label: "+224 (Guinea)" },
  { code: "+245", label: "+245 (Guinea-Bissau)" },
  { code: "+592", label: "+592 (Guyana)" },
  { code: "+509", label: "+509 (Haiti)" },
  { code: "+504", label: "+504 (Honduras)" },
  { code: "+852", label: "+852 (Hong Kong)" },
  { code: "+36",  label: "+36 (Hungary)" },
  { code: "+354", label: "+354 (Iceland)" },
  { code: "+91",  label: "+91 (India)" },
  { code: "+62",  label: "+62 (Indonesia)" },
  { code: "+98",  label: "+98 (Iran)" },
  { code: "+964", label: "+964 (Iraq)" },
  { code: "+353", label: "+353 (Ireland)" },
  { code: "+972", label: "+972 (Israel)" },
  { code: "+39",  label: "+39 (Italy)" },
  { code: "+81",  label: "+81 (Japan)" },
  { code: "+962", label: "+962 (Jordan)" },
  { code: "+7",   label: "+7 (Kazakhstan)" },
  { code: "+254", label: "+254 (Kenya)" },
  { code: "+686", label: "+686 (Kiribati)" },
  { code: "+965", label: "+965 (Kuwait)" },
  { code: "+996", label: "+996 (Kyrgyzstan)" },
  { code: "+856", label: "+856 (Laos)" },
  { code: "+371", label: "+371 (Latvia)" },
  { code: "+961", label: "+961 (Lebanon)" },
  { code: "+266", label: "+266 (Lesotho)" },
  { code: "+231", label: "+231 (Liberia)" },
  { code: "+218", label: "+218 (Libya)" },
  { code: "+423", label: "+423 (Liechtenstein)" },
  { code: "+370", label: "+370 (Lithuania)" },
  { code: "+352", label: "+352 (Luxembourg)" },
  { code: "+853", label: "+853 (Macau)" },
  { code: "+389", label: "+389 (Macedonia)" },
  { code: "+261", label: "+261 (Madagascar)" },
  { code: "+265", label: "+265 (Malawi)" },
  { code: "+60",  label: "+60 (Malaysia)" },
  { code: "+960", label: "+960 (Maldives)" },
  { code: "+223", label: "+223 (Mali)" },
  { code: "+356", label: "+356 (Malta)" },
  { code: "+692", label: "+692 (Marshall Islands)" },
  { code: "+222", label: "+222 (Mauritania)" },
  { code: "+230", label: "+230 (Mauritius)" },
  { code: "+52",  label: "+52 (Mexico)" },
  { code: "+691", label: "+691 (Micronesia)" },
  { code: "+373", label: "+373 (Moldova)" },
  { code: "+377", label: "+377 (Monaco)" },
  { code: "+976", label: "+976 (Mongolia)" },
  { code: "+382", label: "+382 (Montenegro)" },
  { code: "+212", label: "+212 (Morocco)" },
  { code: "+258", label: "+258 (Mozambique)" },
  { code: "+95",  label: "+95 (Myanmar)" },
  { code: "+264", label: "+264 (Namibia)" },
  { code: "+674", label: "+674 (Nauru)" },
  { code: "+977", label: "+977 (Nepal)" },
  { code: "+31",  label: "+31 (Netherlands)" },
  { code: "+64",  label: "+64 (New Zealand)" },
  { code: "+505", label: "+505 (Nicaragua)" },
  { code: "+227", label: "+227 (Niger)" },
  { code: "+234", label: "+234 (Nigeria)" },
  { code: "+47",  label: "+47 (Norway)" },
  { code: "+968", label: "+968 (Oman)" },
  { code: "+92",  label: "+92 (Pakistan)" },
  { code: "+680", label: "+680 (Palau)" },
  { code: "+507", label: "+507 (Panama)" },
  { code: "+675", label: "+675 (Papua New Guinea)" },
  { code: "+595", label: "+595 (Paraguay)" },
  { code: "+51",  label: "+51 (Peru)" },
  { code: "+63",  label: "+63 (Philippines)" },
  { code: "+48",  label: "+48 (Poland)" },
  { code: "+351", label: "+351 (Portugal)" },
  { code: "+974", label: "+974 (Qatar)" },
  { code: "+40",  label: "+40 (Romania)" },
  { code: "+7",   label: "+7 (Russia)" },
  { code: "+250", label: "+250 (Rwanda)" },
  { code: "+685", label: "+685 (Samoa)" },
  { code: "+378", label: "+378 (San Marino)" },
  { code: "+239", label: "+239 (Sao Tome and Principe)" },
  { code: "+966", label: "+966 (Saudi Arabia)" },
  { code: "+221", label: "+221 (Senegal)" },
  { code: "+381", label: "+381 (Serbia)" },
  { code: "+248", label: "+248 (Seychelles)" },
  { code: "+232", label: "+232 (Sierra Leone)" },
  { code: "+65",  label: "+65 (Singapore)" },
  { code: "+421", label: "+421 (Slovakia)" },
  { code: "+386", label: "+386 (Slovenia)" },
  { code: "+677", label: "+677 (Solomon Islands)" },
  { code: "+252", label: "+252 (Somalia)" },
  { code: "+27",  label: "+27 (South Africa)" },
  { code: "+82",  label: "+82 (South Korea)" },
  { code: "+34",  label: "+34 (Spain)" },
  { code: "+94",  label: "+94 (Sri Lanka)" },
  { code: "+249", label: "+249 (Sudan)" },
  { code: "+597", label: "+597 (Suriname)" },
  { code: "+268", label: "+268 (Swaziland)" },
  { code: "+46",  label: "+46 (Sweden)" },
  { code: "+41",  label: "+41 (Switzerland)" },
  { code: "+963", label: "+963 (Syria)" },
  { code: "+886", label: "+886 (Taiwan)" },
  { code: "+992", label: "+992 (Tajikistan)" },
  { code: "+255", label: "+255 (Tanzania)" },
  { code: "+66",  label: "+66 (Thailand)" },
  { code: "+228", label: "+228 (Togo)" },
  { code: "+690", label: "+690 (Tokelau)" },
  { code: "+676", label: "+676 (Tonga)" },
  { code: "+216", label: "+216 (Tunisia)" },
  { code: "+90",  label: "+90 (Turkey)" },
  { code: "+993", label: "+993 (Turkmenistan)" },
  { code: "+688", label: "+688 (Tuvalu)" },
  { code: "+256", label: "+256 (Uganda)" },
  { code: "+380", label: "+380 (Ukraine)" },
  { code: "+971", label: "+971 (United Arab Emirates)" },
  { code: "+44",  label: "+44 (United Kingdom)" },
  { code: "+598", label: "+598 (Uruguay)" },
  { code: "+998", label: "+998 (Uzbekistan)" },
  { code: "+678", label: "+678 (Vanuatu)" },
  { code: "+58",  label: "+58 (Venezuela)" },
  { code: "+84",  label: "+84 (Vietnam)" },
  { code: "+967", label: "+967 (Yemen)" },
  { code: "+260", label: "+260 (Zambia)" },
  { code: "+263", label: "+263 (Zimbabwe)" },
];

const COMM_OPTIONS = [
  { value: "Email",    label: "Email" },
  { value: "Phone",    label: "Phone" },
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
        <div className="flex items-center gap-2 text-gray-600 hidden">
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
            <div className="w-32 flex-shrink-0">
              <select
                {...register("phone_area_code")}
                className={selectClass()}
              >
                {AREA_CODES.map((a, i) => (
                  <option key={`${a.code}-${i}`} value={a.code}>{a.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-0">
              <input
                {...register("phone")}
                type="tel"
                placeholder="555 000 0000"
                autoComplete="tel-national"
                className={inputClass()}
              />
            </div>
          </div>
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
