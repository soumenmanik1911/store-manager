import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { inventory, products, productSizes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('🔄 Fetching inventory...');
    
    // Simple query - get all inventory first
    const allInventory = await db.select().from(inventory);
    console.log('📦 Inventory count:', allInventory.length);
    
    // Get all product sizes in one query
    const allSizes = await db.select().from(productSizes);
    console.log('📏 Product sizes count:', allSizes.length);
    
    // Get all products in one query  
    const allProducts = await db.select().from(products);
    console.log('🏷️ Products count:', allProducts.length);
    
    // Build the response with joins in memory
    const inventoryWithDetails = allInventory.map(item => {
      // Find the size
      const size = allSizes.find(s => s.id === item.productSizeId);
      
      if (!size) {
        return { 
          ...item, 
          sizeId: item.productSizeId, // Map to frontend field name
          productName: null, 
          brand: null, 
          sizeName: null 
        };
      }
      
      // Find the product
      const product = allProducts.find(p => p.id === size.productId);
      
      return {
        ...item,
        sizeId: item.productSizeId, // Map to frontend field name
        productName: product?.name || null,
        brand: product?.brand || null,
        sizeName: size.sizeName,
      };
    });
    
    console.log('✅ Inventory fetched successfully');
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
