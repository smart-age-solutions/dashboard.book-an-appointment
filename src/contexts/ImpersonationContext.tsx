import { createContext, useContext, useState, ReactNode } from "react";

export interface ImpersonatedClient {
  id: string;
  companyName: string;
}

interface ImpersonationContextType {
  impersonatedClient: ImpersonatedClient | null;
  startImpersonation: (client: ImpersonatedClient) => void;
  stopImpersonation: () => void;
  isImpersonating: boolean;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [impersonatedClient, setImpersonatedClient] = useState<ImpersonatedClient | null>(() => {
    const saved = localStorage.getItem("impersonate_client");
    return saved ? JSON.parse(saved) : null;
  });

  const startImpersonation = (client: ImpersonatedClient) => {
    setImpersonatedClient(client);
    localStorage.setItem("impersonate_client", JSON.stringify(client));
    // Optional: reload to clear state, or just navigate
    window.location.href = "/";
  };

  const stopImpersonation = () => {
    setImpersonatedClient(null);
    localStorage.removeItem("impersonate_client");
    window.location.href = "/backoffice";
  };

  return (
    <ImpersonationContext.Provider
      value={{
        impersonatedClient,
        startImpersonation,
        stopImpersonation,
        isImpersonating: !!impersonatedClient,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (!context) {
    throw new Error("useImpersonation must be used within ImpersonationProvider");
  }
  return context;
}
