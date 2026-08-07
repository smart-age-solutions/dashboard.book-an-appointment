import { ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminMode } from "@/contexts/AdminModeContext";

export function AdminModeBanner() {
  const { managedClient, stopAdminMode, isAdminMode } = useAdminMode();

  if (!isAdminMode || !managedClient) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-center gap-3">
      <ShieldCheck className="h-4 w-4" />
      <span className="font-medium">
        Admin Mode &mdash; Managing <strong>{managedClient.companyName}</strong>
      </span>
      <Button
        size="sm"
        variant="outline"
        className="ml-4 h-7 bg-amber-600 border-amber-700 text-white hover:bg-amber-700"
        onClick={stopAdminMode}
      >
        <X className="h-3 w-3 mr-1" />
        Stop
      </Button>
    </div>
  );
}
