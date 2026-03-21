'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Receipt, Package, Plus, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dash', icon: LayoutDashboard },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/billing', label: '', icon: Plus, isCenter: true },
  { href: '/inventory', label: 'Stock', icon: ShoppingCart },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/history', label: 'Bills', icon: Receipt },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-between z-50 pb-safe">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        
        if (item.isCenter) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center bg-primary text-white size-14 rounded-full -mt-8 shadow-lg border-4 border-white"
            >
              <item.icon className="w-7 h-7" />
            </Link>
          );
        }
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-0.5 py-2 px-2',
              isActive ? 'text-primary' : 'text-slate-400'
            )}
          >
            <item.icon className="w-4 h-4" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
