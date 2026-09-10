/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  TrendingUp,
  Receipt,
  FileText,
  Users,
  Building2,
  Calculator,
  BookOpen,
  BarChart3,
  Activity,
  HardDrive,
  Settings as SettingsIcon,
} from 'lucide-react';
import { Language } from '../types';

interface SidebarProps {
  currentTab?: string;
  activeTab?: string;
  onSelectTab: (tab: any) => void;
  language?: Language;
  counts?: {
    availableBikes?: number;
    totalBikes?: number;
    overdueInstallments?: number;
    pendingDocs?: number;
  };
  availableBikesCount?: number;
  pendingDocsCount?: number;
  overdueInstallmentsCount?: number;
  onOpenSettings?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  activeTab,
  onSelectTab,
  language = 'en',
  counts,
  availableBikesCount,
  pendingDocsCount,
  overdueInstallmentsCount,
  onOpenSettings,
}) => {
  const isUrdu = language === 'ur';
  const active = currentTab || activeTab || 'dashboard';

  const availBikes = counts?.availableBikes ?? availableBikesCount ?? 0;
  const pendDocs = counts?.pendingDocs ?? pendingDocsCount ?? 0;
  const overdueInst = counts?.overdueInstallments ?? overdueInstallmentsCount ?? 0;

  const navItems = [
    {
      id: 'dashboard',
      label: isUrdu ? 'ڈیش بورڈ' : 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'purchases',
      label: isUrdu ? 'موٹرسائیکل خریداری' : 'Purchases',
      icon: ShoppingCart,
      badge: undefined,
    },
    {
      id: 'inventory',
      label: isUrdu ? 'اسٹاک و موٹرسائیکل' : 'Inventory',
      icon: Boxes,
      badge: availBikes > 0 ? `${availBikes} Avail` : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'sales',
      label: isUrdu ? 'فروخت' : 'Sales',
      icon: TrendingUp,
    },
    {
      id: 'expenses',
      label: isUrdu ? 'موٹرسائیکل کے اخراجات' : 'Bike Expenses',
      icon: Receipt,
    },
    {
      id: 'documentation',
      label: isUrdu ? 'دستاویزات و فائل' : 'Documentation',
      icon: FileText,
      badge: pendDocs > 0 ? `${pendDocs} Open` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
    {
      id: 'customers',
      label: isUrdu ? 'گاہک و کھاتہ' : 'Customers & Ledger',
      icon: Users,
    },
    {
      id: 'sellers',
      label: isUrdu ? 'فروخت کنندگان' : 'Sellers (Suppliers)',
      icon: Building2,
    },
    {
      id: 'finance',
      label: isUrdu ? 'قسطیں و فنانس' : 'Installments / Finance',
      icon: Calculator,
      badge: overdueInst > 0 ? `${overdueInst} Overdue` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    },
    {
      id: 'cashbook',
      label: isUrdu ? 'روزنامچہ / کیش بک' : 'Cashbook',
      icon: BookOpen,
    },
    {
      id: 'reports',
      label: isUrdu ? 'رپورٹس و پی ڈی ایف' : 'Reports & PDF',
      icon: BarChart3,
    },
    {
      id: 'health',
      label: isUrdu ? 'ڈیٹا بیس چیک' : 'DB Health Check',
      icon: Activity,
    },
    {
      id: 'backup',
      label: isUrdu ? 'بیک اپ و گوگل ڈرائیو' : 'Backup & Google Drive',
      icon: HardDrive,
      badge: 'Cloud',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
    {
      id: 'settings',
      label: isUrdu ? 'ترتیبات' : 'Settings',
      icon: SettingsIcon,
    },
  ];

  return (
    <aside className="w-full md:w-64 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shrink-0 overflow-hidden shadow-xl">
      <div className="p-3 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => {
                if (item.id === 'settings' && onOpenSettings) {
                  onOpenSettings();
                } else {
                  onSelectTab(item.id);
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold shadow-sm shadow-amber-500/5'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                    item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Storage Indicator */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>IndexedDB: <b>BikeShopDB</b></span>
          </span>
          <span className="font-mono text-emerald-400">Offline-Ready</span>
        </div>
        <div className="text-[10px] text-slate-500">
          All records, CNICs & blobs stored safely locally.
        </div>
      </div>
    </aside>
  );
};
