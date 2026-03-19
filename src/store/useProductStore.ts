import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product, ProductSize, ProductCategory } from '@/types';
import * as storage from '@/lib/storage';

interface ProductState {
  products: Product[];
  searchQuery: string;
  selectedCategory: ProductCategory;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initialize: () => Promise<void>;
  initializeFromStorage: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: ProductCategory) => void;
  getFilteredProducts: () => Product[];
  getProductById: (id: string) => Product | undefined;
}

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: [],
      searchQuery: '',
      selectedCategory: 'All',
      isLoading: false,
      error: null,

      initialize: async () => {
        set({ isLoading: true, error: null });
        try {
          const products = await storage.getProducts();
          set({ products, isLoading: false });
        } catch (error) {
          console.error('Error initializing products:', error);
          set({ isLoading: false, error: 'Failed to load products' });
        }
      },

      // Backward compatibility alias
      initializeFromStorage: async () => {
        return get().initialize();
      },

      addProduct: async (productData) => {
        const now = new Date().toISOString();
        const product: Product = {
          ...productData,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        };
        
        // Add to store first (optimistic update)
        set((state) => ({
          products: [...state.products, product],
        }));
        
        try {
          // Persist to API
          await storage.addProduct(product);
          
          // Create SKUs for each size and add initial stock
          for (const size of product.sizes) {
            const skuCode = storage.generateSKUCode(product.brand, product.name, size.name);
            const sku = {
              id: crypto.randomUUID(),
              productId: product.id,
              sizeId: size.id,
              skuCode,
              currentStock: ((size as any).initialStock || 0) * size.bottlesPerCarton,
              lowStockThreshold: 50,
              status: (((size as any).initialStock || 0) * size.bottlesPerCarton) > 50 ? 'Healthy' as const : 'Low Stock' as const,
            };
            await storage.upsertSKU(sku);
          }
        } catch (error) {
          // Rollback on error
          set((state) => ({
            products: state.products.filter(p => p.id !== product.id),
          }));
          console.error('Error adding product:', error);
          throw error;
        }
      },

      updateProduct: async (id, updates) => {
        const previousProduct = get().products.find(p => p.id === id);
        
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id
              ? { ...p, ...updates, updatedAt: new Date().toISOString() }
              : p
          ),
        }));
        
        try {
          await storage.updateProduct(id, updates);
        } catch (error) {
          // Rollback on error
          if (previousProduct) {
            set((state) => ({
              products: state.products.map((p) =>
                p.id === id ? previousProduct : p
              ),
            }));
          }
          console.error('Error updating product:', error);
          throw error;
        }
      },

      deleteProduct: async (id) => {
        const previousProducts = get().products;
        
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        }));
        
        try {
          await storage.deleteProduct(id);
        } catch (error) {
          // Rollback on error
          set({ products: previousProducts });
          console.error('Error deleting product:', error);
          throw error;
        }
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      setSelectedCategory: (category) => {
        set({ selectedCategory: category });
      },

      getFilteredProducts: () => {
        const { products, searchQuery, selectedCategory } = get();
        
        return products.filter((product) => {
          // Filter by category
          if (selectedCategory !== 'All' && product.category !== selectedCategory) {
            return false;
          }
          
          // Filter by search query
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
              product.name.toLowerCase().includes(query) ||
              product.brand.toLowerCase().includes(query)
            );
          }
          
          return true;
        });
      },

      getProductById: (id) => {
        return get().products.find((p) => p.id === id);
      },
    }),
    {
      name: 'cold-drinks-products',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        selectedCategory: state.selectedCategory,
      }),
    }
  )
);

// Helper to add sample products
export async function addSampleProducts() {
  const sampleProducts: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      brand: 'The Coca-Cola Company',
      name: 'Coca-Cola Classic',
      category: 'Sodas',
      sizes: [
        { id: '1', name: '250ml', pricePerBottle: 20, pricePerCarton: 200, bottlesPerCarton: 12 },
        { id: '2', name: '500ml', pricePerBottle: 35, pricePerCarton: 350, bottlesPerCarton: 12 },
        { id: '3', name: '1.25L', pricePerBottle: 55, pricePerCarton: 550, bottlesPerCarton: 12 },
        { id: '4', name: '2L', pricePerBottle: 75, pricePerCarton: 750, bottlesPerCarton: 6 },
      ],
    },
    {
      brand: 'PepsiCo',
      name: 'Pepsi Blue',
      category: 'Sodas',
      sizes: [
        { id: '5', name: '330ml', pricePerBottle: 25, pricePerCarton: 250, bottlesPerCarton: 12 },
        { id: '6', name: '500ml', pricePerBottle: 35, pricePerCarton: 350, bottlesPerCarton: 12 },
        { id: '7', name: '1.5L', pricePerBottle: 55, pricePerCarton: 550, bottlesPerCarton: 12 },
      ],
    },
    {
      brand: 'The Coca-Cola Company',
      name: 'Sprite',
      category: 'Sodas',
      sizes: [
        { id: '8', name: '500ml', pricePerBottle: 35, pricePerCarton: 350, bottlesPerCarton: 12 },
        { id: '9', name: '1L', pricePerBottle: 50, pricePerCarton: 500, bottlesPerCarton: 12 },
        { id: '10', name: '2.25L', pricePerBottle: 80, pricePerCarton: 800, bottlesPerCarton: 6 },
      ],
    },
    {
      brand: 'Red Bull GmbH',
      name: 'Red Bull Energy',
      category: 'Energy Drinks',
      sizes: [
        { id: '11', name: '250ml', pricePerBottle: 150, pricePerCarton: 1200, bottlesPerCarton: 24 },
        { id: '12', name: '355ml', pricePerBottle: 200, pricePerCarton: 1600, bottlesPerCarton: 24 },
      ],
    },
    {
      brand: 'PepsiCo',
      name: 'Mountain Dew',
      category: 'Energy Drinks',
      sizes: [
        { id: '13', name: '250ml', pricePerBottle: 30, pricePerCarton: 300, bottlesPerCarton: 12 },
        { id: '14', name: '500ml', pricePerBottle: 45, pricePerCarton: 450, bottlesPerCarton: 12 },
      ],
    },
    {
      brand: 'Citrus Farms',
      name: 'Orange Juice',
      category: 'Juices',
      sizes: [
        { id: '15', name: '1L', pricePerBottle: 80, pricePerCarton: 800, bottlesPerCarton: 12 },
        { id: '16', name: '200ml', pricePerBottle: 25, pricePerCarton: 250, bottlesPerCarton: 24 },
      ],
    },
    {
      brand: 'Alpine Springs',
      name: 'Mineral Water',
      category: 'Water',
      sizes: [
        { id: '17', name: '1L', pricePerBottle: 20, pricePerCarton: 200, bottlesPerCarton: 24 },
        { id: '18', name: '500ml', pricePerBottle: 12, pricePerCarton: 120, bottlesPerCarton: 24 },
        { id: '19', name: '2L', pricePerBottle: 30, pricePerCarton: 300, bottlesPerCarton: 12 },
      ],
    },
    {
      brand: 'Nestle',
      name: 'Nestle Water',
      category: 'Water',
      sizes: [
        { id: '20', name: '1L', pricePerBottle: 18, pricePerCarton: 180, bottlesPerCarton: 24 },
        { id: '21', name: '500ml', pricePerBottle: 10, pricePerCarton: 100, bottlesPerCarton: 24 },
      ],
    },
  ];

  const store = useProductStore.getState();
  for (const product of sampleProducts) {
    await store.addProduct(product);
  }
}
