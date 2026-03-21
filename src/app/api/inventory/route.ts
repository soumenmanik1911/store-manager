import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { inventory, products, productSizes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('🔄 Fetching inventory with JOIN...');
    
    // Proper JOIN query using Drizzle ORM
    const inventoryWithDetails = await db
      .select({
        // Inventory fields
        id: inventory.id,
        skuCode: inventory.skuCode,
        currentStock: inventory.currentStock,
        lowStockThreshold: inventory.lowStockThreshold,
        status: inventory.status,
        isPinned: inventory.isPinned,
        lastRestocked: inventory.lastRestocked,
        productSizeId: inventory.productSizeId,
        // Aliases for backward compatibility
        sizeId: inventory.productSizeId,
        productId: productSizes.productId,
        // ProductSize fields
        sizeName: productSizes.sizeName,
        pricePerBottle: productSizes.pricePerBottle,
        pricePerCarton: productSizes.pricePerCarton,
        bottlesPerCarton: productSizes.bottlesPerCarton,
        // Product fields (mapped to flat fields)
        productName: products.name,
        brand: products.brand,
        category: products.category,
        imageUrl: products.imageUrl,
      })
      .from(inventory)
      .leftJoin(productSizes, eq(inventory.productSizeId, productSizes.id))
      .leftJoin(products, eq(productSizes.productId, products.id));
    
    console.log('📦 Inventory count:', inventoryWithDetails.length);
    console.log('✅ Inventory fetched successfully with JOIN');
    return NextResponse.json(inventoryWithDetails);
  } catch (error) {
    console.error('❌ Inventory API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, productId, sizeId, skuCode, currentStock, lowStockThreshold } = body;
    
    if (!id || !productId || !sizeId || !skuCode) {
      return NextResponse.json(
        { error: 'Missing required fields: id, productId, sizeId, skuCode' },
        { status: 400 }
      );
    }
    
    // Check if inventory item already exists
    const [existing] = await db.select().from(inventory).where(
      // @ts-ignore
      inventory.id.eq(id)
    );
    
    if (existing) {
      return NextResponse.json({ error: 'Inventory item already exists' }, { status: 409 });
    }
    
    // Create new inventory item
    const [newInventory] = await db.insert(inventory).values({
      id,
      productSizeId: sizeId, // Map from frontend's sizeId to database's productSizeId
      skuCode,
      currentStock: currentStock || 0,
      lowStockThreshold: lowStockThreshold || 50,
      status: (currentStock || 0) > (lowStockThreshold || 50) ? 'Healthy' : 'Low Stock',
    }).returning();
    
    return NextResponse.json(newInventory, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating inventory:', error);
    return NextResponse.json(
      { error: 'Failed to create inventory item', details: String(error) },
      { status: 500 }
    );
  }
}
