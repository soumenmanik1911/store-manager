import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bills, billItems } from '@/lib/db/schema';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [bill] = await db.select().from(bills).where(
      // @ts-ignore
      bills.id.eq(id)
    );
    
    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }
    
    const items = await db.select().from(billItems).where(
      // @ts-ignore
      billItems.billId.eq(id)
    );
    
    return NextResponse.json({ ...bill, items });
  } catch (error) {
    console.error('Error fetching bill:', error);
    return NextResponse.json({ error: 'Failed to fetch bill' }, { status: 500 });
  }
}
