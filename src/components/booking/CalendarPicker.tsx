import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarPickerProps {
  availableSlots: Record<string, string[]>; // date -> times[]
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  brandColor: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function CalendarPicker({ availableSlots, selectedDate, onSelectDate, brandColor }: CalendarPickerProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentYear(y => y - 1); setCurrentMonth(11); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentYear(y => y + 1); setCurrentMonth(0); }
    else setCurrentMonth(m => m + 1);
  };

  const isAvailable = (dayNum: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    return !!availableSlots[dateStr]?.length;
  };

  const isPast = (dayNum: number) => {
    const d = new Date(currentYear, currentMonth, dayNum);
    d.setHours(0, 0, 0, 0);
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return d < t;
  };

  const toDateStr = (dayNum: number) =>
    `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;

  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  // Pad to complete the last week row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <span className="font-semibold text-gray-900">
          {MONTHS[currentMonth]} {currentYear}
        </span>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;
          const dateStr = toDateStr(day);
          const past = isPast(day);
          const avail = isAvailable(day);
          const isSelected = selectedDate === dateStr;

          let style: React.CSSProperties = {};
          let className = "relative mx-auto flex items-center justify-center rounded-full w-9 h-9 text-sm transition-all duration-150 select-none";

          if (isSelected) {
            style = { backgroundColor: brandColor, color: "white" };
            className += " font-semibold shadow-sm";
          } else if (!past && avail) {
            className += " font-semibold cursor-pointer hover:opacity-80";
            style = { color: brandColor, backgroundColor: `${brandColor}15` };
          } else {
            className += " text-gray-300 cursor-default";
          }

          return (
            <div key={dateStr} className="flex justify-center">
              <button
                disabled={past || !avail}
                onClick={() => !past && avail && onSelectDate(dateStr)}
                className={className}
                style={style}
                aria-label={dateStr}
              >
                {day}
                {avail && !past && !isSelected && (
                  <span
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ backgroundColor: brandColor }}
                  />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
