import { CustomerType, CustomerPaymentType, CustomerReport } from '@/types';

// ============================================================================
// CUSTOMER TYPES
// ============================================================================
export const CUSTOMER_TYPES: Record<CustomerType, { label: string; badgeColor: string }> = {
  regular: {
    label: 'Regular',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  wholesale: {
    label: 'Wholesale',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  vip: {
    label: 'VIP',
    badgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
  },
};

// ============================================================================
// PAYMENT TYPES
// ============================================================================
export const PAYMENT_TYPES: Record<CustomerPaymentType, { label: string; color: string }> = {
  payment: {
    label: 'Payment',
    color: 'text-green-600',
  },
  refund: {
    label: 'Refund',
    color: 'text-orange-600',
  },
  credit: {
    label: 'Credit',
    color: 'text-red-600',
  },
};

// ============================================================================
// DEFAULT CREDIT LIMITS
// ============================================================================
export const DEFAULT_CREDIT_LIMITS: Record<CustomerType, number> = {
  regular: 0,
  wholesale: 10000,
  vip: 25000,
};

// ============================================================================
// EXPORT COLUMN DEFINITIONS
// ============================================================================
export const CUSTOMER_EXPORT_COLUMNS: { key: keyof CustomerReport; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'address', label: 'Address' },
  { key: 'customerType', label: 'Customer Type' },
  { key: 'totalPurchases', label: 'Total Purchases' },
  { key: 'totalPaid', label: 'Total Paid' },
  { key: 'outstandingBalance', label: 'Outstanding Balance' },
  { key: 'creditLimit', label: 'Credit Limit' },
  { key: 'totalBills', label: 'Total Bills' },
  { key: 'lastPurchaseDate', label: 'Last Purchase Date' },
  { key: 'memberSince', label: 'Member Since' },
];

// ============================================================================
// CUSTOMER SALES REPORT COLUMNS
// ============================================================================
export const CUSTOMER_SALES_REPORT_COLUMNS = [
  'Customer Name',
  'Total Bills',
  'Total Amount',
  'Average Bill',
  'Last Purchase',
];

// ============================================================================
// BALANCE STATUS
// ============================================================================
export type BalanceStatus = 'clear' | 'has_balance' | 'over_limit';

export const getBalanceStatus = (
  outstandingBalance: number,
  creditLimit: number
): BalanceStatus => {
  if (outstandingBalance <= 0) return 'clear';
  if (creditLimit > 0 && outstandingBalance > creditLimit) return 'over_limit';
  return 'has_balance';
};

export const getBalanceStatusLabel = (status: BalanceStatus): string => {
  switch (status) {
    case 'clear':
      return 'Clear';
    case 'has_balance':
      return 'Has Balance';
    case 'over_limit':
      return 'Over Limit';
  }
};
