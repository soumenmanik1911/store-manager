import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productSizes, inventory } from '@/lib/db/schema';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [product] = await db.select().from(products).where(
      // @ts-ignore
      products.id.eq(id)
    );
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    const sizes = await db.select().from(productSizes).where(
      // @ts-ignore
      productSizes.productId.eq(id)
    );
    
    return NextResponse.json({ ...product, sizes });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, brand, category, imageUrl, sizes } = body;
    
    // Update product
    await db.update(products).set({
      name,
      brand,
      category,
      imageUrl: imageUrl || null,
      updatedAt: new Date(),
    }).where(
      // @ts-ignore
      products.id.eq(id)
    );
    
    // If sizes provided, update them
    if (sizes && Array.isArray(sizes)) {
      // Delete existing sizes
      await db.delete(productSizes).where(
        // @ts-ignore
        productSizes.productId.eq(id)
      );
      
      // Insert new sizes
      await db.insert(productSizes).values(
        sizes.map((size: { name: string; pricePerBottle: number; pricePerCarton: number; bottlesPerCarton: number }) => ({
          productId: id,
          sizeName: size.name,
          pricePerBottle: size.pricePerBottle.toString(),
          pricePerCarton: size.pricePerCarton.toString(),
          bottlesPerCarton: size.bottlesPerCarton,
        }))
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Delete product (sizes and inventory will cascade)
    await db.delete(products).where(
      // @ts-ignore
      products.id.eq(id)
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
