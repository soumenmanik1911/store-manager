'use client';

import { Bill, StoreSettings } from '@/types';
import { CUSTOMER_TYPES } from '@/lib/constants/customerConstants';
import { numberToWords } from '@/lib/numberToWords';

interface BillReceiptProps {
  bill: Bill;
  settings: StoreSettings;
}

export function BillReceipt({ bill, settings }: BillReceiptProps) {
  const shopName = settings.shopName || 'My Store';
  const shopPhone = settings.shopPhone || '';
  const shopAddress = settings.shopAddress || '';
  const shopGstin = settings.shopGstin || '';
  const shopEmail = settings.shopEmail || '';
  const taxRate = settings.taxRate || 0;

  // Get shop initials for avatar (first 2 letters)
  const shopInitials = shopName.substring(0, 2).toUpperCase();

  // Calculate values
  const subtotal = Number(bill.subtotal);
  const discountAmount = Number(bill.discountAmount);
  const taxAmount = taxRate > 0 ? subtotal * (taxRate / 100) : 0;
  const grandTotal = subtotal - discountAmount + taxAmount;
  
  // Calculate paid amount and balance due
  const paidAmount = bill.paidAmount || (bill.paymentMode === 'Cash' && bill.cashReceived ? bill.cashReceived : 0);
  const balanceDue = bill.balanceDue ?? (grandTotal - paidAmount);

  // Determine stamp type based on payment status
  const getStampInfo = (): { text: string; color: string } | null => {
    // Fully paid
    if (balanceDue === 0 && paidAmount > 0) {
      return { text: 'PAID', color: '#16a34a' }; // green
    }
    // Partially paid
    if (balanceDue > 0 && paidAmount > 0) {
      return { text: 'PARTIAL', color: '#d97706' }; // amber
    }
    // Credit or unpaid
    if (paidAmount === 0 || bill.paymentMode === 'Credit') {
      return { text: 'UNPAID', color: '#dc2626' }; // red
    }
    return null;
  };
  
  const stampInfo = getStampInfo();

  // Format date as DD/MM/YYYY
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Format time as HH:MM AM/PM
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  // Format phone number as "Ph: +91 XXXXXXXXXX"
  const formatPhone = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `Ph: +91 ${cleaned}`;
    }
    return `Ph: ${phone}`;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  // Thermal printer width (80mm ≈ 384px)
  const RECEIPT_WIDTH = 384;

  return (
    <div
      id="print-receipt"
      className="thermal-receipt"
      style={{
        width: `${RECEIPT_WIDTH}px`,
        padding: '16px',
        fontFamily: '"Courier New", Courier, monospace',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontSize: '12px',
        lineHeight: '1.4',
        boxSizing: 'border-box',
      }}
    >
      {/* ========== HEADER SECTION ========== */}
      
      {/* Shop Name Avatar Circle */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#000000',
            color: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 'bold',
          }}
        >
          {shopInitials}
        </div>
      </div>

      {/* Shop Name - ALL CAPS */}
      <h1
        style={{
          fontSize: '18px',
          fontWeight: 700,
          textAlign: 'center',
          marginBottom: '4px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          margin: 0,
        }}
      >
        {shopName}
      </h1>

      {/* Shop Address */}
      {shopAddress && (
        <p
          style={{
            fontSize: '11px',
            textAlign: 'center',
            marginBottom: '2px',
            margin: 0,
          }}
        >
          {shopAddress}
        </p>
      )}

      {/* Shop Phone */}
      {shopPhone && (
        <p
          style={{
            fontSize: '11px',
            textAlign: 'center',
            marginBottom: '2px',
            margin: 0,
          }}
        >
          {formatPhone(shopPhone)}
        </p>
      )}

      {/* Shop Email */}
      {shopEmail && (
        <p
          style={{
            fontSize: '11px',
            textAlign: 'center',
            marginBottom: '2px',
            margin: 0,
          }}
        >
          {shopEmail}
        </p>
      )}

      {/* GSTIN */}
      {shopGstin && (
        <p
          style={{
            fontSize: '11px',
            textAlign: 'center',
            marginBottom: '8px',
            margin: 0,
          }}
        >
          GSTIN: {shopGstin}
        </p>
      )}

      {/* Dashed Separator */}
      <div style={{ borderTop: '1px dashed #000000', margin: '8px 0' }} />

      {/* ========== BILL INFO SECTION ========== */}
      
      {/* Invoice and Date/Time - Two Column Layout */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
        <tbody>
          <tr>
            <td style={{ textAlign: 'left', padding: '1px 0', fontSize: '11px' }}>Invoice No.:</td>
            <td style={{ textAlign: 'right', padding: '1px 0', fontSize: '11px', fontWeight: 'bold' }}>{bill.invoiceNumber}</td>
          </tr>
          <tr>
            <td style={{ textAlign: 'left', padding: '1px 0', fontSize: '11px' }}>Date:</td>
            <td style={{ textAlign: 'right', padding: '1px 0', fontSize: '11px' }}>{formatDate(bill.createdAt)}</td>
          </tr>
          <tr>
            <td style={{ textAlign: 'left', padding: '1px 0', fontSize: '11px' }}>Time:</td>
            <td style={{ textAlign: 'right', padding: '1px 0', fontSize: '11px' }}>{formatTime(bill.createdAt)}</td>
          </tr>
        </tbody>
      </table>

      {/* Dashed Separator */}
      <div style={{ borderTop: '1px dashed #000000', margin: '8px 0' }} />

      {/* ========== CUSTOMER SECTION ========== */}
      {(bill.customerName || bill.phoneNumber) && (
        <>
          <div style={{ marginBottom: '4px' }}>
            {bill.customerName && (
              <p style={{ fontWeight: 600, fontSize: '12px', margin: '0 0 2px 0' }}>
                Customer Name: {bill.customerName}
              </p>
            )}
            {bill.phoneNumber && (
              <p style={{ fontSize: '11px', margin: '0 0 2px 0' }}>
                Ph: {bill.phoneNumber}
              </p>
            )}
            {bill.customerType && (
              <span
                style={{
                  fontSize: '10px',
                  padding: '1px 6px',
                  border: '1px solid #000000',
                  fontWeight: 600,
                }}
              >
                {CUSTOMER_TYPES[bill.customerType]?.label || bill.customerType.toUpperCase()}
              </span>
            )}
          </div>
          <div style={{ borderTop: '1px dashed #000000', margin: '8px 0' }} />
        </>
      )}

      {/* ========== ITEMS TABLE SECTION ========== */}
      
      {/* Header Row */}
      <div style={{ display: 'flex', borderBottom: '1px solid #000000', paddingBottom: '4px', marginBottom: '4px' }}>
        <span style={{ flex: 2, fontSize: '10px', fontWeight: 700 }}>Item Name</span>
        <span style={{ flex: 1, textAlign: 'center', fontSize: '10px', fontWeight: 700 }}>Qty</span>
        <span style={{ flex: 1, textAlign: 'right', fontSize: '10px', fontWeight: 700 }}>Rate</span>
        <span style={{ flex: 1, textAlign: 'right', fontSize: '10px', fontWeight: 700 }}>Amt</span>
      </div>

      {/* Thin separator line */}
      <div style={{ borderTop: '1px solid #cccccc', marginBottom: '4px' }} />

      {/* Line Items */}
      {bill.items.map((item) => (
        <div key={item.id} style={{ marginBottom: '6px' }}>
          <div style={{ display: 'flex' }}>
            <span style={{ flex: 2, fontSize: '11px' }}>
              {item.productName} {item.sizeName && <span style={{ fontSize: '10px' }}>{item.sizeName}</span>}
            </span>
            <span style={{ flex: 1, textAlign: 'center', fontSize: '11px' }}>{item.quantity}</span>
            <span style={{ flex: 1, textAlign: 'right', fontSize: '11px' }}>{item.unitPrice.toFixed(2)}</span>
            <span style={{ flex: 1, textAlign: 'right', fontSize: '11px' }}>{item.totalPrice.toFixed(2)}</span>
          </div>
          {/* Packaging type below item name */}
          {item.packaging && (
            <div style={{ fontSize: '9px', color: '#666666', paddingLeft: '2px' }}>
              {item.packaging === 'carton' ? `Carton x${item.quantity}` : 'Bottle'}
            </div>
          )}
        </div>
      ))}

      {/* Thin separator after all items */}
      <div style={{ borderTop: '1px solid #cccccc', margin: '8px 0' }} />

      {/* ========== TOTALS SECTION ========== */}
      
      {/* Item Total */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px' }}>Item Total:</span>
        <span style={{ fontSize: '11px' }}>{formatCurrency(subtotal)}</span>
      </div>

      {/* Subtotal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px' }}>Subtotal:</span>
        <span style={{ fontSize: '11px' }}>{formatCurrency(subtotal)}</span>
      </div>

      {/* Discount */}
      {discountAmount > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px' }}>
            Discount {bill.discountType === 'percentage' ? `(${bill.discountValue}%)` : ''}:
          </span>
          <span style={{ fontSize: '11px' }}>-{formatCurrency(discountAmount)}</span>
        </div>
      )}

      {/* GST */}
      {taxRate > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px' }}>GST ({taxRate}%):</span>
          <span style={{ fontSize: '11px' }}>{formatCurrency(taxAmount)}</span>
        </div>
      )}

      {/* Double Dashed Separator */}
      <div style={{ borderTop: '2px dashed #000000', margin: '8px 0' }} />

      {/* Grand Total - Most Prominent */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '16px', fontWeight: 700 }}>GRAND TOTAL:</span>
        <span style={{ fontSize: '16px', fontWeight: 700 }}>{formatCurrency(grandTotal)}</span>
      </div>

      {/* Paid Amount */}
      {paidAmount > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px' }}>Paid Amount:</span>
          <span style={{ fontSize: '11px' }}>{formatCurrency(paidAmount)}</span>
        </div>
      )}

      {/* Balance Due */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: 700 }}>Balance Due:</span>
        <span style={{ fontSize: '12px', fontWeight: 700 }}>{formatCurrency(balanceDue)}</span>
      </div>

      {/* Single Dashed Separator */}
      <div style={{ borderTop: '1px dashed #000000', margin: '8px 0' }} />

      {/* ========== AMOUNT IN WORDS SECTION ========== */}
      
      <div style={{ marginBottom: '8px' }}>
        <span style={{ fontSize: '10px', fontWeight: 600 }}>Amount in Words:</span>
        <div style={{ fontSize: '11px', fontStyle: 'italic' }}>
          {numberToWords(grandTotal)}
        </div>
      </div>

      {/* ========== PAYMENT SECTION ========== */}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px' }}>Payment Method:</span>
        <span style={{ fontSize: '11px', fontWeight: 600 }}>{bill.paymentMode}</span>
      </div>

      {/* Cash specific details */}
      {bill.paymentMode === 'Cash' && (
        <>
          {bill.cashReceived !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px' }}>Cash Received:</span>
              <span style={{ fontSize: '11px' }}>{formatCurrency(bill.cashReceived)}</span>
            </div>
          )}
          {bill.changeGiven !== undefined && bill.changeGiven > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px' }}>Change Given:</span>
              <span style={{ fontSize: '11px' }}>{formatCurrency(bill.changeGiven)}</span>
            </div>
          )}
        </>
      )}

      {/* Dashed Separator */}
      <div style={{ borderTop: '1px dashed #000000', margin: '8px 0' }} />

      {/* ========== PAYMENT STAMP SECTION ========== */}
      
      {stampInfo && (
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div
            style={{
              display: 'inline-block',
              border: `2px solid ${stampInfo.color}`,
              padding: '4px 20px',
              fontSize: '20px',
              fontWeight: 'bold',
              letterSpacing: '4px',
              color: stampInfo.color,
              transform: 'rotate(-15deg)',
            }}
          >
            {stampInfo.text}
          </div>
        </div>
      )}

      {/* ========== FOOTER SECTION ========== */}
      
      {/* Dashed Separator */}
      <div style={{ borderTop: '1px dashed #000000', margin: '8px 0' }} />

      {/* Thank You Message */}
      <p
        style={{
          fontSize: '12px',
          fontStyle: 'italic',
          textAlign: 'center',
          marginBottom: '4px',
          fontWeight: 600,
        }}
      >
        Thank you! Visit Again!
      </p>
    </div>
  );
}
