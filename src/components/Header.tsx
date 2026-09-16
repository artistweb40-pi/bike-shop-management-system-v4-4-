/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Bike as BikeIcon,
  Search,
  ShieldCheck,
  Settings,
  Sparkles,
  Cloud,
  LogOut,
  User as UserIcon,
  RefreshCw,
  Menu,
  X,
} from 'lucide-react';
import { Language, ShowroomSettings } from '../types';
import { formatPKDateTime, getCurrentDate, getCurrentTime } from '../utils/formatters';

interface HeaderProps {
  settings?: Partial<ShowroomSettings> | null;
  activeTab?: string;
  onSelectTab?: (tab: any) => void;
  globalSearch?: string;
  onSearchChange?: (q: string) => void;
  language?: Language;
  onToggleLanguage?: () => void;
  onOpenTestModal?: () => void;
  onOpenTestSimulation?: () => void;
  onOpenSettings?: () => void;
  user?: { email?: string | null; displayName?: string | null } | null;
  onLogout?: () => void;
  cloudSyncStatus?: {
    isSyncing: boolean;
    lastSyncedAt: Date | null;
    error: string | null;
  };
  onTriggerCloudSync?: () => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  activeTab = 'dashboard',
  onSelectTab = (_tab: any) => {},
  globalSearch = '',
  onSearchChange = (_q: string) => {},
  language = 'en',
  onToggleLanguage = () => {},
  onOpenTestModal,
  onOpenTestSimulation,
  onOpenSettings = () => {},
  user,
  onLogout,
  cloudSyncStatus,
  onTriggerCloudSync,
  isMobileMenuOpen = false,
  onToggleMobileMenu,
}) => {
  const [clock, setClock] = useState('');
  const handleTestModal = onOpenTestSimulation || onOpenTestModal || (() => {});

  useEffect(() => {
    const updateTime = () => {
      setClock(formatPKDateTime(getCurrentDate(), getCurrentTime()));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const shopTitle = settings?.shopName || 'Usman Trader and Autos';
  const shopCity = settings?.city || 'Circular Road, Lahore';

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16 sm:h-18 gap-2 sm:gap-4 py-2">
          
          {/* Left: Showroom Badge & Mobile Shop Name */}
          <div
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer z-10 shrink-0 min-w-0"
            onClick={() => onSelectTab('dashboard')}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 shrink-0 group hover:scale-105 transition-transform">
              <BikeIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            {/* Responsive Shop Title for mobile and tablets (< lg) */}
            <div className="lg:hidden min-w-0">
              <h1 className="text-xs sm:text-sm font-black text-white truncate max-w-[150px] sm:max-w-xs leading-tight">
                {shopTitle}
              </h1>
              <p className="text-[10px] text-amber-400 font-medium truncate max-w-[150px] sm:max-w-xs">
                عثمان ٹریڈرز اینڈ آٹوز
              </p>
            </div>

            {/* Desktop Live Badge & Clock (lg+) */}
            <div className="hidden lg:block">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Live System
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  V4 IDB
                </span>
              </div>
              <div className="text-[11px] font-mono text-amber-400/90 mt-0.5">
                {clock}
              </div>
            </div>
          </div>

          {/* Center: Center-Aligned Usman Trader and Autos (Only on lg+ to prevent mobile overlapping) */}
          <div className="hidden lg:flex absolute inset-x-0 flex-col items-center justify-center text-center pointer-events-none px-4">
            <div className="pointer-events-auto cursor-pointer" onClick={() => onSelectTab('dashboard')}>
              <h1 className="text-base sm:text-xl font-black text-white tracking-tight flex items-center justify-center gap-2 drop-shadow-sm">
                <span>{shopTitle}</span>
              </h1>
              <p className="text-[11px] sm:text-xs text-amber-400/90 font-medium flex items-center justify-center gap-1.5">
                <span>عثمان ٹریڈرز اینڈ آٹوز</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">{shopCity}</span>
              </p>
            </div>
          </div>

          {/* Right: Actions & Mobile Hamburger */}
          <div className="flex items-center gap-1.5 sm:gap-2 z-10 shrink-0 ml-auto">
            
            {/* Search Input (Large Desktop) */}
            <div className="relative hidden xl:block w-44">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search engine / bike..."
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              />
            </div>

            {/* Run Showroom A to Z Daily QA Test Suite */}
            <button
              id="header-run-qa-test"
              onClick={handleTestModal}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-900/70 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60 transition shadow-sm"
              title="Run Full A to Z Showroom Daily Workflow Simulation"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span className="hidden md:inline">A to Z QA Test</span>
              <span className="md:hidden">QA Test</span>
            </button>

            {/* Language Toggle */}
            <button
              id="header-lang-toggle"
              onClick={onToggleLanguage}
              className="hidden sm:inline-flex px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Switch Language (English / اردو)"
            >
              {language === 'en' ? 'اردو' : 'English'}
            </button>

            {/* Real-time Cloud Sync Status & Trigger */}
            <button
              id="header-cloud-sync-btn"
              onClick={onTriggerCloudSync}
              disabled={cloudSyncStatus?.isSyncing}
              className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition shadow-sm ${
                cloudSyncStatus?.isSyncing
                  ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                  : cloudSyncStatus?.error
                  ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                  : 'bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/60'
              }`}
              title={
                cloudSyncStatus?.isSyncing
                  ? 'Syncing showroom database with Cloud Firestore...'
                  : cloudSyncStatus?.lastSyncedAt
                  ? `Real-time Cloud Sync Active (Last synced: ${cloudSyncStatus.lastSyncedAt.toLocaleTimeString()}). Click to force push now.`
                  : 'Real-time Cloud Sync. Click to push all data to Cloud now.'
              }
            >
              {cloudSyncStatus?.isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
              <span className="hidden md:inline">
                {cloudSyncStatus?.isSyncing ? 'Syncing...' : 'Cloud Sync'}
              </span>
            </button>

            {/* Google Drive Cloud Quick Access */}
            <button
              id="header-google-drive-btn"
              onClick={() => onSelectTab('backup')}
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-800/60 transition shadow-sm"
              title="Google Drive Cloud Backup & Sync"
            >
              <Cloud className="w-3.5 h-3.5 text-blue-400" />
              <span>Drive</span>
            </button>

            {/* Settings Quick Trigger */}
            <button
              onClick={onOpenSettings}
              className="hidden sm:inline-flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition"
              title="Showroom Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Signed-in User Profile & Logout (Desktop) */}
            {user && (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
                <div
                  className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300"
                  title={`Logged in as ${user.email || user.displayName}`}
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="max-w-[110px] truncate font-medium text-slate-200">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                </div>

                {onLogout && (
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to sign out of the showroom?')) {
                        onLogout();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 transition shadow-sm"
                    title="Sign Out of Showroom"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Logout</span>
                  </button>
                )}
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle Button (md:hidden) */}
            {onToggleMobileMenu && (
              <button
                id="header-mobile-menu-btn"
                onClick={onToggleMobileMenu}
                className="md:hidden flex items-center justify-center p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-800 border border-slate-700 transition"
                aria-label="Toggle Showroom Menu"
                title="Open Navigation Menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-amber-400" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};

