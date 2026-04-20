import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "./AuthContext";

export interface StoreHours {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface Store {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  isActive: boolean;
}

interface StoreContextType {
  stores: Store[];
  addStore: (store: Omit<Store, "id">) => void;
  updateStore: (id: string, store: Partial<Store>) => void;
  deleteStore: (id: string) => void;
  getStore: (id: string) => Store | undefined;
}

const defaultHours: StoreHours[] = [
  { day: "Monday", isOpen: true, openTime: "09:00", closeTime: "18:00" },
  { day: "Tuesday", isOpen: true, openTime: "09:00", closeTime: "18:00" },
  { day: "Wednesday", isOpen: true, openTime: "09:00", closeTime: "18:00" },
  { day: "Thursday", isOpen: true, openTime: "09:00", closeTime: "18:00" },
  { day: "Friday", isOpen: true, openTime: "09:00", closeTime: "18:00" },
  { day: "Saturday", isOpen: true, openTime: "10:00", closeTime: "16:00" },
  { day: "Sunday", isOpen: false, openTime: "10:00", closeTime: "14:00" },
];

const initialStores: Store[] = [];

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [stores, setStores] = useState<Store[]>(initialStores);
  const [isLoading, setIsLoading] = useState(true);

  const transformStore = (s: any): Store => ({
    id: s.id,
    name: s.name,
    email: s.email || "",
    phone: s.phone || "",
    address: s.address || "",
    city: "", 
    state: "",
    zip: "",
    isActive: s.is_active,
  });

  const { isAuthenticated } = useAuth();

  const fetchStores = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    
    try {
      const data = await api.get("/auth/stores");
      setStores(data.stores.map(transformStore));
    } catch (error) {
      console.error("Failed to fetch stores", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const addStore = async (store: Omit<Store, "id">) => {
    try {
      const payload = {
        name: store.name,
        email: store.email,
        phone: store.phone,
        address: store.address,
      };
      await api.post("/auth/stores", payload);
      fetchStores();
    } catch (error) {
      console.error("Failed to add store", error);
    }
  };

  const updateStore = async (id: string, updates: Partial<Store>) => {
    try {
      const payload: any = {};
      if (updates.name) payload.name = updates.name;
      if (updates.email) payload.email = updates.email;
      if (updates.phone) payload.phone = updates.phone;
      if (updates.address) payload.address = updates.address;
      if (updates.isActive !== undefined) payload.is_active = updates.isActive;

      await api.put(`/auth/stores/${id}`, payload);
      fetchStores();
    } catch (error) {
      console.error("Failed to update store", error);
    }
  };

  const deleteStore = async (id: string) => {
    try {
      await api.delete(`/auth/stores/${id}`);
      fetchStores();
    } catch (error) {
      console.error("Failed to delete store", error);
    }
  };

  const getStore = (id: string) => {
    return stores.find(store => store.id === id);
  };

  return (
    <StoreContext.Provider value={{ stores, addStore, updateStore, deleteStore, getStore }}>
      {!isLoading && children}
    </StoreContext.Provider>
  );
}

export function useStores() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStores must be used within StoreProvider");
  }
  return context;
}

export { defaultHours };
