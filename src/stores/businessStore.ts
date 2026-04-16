/**
 * Unified Business Store
 * Bridges B2B (Merchant) and B2C (Business/Master) systems
 * All entities are shared - changes in B2B immediately reflect in B2C
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Merchant,
  MerchantService,
  MerchantStaff,
  MerchantAvailability,
  MerchantBooking,
  MerchantClient,
  Business,
  Master,
  Service,
  Booking,
} from '@/lib/api/types';

// Convert Merchant to Business for B2C display
export const merchantToBusiness = (merchant: Merchant): Business => ({
  id: merchant.id,
  provider_type: merchant.business_type === 'salon' ? 'business' : 'individual',
  name: merchant.business_name,
  description: merchant.description || '',
  category: merchant.category,
  address: merchant.address,
  city: merchant.city,
  phone: merchant.phone,
  instagram: merchant.instagram,
  telegram_username: merchant.telegram_username,
  working_hours: {}, // Will be populated from availability
  slot_duration_min: 30,
  is_active: merchant.is_active,
  rating: merchant.rating,
  created_at: merchant.created_at,
  updated_at: merchant.updated_at,
});

// Convert MerchantService to Service for B2C
export const merchantServiceToService = (service: MerchantService): Service => ({
  id: service.id,
  business_id: service.merchant_id,
  name: service.name,
  description: service.description,
  price: service.price,
  duration_min: service.duration_min,
  category: service.category,
  is_active: service.is_active,
  position: service.position,
  created_at: service.created_at,
  updated_at: service.updated_at,
});

// Convert MerchantStaff to Master for B2C
export const merchantStaffToMaster = (staff: MerchantStaff, merchantId: string): Master => ({
  id: staff.id,
  business_id: merchantId,
  name: staff.name,
  specialization: staff.specialization,
  photo_url: staff.photo_url,
  rating: 5.0,
  review_count: 0,
  working_days: ['1', '2', '3', '4', '5', '6'],
  is_active: staff.is_active,
  position: staff.position,
  created_at: staff.created_at,
  updated_at: staff.updated_at,
});

interface BusinessState {
  // B2B State (from merchantStore integration)
  currentMerchant: Merchant | null;
  merchantServices: MerchantService[];
  merchantStaff: MerchantStaff[];
  merchantAvailability: MerchantAvailability[];
  merchantBookings: MerchantBooking[];
  merchantClients: MerchantClient[];
  
  // B2C Views (computed from B2B data)
  allBusinesses: Business[];
  allServices: Service[];
  allMasters: Master[];
  allBookings: Booking[];
  
  // Auth
  isAuthenticated: boolean;
  merchantToken: string | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
}

interface BusinessActions {
  // Initialize merchant from registration
  initializeMerchant: (merchant: Merchant) => void;
  
  // Merchant CRUD
  updateMerchantProfile: (updates: Partial<Merchant>) => void;
  
  // Services CRUD
  addService: (service: Omit<MerchantService, 'id' | 'created_at' | 'updated_at'>) => void;
  updateService: (id: string, updates: Partial<MerchantService>) => void;
  deleteService: (id: string) => void;
  
  // Staff CRUD
  addStaff: (staff: Omit<MerchantStaff, 'id' | 'created_at' | 'updated_at'>) => void;
  updateStaff: (id: string, updates: Partial<MerchantStaff>) => void;
  deleteStaff: (id: string) => void;
  
  // Availability
  setAvailability: (dayOfWeek: number, openTime: string, closeTime: string, isOpen: boolean) => void;
  
  // Bookings
  createBooking: (booking: Omit<MerchantBooking, 'id' | 'created_at' | 'updated_at'>) => void;
  updateBookingStatus: (id: string, status: MerchantBooking['status']) => void;
  updateBookingTime: (id: string, startsAt: string, endsAt: string) => void;
  cancelBooking: (id: string) => void;
  
  // Clients
  getOrCreateClient: (phone: string, name?: string) => string;
  
  // Auth
  login: (token: string, merchant: Merchant) => void;
  logout: () => void;
  
  // Utils
  clearError: () => void;
}

const STORAGE_KEY = 'yookie_business_state';

export const useBusinessStore = create<BusinessState & BusinessActions>()(
  persist(
    (set, get) => ({
      // Initial State
      currentMerchant: null,
      merchantServices: [],
      merchantStaff: [],
      merchantAvailability: [],
      merchantBookings: [],
      merchantClients: [],
      
      allBusinesses: [],
      allServices: [],
      allMasters: [],
      allBookings: [],
      
      isAuthenticated: false,
      merchantToken: null,
      isLoading: false,
      error: null,

      // Initialize merchant after registration
      initializeMerchant: (merchant) => {
        const state = get();
        
        // Create default availability if not exists
        const defaultAvailability: MerchantAvailability[] = [
          { id: 'avail-1', merchant_id: merchant.id, day_of_week: 1, open_time: '09:00', close_time: '18:00', is_open: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'avail-2', merchant_id: merchant.id, day_of_week: 2, open_time: '09:00', close_time: '18:00', is_open: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'avail-3', merchant_id: merchant.id, day_of_week: 3, open_time: '09:00', close_time: '18:00', is_open: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'avail-4', merchant_id: merchant.id, day_of_week: 4, open_time: '09:00', close_time: '18:00', is_open: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'avail-5', merchant_id: merchant.id, day_of_week: 5, open_time: '09:00', close_time: '18:00', is_open: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'avail-6', merchant_id: merchant.id, day_of_week: 6, open_time: '10:00', close_time: '16:00', is_open: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ];
        
        // Convert to B2C views
        const business = merchantToBusiness(merchant);
        
        set({
          currentMerchant: merchant,
          merchantAvailability: defaultAvailability,
          allBusinesses: [...state.allBusinesses.filter(b => b.id !== merchant.id), business],
          isAuthenticated: true,
          error: null,
        });
      },

      // Update merchant profile
      updateMerchantProfile: (updates) => {
        const { currentMerchant } = get();
        if (!currentMerchant) return;
        
        const updatedMerchant = { 
          ...currentMerchant, 
          ...updates, 
          updated_at: new Date().toISOString() 
        };
        
        // Update B2C view
        const updatedBusiness = merchantToBusiness(updatedMerchant);
        
        set((state) => ({
          currentMerchant: updatedMerchant,
          allBusinesses: state.allBusinesses.map(b => 
            b.id === updatedMerchant.id ? updatedBusiness : b
          ),
        }));
      },

      // Add service
      addService: (serviceData) => {
        const { currentMerchant, merchantServices } = get();
        if (!currentMerchant) return;
        
        const newService: MerchantService = {
          ...serviceData,
          id: `service-${Date.now()}`,
          merchant_id: currentMerchant.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        const updatedServices = [...merchantServices, newService];
        const b2cService = merchantServiceToService(newService);
        
        set((state) => ({
          merchantServices: updatedServices,
          allServices: [...state.allServices.filter(s => s.id !== newService.id), b2cService],
        }));
      },

      // Update service
      updateService: (id, updates) => {
        const { merchantServices } = get();
        const updatedServices = merchantServices.map(s =>
          s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s
        );
        
        const updatedService = updatedServices.find(s => s.id === id);
        
        set((state) => ({
          merchantServices: updatedServices,
          allServices: updatedService
            ? state.allServices.map(s => s.id === id ? merchantServiceToService(updatedService) : s)
            : state.allServices,
        }));
      },

      // Delete service
      deleteService: (id) => {
        const { merchantServices } = get();
        set((state) => ({
          merchantServices: merchantServices.filter(s => s.id !== id),
          allServices: state.allServices.filter(s => s.id !== id),
        }));
      },

      // Add staff
      addStaff: (staffData) => {
        const { currentMerchant, merchantStaff } = get();
        if (!currentMerchant) return;
        
        const newStaff: MerchantStaff = {
          ...staffData,
          id: `staff-${Date.now()}`,
          merchant_id: currentMerchant.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        const updatedStaff = [...merchantStaff, newStaff];
        const b2cMaster = merchantStaffToMaster(newStaff, currentMerchant.id);
        
        set((state) => ({
          merchantStaff: updatedStaff,
          allMasters: [...state.allMasters.filter(m => m.id !== newStaff.id), b2cMaster],
        }));
      },

      // Update staff
      updateStaff: (id, updates) => {
        const { merchantStaff, currentMerchant } = get();
        if (!currentMerchant) return;
        
        const updatedStaffList = merchantStaff.map(s =>
          s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s
        );
        
        const updatedStaff = updatedStaffList.find(s => s.id === id);
        
        set((state) => ({
          merchantStaff: updatedStaffList,
          allMasters: updatedStaff
            ? state.allMasters.map(m => m.id === id ? merchantStaffToMaster(updatedStaff, currentMerchant.id) : m)
            : state.allMasters,
        }));
      },

      // Delete staff
      deleteStaff: (id) => {
        const { merchantStaff } = get();
        set((state) => ({
          merchantStaff: merchantStaff.filter(s => s.id !== id),
          allMasters: state.allMasters.filter(m => m.id !== id),
        }));
      },

      // Set availability
      setAvailability: (dayOfWeek, openTime, closeTime, isOpen) => {
        const { merchantAvailability } = get();
        const existing = merchantAvailability.find(a => a.day_of_week === dayOfWeek);
        
        let updatedAvailability;
        if (existing) {
          updatedAvailability = merchantAvailability.map(a =>
            a.day_of_week === dayOfWeek
              ? { ...a, open_time: openTime, close_time: closeTime, is_open: isOpen, updated_at: new Date().toISOString() }
              : a
          );
        } else {
          const newAvail: MerchantAvailability = {
            id: `avail-${dayOfWeek}-${Date.now()}`,
            merchant_id: get().currentMerchant?.id || '',
            day_of_week: dayOfWeek,
            open_time: openTime,
            close_time: closeTime,
            is_open: isOpen,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          updatedAvailability = [...merchantAvailability, newAvail];
        }
        
        set({ merchantAvailability: updatedAvailability });
      },

      // Create booking
      createBooking: (bookingData) => {
        const { currentMerchant, merchantBookings, merchantClients } = get();
        if (!currentMerchant) return;
        
        // Get or create client
        let clientId = bookingData.client_id;
        let updatedClients = [...merchantClients];
        
        const existingClient = merchantClients.find(c => c.phone === bookingData.client_phone);
        if (!existingClient) {
          const newClient: MerchantClient = {
            id: `client-${Date.now()}`,
            merchant_id: currentMerchant.id,
            name: bookingData.client_name,
            phone: bookingData.client_phone,
            total_bookings: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          clientId = newClient.id;
          updatedClients.push(newClient);
        } else {
          updatedClients = merchantClients.map(c =>
            c.id === existingClient.id
              ? { ...c, total_bookings: c.total_bookings + 1, updated_at: new Date().toISOString() }
              : c
          );
        }
        
        const newBooking: MerchantBooking = {
          ...bookingData,
          id: `booking-${Date.now()}`,
          client_id: clientId,
          merchant_id: currentMerchant.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        set({
          merchantBookings: [...merchantBookings, newBooking],
          merchantClients: updatedClients,
        });
      },

      // Update booking status
      updateBookingStatus: (id, status) => {
        const { merchantBookings } = get();
        const updatedBookings = merchantBookings.map(b =>
          b.id === id ? { ...b, status, updated_at: new Date().toISOString() } : b
        );
        set({ merchantBookings: updatedBookings });
      },

      // Update booking time
      updateBookingTime: (id, startsAt, endsAt) => {
        const { merchantBookings } = get();
        const updatedBookings = merchantBookings.map(b =>
          b.id === id ? { ...b, starts_at: startsAt, ends_at: endsAt, updated_at: new Date().toISOString() } : b
        );
        set({ merchantBookings: updatedBookings });
      },

      // Cancel booking
      cancelBooking: (id) => {
        get().updateBookingStatus(id, 'cancelled');
      },

      // Get or create client
      getOrCreateClient: (phone, name = 'Клиент') => {
        const { currentMerchant, merchantClients } = get();
        if (!currentMerchant) return '';
        
        const existing = merchantClients.find(c => c.phone === phone);
        if (existing) return existing.id;
        
        const newClient: MerchantClient = {
          id: `client-${Date.now()}`,
          merchant_id: currentMerchant.id,
          name,
          phone,
          total_bookings: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        set({ merchantClients: [...merchantClients, newClient] });
        return newClient.id;
      },

      // Login
      login: (token, merchant) => {
        set({
          merchantToken: token,
          isAuthenticated: true,
          currentMerchant: merchant,
          error: null,
        });
        get().initializeMerchant(merchant);
      },

      // Logout
      logout: () => {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {}
        set({
          merchantToken: null,
          isAuthenticated: false,
          currentMerchant: null,
          merchantServices: [],
          merchantStaff: [],
          merchantAvailability: [],
          merchantBookings: [],
          merchantClients: [],
          error: null,
        });
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        currentMerchant: state.currentMerchant,
        merchantServices: state.merchantServices,
        merchantStaff: state.merchantStaff,
        merchantAvailability: state.merchantAvailability,
        merchantBookings: state.merchantBookings,
        merchantClients: state.merchantClients,
        allBusinesses: state.allBusinesses,
        allServices: state.allServices,
        allMasters: state.allMasters,
        isAuthenticated: state.isAuthenticated,
        merchantToken: state.merchantToken,
      }),
    }
  )
);
