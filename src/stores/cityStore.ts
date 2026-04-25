/**
 * City Store
 * Manages selected city/region (persisted to localStorage)
 * Filters all business queries by city.
 * For Tashkent: optional district sub-filter (soft priority, not strict exclusion).
 */

import { create } from 'zustand';

export interface City {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface TashkentDistrict {
  id: string;
  name: string;
}

export const UZBEKISTAN_CITIES: City[] = [
  { id: 'Tashkent', name: 'Ташкент', lat: 41.2995, lng: 69.2401 },
  { id: 'Samarkand', name: 'Самарканд', lat: 39.6542, lng: 66.9597 },
  { id: 'Bukhara', name: 'Бухара', lat: 39.7747, lng: 64.4286 },
  { id: 'Namangan', name: 'Наманган', lat: 40.9983, lng: 71.6726 },
  { id: 'Andijan', name: 'Андижан', lat: 40.7821, lng: 72.3442 },
  { id: 'Fergana', name: 'Фергана', lat: 40.3864, lng: 71.7864 },
  { id: 'Nukus', name: 'Нукус', lat: 42.4531, lng: 59.6103 },
  { id: 'Karshi', name: 'Карши', lat: 38.8606, lng: 65.7897 },
  { id: 'Termez', name: 'Термез', lat: 37.2242, lng: 67.2783 },
  { id: 'Navoi', name: 'Навои', lat: 40.0844, lng: 65.3792 },
  { id: 'Jizzakh', name: 'Джизак', lat: 40.1158, lng: 67.8422 },
  { id: 'Urgench', name: 'Ургенч', lat: 41.5500, lng: 60.6333 },
  { id: 'Kokand', name: 'Коканд', lat: 40.5283, lng: 70.9450 },
  { id: 'Chirchiq', name: 'Чирчик', lat: 41.4689, lng: 69.5822 },
  { id: 'Margilan', name: 'Маргилан', lat: 40.4717, lng: 71.7244 },
  { id: 'Gulistan', name: 'Гулистан', lat: 40.4889, lng: 68.7828 },
  { id: 'Angren', name: 'Ангрен', lat: 41.0167, lng: 70.1333 },
]

export const TASHKENT_DISTRICTS: TashkentDistrict[] = [
  { id: 'almazar', name: 'Алмазарский' },
  { id: 'bektemir', name: 'Бектемирский' },
  { id: 'mirobod', name: 'Мирабадский' },
  { id: 'mirzo_ulugbek', name: 'Мирзо-Улугбекский' },
  { id: 'sergeli', name: 'Сергелийский' },
  { id: 'uchtepa', name: 'Учтепинский' },
  { id: 'chilonzor', name: 'Чиланзарский' },
  { id: 'shaykhontohur', name: 'Шайхантаурский' },
  { id: 'yunusabad', name: 'Юнусабадский' },
  { id: 'yakkasaray', name: 'Яккасарайский' },
  { id: 'yashnobod', name: 'Яшнободский' },
]

const STORAGE_KEY = 'yookie_city'
const DISTRICT_KEY = 'yookie_district'
const DEFAULT_CITY = UZBEKISTAN_CITIES[0] // Ташкент

interface CityState {
  city: City;
  district: TashkentDistrict | null;
  setCity: (city: City) => void;
  setDistrict: (district: TashkentDistrict | null) => void;
  loadFromStorage: () => void;
}

export const useCityStore = create<CityState>((set) => ({
  city: DEFAULT_CITY,
  district: null,

  setCity: (city: City) => {
    applyCity(city);
    // Clear district when switching to a non-Tashkent city
    if (city.id !== 'Tashkent') {
      try { localStorage.removeItem(DISTRICT_KEY) } catch {}
    }
    set({ city, district: null });
  },

  setDistrict: (district: TashkentDistrict | null) => {
    try {
      if (district) {
        localStorage.setItem(DISTRICT_KEY, JSON.stringify(district));
      } else {
        localStorage.removeItem(DISTRICT_KEY);
      }
    } catch {}
    set({ district });
  },

  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as City;
        const found = UZBEKISTAN_CITIES.find(c => c.id === parsed.id);
        if (found) {
          applyCity(found);
          let district: TashkentDistrict | null = null;
          if (found.id === 'Tashkent') {
            try {
              const ds = localStorage.getItem(DISTRICT_KEY);
              if (ds) {
                const pd = JSON.parse(ds) as TashkentDistrict;
                district = TASHKENT_DISTRICTS.find(d => d.id === pd.id) ?? null;
              }
            } catch {}
          }
          set({ city: found, district });
          return;
        }
      }
    } catch {
      // Storage read failed
    }
    // Default
    applyCity(DEFAULT_CITY);
  },
}));

function applyCity(city: City) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(city));
  } catch {
    // Storage unavailable
  }
}

// Auto-load
let initialized = false;
if (typeof window !== 'undefined' && !initialized) {
  initialized = true;
  useCityStore.getState().loadFromStorage();
}
