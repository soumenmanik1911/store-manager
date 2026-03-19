'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useProductStore } from '@/store/useProductStore';
import { useBillStore } from '@/store/useBillStore';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useToast } from '@/components/Toast';
import { formatCurrency } from '@/lib/utils';
import { Search, Plus, Minus, X, Printer, Receipt, CreditCard, Smartphone } from 'lucide-react';
import { Product, ProductSize, BillItem } from '@/types';

export default function BillingPage() {
  const router = useRouter();
  const { products, initializeFromStorage: initProducts } = useProductStore();
  const { 
    currentBill, 
    addItem, 
    removeItem, 
    updateItemQuantity,
    setCustomerInfo,
    setDiscount,
    setPaymentMode,
    setCashReceived,
    submitBill,
    getSubtotal,
    getDiscountAmount,
    getTotal,
    clearCurrentBill,
    initializeFromStorage: initBills
  } = useBillStore();
  const { inventory, initializeFromStorage: initInventory } = useInventoryStore();
  const { addToast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [packaging, setPackaging] = useState<'bottle' | 'carton'>('bottle');
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'flat'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMode, setPaymentModeLocal] = useState<'Cash' | 'UPI' | 'Card'>('Cash');
  const [cashReceived, setCashReceivedLocal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await Promise.all([initProducts(), initBills(), initInventory()]);
    };
    initialize();
  }, [initProducts, initBills, initInventory]);

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products.slice(0, 10);
    const query = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.brand.toLowerCase().includes(query)
    ).slice(0, 10);
  }, [products, searchQuery]);

  // Get stock for selected size
  const getStockForSize = (productId: string, sizeId: string) => {
    const sku = inventory.find(s => s.productId === productId && s.sizeId === sizeId);
    return sku?.currentStock || 0;
  };

  // Calculate price based on packaging
  const calculatePrice = () => {
    if (!selectedSize) return 0;
    if (packaging === 'bottle') {
      return selectedSize.pricePerBottle;
    }
    return selectedSize.pricePerCarton;
  };

  // Add item to bill
  const handleAddItem = () => {
    if (!selectedProduct || !selectedSize) return;

    const unitPrice = calculatePrice();
    const item: BillItem = {
      id: crypto.randomUUID(),
      productId: selectedProduct.id,
      sizeId: selectedSize.id,
      productName: selectedProduct.name,
      sizeName: selectedSize.name,
      packaging,
      quantity,
      unitPrice,
      totalPrice: unitPrice * quantity,
    };

    addItem(item);
    addToast('success', 'Item added to bill');
    
    // Reset selection
    setSelectedProduct(null);
    setSelectedSize(null);
    setQuantity(1);
    setPackaging('bottle');
  };

  // Handle bill submission
  const handleSubmitBill = async () => {
    if (currentBill.items.length === 0) {
      addToast('error', 'No items in bill');
      return;
    }

    setIsSubmitting(true);
    
    // Update store
    setCustomerInfo(customerName, phoneNumber);
    setDiscount(discountType, discountValue);
    setPaymentMode(paymentMode);
    setCashReceived(cashReceived);

    const result = submitBill();

    if (result.success) {
      addToast('success', `Bill ${result.invoiceNumber} generated successfully`);
      
      // Print receipt
      window.print();
      
      // Reset form
      setCustomerName('');
      setPhoneNumber('');
      setDiscountValue(0);
      setCashReceived(0);
      setSelectedProduct(null);
      setSelectedSize(null);
      setQuantity(1);
    } else {
      addToast('error', result.error || 'Failed to generate bill');
    }
    
    setIsSubmitting(false);
  };

  const subtotal = getSubtotal();
  const discountAmount = getDiscountAmount();
  const total = getTotal();
  const change = paymentMode === 'Cash' ? cashReceived - total : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 no-print">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">New Billing</h1>
          <p className="text-slate-500 text-sm">Create a new bill</p>
        </div>
        <button
          onClick={() => router.push('/history')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50"
        >
          <Receipt className="w-4 h-4" />
          History
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Product Selection */}
        <div className="space-y-4">
          {/* Customer Details */}
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3">Customer Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm"
              />
            </div>
          </div>

          {/* Product Search */}
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3">Add Items</h3>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search drinks, juices, soda..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            {/* Search Results */}
            {searchQuery && filteredProducts.length > 0 && !selectedProduct && (
              <div className="space-y-2 mb-4">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => {
                      setSelectedProduct(product);
                      setSelectedSize(product.sizes[0] || null);
                    }}
                    className="w-full p-3 text-left bg-slate-50 rounded-lg hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-sm">{product.name}</h4>
                        <p className="text-xs text-slate-500">{product.brand}</p>
                      </div>
                      <span className="text-primary font-bold text-sm">
                        ₹{product.sizes[0]?.pricePerBottle}/unit
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Item Configurator */}
            {selectedProduct && selectedSize && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold">{selectedProduct.name}</h4>
                    <p className="text-xs text-slate-500">
                      Stock: {getStockForSize(selectedProduct.id, selectedSize.id)} units
                    </p>
                  </div>
                  <span className="text-primary font-bold">
                    ₹{calculatePrice()}/{packaging === 'bottle' ? 'unit' : 'carton'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Size</p>
                    <select
                      value={selectedSize.id}
                      onChange={(e) => {
                        const size = selectedProduct.sizes.find(s => s.id === e.target.value);
                        setSelectedSize(size || null);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg text-sm p-2"
                    >
                      {selectedProduct.sizes.map(size => (
                        <option key={size.id} value={size.id}>{size.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Packaging</p>
                    <select
                      value={packaging}
                      onChange={(e) => setPackaging(e.target.value as 'bottle' | 'carton')}
                      className="w-full bg-white border border-slate-200 rounded-lg text-sm p-2"
                    >
                      <option value="bottle">Bottle</option>
                      <option value="carton">Carton ({selectedSize.bottlesPerCarton} pcs)</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 hover:bg-slate-100"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 font-bold text-sm">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-2 hover:bg-slate-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={handleAddItem}
                    className="bg-primary text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add to Bill
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Bill Preview */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex-1">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3">Bill Preview</h3>
            
            {/* Items */}
            <div className="space-y-4 mb-4 max-h-64 overflow-auto">
              {currentBill.items.length > 0 ? (
                currentBill.items.map(item => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">{item.productName} ({item.sizeName})</h5>
                      <p className="text-xs text-slate-500 italic">
                        {item.quantity} x {item.packaging}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <p className="font-bold text-sm">{formatCurrency(item.totalPrice)}</p>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No items added</p>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="pt-4 border-t border-dashed border-slate-200 space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-sm">Discount</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-16 h-8 text-xs rounded border border-slate-200 bg-slate-50 text-right px-2"
                    placeholder="0"
                  />
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'flat')}
                    className="h-8 text-[10px] rounded border border-slate-200 bg-slate-50 px-2"
                  >
                    <option value="percentage">%</option>
                    <option value="flat">₹</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2">
                <span>Total Amount</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Payment Options */}
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3">Payment Method</h3>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setPaymentModeLocal('Cash')}
                className={`flex-1 py-3 border-2 rounded-xl flex flex-col items-center gap-1 transition-colors ${
                  paymentMode === 'Cash'
                    ? 'border-primary bg-primary/10'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <Receipt className={`w-5 h-5 ${paymentMode === 'Cash' ? 'text-primary' : 'text-slate-400'}`} />
                <span className={`text-[10px] font-bold uppercase ${paymentMode === 'Cash' ? 'text-primary' : 'text-slate-400'}`}>
                  Cash
                </span>
              </button>
              <button
                onClick={() => setPaymentModeLocal('UPI')}
                className={`flex-1 py-3 border-2 rounded-xl flex flex-col items-center gap-1 transition-colors ${
                  paymentMode === 'UPI'
                    ? 'border-primary bg-primary/10'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <Smartphone className={`w-5 h-5 ${paymentMode === 'UPI' ? 'text-primary' : 'text-slate-400'}`} />
                <span className={`text-[10px] font-bold uppercase ${paymentMode === 'UPI' ? 'text-primary' : 'text-slate-400'}`}>
                  UPI
                </span>
              </button>
              <button
                onClick={() => setPaymentModeLocal('Card')}
                className={`flex-1 py-3 border-2 rounded-xl flex flex-col items-center gap-1 transition-colors ${
                  paymentMode === 'Card'
                    ? 'border-primary bg-primary/10'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <CreditCard className={`w-5 h-5 ${paymentMode === 'Card' ? 'text-primary' : 'text-slate-400'}`} />
                <span className={`text-[10px] font-bold uppercase ${paymentMode === 'Card' ? 'text-primary' : 'text-slate-400'}`}>
                  Card
                </span>
              </button>
            </div>

            {/* Cash Received (only for Cash mode) */}
            {paymentMode === 'Cash' && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Cash Received</label>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceivedLocal(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm"
                  placeholder="Enter amount"
                />
                {cashReceived > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    Change: {formatCurrency(change)}
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmitBill}
              disabled={isSubmitting || currentBill.items.length === 0}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all"
            >
              <Printer className="w-5 h-5" />
              {isSubmitting ? 'Processing...' : 'Generate Bill & Print'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

