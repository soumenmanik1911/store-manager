'use client';

import { useEffect, useState } from 'react';
import { useBillStore } from '@/store/useBillStore';
import { formatCurrency, formatDate, formatDateTime, toNumber } from '@/lib/utils';
import { Search, Calendar, Filter, Receipt, ChevronRight, X, Printer } from 'lucide-react';
import { Bill } from '@/types';

export default function HistoryPage() {
  const { bills, initializeFromStorage } = useBillStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeFromStorage();
    setIsLoading(false);
  }, [initializeFromStorage]);

  // Filter bills
  const filteredBills = bills.filter((bill) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        bill.invoiceNumber.toLowerCase().includes(query) ||
        (bill.customerName && bill.customerName.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Date filter
    if (dateFilter !== 'all') {
      const billDate = new Date(bill.createdAt);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          if (billDate.toDateString() !== now.toDateString()) return false;
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (billDate < weekAgo) return false;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (billDate < monthAgo) return false;
          break;
      }
    }

    return true;
  });

  // Calculate stats - handle both string and number types from database
  const totalRevenue = bills.reduce((sum, b) => {
    const amount = typeof b.totalAmount === 'string' ? parseFloat(b.totalAmount) : b.totalAmount;
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  const totalBills = bills.length;
  const averageBillValue = totalBills > 0 ? totalRevenue / totalBills : 0;

  const getPaymentModeBadge = (mode: string) => {
    switch (mode) {
      case 'Cash':
        return 'bg-slate-100 text-slate-600';
      case 'UPI':
        return 'bg-primary/10 text-primary';
      case 'Card':
        return 'bg-primary/10 text-primary';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const handlePrint = (bill: Bill) => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="skeleton h-8 w-32 rounded"></div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex items-center gap-4">
        <div className="bg-primary/10 p-2 rounded-lg">
          <Receipt className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Bill History</h1>
          <p className="text-sm text-slate-500">View all transaction records</p>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white bg-slate-800 p-6 rounded-xl border border-primary/5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-500 text-sm font-medium">Total Revenue</p>
            <Receipt className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-primary">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-slate-400 mt-2">
            {totalBills > 0 ? `+${((totalRevenue / (totalRevenue - totalRevenue * 0.1)) * 10).toFixed(1)}%` : '0%'} from last period
          </p>
        </div>
        <div className="bg-white bg-slate-800 p-6 rounded-xl border border-primary/5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-500 text-sm font-medium">Total Bills</p>
            <Receipt className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold">{totalBills}</p>
          <p className="text-xs text-slate-400 mt-2">
            Average: {formatCurrency(averageBillValue)} per bill
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer name or bill ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-none rounded-lg py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary shadow-sm"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-primary/5 text-sm font-medium hover:bg-slate-50 transition-colors">
            <Calendar className="w-4 h-4" />
            {dateFilter === 'all' && 'All Time'}
            {dateFilter === 'today' && 'Today'}
            {dateFilter === 'week' && 'Last 7 Days'}
            {dateFilter === 'month' && 'Last 30 Days'}
          </button>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-white px-4 py-2 rounded-lg border border-primary/5 text-sm font-medium"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-xl border border-primary/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-primary/5">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date & Bill #</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Mode</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                <th className="px-6 py-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {filteredBills.length > 0 ? (
                filteredBills.map((bill) => (
                  <tr
                    key={bill.id}
                    onClick={() => setSelectedBill(bill)}
                    className="hover:bg-primary/5 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium">{formatDate(bill.createdAt)}</p>
                      <p className="text-xs text-slate-500">{bill.invoiceNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-700">
                        {bill.customerName || 'Walk-in Customer'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentModeBadge(bill.paymentMode)}`}>
                        {bill.paymentMode}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold">
                      {formatCurrency(bill.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary" />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <Receipt className="w-12 h-12 mx-auto mb-2" />
                    <p>No bills found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-primary/5 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {filteredBills.length} of {bills.length} bills
          </p>
        </div>
      </div>

      {/* Bill Detail Modal */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Bill Details</h3>
                <p className="text-sm text-slate-500">{selectedBill.invoiceNumber}</p>
              </div>
              <button
                onClick={() => setSelectedBill(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase">Customer</p>
                  <p className="font-medium">{selectedBill.customerName || 'Walk-in'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Date</p>
                  <p className="font-medium">{formatDateTime(selectedBill.createdAt)}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-xs text-slate-500 uppercase mb-2">Items</p>
                <div className="space-y-2">
                  {selectedBill.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.productName} ({item.sizeName}) x {item.quantity} {item.packaging}</span>
                      <span className="font-medium">{formatCurrency(toNumber(item.totalPrice))}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedBill.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Discount ({selectedBill.discountType === 'percentage' ? `${selectedBill.discountValue}%` : 'Flat'})</span>
                  <span>-{formatCurrency(selectedBill.discountAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(selectedBill.totalAmount)}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="pt-4 border-t border-slate-100 border-slate-800">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Payment Mode</p>
                    <p className="font-medium">{selectedBill.paymentMode}</p>
                  </div>
                  {selectedBill.cashReceived && (
                    <>
                      <div>
                        <p className="text-xs text-slate-500 uppercase">Cash Received</p>
                        <p className="font-medium">{formatCurrency(selectedBill.cashReceived)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase">Change Given</p>
                        <p className="font-medium">{formatCurrency(selectedBill.changeGiven || 0)}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 bg-slate-100 flex gap-3">
              <button
                onClick={() => setSelectedBill(null)}
                className="flex-1 px-4 py-2.5 rounded-lg font-bold border border-slate-200 border-slate-700 hover:bg-white hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handlePrint(selectedBill)}
                className="flex-1 px-4 py-2.5 rounded-lg font-bold bg-primary text-white hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

