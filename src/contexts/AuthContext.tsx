import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { api } from "@/lib/api";

export type IdentityType = "client" | "backoffice";

export interface BackofficeUser {
  id: string;
  name: string;
  email: string;
}

export interface Client {
  id: string;
  companyName: string;
  email: string;
  status: "active" | "inactive";
}

interface AuthState {
  isAuthenticated: boolean;
  identityType: IdentityType | null;
  user: BackofficeUser | null; // For backoffice users
  client: Client | null; // For client users
  accessToken: string | null;
}

interface AuthContextType extends AuthState {
  login: (response: LoginResponse) => void;
  logout: () => void;
  isBackofficeUser: boolean;
  isClientUser: boolean;
}

export interface LoginResponse {
  access_token: string;
  identity_type: IdentityType;
  user?: BackofficeUser;
  client?: Client;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  isAuthenticated: false,
  identityType: null,
  user: null,
  client: null,
  accessToken: null,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(initialState);
  const [isLoading, setIsLoading] = useState(true);

  const login = useCallback((response: LoginResponse) => {
    localStorage.setItem("access_token", response.access_token);
    setAuthState({
      isAuthenticated: true,
      identityType: response.identity_type,
      user: response.user || null,
      client: response.client || null,
      accessToken: response.access_token,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    setAuthState(initialState);
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await api.get("/auth/profile");
      if (data.user) {
        // Client context response: { user, client }
        setAuthState({
          isAuthenticated: true,
          identityType: "client",
          user: data.user,
          client: data.client,
          accessToken: localStorage.getItem("access_token"),
        });
      } else {
        // Backoffice context response: { id, name, email, ... }
        setAuthState({
          isAuthenticated: true,
          identityType: "backoffice",
          user: data,
          client: null,
          accessToken: localStorage.getItem("access_token"),
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  const isBackofficeUser = authState.identityType === "backoffice";
  const isClientUser = authState.identityType === "client";

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        isBackofficeUser,
        isClientUser,
      }}
    >
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
