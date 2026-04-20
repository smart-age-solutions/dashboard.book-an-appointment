import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isBefore,
  startOfDay,
  isToday,
} from "date-fns";

interface SlugCalendarPickerProps {
  selectedDate: string | null; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  brandColor: string;
  /** When provided, only dates in this Set are selectable (they have available slots). */
  availableDates?: Set<string>;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function SlugCalendarPicker({
  selectedDate,
  onSelectDate,
  brandColor,
  availableDates,
}: SlugCalendarPickerProps) {
  const [viewDate, setViewDate] = useState(() => startOfMonth(new Date()));

  const today = startOfDay(new Date());
  const selectedObj = selectedDate ? startOfDay(new Date(selectedDate + "T00:00:00")) : null;

  // Build calendar grid
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let cur = gridStart;
  while (cur <= gridEnd) {
    days.push(cur);
    cur = addDays(cur, 1);
  }

  const fmt = (d: Date) => format(d, "yyyy-MM-dd");

  const isPast = (d: Date) => isBefore(d, today);
  const hasSlots = (d: Date) => (availableDates ? availableDates.has(fmt(d)) : true);
  const isDisabled = (d: Date) => isPast(d) || !isSameMonth(d, viewDate) || !hasSlots(d);
  const isSelected = (d: Date) => (selectedObj ? isSameDay(d, selectedObj) : false);

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-gray-900">Select a Date</h2>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setViewDate((v) => subMonths(v, 1))}
          disabled={isBefore(endOfMonth(subMonths(viewDate, 1)), today)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>

        <span className="text-sm font-semibold text-gray-800">
          {format(viewDate, "MMMM yyyy")}
        </span>

        <button
          onClick={() => setViewDate((v) => addMonths(v, 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 text-center">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-[10px] font-semibold uppercase text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day) => {
          const disabled = isDisabled(day);
          const selected = isSelected(day);
          const todayDay = isToday(day);
          const inMonth = isSameMonth(day, viewDate);
          const hasAvail = hasSlots(day) && !isPast(day) && inMonth;

          return (
            <div key={day.toISOString()} className="flex flex-col items-center">
              <button
                onClick={() => !disabled && onSelectDate(fmt(day))}
                disabled={disabled}
                className={`
                  w-9 h-9 rounded-full text-sm font-medium transition-all duration-150
                  focus:outline-none focus-visible:ring-2
                  ${!inMonth ? "opacity-0 pointer-events-none" : ""}
                  ${disabled && inMonth ? "text-gray-300 cursor-not-allowed" : ""}
                  ${!disabled && !selected ? "hover:bg-gray-100 text-gray-700" : ""}
                  ${todayDay && !selected ? "font-bold" : ""}
                `}
                style={
                  selected
                    ? {
                        backgroundColor: brandColor,
                        color: "white",
                        boxShadow: `0 0 0 2px ${brandColor}40`,
                      }
                    : todayDay && !disabled
                    ? { color: brandColor, fontWeight: 700 }
                    : {}
                }
              >
                {format(day, "d")}
              </button>
              {/* Dot indicator for dates with available slots */}
              {hasAvail && !selected && (
                <div
                  className="w-1 h-1 rounded-full mt-0.5"
                  style={{ backgroundColor: brandColor, opacity: 0.7 }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
