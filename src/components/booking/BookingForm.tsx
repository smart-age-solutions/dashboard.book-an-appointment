import { useState } from "react";
import { User, Mail, Phone, FileText, ChevronDown } from "lucide-react";

export interface BookingFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone_area_code: string;
  phone: string;
  notes: string;
  purpose: string;
  customData?: Record<string, any>;
  accepted_terms: boolean;
  consent_communication: boolean;
  preferred_communication: string;
  title: string;
  country_of_residence: string;
}

interface BookingFormProps {
  onSubmit: (data: BookingFormData) => void;
  isLoading: boolean;
  brandColor: string;
  date: string;
  time: string;
  storeName?: string;
  companyName: string;
}

const PURPOSES = ["Discovery", "Consultation", "Servicing", "Support", "Other"];

function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${period}`;
}

export function BookingForm({ onSubmit, isLoading, brandColor, date, time, storeName, companyName }: BookingFormProps) {
  const [form, setForm] = useState<BookingFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone_area_code: "",
    phone: "",
    notes: "",
    purpose: "",
    customData: {},
    accepted_terms: false,
    consent_communication: false,
    preferred_communication: "email",
    title: "",
    country_of_residence: "",
  });
  const [customDataText, setCustomDataText] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof BookingFormData | "customDataText", string>>>({});

  const set = (key: keyof BookingFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(er => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const errs: Partial<Record<keyof BookingFormData, string>> = {};
    if (!form.first_name.trim()) errs.first_name = "First name is required";
    if (!form.email.trim() || !form.email.includes("@")) errs.email = "Valid email is required";
    if (!form.accepted_terms) errs.accepted_terms = "You must accept the terms";
    if (customDataText.trim()) {
      try {
        JSON.parse(customDataText);
      } catch (e) {
        (errs as any).customDataText = "Invalid JSON format";
      }
    }
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    
    const finalData = { ...form };
    if (customDataText.trim()) {
      try {
        finalData.customData = JSON.parse(customDataText);
      } catch (e) {
        // Should be caught by validate, but for safety:
        return;
      }
    }
    onSubmit(finalData);
  };

  const inputClass = "w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-shadow bg-white placeholder-gray-400";
  const focusStyle = { "--tw-ring-color": `${brandColor}50` } as React.CSSProperties;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Appointment summary */}
      <div className="rounded-xl p-4 text-sm space-y-1" style={{ backgroundColor: `${brandColor}10`, borderLeft: `3px solid ${brandColor}` }}>
        <p className="font-semibold text-gray-800">📅 {formatDate(date)} at {formatTime(time)}</p>
        {storeName && <p className="text-gray-600">📍 {storeName}</p>}
        <p className="text-gray-600">🏢 {companyName}</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900">Your Details</h2>
        <p className="text-sm text-gray-500 mt-0.5">We'll send a confirmation to your email</p>
      </div>

      {/* Name row */}
      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
          <div className="relative">
            <select
              value={form.title}
              onChange={set("title")}
              className={`${inputClass} appearance-none`}
              style={focusStyle}
            >
              <option value="">Title</option>
              <option value="Mr">Mr.</option>
              <option value="Mrs">Mrs.</option>
              <option value="Ms">Ms.</option>
              <option value="Dr">Dr.</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div className="col-span-3 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="John"
                value={form.first_name}
                onChange={set("first_name")}
                className={`${inputClass} pl-9`}
                style={focusStyle}
              />
            </div>
            {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
            <input
              type="text"
              placeholder="Doe"
              value={form.last_name}
              onChange={set("last_name")}
              className={inputClass}
              style={focusStyle}
            />
          </div>
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Email Address *</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="email"
            placeholder="john@example.com"
            value={form.email}
            onChange={set("email")}
            className={`${inputClass} pl-9`}
            style={focusStyle}
          />
        </div>
        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Phone (optional)</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="+1"
            value={form.phone_area_code}
            onChange={set("phone_area_code")}
            className={`${inputClass} w-20`}
            style={focusStyle}
          />
          <div className="flex-1 relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="tel"
              placeholder="555-000-1234"
              value={form.phone}
              onChange={set("phone")}
              className={`${inputClass} pl-9 w-full`}
              style={focusStyle}
            />
          </div>
        </div>
      </div>

      {/* Communication & Location */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Preferred Communication</label>
          <div className="flex flex-wrap gap-x-3 gap-y-2 pt-1">
            {([
              { value: "email", label: "Email" },
              { value: "phone", label: "Phone" },
              { value: "text", label: "Text" },
              { value: "whatsapp", label: "WhatsApp" },
            ] as const).map(({ value, label }) => (
              <label key={value} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.preferred_communication.split(", ").includes(value)}
                  onChange={() =>
                    setForm(f => {
                      const parts = f.preferred_communication ? f.preferred_communication.split(", ").filter(Boolean) : [];
                      const idx = parts.indexOf(value);
                      if (idx >= 0) parts.splice(idx, 1); else parts.push(value);
                      return { ...f, preferred_communication: parts.join(", ") };
                    })
                  }
                  className="rounded border-gray-300"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Country of Residence</label>
          <input
            type="text"
            placeholder="e.g. USA"
            value={form.country_of_residence}
            onChange={set("country_of_residence")}
            className={inputClass}
            style={focusStyle}
          />
        </div>
      </div>

      {/* Purpose */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Purpose of visit</label>
        <div className="relative">
          <select
            value={form.purpose}
            onChange={set("purpose")}
            className={`${inputClass} appearance-none pr-9`}
            style={focusStyle}
          >
            <option value="">Select a reason…</option>
            {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Custom Data */}
      {/* <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Additional Data (JSON)</label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <textarea
            placeholder='{"key": "value"}'
            value={customDataText}
            onChange={(e) => {
              setCustomDataText(e.target.value);
              if (errors.customDataText) setErrors(er => ({ ...er, customDataText: undefined }));
            }}
            rows={2}
            className={`${inputClass} pl-9 font-mono text-xs resize-none`}
            style={focusStyle}
          />
        </div>
        {(errors as any).customDataText && <p className="text-xs text-red-500 mt-1">{(errors as any).customDataText}</p>}
      </div> */}

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Additional notes</label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <textarea
            placeholder="Anything we should know?"
            value={form.notes}
            onChange={set("notes")}
            rows={3}
            className={`${inputClass} pl-9 resize-none`}
            style={focusStyle}
          />
        </div>
      </div>

      {/* Checkboxes */}
      <div className="space-y-3 pt-1">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={form.accepted_terms}
            onChange={set("accepted_terms")}
            className="mt-0.5 h-4 w-4 rounded"
            style={{ accentColor: brandColor }}
          />
          <span className="text-sm text-gray-600">
            I accept the <span className="underline cursor-pointer" style={{ color: brandColor }}>terms and conditions</span> *
          </span>
        </label>
        {errors.accepted_terms && <p className="text-xs text-red-500 -mt-2 pl-7">{errors.accepted_terms}</p>}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.consent_communication}
            onChange={set("consent_communication")}
            className="mt-0.5 h-4 w-4 rounded"
            style={{ accentColor: brandColor }}
          />
          <span className="text-sm text-gray-600">I consent to receive communications regarding my appointment</span>
        </label>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        style={{ backgroundColor: brandColor }}
      >
        {isLoading ? "Booking…" : "Confirm Appointment"}
      </button>
    </form>
  );
}
