import { createContext, useContext, useState, ReactNode } from "react";

export interface ManagedClient {
  id: string;
  companyName: string;
}

interface AdminModeContextType {
  managedClient: ManagedClient | null;
  startAdminMode: (client: ManagedClient) => void;
  stopAdminMode: () => void;
  isAdminMode: boolean;
}

const AdminModeContext = createContext<AdminModeContextType | undefined>(undefined);

export function AdminModeProvider({ children }: { children: ReactNode }) {
  const [managedClient, setManagedClient] = useState<ManagedClient | null>(() => {
    const saved = localStorage.getItem("admin_managed_client");
    return saved ? JSON.parse(saved) : null;
  });

  const startAdminMode = (client: ManagedClient) => {
    setManagedClient(client);
    localStorage.setItem("admin_managed_client", JSON.stringify(client));
    // Optional: reload to clear state, or just navigate
    window.location.href = "/";
  };

  const stopAdminMode = () => {
    setManagedClient(null);
    localStorage.removeItem("admin_managed_client");
    window.location.href = "/backoffice";
  };

  return (
    <AdminModeContext.Provider
      value={{
        managedClient,
        startAdminMode,
        stopAdminMode,
        isAdminMode: !!managedClient,
      }}
    >
      {children}
    </AdminModeContext.Provider>
  );
}

export function useAdminMode() {
  const context = useContext(AdminModeContext);
  if (!context) {
    throw new Error("useAdminMode must be used within AdminModeProvider");
  }
  return context;
}
