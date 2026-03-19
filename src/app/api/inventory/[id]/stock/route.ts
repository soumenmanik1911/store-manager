import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { inventory, stockHistory, products, productSizes } from '@/lib/db/schema';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { stock } = body;
    
    // Get current inventory item
    const [item] = await db.select().from(inventory).where(
      // @ts-ignore
      inventory.id.eq(id)
    );
    
    if (!item) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }
    
    const previousStock = item.currentStock;
    const newStock = typeof stock === 'number' ? stock : parseFloat(stock);
    
    if (isNaN(newStock) || newStock < 0) {
      return NextResponse.json({ error: 'Invalid stock value' }, { status: 400 });
    }
    
    // Determine new status
    let status: string;
    if (newStock <= 0) {
      status = 'Out of Stock';
    } else if (newStock <= (item.lowStockThreshold ?? 0)) {
      status = 'Low Stock';
    } else {
      status = 'Healthy';
    }
    
    // Update inventory
    await db.update(inventory).set({
      currentStock: newStock,
      status,
      lastRestocked: newStock > previousStock ? new Date() : item.lastRestocked,
      updatedAt: new Date(),
    }).where(
      // @ts-ignore
      inventory.id.eq(id)
    );
    
    return NextResponse.json({ 
      success: true, 
      previousStock, 
      newStock,
      status 
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    return NextResponse.json({ error: 'Failed to update stock' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { quantity, type, note } = body;
    
    // Get current inventory item
    const [item] = await db.select().from(inventory).where(
      // @ts-ignore
      inventory.id.eq(id)
    );
    
    if (!item) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }

    const previousStock = item.currentStock;
    let newStock: number;
    let quantityInBottles = quantity;
    
    // Get size info to convert cartons to bottles if needed
    const [size] = await db.select().from(productSizes).where(
      // @ts-ignore
      productSizes.id.eq(item.productSizeId)
    );
    
    if (type === 'cartons' && size) {
      quantityInBottles = quantity * size.bottlesPerCarton;
    }
    
    if (type === 'addition') {
      newStock = previousStock + quantityInBottles;
    } else if (type === 'deduction') {
      newStock = previousStock - quantityInBottles;
      if (newStock < 0) {
        return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
    
    // Determine new status
    let status = item.status;
    if (newStock <= 0) {
      status = 'Out of Stock';
    } else if (newStock <= (item.lowStockThreshold ?? 0)) {
      status = 'Low Stock';
    } else {
      status = 'Healthy';
    }
    
    // Update inventory
    await db.update(inventory).set({
      currentStock: newStock,
      status,
      lastRestocked: type === 'addition' ? new Date() : item.lastRestocked,
      updatedAt: new Date(),
    }).where(
      // @ts-ignore
      inventory.id.eq(id)
    );
    
    // Add stock history entry
    await db.insert(stockHistory).values({
      inventoryId: id,
      productId: size?.productId || '',
      type,
      quantity: quantityInBottles,
      previousStock,
      newStock,
      note: note || `${type === 'addition' ? 'Added' : 'Removed'} ${quantity} ${type}`,
    });
    
    return NextResponse.json({ 
      success: true, 
      previousStock, 
      newStock,
      status 
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    return NextResponse.json({ error: 'Failed to update stock' }, { status: 500 });
  }
}
