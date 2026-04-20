import { Check } from "lucide-react";
import type { BookingStep } from "@/types/booking";

interface Step {
  key: BookingStep;
  label: string;
}

interface StepProgressBarProps {
  steps: Step[];
  currentIndex: number;
  brandColor: string;
}

export function StepProgressBar({ steps, currentIndex, brandColor }: StepProgressBarProps) {
  return (
    <div className="flex items-center gap-0 w-full mt-4">
      {steps.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;

        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0">
            {/* Circle */}
            <div className="flex flex-col items-center">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-300"
                style={{
                  backgroundColor:
                    done || active ? brandColor : "#e5e7eb",
                  color: done || active ? "#fff" : "#9ca3af",
                  boxShadow: active ? `0 0 0 3px ${brandColor}30` : "none",
                }}
              >
                {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : i + 1}
              </div>
              <span
                className={`text-[10px] font-medium mt-0.5 whitespace-nowrap transition-colors ${
                  active ? "text-gray-800" : done ? "text-gray-500" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div
                className="flex-1 h-px mx-1 transition-all duration-500 mb-4"
                style={{ backgroundColor: done ? brandColor : "#e5e7eb" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
