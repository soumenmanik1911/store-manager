'use client';

import { useEffect, useState } from 'react';
import { Bell, IceCream } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';

export function Header() {
  const { shopName, ownerName } = useSettingsStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getInitials = () => {
    if (ownerName) {
      return ownerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'FF';
  };

  return (
    <header 
      className="
        sticky top-0 z-50 
        bg-white/80 backdrop-blur-sm 
        border-b border-slate-200 
        animate-slide-down
      "
    >
      <div className="flex items-center justify-between px-4 lg:px-8 h-16">
        {/* Shop Name */}
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg text-white">
            <IceCream className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">
            {mounted ? shopName : 'FrostyFlow'}
          </h1>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          
          {/* User Avatar */}
          <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
            {mounted ? getInitials() : 'FF'}
          </div>
        </div>
      </div>
    </header>
  );
}
