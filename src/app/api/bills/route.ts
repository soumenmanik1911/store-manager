import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bills, billItems, invoiceCounter } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

// Helper to parse PostgreSQL decimal strings to numbers
function parseBill(bill: any) {
  return {
    ...bill,
    subtotal: parseFloat(bill.subtotal) || 0,
    discountValue: parseFloat(bill.discountValue) || 0,
    discountAmount: parseFloat(bill.discountAmount) || 0,
    totalAmount: parseFloat(bill.totalAmount) || 0,
    cashReceived: bill.cashReceived ? parseFloat(bill.cashReceived) : null,
    changeGiven: bill.changeGiven ? parseFloat(bill.changeGiven) : null,
  };
}

function parseBillItem(item: any) {
  return {
    ...item,
    unitPrice: parseFloat(item.unitPrice) || 0,
    totalPrice: parseFloat(item.totalPrice) || 0,
  };
}

export async function GET() {
  try {
    console.log('🔄 Fetching bills...');
    
    // Get all bills ordered by date
    const allBills = await db.select().from(bills);
    console.log('📄 Bills count:', allBills.length);
    
    // Get all bill items in one query
    const allItems = await db.select().from(billItems);
    console.log('📋 Bill items count:', allItems.length);
    
    // Map items to bills in memory, parsing numeric fields
    const billsWithItems = allBills
      .map(bill => {
        const items = allItems
          .filter(item => item.billId === bill.id)
          .map(parseBillItem);
        return { ...parseBill(bill), items };
      })
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    
    console.log('✅ Bills fetched successfully');
    return NextResponse.json(billsWithItems);
  } catch (error) {
    console.error('❌ Bills API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerPhone,
      items,
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      totalAmount,
      paymentMode,
      cashReceived,
      changeGiven,
    } = body;
    
    console.log('🔄 Creating bill...');
    
    // Get current counter and increment atomically
    const [counter] = await db.update(invoiceCounter)
      .set({ lastNumber: sql`last_number + 1` })
      .where(sql`id = 1`)
      .returning({ lastNumber: invoiceCounter.lastNumber });
    
    const currentCount = counter?.lastNumber || 1;
    const invoiceNumber = `INV-${String(currentCount).padStart(4, '0')}`;
    
    // Create bill
    const [newBill] = await db.insert(bills).values({
      invoiceNumber,
      customerName: customerName || null,
      customerPhone: customerPhone || null,
      subtotal: subtotal.toString(),
      discountType: discountType || 'percentage',
      discountValue: discountValue?.toString() || '0',
      discountAmount: discountAmount?.toString() || '0',
      totalAmount: totalAmount.toString(),
      paymentMode: paymentMode || 'Cash',
      cashReceived: cashReceived?.toString() || null,
      changeGiven: changeGiven?.toString() || null,
      status: 'paid',
    }).returning();
    
    // Create bill items
    const newItems = await db.insert(billItems).values(
      items.map((item: { productId: string; sizeId: string; productName: string; sizeName: string; packaging: string; quantity: number; unitPrice: number; totalPrice: number }) => ({
        billId: newBill.id,
        productSizeId: item.sizeId || null,
        productName: item.productName,
        sizeName: item.sizeName,
        packaging: item.packaging,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        totalPrice: item.totalPrice.toString(),
      }))
    ).returning();
    
    console.log('✅ Bill created:', invoiceNumber);
    return NextResponse.json({
      ...newBill,
      items: newItems,
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Bill creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
