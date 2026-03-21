import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bills, billItems, invoiceCounter, inventory, stockHistory, productSizes, products } from '@/lib/db/schema';
import { sql, eq } from 'drizzle-orm';

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
    console.log('📝 Bill items:', JSON.stringify(items, null, 2));
    
    // Ensure invoice counter exists
    const existingCounter = await db.select().from(invoiceCounter).where(eq(invoiceCounter.id, 1));
    if (existingCounter.length === 0) {
      await db.insert(invoiceCounter).values({ id: 1, lastNumber: 0 });
    }
    
    // Get current counter and increment atomically
    const [counter] = await db.update(invoiceCounter)
      .set({ lastNumber: sql`last_number + 1` })
      .where(eq(invoiceCounter.id, 1))
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
    
    // ========================================
    // STOCK DEDUCTION LOGIC
    // ========================================
    // Process each bill item and deduct inventory
    for (const item of items) {
      const sizeId = item.sizeId;
      
      if (!sizeId) {
        console.warn('⚠️ No sizeId for item, skipping stock deduction:', item.productName);
        continue;
      }
      
      // Find inventory by productSizeId
      const [invItem] = await db.select().from(inventory).where(
        // @ts-ignore
        eq(inventory.productSizeId, sizeId)
      );
      
      if (!invItem) {
        console.warn('⚠️ No inventory found for sizeId:', sizeId);
        continue;
      }
      
      // Get productSize to find bottlesPerCarton
      const [sizeInfo] = await db.select().from(productSizes).where(
        // @ts-ignore
        eq(productSizes.id, sizeId)
      );
      
      if (!sizeInfo) {
        console.warn('⚠️ No size info found for sizeId:', sizeId);
        continue;
      }
      
      // Calculate bottles to deduct
      // If packaging is carton, multiply quantity by bottlesPerCarton
      const isCarton = item.packaging?.toLowerCase() === 'carton';
      const bottlesPerCarton = sizeInfo.bottlesPerCarton || 12;
      const bottlesToDeduct = isCarton ? item.quantity * bottlesPerCarton : item.quantity;
      
      const previousStock = invItem.currentStock;
      const newStock = previousStock - bottlesToDeduct;
      
      // Check if sufficient stock
      if (newStock < 0) {
        // Rollback: Delete the bill and bill items
        await db.delete(billItems).where(eq(billItems.billId, newBill.id));
        await db.delete(bills).where(eq(bills.id, newBill.id));
        
        console.error('❌ Insufficient stock for:', item.productName, item.sizeName);
        return NextResponse.json(
          { error: `Insufficient stock for ${item.productName} (${item.sizeName}). Available: ${previousStock}, Requested: ${bottlesToDeduct}` },
          { status: 400 }
        );
      }
      
      // Determine new status
      let newStatus: 'Healthy' | 'Low Stock' | 'Out of Stock' = 'Healthy';
      if (newStock <= 0) {
        newStatus = 'Out of Stock';
      } else if (newStock <= (invItem.lowStockThreshold || 50)) {
        newStatus = 'Low Stock';
      }
      
      // Update inventory stock and status
      await db.update(inventory)
        .set({
          currentStock: newStock,
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(
          // @ts-ignore
          eq(inventory.id, invItem.id)
        );
      
      console.log('✅ Stock deducted:', item.productName, item.sizeName, '-', bottlesToDeduct, 'bottles. Stock:', previousStock, '->', newStock);
      
      // Insert stock history entry
      await db.insert(stockHistory).values({
        inventoryId: invItem.id,
        productId: sizeInfo.productId,
        type: 'sale',
        quantity: bottlesToDeduct,
        previousStock,
        newStock,
        billId: newBill.id,
        note: `Sale: ${item.quantity} ${item.packaging}(s) of ${item.productName} ${item.sizeName}`,
      });
      
      console.log('✅ Stock history added for sale');
    }
    
    // ========================================
    // CACHE INVALIDATION
    // ========================================
    // Import and call cache invalidation
    // Note: In a real implementation, you'd call a cache invalidation function
    // For now, the Next.js API route cache will be invalidated on next fetch
    console.log('✅ Stock deduction completed for all items');
    
    return NextResponse.json({
      ...newBill,
      items: newItems,
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Bill creation error:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('❌ Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
