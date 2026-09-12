/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Settings,
  Building,
  Phone,
  MapPin,
  FileText,
  CheckCircle2,
  Save,
  User as UserIcon,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { ShowroomSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  settings: ShowroomSettings;
  onClose: () => void;
  onSave: (settings: ShowroomSettings) => Promise<any>;
  user?: { email?: string | null; displayName?: string | null } | null;
  onLogout?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSave,
  user,
  onLogout,
}) => {
  const [showroomName, setShowroomName] = useState(settings.showroomName || 'Pak Motor Showroom');
  const [ownerName, setOwnerName] = useState(settings.ownerName || 'Haji Muhammad Aslam');
  const [phone1, setPhone1] = useState(settings.phone1 || '0300-1234567');
  const [phone2, setPhone2] = useState(settings.phone2 || '0321-7654321');
  const [address, setAddress] = useState(settings.address || 'Main Motorcycle Market, McLeod Road, Lahore');
  const [city, setCity] = useState(settings.city || 'Lahore');
  const [receiptFooter, setReceiptFooter] = useState(
    settings.receiptFooter ||
      'بیچی گئی موٹرسائیکل کی واپسی یا تبدیلی ممکن نہیں۔ تمام کاغذات اور انجن چیسس نمبر چیک کر کے خریدیں۔'
  );
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || 'Rs.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        ...settings,
        showroomName: showroomName.trim(),
        ownerName: ownerName.trim(),
        phone1: phone1.trim(),
        phone2: phone2.trim(),
        address: address.trim(),
        city: city.trim(),
        receiptFooter: receiptFooter.trim(),
        currencySymbol: currencySymbol.trim(),
      });
      setMsg('Showroom details and receipt header updated successfully!');
      setTimeout(() => {
        setMsg(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Showroom Profile & Receipt Header</h2>
              <p className="text-xs text-slate-400">Configure your business title, contact info, and legal terms.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-bold text-lg"
          >
            ✕
          </button>
        </div>

        {msg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{msg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Showroom Title / Business Name *</label>
              <input
                type="text"
                required
                value={showroomName}
                onChange={(e) => setShowroomName(e.target.value)}
                placeholder="e.g. Al-Madina Honda Showroom"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Proprietor / Owner Name</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Haji Muhammad Aslam"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Primary Phone / WhatsApp</label>
              <input
                type="text"
                value={phone1}
                onChange={(e) => setPhone1(e.target.value)}
                placeholder="0300-1234567"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Secondary Phone</label>
              <input
                type="text"
                value={phone2}
                onChange={(e) => setPhone2(e.target.value)}
                placeholder="0321-7654321"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Lahore / Karachi / Rawalpindi"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Currency Symbol</label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                placeholder="Rs."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Showroom Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Shop No. 12, Main Auto Market, McLeod Road, Lahore"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">
              Sales Receipt Footer / Legal Agreement Terms (Urdu / English)
            </label>
            <textarea
              rows={3}
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 leading-relaxed font-sans"
            />
          </div>

          {/* Cloud Account & Vercel Session Info */}
          {user && (
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    {user.displayName || 'Showroom Admin'}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {user.email}
                  </div>
                </div>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Sign out of your showroom account?')) {
                      onClose();
                      onLogout();
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 transition flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
