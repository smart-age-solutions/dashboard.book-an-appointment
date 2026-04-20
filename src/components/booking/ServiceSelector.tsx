import { Clock, DollarSign } from "lucide-react";
import type { ServiceOption } from "@/types/booking";

interface ServiceSelectorProps {
  services: ServiceOption[];
  selected: ServiceOption | null;
  onSelect: (service: ServiceOption) => void;
  brandColor: string;
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border-2 border-gray-100 p-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
    </div>
  );
}

export function ServiceSelector({
  services,
  selected,
  onSelect,
  brandColor,
}: ServiceSelectorProps) {
  if (!services.length) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        No services available on this booking page.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Select a Service</h2>
        <p className="text-sm text-gray-500 mt-0.5">Choose what you'd like to book</p>
      </div>

      <div className="grid gap-2.5">
        {services.map((service) => {
          const isSelected = selected?.id === service.id;
          return (
            <button
              key={service.id}
              onClick={() => onSelect(service)}
              className="w-full text-left rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-sm focus:outline-none focus-visible:ring-2"
              style={{
                borderColor: isSelected ? brandColor : "#e5e7eb",
                backgroundColor: isSelected ? `${brandColor}08` : "white",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {/* Selection indicator */}
                    <div
                      className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
                      style={{
                        borderColor: isSelected ? brandColor : "#d1d5db",
                        backgroundColor: isSelected ? brandColor : "transparent",
                      }}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="font-semibold text-gray-900 text-sm leading-tight">
                      {service.name}
                    </span>
                  </div>

                  {service.description && (
                    <p className="text-xs text-gray-500 mt-1.5 ml-6 leading-relaxed line-clamp-2">
                      {service.description}
                    </p>
                  )}
                </div>

                {/* Meta */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-50 rounded-full px-2 py-0.5">
                    <Clock className="w-3 h-3" />
                    {service.duration_minutes} min
                  </span>
                  {service.price != null && service.price > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-gray-700">
                      <DollarSign className="w-3 h-3" />
                      {service.price.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ServiceSelectorSkeleton() {
  return (
    <div className="space-y-3">
      <div>
        <div className="h-6 bg-gray-200 rounded w-40 animate-pulse mb-1" />
        <div className="h-3 bg-gray-100 rounded w-56 animate-pulse" />
      </div>
      <div className="grid gap-2.5">
        {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}
