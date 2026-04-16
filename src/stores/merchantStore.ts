/**
 * Merchant Store (B2B)
 * Centralized state management for merchant data, services, staff, bookings, and availability
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Merchant,
  MerchantStaff,
  MerchantService,
  MerchantAvailability,
  MerchantBooking,
  MerchantClient,
} from '../lib/api/types';

// Mock data generator for development
function generateMockMerchant(): Merchant {
  return {
    id: 'merchant-001',
    business_name: 'Beauty Studio Pro',
    business_type: 'salon',
    category: 'hair',
    address: 'ул. Ленина 45, Ташкент',
    city: 'Tashkent',
    phone: '+998901234567',
    description: 'Современная студия красоты с опытными мастерами',
    is_active: true,
    is_verified: false,
    rating: 4.8,
    review_count: 24,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function generateMockServices(merchantId: string): MerchantService[] {
  return [
    {
      id: 'service-001',
      merchant_id: merchantId,
      name: 'Стрижка женская',
      description: 'Стрижка с укладкой',
      price: 150000,
      duration_min: 60,
      category: 'hair',
      is_active: true,
      position: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'service-002',
      merchant_id: merchantId,
      name: 'Маникюр классический',
      description: 'Классический маникюр с покрытием',
      price: 80000,
      duration_min: 90,
      category: 'nail',
      is_active: true,
      position: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'service-003',
      merchant_id: merchantId,
      name: 'Оформление бровей',
      description: 'Коррекция и окрашивание бровей',
      price: 50000,
      duration_min: 45,
      category: 'brow_lash',
      is_active: true,
      position: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}

function generateMockStaff(merchantId: string): MerchantStaff[] {
  return [
    {
      id: 'staff-001',
      merchant_id: merchantId,
      name: 'Алина Каримова',
      specialization: 'Топ-стилист',
      phone: '+998901111111',
      photo_url: undefined,
      is_active: true,
      position: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'staff-002',
      merchant_id: merchantId,
      name: 'Дильноза Рахимова',
      specialization: 'Мастер маникюра',
      phone: '+998902222222',
      photo_url: undefined,
      is_active: true,
      position: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}

function generateMockAvailability(merchantId: string): MerchantAvailability[] {
  const days = [
    { day: 1, open: '09:00', close: '18:00' },
    { day: 2, open: '09:00', close: '18:00' },
    { day: 3, open: '09:00', close: '18:00' },
    { day: 4, open: '09:00', close: '18:00' },
    { day: 5, open: '09:00', close: '18:00' },
    { day: 6, open: '10:00', close: '16:00' },
  ];

  return days.map((d) => ({
    id: `avail-${d.day}`,
    merchant_id: merchantId,
    day_of_week: d.day,
    open_time: d.open,
    close_time: d.close,
    is_open: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

interface MerchantState {
  // Auth
  merchantToken: string | null;
  isAuthenticated: boolean;
  
  // Entities
  merchant: Merchant | null;
  services: MerchantService[];
  staff: MerchantStaff[];
  availability: MerchantAvailability[];
  bookings: MerchantBooking[];
  clients: MerchantClient[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
}

interface MerchantActions {
  // Auth
  login: (token: string, merchant: Merchant) => void;
  logout: () => void;
  
  // Merchant CRUD
  updateMerchant: (updates: Partial<Merchant>) => void;
  
  // Services CRUD
  addService: (service: Omit<MerchantService, 'id' | 'created_at' | 'updated_at'>) => void;
  updateService: (id: string, updates: Partial<MerchantService>) => void;
  deleteService: (id: string) => void;
  
  // Staff CRUD
  addStaff: (staff: Omit<MerchantStaff, 'id' | 'created_at' | 'updated_at'>) => void;
  updateStaff: (id: string, updates: Partial<MerchantStaff>) => void;
  deleteStaff: (id: string) => void;
  
  // Availability
  updateAvailability: (dayOfWeek: number, availability: Partial<MerchantAvailability>) => void;
  
  // Bookings
  addBooking: (booking: Omit<MerchantBooking, 'id' | 'created_at' | 'updated_at'>) => void;
  updateBooking: (id: string, updates: Partial<MerchantBooking>) => void;
  deleteBooking: (id: string) => void;
  
  // Clients (auto-managed)
  addOrUpdateClient: (client: Omit<MerchantClient, 'id' | 'created_at' | 'updated_at'>) => void;
  
  // Utils
  clearError: () => void;
  loadFromStorage: () => void;
}

const STORAGE_KEY = 'yookie_merchant_state';

export const useMerchantStore = create<MerchantState & MerchantActions>()(
  persist(
    (set, get) => ({
      // Initial State
      merchantToken: null,
      isAuthenticated: false,
      merchant: null,
      services: [],
      staff: [],
      availability: [],
      bookings: [],
      clients: [],
      isLoading: false,
      error: null,

      // Auth Actions
      login: (token, merchant) => {
        const mockServices = generateMockServices(merchant.id);
        const mockStaff = generateMockStaff(merchant.id);
        const mockAvailability = generateMockAvailability(merchant.id);
        
        set({
          merchantToken: token,
          isAuthenticated: true,
          merchant,
          services: mockServices,
          staff: mockStaff,
          availability: mockAvailability,
          bookings: [],
          clients: [],
          error: null,
        });
      },

      logout: () => {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {}
        set({
          merchantToken: null,
          isAuthenticated: false,
          merchant: null,
          services: [],
          staff: [],
          availability: [],
          bookings: [],
          clients: [],
          error: null,
        });
      },

      // Merchant Actions
      updateMerchant: (updates) => {
        const { merchant } = get();
        if (!merchant) return;
        
        set({
          merchant: { ...merchant, ...updates, updated_at: new Date().toISOString() },
        });
      },

      // Service Actions
      addService: (service) => {
        const { services, merchant } = get();
        if (!merchant) return;
        
        const newService: MerchantService = {
          ...service,
          id: `service-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        set({ services: [...services, newService] });
      },

      updateService: (id, updates) => {
        const { services } = get();
        const updated = services.map((s) =>
          s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s
        );
        set({ services: updated });
      },

      deleteService: (id) => {
        const { services } = get();
        set({ services: services.filter((s) => s.id !== id) });
      },

      // Staff Actions
      addStaff: (staff) => {
        const { staff: currentStaff, merchant } = get();
        if (!merchant) return;
        
        const newStaff: MerchantStaff = {
          ...staff,
          id: `staff-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        set({ staff: [...currentStaff, newStaff] });
      },

      updateStaff: (id, updates) => {
        const { staff } = get();
        const updated = staff.map((s) =>
          s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s
        );
        set({ staff: updated });
      },

      deleteStaff: (id) => {
        const { staff } = get();
        set({ staff: staff.filter((s) => s.id !== id) });
      },

      // Availability Actions
      updateAvailability: (dayOfWeek, updates) => {
        const { availability } = get();
        const updated = availability.map((a) =>
          a.day_of_week === dayOfWeek
            ? { ...a, ...updates, updated_at: new Date().toISOString() }
            : a
        );
        set({ availability: updated });
      },

      // Booking Actions
      addBooking: (booking) => {
        const { bookings, clients } = get();
        
        // Auto-create or update client
        const existingClient = clients.find(
          (c) => c.phone === booking.client_phone
        );
        
        let clientId = booking.client_id;
        if (!existingClient) {
          const newClient: MerchantClient = {
            id: `client-${Date.now()}`,
            merchant_id: booking.merchant_id,
            name: booking.client_name,
            phone: booking.client_phone,
            total_bookings: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          clientId = newClient.id;
          set({ clients: [...clients, newClient] });
        } else {
          // Update existing client
          const updatedClients = clients.map((c) =>
            c.id === existingClient.id
              ? { ...c, total_bookings: c.total_bookings + 1, updated_at: new Date().toISOString() }
              : c
          );
          set({ clients: updatedClients });
        }
        
        const newBooking: MerchantBooking = {
          ...booking,
          id: `booking-${Date.now()}`,
          client_id: clientId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        set({ bookings: [...bookings, newBooking] });
      },

      updateBooking: (id, updates) => {
        const { bookings } = get();
        const updated = bookings.map((b) =>
          b.id === id ? { ...b, ...updates, updated_at: new Date().toISOString() } : b
        );
        set({ bookings: updated });
      },

      deleteBooking: (id) => {
        const { bookings } = get();
        set({ bookings: bookings.filter((b) => b.id !== id) });
      },

      // Client Actions
      addOrUpdateClient: (client) => {
        const { clients } = get();
        const existing = clients.find((c) => c.phone === client.phone);
        
        if (existing) {
          const updated = clients.map((c) =>
            c.id === existing.id
              ? { ...c, ...client, updated_at: new Date().toISOString() }
              : c
          );
          set({ clients: updated });
        } else {
          const newClient: MerchantClient = {
            ...client,
            id: `client-${Date.now()}`,
            total_bookings: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          set({ clients: [...clients, newClient] });
        }
      },

      // Utils
      clearError: () => set({ error: null }),
      
      loadFromStorage: () => {
        // Handled by zustand persist middleware
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        merchantToken: state.merchantToken,
        isAuthenticated: state.isAuthenticated,
        merchant: state.merchant,
        services: state.services,
        staff: state.staff,
        availability: state.availability,
        bookings: state.bookings,
        clients: state.clients,
      }),
    }
  )
);
