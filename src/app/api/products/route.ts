import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productSizes } from '@/lib/db/schema';

export async function GET() {
  try {
    const allProducts = await db.select().from(products);
    
    // Get sizes for all products - fetch all sizes
    const allSizes = await db.select().from(productSizes);
    
    // Map sizes to products
    const productsWithSizes = allProducts.map(product => ({
      ...product,
      sizes: allSizes.filter(size => size.productId === product.id).map(size => ({
        id: size.id,
        name: size.sizeName,
        pricePerBottle: parseFloat(size.pricePerBottle || '0'),
        pricePerCarton: parseFloat(size.pricePerCarton || '0'),
        bottlesPerCarton: size.bottlesPerCarton,
      })),
    }));
    
    return NextResponse.json(productsWithSizes);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, brand, category, imageUrl, sizes } = body;
    
    if (!name || !brand || !category || !sizes || sizes.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Insert product
    const [newProduct] = await db.insert(products).values({
      name,
      brand,
      category,
      imageUrl: imageUrl || null,
    }).returning();
    
    // Insert product sizes
    const newSizes = await db.insert(productSizes).values(
      sizes.map((size: { name: string; pricePerBottle: number; pricePerCarton: number; bottlesPerCarton: number }) => ({
        productId: newProduct.id,
        sizeName: size.name,
        pricePerBottle: size.pricePerBottle.toString(),
        pricePerCarton: size.pricePerCarton.toString(),
        bottlesPerCarton: size.bottlesPerCarton,
      }))
    ).returning();
    
    return NextResponse.json({
      ...newProduct,
      sizes: newSizes,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
