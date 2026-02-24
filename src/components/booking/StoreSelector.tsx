import { MapPin, Phone, Mail, CheckCircle } from "lucide-react";

interface StoreOption {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface StoreSelectorProps {
  stores: StoreOption[];
  selectedStoreId: string | null;
  onSelect: (storeId: string) => void;
  brandColor: string;
}

export function StoreSelector({ stores, selectedStoreId, onSelect, brandColor }: StoreSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Select a Location</h2>
        <p className="text-sm text-gray-500 mt-1">Choose where you'd like your appointment</p>
      </div>
      <div className="grid gap-3">
        {stores.map((store) => {
          const isSelected = selectedStoreId === store.id;
          return (
            <button
              key={store.id}
              onClick={() => onSelect(store.id)}
              className="w-full text-left rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md focus:outline-none"
              style={{
                borderColor: isSelected ? brandColor : "transparent",
                backgroundColor: isSelected ? `${brandColor}10` : "white",
                boxShadow: isSelected ? `0 0 0 2px ${brandColor}30` : "0 1px 3px rgba(0,0,0,0.08)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{store.name}</span>
                  </div>
                  {store.address && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-500 truncate">{store.address}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    {store.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-500">{store.phone}</span>
                      </div>
                    )}
                    {store.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-500">{store.email}</span>
                      </div>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: brandColor }} />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
