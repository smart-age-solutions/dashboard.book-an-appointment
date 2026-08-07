import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, CalendarDays, Copy, Check, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminMode } from "@/contexts/AdminModeContext";
import { cn } from "@/lib/utils";

interface ActionTileProps {
  label: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  to?: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  activeLabel?: string;
  activeIcon?: React.ElementType;
}

function ActionTile({
  label, icon: Icon, iconBg, iconColor, to, onClick, disabled,
  active, activeLabel, activeIcon: ActiveIcon,
}: ActionTileProps) {
  const inner = (
    <div className="flex flex-col items-center gap-2.5 px-4 py-5 text-center">
      <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl transition-colors", iconBg)}>
        {active && ActiveIcon
          ? <ActiveIcon className={cn("h-5 w-5", iconColor)} />
          : <Icon className={cn("h-5 w-5", iconColor)} />}
      </div>
      <span className="text-sm font-medium text-card-foreground leading-tight">
        {active && activeLabel ? activeLabel : label}
      </span>
    </div>
  );

  const base =
    "flex-1 min-w-0 hover:bg-muted/50 active:bg-muted transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  if (to) {
    return <Link to={to} className={base}>{inner}</Link>;
  }
  return (
    <button onClick={onClick} disabled={disabled} className={cn(base, "w-full")}>
      {inner}
    </button>
  );
}

export function QuickActions() {
  const { client } = useAuth();
  const { managedClient } = useAdminMode();
  const [copied, setCopied] = useState(false);

  const clientId = client?.id || managedClient?.id;
  const bookingUrl = clientId ? `${window.location.origin}/booking/${clientId}` : null;

  const handleCopy = () => {
    if (!bookingUrl) return;
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl bg-card card-shadow animate-fade-in overflow-hidden">
      <div className="border-b border-border px-6 py-3.5">
        <p className="text-sm font-medium text-muted-foreground">Quick Actions</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-x divide-border">
        <ActionTile
          label="New Appointment"
          icon={CalendarPlus}
          iconBg="bg-primary/10"
          iconColor="text-primary"
          to="/appointments"
        />
        <ActionTile
          label="View Calendar"
          icon={CalendarDays}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-600"
          to="/calendar"
        />
        <ActionTile
          label="Copy Booking Link"
          icon={Copy}
          iconBg="bg-teal-500/10"
          iconColor="text-teal-600"
          onClick={handleCopy}
          disabled={!bookingUrl}
          active={copied}
          activeLabel="Copied!"
          activeIcon={Check}
        />
        <ActionTile
          label="Booking Pages"
          icon={BookOpen}
          iconBg="bg-purple-500/10"
          iconColor="text-purple-600"
          to="/booking-pages"
        />
      </div>
    </div>
  );
}
