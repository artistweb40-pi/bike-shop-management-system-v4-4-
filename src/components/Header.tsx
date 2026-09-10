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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-18 gap-4 py-2">
          
          {/* Left: Showroom Badge & System Clock */}
          <div
            className="flex items-center gap-3 cursor-pointer z-10 shrink-0"
            onClick={() => onSelectTab('dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 group hover:scale-105 transition-transform">
              <BikeIcon className="w-6 h-6" />
            </div>
            <div className="hidden sm:block">
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

          {/* Center: Center-Aligned Usman Trader and Autos */}
          <div className="absolute inset-x-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
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

          {/* Right: A to Z System Test & Utilities (Buy/Sell buttons removed) */}
          <div className="flex items-center gap-2 z-10 shrink-0 ml-auto">
            
            {/* Search Input (Desktop) */}
            <div className="relative hidden xl:block w-48">
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-900/70 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60 transition shadow-sm"
              title="Run Full A to Z Showroom Daily Workflow Simulation (Tests A to L)"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">A to Z System Test</span>
              <span className="sm:hidden">QA Test</span>
            </button>

            {/* Language Toggle */}
            <button
              id="header-lang-toggle"
              onClick={onToggleLanguage}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Switch Language (English / اردو)"
            >
              {language === 'en' ? 'اردو' : 'English'}
            </button>

            {/* Google Drive Cloud Quick Access */}
            <button
              id="header-google-drive-btn"
              onClick={() => onSelectTab('backup')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-800/60 transition shadow-sm"
              title="Google Drive Cloud Backup & Sync"
            >
              <Cloud className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Drive</span>
            </button>

            {/* Settings Quick Trigger */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition"
              title="Showroom Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};

