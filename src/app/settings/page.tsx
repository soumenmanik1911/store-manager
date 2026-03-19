'use client';

import { useState, useEffect } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useToast } from '@/components/Toast';
import { Settings, Store, User, Save } from 'lucide-react';

export default function SettingsPage() {
  const { 
    shopName, 
    ownerName, 
    shopPhone, 
    shopAddress, 
    taxRate,
    setShopName, 
    setOwnerName, 
    setShopPhone, 
    setShopAddress, 
    setTaxRate 
  } = useSettingsStore();
  const { addToast } = useToast();
  
  const [localShopName, setLocalShopName] = useState(shopName);
  const [localOwnerName, setLocalOwnerName] = useState(ownerName);
  const [localShopPhone, setLocalShopPhone] = useState(shopPhone);
  const [localShopAddress, setLocalShopAddress] = useState(shopAddress);
  const [localTaxRate, setLocalTaxRate] = useState(taxRate);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalShopName(shopName);
    setLocalOwnerName(ownerName);
    setLocalShopPhone(shopPhone);
    setLocalShopAddress(shopAddress);
    setLocalTaxRate(taxRate);
  }, [shopName, ownerName, shopPhone, shopAddress, taxRate]);

  const handleSave = () => {
    setIsSaving(true);
    setShopName(localShopName);
    setOwnerName(localOwnerName);
    setShopPhone(localShopPhone);
    setShopAddress(localShopAddress);
    setTaxRate(localTaxRate);
    addToast('success', 'Settings saved successfully');
    setIsSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 lg:pb-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 p-2 rounded-lg">
          <Settings className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Settings</h1>
          <p className="text-sm text-slate-500">Manage your store preferences</p>
        </div>
      </div>

      {/* Store Settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-bold flex items-center gap-2">
          <Store className="w-5 h-5" />
          Store Information
        </h2>
        
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Store Name</label>
            <input
              type="text"
              value={localShopName}
              onChange={(e) => setLocalShopName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-base"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Owner Name</label>
            <input
              type="text"
              value={localOwnerName}
              onChange={(e) => setLocalOwnerName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-base"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input
              type="tel"
              value={localShopPhone}
              onChange={(e) => setLocalShopPhone(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-base"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <textarea
              value={localShopAddress}
              onChange={(e) => setLocalShopAddress(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-base"
            />
          </div>
        </div>
      </div>

      {/* Billing Settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-bold flex items-center gap-2">
          <User className="w-5 h-5" />
          Billing Settings
        </h2>
        
        <div>
          <label className="block text-sm font-medium mb-1">Tax Rate (%)</label>
          <input
            type="number"
            value={localTaxRate}
            onChange={(e) => setLocalTaxRate(Number(e.target.value))}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-base"
            min="0"
            max="100"
          />
          <p className="text-xs text-slate-500 mt-1">
            Tax rate to apply on bills (0-100%)
          </p>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full bg-primary hover:bg-primary/90 disabled:bg-slate-300 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors h-12"
      >
        <Save className="w-5 h-5" />
        {isSaving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}
