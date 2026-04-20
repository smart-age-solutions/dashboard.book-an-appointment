import { User } from "lucide-react";
import type { UserOption } from "@/types/booking";

interface UserSelectorProps {
  users: UserOption[];
  selected: UserOption | null;
  onSelect: (user: UserOption) => void;
  brandColor: string;
}

export function UserSelector({ users, selected, onSelect, brandColor }: UserSelectorProps) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Choose a Staff Member</h2>
        <p className="text-sm text-gray-500 mt-0.5">Select who you'd like to book with</p>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {users.map((user) => {
          const isSelected = selected?.id === user.id;
          return (
            <button
              key={user.id}
              onClick={() => onSelect(user)}
              className="w-full text-left rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-sm focus:outline-none focus-visible:ring-2"
              style={{
                borderColor: isSelected ? brandColor : "#e5e7eb",
                backgroundColor: isSelected ? `${brandColor}08` : "white",
              }}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 transition-all"
                  style={{
                    backgroundColor: isSelected ? brandColor : "#f3f4f6",
                    color: isSelected ? "white" : "#6b7280",
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {user.name}
                  </p>
                  {user.is_default && (
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${brandColor}15`,
                        color: brandColor,
                      }}
                    >
                      Recommended
                    </span>
                  )}
                </div>

                {/* Selection dot */}
                <div
                  className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
                  style={{
                    borderColor: isSelected ? brandColor : "#d1d5db",
                    backgroundColor: isSelected ? brandColor : "transparent",
                  }}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function UserSelectorSkeleton() {
  return (
    <div className="space-y-3">
      <div>
        <div className="h-6 bg-gray-200 rounded w-48 animate-pulse mb-1" />
        <div className="h-3 bg-gray-100 rounded w-64 animate-pulse" />
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border-2 border-gray-100 p-4 flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
