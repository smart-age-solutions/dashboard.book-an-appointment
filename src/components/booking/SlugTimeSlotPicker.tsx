import { Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";

interface SlugTimeSlotPickerProps {
  slots: string[];       // ["09:00", "09:30", …]
  selectedTime: string | null;
  onSelect: (time: string) => void;
  brandColor: string;
  isLoading: boolean;
  isError: boolean;
  date: string | null;   // YYYY-MM-DD for display
  timezone?: string;
}

function formatTime(hhmm: string): string {
  try {
    // Parse as a dummy date to get AM/PM formatting
    const [h, m] = hhmm.split(":");
    const d = new Date(2000, 0, 1, Number(h), Number(m));
    return format(d, "h:mm aa");
  } catch {
    return hhmm;
  }
}

function SkeletonSlots() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="h-10 rounded-xl bg-gray-100 animate-pulse"
          style={{ animationDelay: `${i * 40}ms` }}
        />
      ))}
    </div>
  );
}

export function SlugTimeSlotPicker({
  slots,
  selectedTime,
  onSelect,
  brandColor,
  isLoading,
  isError,
  date,
  timezone,
}: SlugTimeSlotPickerProps) {
  const displayDate = date
    ? format(parseISO(date + "T00:00:00"), "EEEE, MMMM d")
    : "";

  return (
    <div className="space-y-3 pt-4 border-t border-gray-100">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 text-sm">
          {displayDate && `Available times — ${displayDate}`}
        </h3>
        {timezone && (
          <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
            {timezone.replace("_", " ")}
          </span>
        )}
      </div>

      {isLoading && <SkeletonSlots />}

      {isError && !isLoading && (
        <div className="text-center py-6 text-sm text-red-500">
          Failed to load available times. Please try again.
        </div>
      )}

      {!isLoading && !isError && slots.length === 0 && (
        <div className="text-center py-8 text-sm text-gray-400">
          <div className="text-2xl mb-2">😔</div>
          No available slots on this date. Please select another day.
        </div>
      )}

      {!isLoading && !isError && slots.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {slots.map((slot) => {
            const isSelected = selectedTime === slot;
            return (
              <button
                key={slot}
                onClick={() => onSelect(slot)}
                className="py-2.5 px-2 rounded-xl text-sm font-semibold text-center transition-all duration-150 focus:outline-none focus-visible:ring-2 border-2"
                style={
                  isSelected
                    ? {
                        backgroundColor: brandColor,
                        borderColor: brandColor,
                        color: "white",
                        boxShadow: `0 0 0 2px ${brandColor}30`,
                      }
                    : {
                        backgroundColor: "white",
                        borderColor: "#e5e7eb",
                        color: "#374151",
                      }
                }
              >
                {formatTime(slot)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
