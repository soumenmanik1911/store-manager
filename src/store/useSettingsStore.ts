import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as storage from '@/lib/storage';

interface SettingsState {
  shopName: string;
  ownerName: string;
  shopPhone: string;
  shopAddress: string;
  taxRate: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initialize: () => Promise<void>;
  setShopName: (name: string) => void;
  setOwnerName: (name: string) => void;
  setShopPhone: (phone: string) => void;
  setShopAddress: (address: string) => void;
  setTaxRate: (rate: number) => void;
  saveAllSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      shopName: 'FrostyFlow',
      ownerName: '',
      shopPhone: '',
      shopAddress: '',
      taxRate: 0,
      isLoading: false,
      error: null,

      initialize: async () => {
        set({ isLoading: true, error: null });
        try {
          const settings = await storage.getSettings();
          set({
            shopName: settings.shopName || 'FrostyFlow',
            ownerName: settings.ownerName || '',
            shopPhone: settings.phone || '',
            shopAddress: settings.address || '',
            taxRate: settings.taxRate || 0,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error initializing settings:', error);
          set({ isLoading: false, error: 'Failed to load settings' });
        }
      },

      setShopName: (name) => set({ shopName: name }),
      setOwnerName: (name) => set({ ownerName: name }),
      setShopPhone: (phone) => set({ shopPhone: phone }),
      setShopAddress: (address) => set({ shopAddress: address }),
      setTaxRate: (rate) => set({ taxRate: rate }),

      saveAllSettings: async () => {
        const { shopName, ownerName, shopPhone, shopAddress, taxRate } = get();
        
        try {
          await storage.saveSettings({
            shopName,
            ownerName,
            phone: shopPhone,
            address: shopAddress,
            taxRate,
            currency: 'INR',
            lowStockDefaultThreshold: 50,
          });
        } catch (error) {
          console.error('Error saving settings:', error);
          throw error;
        }
      },
    }),
    {
      name: 'frostyflow-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
