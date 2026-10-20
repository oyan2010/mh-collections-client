import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useLocationStore = create(
    persist(
        (set) => ({
            lat: null,
            lng: null,
            address: null,

            setLocation: (lat, lng) => set({ lat, lng }),
            setAddress: (address) => set({ address }),
            clearLocation: () => set({ lat: null, lng: null, address: null }),
        }),
        {
            name: 'mh-location-storage',
        }
    )
);
