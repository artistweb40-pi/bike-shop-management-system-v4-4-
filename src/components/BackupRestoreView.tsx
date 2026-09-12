/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  HardDrive,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ShieldAlert,
  Database,
  Archive,
  FileText,
  Printer,
  Image as ImageIcon,
  Cloud,
} from 'lucide-react';
import { dbManager } from '../db/indexedDB';
import { formatPKDateTime, getCurrentDate, getCurrentTime } from '../utils/formatters';
import { generateFullBackupPDF, generateInventoryPhotoCatalogPDF } from '../utils/pdfGenerator';
import { GoogleDriveSync } from './GoogleDriveSync';
import { cloudSyncService, CloudSyncStatus } from '../services/cloudSyncService';

interface BackupRestoreViewProps {
  onRefreshData: () => void;
  currentUser?: { uid?: string; email?: string | null; displayName?: string | null } | null;
}

export const BackupRestoreView: React.FC<BackupRestoreViewProps> = ({
  onRefreshData,
  currentUser,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingCatalog, setIsExportingCatalog] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>(cloudSyncService.getStatus());
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [importedBackupData, setImportedBackupData] = useState<any | null>(null);

  React.useEffect(() => {
    const unsub = cloudSyncService.subscribeStatus((st) => setCloudStatus(st));
    return () => unsub();
  }, []);

  const handleForceCloudPush = async () => {
    if (!currentUser?.uid) {
      setMessage({ type: 'error', text: 'You must be signed in to sync data to the Cloud.' });
      return;
    }
    setIsCloudSyncing(true);
    setMessage(null);
    try {
      const res = await cloudSyncService.pushAllToCloud(currentUser.uid);
      if (res.success) {
        setMessage({
          type: 'success',
          text: `Cloud synchronization successful! ${res.count} showroom records saved in Firestore.`,
        });
      } else {
        setMessage({
          type: 'error',
          text: res.error || 'Failed to sync with cloud.',
        });
      }
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleForceCloudPull = async () => {
    if (!currentUser?.uid) {
      setMessage({ type: 'error', text: 'You must be signed in to sync data from the Cloud.' });
      return;
    }
    setIsCloudSyncing(true);
    setMessage(null);
    try {
      await cloudSyncService.reconcileInitialSync(currentUser.uid, onRefreshData);
      setMessage({
        type: 'success',
        text: 'Latest showroom data fetched and synchronized from Cloud!',
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Failed to fetch from cloud.',
      });
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Export Complete Backup JSON
  const handleExportBackup = async () => {
    setIsExporting(true);
    setMessage(null);
    try {
      const backupData = await dbManager.exportCompleteBackup();
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BikeShop_V4_Backup_${getCurrentDate()}_${getCurrentTime().replace(':', '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({
        type: 'success',
        text: 'JSON Backup exported successfully! All records and photos saved.',
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Failed to export backup.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Export Full PDF Backup
  const handleExportPDFBackup = async () => {
    setIsExportingPDF(true);
    setMessage(null);
    try {
      const backupData = await dbManager.exportCompleteBackup();
      generateFullBackupPDF(backupData);
      setMessage({
        type: 'success',
        text: 'Full Showroom Backup PDF opened in print viewer! You can print or save as PDF.',
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Failed to generate PDF backup.',
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Export Visual Bike Catalog PDF
  const handleExportPhotoCatalogPDF = async () => {
    setIsExportingCatalog(true);
    setMessage(null);
    try {
      const [bikes, documents, settings] = await Promise.all([
        dbManager.getAllBikes(),
        dbManager.getAllDocuments(),
        dbManager.getSettings(),
      ]);
      generateInventoryPhotoCatalogPDF(bikes, documents, settings);
      setMessage({
        type: 'success',
        text: 'Visual Motorcycle Stock Catalog PDF opened with pictures!',
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Failed to generate photo catalog.',
      });
    } finally {
      setIsExportingCatalog(false);
    }
  };

  // Select file for restore
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.version || !parsed.data) {
          throw new Error('Invalid backup file format. Missing version or data object.');
        }
        setImportedBackupData(parsed);
        setMessage({
          type: 'info',
          text: `Backup file loaded. Version: ${parsed.version} (${parsed.exportedAt || 'Unknown date'}). Ready for restore.`,
        });
      } catch (err: any) {
        setMessage({
          type: 'error',
          text: `Invalid backup JSON file: ${err.message}`,
        });
        setImportedBackupData(null);
      }
    };
    reader.readAsText(file);
  };

  // Perform Restore
  const handlePerformRestore = async () => {
    if (!importedBackupData) return;
    if (
      !confirm(
        'Are you sure you want to restore this backup? This will update your IndexedDB records.'
      )
    ) {
      return;
    }

    setIsImporting(true);
    setMessage(null);
    try {
      await dbManager.restoreCompleteBackup(importedBackupData);
      setMessage({
        type: 'success',
        text: 'Database restored successfully! All tables and photos have been updated.',
      });
      setImportedBackupData(null);
      onRefreshData();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Failed to restore backup.',
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Migrate older V3 localStorage data if present
  const handleMigrateV3 = async () => {
    setIsMigrating(true);
    setMessage(null);
    try {
      const res = await dbManager.migrateFromV3LocalStorage();
      if (res.migrated) {
        setMessage({
          type: 'success',
          text: `Successfully migrated ${res.count} records from V3 LocalStorage into IndexedDB!`,
        });
        onRefreshData();
      } else {
        setMessage({
          type: 'info',
          text: 'No legacy V3 LocalStorage data found to migrate.',
        });
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Migration failed.',
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2.5">
            <HardDrive className="w-6 h-6 text-emerald-400" />
            <span>Database Backup, Restore & Data Migration</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Safeguard your motorcycle showroom data with offline single-file JSON backups including CNIC images.
          </p>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : message.type === 'error'
              ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              : 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : message.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          ) : (
            <FileCheck className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Google Drive Cloud Integration */}
      <GoogleDriveSync onDataRestored={onRefreshData} />

      {/* Cloud Firestore Real-Time Auto-Sync Panel */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">Real-Time Cloud Synchronization (Firestore)</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically saves and mirrors all bikes, sales, customers, installment accounts, and cashbook records to Google Cloud Firestore in real time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleForceCloudPush}
              disabled={isCloudSyncing || !currentUser?.uid}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md"
              title="Push all local IndexedDB records to Firestore cloud"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
              <span>{isCloudSyncing ? 'Syncing...' : 'Sync Local Data to Cloud'}</span>
            </button>
            <button
              onClick={handleForceCloudPull}
              disabled={isCloudSyncing || !currentUser?.uid}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-slate-700"
              title="Fetch latest cloud database records from Firestore into this browser"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Pull from Cloud</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Synced Account:</span>
            <span className="font-semibold text-slate-200 truncate block">
              {currentUser?.email || currentUser?.displayName || 'Not signed in'}
            </span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Last Cloud Sync:</span>
            <span className="font-semibold text-emerald-400 block">
              {cloudStatus.lastSyncedAt
                ? cloudStatus.lastSyncedAt.toLocaleTimeString()
                : 'Active (Real-time listener attached)'}
            </span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Cross-Device Sync:</span>
            <span className="font-semibold text-amber-400 block">
              Enabled across all browsers & tabs
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Official Full PDF Backup */}
        <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 font-black text-[9px] px-2.5 py-1 rounded-bl-lg uppercase tracking-wider">
            Print Ready / PDF
          </div>
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-base font-black text-white">Full Database Backup (PDF)</h2>
            <p className="text-xs text-slate-400 mt-1.5">
              Generates a printable, auditable PDF archive document with all inventory, bike pictures, purchase ledgers, sales records, customer dossiers, and manager signatures.
            </p>
          </div>
          <button
            onClick={handleExportPDFBackup}
            disabled={isExportingPDF}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition shadow-lg flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>{isExportingPDF ? 'Generating PDF...' : 'Print / Save Backup as PDF'}</span>
          </button>
        </div>

        {/* Card 2: Visual Motorcycle Photo Catalog (PDF) */}
        <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center mb-3">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h2 className="text-base font-black text-white">Bike Photo Catalog (PDF)</h2>
            <p className="text-xs text-slate-400 mt-1.5">
              Exports an elegant visual showroom catalog with bike pictures, specifications, engine & chassis numbers, doc status, and prices for customer sharing or printing.
            </p>
          </div>
          <button
            onClick={handleExportPhotoCatalogPDF}
            disabled={isExportingCatalog}
            className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-lg flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>{isExportingCatalog ? 'Generating Catalog...' : 'Print Bike Photo Catalog (PDF)'}</span>
          </button>
        </div>

        {/* Card 3: Export Complete JSON Backup */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mb-3">
              <Download className="w-5 h-5" />
            </div>
            <h2 className="text-base font-black text-white">Export Database File (.json)</h2>
            <p className="text-xs text-slate-400 mt-1.5">
              Generates a verified, standalone JSON backup containing all raw tables and photo blobs for machine restoration across devices.
            </p>
          </div>
          <button
            onClick={handleExportBackup}
            disabled={isExporting}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Generating Backup...' : 'Download Backup File (.json)'}</span>
          </button>
        </div>

        {/* Card 4: Restore from Backup */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-3">
              <Upload className="w-5 h-5" />
            </div>
            <h2 className="text-base font-black text-white">Restore Database (.json)</h2>
            <p className="text-xs text-slate-400 mt-1.5">
              Load a previously exported JSON backup to recover all showroom records and customer images safely into IndexedDB.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block w-full text-center py-2 px-3 border border-dashed border-slate-700 hover:border-slate-500 rounded-xl cursor-pointer bg-slate-800/40 text-xs text-slate-300 font-semibold transition">
              <span>{importedBackupData ? 'Change Selected File' : 'Select .json File'}</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileSelected}
              />
            </label>

            {importedBackupData && (
              <button
                onClick={handlePerformRestore}
                disabled={isImporting}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition shadow-lg flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isImporting ? 'animate-spin' : ''}`} />
                <span>{isImporting ? 'Restoring Database...' : 'Apply & Restore Now'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Card 5: V3 LocalStorage Migration */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center mb-3">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-base font-black text-white">Migrate V3 LocalStorage</h2>
            <p className="text-xs text-slate-400 mt-1.5">
              Scan browser localStorage for older V3 data and seamlessly migrate records into the new V4 IndexedDB relational architecture.
            </p>
          </div>
          <button
            onClick={handleMigrateV3}
            disabled={isMigrating}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition shadow-lg flex items-center justify-center gap-2 border border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${isMigrating ? 'animate-spin' : ''}`} />
            <span>{isMigrating ? 'Migrating...' : 'Run V3 → V4 Migration'}</span>
          </button>
        </div>

      </div>

      {/* Storage & Architecture Guarantee Banner */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          <span>Pakistani Showroom Data Integrity Policy</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          1. <b>Zero LocalStorage Business Records:</b> All bike records, purchase contracts, expenses, customer dossiers, CNICs, and sales are stored in high-capacity <b>IndexedDB (BikeShopDB)</b>.<br />
          2. <b>Image Blobs Preservation:</b> Photos of sellers, customers, and CNIC front/back are encoded and saved in IndexedDB and exported fully during backup.<br />
          3. <b>Atomic Transactions:</b> Financial actions (buying, selling, paying installments) use synchronized atomic operations ensuring no partial or corrupted records.
        </p>
      </div>

    </div>
  );
};
