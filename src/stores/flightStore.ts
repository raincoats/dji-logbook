/**
 * Zustand store for flight state management
 * Manages the currently selected flight and flight list
 */

import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { Flight, FlightDataResponse, ImportResult, OverviewStats } from '@/types';

interface FlightState {
  // State
  flights: Flight[];
  selectedFlightId: number | null;
  currentFlightData: FlightDataResponse | null;
  overviewStats: OverviewStats | null;
  isLoading: boolean;
  isImporting: boolean;
  error: string | null;
  unitSystem: 'metric' | 'imperial';
  themeMode: 'system' | 'dark' | 'light';

  // Actions
  loadFlights: () => Promise<void>;
  loadOverview: () => Promise<void>;
  selectFlight: (flightId: number) => Promise<void>;
  importLog: (filePath: string) => Promise<ImportResult>;
  deleteFlight: (flightId: number) => Promise<void>;
  updateFlightName: (flightId: number, displayName: string) => Promise<void>;
  setUnitSystem: (unitSystem: 'metric' | 'imperial') => void;
  setThemeMode: (themeMode: 'system' | 'dark' | 'light') => void;
  clearError: () => void;
}

export const useFlightStore = create<FlightState>((set, get) => ({
  // Initial state
  flights: [],
  selectedFlightId: null,
  currentFlightData: null,
  overviewStats: null,
  isLoading: false,
  isImporting: false,
  error: null,
  unitSystem:
    (typeof localStorage !== 'undefined' &&
      (localStorage.getItem('unitSystem') as 'metric' | 'imperial')) ||
    'metric',
  themeMode:
    (typeof localStorage !== 'undefined' &&
      (localStorage.getItem('themeMode') as 'system' | 'dark' | 'light')) ||
    'system',

  // Load all flights from database
  loadFlights: async () => {
    set({ isLoading: true, error: null });
    try {
      const flights = await invoke<Flight[]>('get_flights');
      set({ flights, isLoading: false });

      // Auto-select first flight if none selected
      if (flights.length > 0 && get().selectedFlightId === null) {
        await get().selectFlight(flights[0].id);
      }
    } catch (err) {
      set({ 
        isLoading: false, 
        error: `Failed to load flights: ${err}` 
      });
    }
  },

  loadOverview: async () => {
    set({ isLoading: true, error: null });
    try {
      const stats = await invoke<OverviewStats>('get_overview_stats');
      set({ overviewStats: stats, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: `Failed to load overview stats: ${err}`,
      });
    }
  },

  // Select a flight and load its data
  selectFlight: async (flightId: number) => {
    set({ isLoading: true, error: null, selectedFlightId: flightId });
    try {
      const flightData = await invoke<FlightDataResponse>('get_flight_data', {
        flightId,
        maxPoints: 5000, // Downsample if needed
      });
      set({ currentFlightData: flightData, isLoading: false });
    } catch (err) {
      set({ 
        isLoading: false, 
        error: `Failed to load flight data: ${err}` 
      });
    }
  },

  // Import a new log file
  importLog: async (filePath: string) => {
    set({ isImporting: true, error: null });
    try {
      const result = await invoke<ImportResult>('import_log', { filePath });
      
      if (result.success && result.flightId) {
        // Reload flights and select the new one
        await get().loadFlights();
        await get().selectFlight(result.flightId);
      }
      
      set({ isImporting: false });
      return result;
    } catch (err) {
      const errorMessage = `Import failed: ${err}`;
      set({ isImporting: false, error: errorMessage });
      return {
        success: false,
        flightId: null,
        message: errorMessage,
        pointCount: 0,
      };
    }
  },

  // Delete a flight
  deleteFlight: async (flightId: number) => {
    try {
      await invoke('delete_flight', { flightId });
      
      // Clear selection if deleted flight was selected
      if (get().selectedFlightId === flightId) {
        set({ selectedFlightId: null, currentFlightData: null });
      }
      
      // Reload flights
      await get().loadFlights();
    } catch (err) {
      set({ error: `Failed to delete flight: ${err}` });
    }
  },

  // Update flight display name
  updateFlightName: async (flightId: number, displayName: string) => {
    try {
      await invoke('update_flight_name', { flightId, displayName });

      // Update local list
      const flights = get().flights.map((flight) =>
        flight.id === flightId
          ? { ...flight, displayName }
          : flight
      );
      set({ flights });

      // If selected, update current flight data too
      const current = get().currentFlightData;
      if (current && current.flight.id === flightId) {
        set({
          currentFlightData: {
            ...current,
            flight: { ...current.flight, displayName },
          },
        });
      }
    } catch (err) {
      set({ error: `Failed to update flight name: ${err}` });
    }
  },

  setUnitSystem: (unitSystem) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('unitSystem', unitSystem);
    }
    set({ unitSystem });
  },

  setThemeMode: (themeMode) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('themeMode', themeMode);
    }
    set({ themeMode });
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
