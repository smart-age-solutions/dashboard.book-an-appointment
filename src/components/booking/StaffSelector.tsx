import { CheckCircle } from "lucide-react";
import type { UserOption } from "@/types/booking";

interface StaffSelectorProps {
  users: UserOption[];
  selectedUser: UserOption | null;
  onSelect: (user: UserOption | null) => void;
  brandColor: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function StaffSelector({ users, selectedUser, onSelect, brandColor }: StaffSelectorProps) {
  const noPreferenceSelected = selectedUser === null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Choose a Staff Member</h2>
        <p className="text-sm text-gray-500 mt-1">Select who you'd like to book with, or let us assign someone for you</p>
      </div>
      <div className="grid gap-3">
        {/* No preference option */}
        <button
          onClick={() => onSelect(null)}
          className="w-full text-left rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md focus:outline-none"
          style={{
            borderColor: noPreferenceSelected ? brandColor : "transparent",
            backgroundColor: noPreferenceSelected ? `${brandColor}10` : "white",
            boxShadow: noPreferenceSelected
              ? `0 0 0 2px ${brandColor}30`
              : "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                style={{ backgroundColor: `${brandColor}20`, color: brandColor }}
              >
                ✦
              </div>
              <div>
                <span className="font-semibold text-gray-900">No preference</span>
                <p className="text-xs text-gray-400 mt-0.5">First available staff member</p>
              </div>
            </div>
            {noPreferenceSelected && (
              <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: brandColor }} />
            )}
          </div>
        </button>

        {/* Individual staff options */}
        {users.map((user) => {
          const isSelected = selectedUser?.id === user.id;
          const initials = getInitials(user.name ?? "?");
          return (
            <button
              key={user.id}
              onClick={() => onSelect(user)}
              className="w-full text-left rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md focus:outline-none"
              style={{
                borderColor: isSelected ? brandColor : "transparent",
                backgroundColor: isSelected ? `${brandColor}10` : "white",
                boxShadow: isSelected
                  ? `0 0 0 2px ${brandColor}30`
                  : "0 1px 3px rgba(0,0,0,0.08)",
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                    style={{ backgroundColor: `${brandColor}20`, color: brandColor }}
                  >
                    {initials}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">{user.name}</span>
                    {user.is_default && (
                      <span
                        className="ml-2 text-xs px-1.5 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
                      >
                        Recommended
                      </span>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: brandColor }} />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
