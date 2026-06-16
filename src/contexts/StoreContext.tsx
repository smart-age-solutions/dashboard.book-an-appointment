import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "./AuthContext";
import { logger } from "@/lib/logger";

export interface StoreHours {
  id?: string;
  day_of_week: number;  // 0=Monday … 6=Sunday
  start_time: string;   // "HH:MM"
  end_time: string;
  is_active: boolean;
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
  mapUrl?: string;
  mapImageUrl?: string;
  lat?: string;
  lng?: string;
  showMapInEmail?: boolean;
  hours?: StoreHours[];
}

interface StoreContextType {
  stores: Store[];
  addStore: (store: Omit<Store, "id">) => Promise<Store | null>;
  updateStore: (id: string, store: Partial<Store>) => void;
  deleteStore: (id: string) => void;
  getStore: (id: string) => Store | undefined;
  fetchStoreHours: (storeId: string) => Promise<StoreHours[]>;
  saveStoreHours: (storeId: string, hours: StoreHours[]) => Promise<void>;
}

export const defaultStoreHours: StoreHours[] = [
  { day_of_week: 0, start_time: "09:00", end_time: "18:00", is_active: true },
  { day_of_week: 1, start_time: "09:00", end_time: "18:00", is_active: true },
  { day_of_week: 2, start_time: "09:00", end_time: "18:00", is_active: true },
  { day_of_week: 3, start_time: "09:00", end_time: "18:00", is_active: true },
  { day_of_week: 4, start_time: "09:00", end_time: "18:00", is_active: true },
  { day_of_week: 5, start_time: "10:00", end_time: "16:00", is_active: true },
  { day_of_week: 6, start_time: "10:00", end_time: "14:00", is_active: false },
];

const defaultHours = defaultStoreHours;

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
    mapUrl: s.map_url || "",
    mapImageUrl: s.map_image_url || "",
    lat: s.lat || "",
    lng: s.lng || "",
    showMapInEmail: s.show_map_in_email !== false,
    hours: s.hours || [],
  });

  const { isAuthenticated, isClientUser } = useAuth();

  const fetchStores = useCallback(async () => {
    if (!isAuthenticated || !isClientUser) {
      setIsLoading(false);
      return;
    }
    
    try {
      const data = await api.get("/auth/stores");
      setStores(data.stores.map(transformStore));
    } catch (error) {
      logger.error("Failed to fetch stores", { action: "fetchStores" }, error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isClientUser]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const addStore = async (store: Omit<Store, "id">): Promise<Store | null> => {
    try {
      const payload: any = {
        name: store.name,
        email: store.email,
        phone: store.phone,
        address: store.address,
        map_url: store.mapUrl,
        map_image_url: store.mapImageUrl,
        lat: store.lat,
        lng: store.lng,
        show_map_in_email: store.showMapInEmail,
      };
      const res = await api.post("/auth/stores", payload);
      fetchStores();
      return transformStore(res.store);
    } catch (error) {
      logger.error("Failed to add store", { action: "addStore" }, error);
      return null;
    }
  };

  const updateStore = async (id: string, updates: Partial<Store>) => {
    try {
      const payload: any = {};
      if (updates.name) payload.name = updates.name;
      if (updates.email !== undefined) payload.email = updates.email;
      if (updates.phone !== undefined) payload.phone = updates.phone;
      if (updates.address !== undefined) payload.address = updates.address;
      if (updates.isActive !== undefined) payload.is_active = updates.isActive;
      if (updates.mapUrl !== undefined) payload.map_url = updates.mapUrl;
      if (updates.mapImageUrl !== undefined) payload.map_image_url = updates.mapImageUrl;
      if (updates.lat !== undefined) payload.lat = updates.lat;
      if (updates.lng !== undefined) payload.lng = updates.lng;
      if (updates.showMapInEmail !== undefined) payload.show_map_in_email = updates.showMapInEmail;

      await api.put(`/auth/stores/${id}`, payload);
      fetchStores();
    } catch (error) {
      logger.error("Failed to update store", { action: "updateStore", storeId: id }, error);
    }
  };

  const deleteStore = async (id: string) => {
    try {
      await api.delete(`/auth/stores/${id}`);
      fetchStores();
    } catch (error) {
      logger.error("Failed to delete store", { action: "deleteStore", storeId: id }, error);
    }
  };

  const getStore = (id: string) => {
    return stores.find(store => store.id === id);
  };

  const fetchStoreHours = async (storeId: string): Promise<StoreHours[]> => {
    try {
      const res = await api.get(`/auth/stores/${storeId}/hours`);
      return res.hours || [];
    } catch {
      return [];
    }
  };

  const saveStoreHours = async (storeId: string, hours: StoreHours[]): Promise<void> => {
    await api.put(`/auth/stores/${storeId}/hours`, { hours });
  };

  return (
    <StoreContext.Provider value={{ stores, addStore, updateStore, deleteStore, getStore, fetchStoreHours, saveStoreHours }}>
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
