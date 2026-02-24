import { Clock } from "lucide-react";

interface TimeSlotPickerProps {
  slots: string[];
  selectedTime: string | null;
  onSelect: (time: string) => void;
  brandColor: string;
}

function formatTime(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export function TimeSlotPicker({ slots, selectedTime, onSelect, brandColor }: TimeSlotPickerProps) {
  if (!slots.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-400">
        <Clock className="w-8 h-8 mb-2 opacity-40" />
        <p className="text-sm">No available times for this date</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-600 mb-3">Available Times</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
        {slots.map((time) => {
          const isSelected = selectedTime === time;
          return (
            <button
              key={time}
              onClick={() => onSelect(time)}
              className="py-2.5 px-3 rounded-lg text-sm font-medium border-2 transition-all duration-150 focus:outline-none"
              style={{
                borderColor: isSelected ? brandColor : "#e5e7eb",
                backgroundColor: isSelected ? brandColor : "white",
                color: isSelected ? "white" : "#374151",
              }}
            >
              {formatTime(time)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
