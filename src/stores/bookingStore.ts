/**
 * Booking Wizard Store
 * Manages the multi-step booking flow state.
 *
 * Supports multi-service selection with per-service master assignment.
 * New state shape:
 *   - selectedServices: Service[] (one or more)
 *   - serviceMasters: Record<serviceId, masterId> (which master does each service)
 *   - selectedMaster: Master | null (legacy single-master, for master detail pages)
 *   - selectedDate, selectedSlot: single shared date/time
 */

import { create } from 'zustand';
import { Business, Master, Service, TimeSlot } from '../lib/api/types';

type BookingStep = 1 | 2 | 3 | 4;

/**
 * A service-to-master assignment used in the new multi-service flow.
 * masterId is null until the user picks a master for that service.
 */
export interface ServiceAssignment {
  service: Service;
  masterId: string | null;
}

interface BookingState {
  // Selected data
  selectedBusiness: Business | null;
  /** Multi-service selection (new flow) */
  selectedServices: ServiceAssignment[];
  /** Legacy single master (used when booking from MasterDetailPage) */
  selectedMaster: Master | null;
  selectedDate: string | null; // YYYY-MM-DD
  selectedSlot: TimeSlot | null;

  // Client info
  clientName: string;
  clientPhone: string;
  notes: string;

  // Wizard state
  step: BookingStep;
}

interface BookingActions {
  // Setters
  setBusiness: (business: Business) => void;
  /** Legacy: set single service (toggles) */
  setService: (service: Service | null) => void;
  /** New: toggle service in multi-select list */
  toggleService: (service: Service) => void;
  /** Clear all selected services */
  clearServices: () => void;
  /** Assign a master to a specific service */
  assignMasterToService: (serviceId: string, masterId: string) => void;
  /** Remove master assignment for a service */
  unassignMasterFromService: (serviceId: string) => void;
  /** Set master (legacy, for master detail pages) */
  setMaster: (master: Master | null) => void;
  setDate: (date: string) => void;
  setSlot: (slot: TimeSlot | null) => void;
  setClientName: (name: string) => void;
  setClientPhone: (phone: string) => void;
  setNotes: (notes: string) => void;

  // Navigation
  setStep: (step: BookingStep) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Utilities
  reset: () => void;
  canProceed: () => boolean;
}

const INITIAL_STATE: BookingState = {
  selectedBusiness: null,
  selectedServices: [],
  selectedMaster: null,
  selectedDate: null,
  selectedSlot: null,
  clientName: '',
  clientPhone: '',
  notes: '',
  step: 1,
};

export const useBookingStore = create<BookingState & BookingActions>((set, get) => ({
  // Initial state
  ...INITIAL_STATE,

  // Setters
  setBusiness: (business: Business) => {
    set({
      selectedBusiness: business,
      // Reset dependent selections when business changes
      selectedServices: [],
      selectedMaster: null,
      selectedDate: null,
      selectedSlot: null,
    });
  },

  /** Legacy: replace single service (used by MasterDetailPage) */
  setService: (service: Service | null) => {
    set({ selectedServices: service ? [{ service, masterId: null }] : [] });
  },

  /** New: toggle service in multi-select list */
  toggleService: (service: Service) => {
    set((state) => {
      const exists = state.selectedServices.find((s) => s.service.id === service.id);
      if (exists) {
        return {
          selectedServices: state.selectedServices.filter((s) => s.service.id !== service.id),
        };
      }
      return {
        selectedServices: [...state.selectedServices, { service, masterId: null }],
      };
    });
  },

  clearServices: () => {
    set({ selectedServices: [] });
  },

  assignMasterToService: (serviceId: string, masterId: string) => {
    set((state) => ({
      selectedServices: state.selectedServices.map((s) =>
        s.service.id === serviceId ? { ...s, masterId } : s
      ),
    }));
  },

  unassignMasterFromService: (serviceId: string) => {
    set((state) => ({
      selectedServices: state.selectedServices.map((s) =>
        s.service.id === serviceId ? { ...s, masterId: null } : s
      ),
    }));
  },

  setMaster: (master: Master | null) => {
    set({ selectedMaster: master });
  },

  setDate: (date: string) => {
    set({
      selectedDate: date,
      // Reset slot when date changes
      selectedSlot: null,
    });
  },

  setSlot: (slot: TimeSlot | null) => {
    set({ selectedSlot: slot });
  },

  setClientName: (name: string) => {
    set({ clientName: name });
  },

  setClientPhone: (phone: string) => {
    set({ clientPhone: phone });
  },

  setNotes: (notes: string) => {
    set({ notes });
  },

  // Navigation
  setStep: (step: BookingStep) => {
    set({ step });
  },

  nextStep: () => {
    const state = get();
    if (state.step < 4) {
      set({ step: (state.step + 1) as BookingStep });
    }
  },

  prevStep: () => {
    const state = get();
    if (state.step > 1) {
      set({ step: (state.step - 1) as BookingStep });
    }
  },

  // Reset all state
  reset: () => {
    set(INITIAL_STATE);
  },

  // Check if user can proceed
  canProceed: (): boolean => {
    const state = get();

    switch (state.step) {
      case 1:
        return state.selectedBusiness !== null;
      case 2:
        // Either legacy single service+master, or new multi-service with all masters assigned
        if (state.selectedServices.length > 0) {
          return state.selectedServices.every((s) => s.masterId !== null);
        }
        return state.selectedMaster !== null;
      case 3:
        return state.selectedDate !== null && state.selectedSlot !== null;
      case 4:
        return state.clientName.trim() !== '' && state.clientPhone.trim() !== '';
      default:
        return false;
    }
  },
}));
