// Product related types
export type ProductCategory = 'Sodas' | 'Juices' | 'Energy Drinks' | 'Water' | 'All';

export interface ProductSize {
  id: string;
  name: string; // e.g., "500ml", "1.5L", "250ml Can"
  pricePerBottle: number;
  pricePerCarton: number;
  bottlesPerCarton: number;
}

export interface Product {
  id: string;
  brand: string;
  name: string;
  category: ProductCategory;
  image?: string; // Base64 encoded image
  sizes: ProductSize[];
  createdAt: string;
  updatedAt: string;
}

// Inventory related types
export type StockStatus = 'Healthy' | 'Low Stock' | 'Out of Stock';

export interface SKU {
  id: string;
  productId: string;
  sizeId: string;
  skuCode: string; // Auto-generated SKU
  currentStock: number;
  lowStockThreshold: number;
  status: StockStatus;
  lastRestocked?: string;
}

export interface StockEntry {
  id: string;
  skuId: string;
  productId: string;
  quantity: number; // in bottles
  quantityType: 'bottles' | 'cartons';
  batchId?: string;
  expiryDate?: string;
  addedAt: string;
  notes?: string;
}

export interface StockHistoryEntry {
  id: string;
  skuId: string;
  productId: string;
  type: 'addition' | 'deduction';
  quantity: number;
  previousStock: number;
  newStock: number;
  billId?: string;
  timestamp: string;
  notes?: string;
}

// Billing related types
export type PaymentMode = 'Cash' | 'UPI' | 'Card';

export interface BillItem {
  id: string;
  productId: string;
  sizeId: string;
  productName: string;
  sizeName: string;
  packaging: 'bottle' | 'carton';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Bill {
  id: string;
  invoiceNumber: string;
  customerName?: string;
  phoneNumber?: string;
  items: BillItem[];
  subtotal: number;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  discountAmount: number;
  totalAmount: number;
  paymentMode: PaymentMode;
  cashReceived?: number;
  changeGiven?: number;
  createdAt: string;
  status: 'paid' | 'pending' | 'cancelled';
}

// Settings types
export interface StoreSettings {
  shopName: string;
  ownerName: string;
  address?: string;
  phone?: string;
  taxRate: number;
  currency: string;
  lowStockDefaultThreshold: number;
}

// Dashboard types
export interface DailySales {
  date: string;
  totalSales: number;
  billCount: number;
}

export interface DashboardStats {
  todaySales: number;
  todayBills: number;
  totalProducts: number;
  lowStockAlerts: number;
  yesterdaySales?: number;
  yesterdayBills?: number;
}
