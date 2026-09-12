/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  ExternalLink,
  HardDrive,
  LogOut,
  ShieldCheck,
  FileCheck,
  Clock,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';
import {
  googleSignIn,
  googleSignOut,
  initAuth,
  listDriveBackups,
  uploadBackupToDrive,
  downloadBackupFromDrive,
  deleteDriveFile,
  getDriveStorageQuota,
  DriveFile,
  DriveQuota,
  getAccessToken,
  GoogleUser,
} from '../services/googleDriveService';
import { dbManager } from '../db/indexedDB';
import { formatPKDateTime, getCurrentDate, getCurrentTime } from '../utils/formatters';

interface GoogleDriveSyncProps {
  onDataRestored?: () => void;
}

export const GoogleDriveSync: React.FC<GoogleDriveSyncProps> = ({
  onDataRestored = () => {},
}) => {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [quota, setQuota] = useState<DriveQuota | null>(null);
  const [backups, setBackups] = useState<DriveFile[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Modals for required user confirmations (Mandatory for destructive/mutating operations)
  const [backupToRestore, setBackupToRestore] = useState<DriveFile | null>(null);
  const [backupToDelete, setBackupToDelete] = useState<DriveFile | null>(null);
  const [showOriginHelp, setShowOriginHelp] = useState(false);
  const [originCopied, setOriginCopied] = useState(false);
  const [hostnameCopied, setHostnameCopied] = useState(false);

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'bike-shop-management-system-v4-4.vercel.app';
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://bike-shop-management-system-v4-4.vercel.app';

  const copyOriginToClipboard = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentOrigin);
      setOriginCopied(true);
      setTimeout(() => setOriginCopied(false), 2500);
    }
  };

  const copyHostnameToClipboard = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentHostname);
      setHostnameCopied(true);
      setTimeout(() => setHostnameCopied(false), 2500);
    }
  };

  // Initialize Auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser) => {
        setUser(authUser);
        loadDriveData();
      },
      () => {
        setUser(null);
        setQuota(null);
        setBackups([]);
      }
    );

    return () => unsubscribe();
  }, []);

  const loadDriveData = async () => {
    setIsLoadingBackups(true);
    try {
      const [quotaData, fileList] = await Promise.all([
        getDriveStorageQuota(),
        listDriveBackups(),
      ]);
      setQuota(quotaData);
      setBackups(fileList);
    } catch (err: any) {
      console.warn('Could not load drive data:', err);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setStatusMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setStatusMessage({
          type: 'success',
          text: `Connected to Google Drive as ${result.user.email}!`,
        });
        await loadDriveData();
      } else {
        // The user closed the popup or cancelled sign in
        setStatusMessage({
          type: 'info',
          text: 'Google Sign-In was closed. Click "Sign in with Google" when you are ready to connect.',
        });
      }
    } catch (err: any) {
      const isCancellation =
        err?.code === 'auth/popup-closed-by-user' ||
        err?.message?.includes('popup-closed-by-user') ||
        err?.code === 'auth/cancelled-popup-request';

      if (!isCancellation) {
        setStatusMessage({
          type: 'error',
          text: err.message || 'Failed to sign in with Google.',
        });
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await googleSignOut();
      setUser(null);
      setQuota(null);
      setBackups([]);
      setStatusMessage({
        type: 'info',
        text: 'Signed out from Google Drive.',
      });
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  // Upload Complete Showroom Backup to Drive
  const handleUploadBackup = async () => {
    setIsUploading(true);
    setStatusMessage(null);
    try {
      const backupData = await dbManager.exportCompleteBackup();
      const filename = `BikeShop_V4_Showroom_Backup_${getCurrentDate()}_${getCurrentTime().replace(':', '-')}.json`;
      const uploadedFile = await uploadBackupToDrive(backupData, filename);

      setStatusMessage({
        type: 'success',
        text: `Successfully backed up showroom data to Google Drive (${uploadedFile.name})!`,
      });

      await loadDriveData();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to upload backup to Google Drive.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Execute Restore after explicit user confirmation
  const executeRestore = async () => {
    if (!backupToRestore) return;
    const file = backupToRestore;
    setBackupToRestore(null);
    setIsRestoring(true);
    setStatusMessage(null);

    try {
      const data = await downloadBackupFromDrive(file.id);
      await dbManager.restoreCompleteBackup(data);

      setStatusMessage({
        type: 'success',
        text: `Restored showroom database successfully from Google Drive backup (${file.name})! All tables and photos updated.`,
      });

      onDataRestored();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to restore backup from Google Drive.',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  // Execute Delete after explicit user confirmation (Mandatory per Workspace integration skill)
  const executeDelete = async () => {
    if (!backupToDelete) return;
    const file = backupToDelete;
    setBackupToDelete(null);

    try {
      await deleteDriveFile(file.id);
      setStatusMessage({
        type: 'info',
        text: `Removed "${file.name}" from Google Drive.`,
      });
      await loadDriveData();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to delete file from Google Drive.',
      });
    }
  };

  // Format bytes helper
  const formatBytes = (bytesStr?: string | number) => {
    if (!bytesStr) return '0 B';
    const bytes = Number(bytesStr);
    if (isNaN(bytes)) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white">Google Drive Cloud Storage</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Official API
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Secure cloud backup and cross-device restoration for Pakistani showroom records, customer CNICs, and ledger.
            </p>
          </div>
        </div>

        {/* Auth / Account Controls */}
        <div>
          {user ? (
            <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Google User'}
                  className="w-8 h-8 rounded-full border border-slate-700"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  {user.displayName?.charAt(0) || 'G'}
                </div>
              )}
              <div className="text-left">
                <div className="text-xs font-bold text-white truncate max-w-[140px]">
                  {user.displayName || 'Google Account'}
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate max-w-[140px]">
                  {user.email}
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                title="Disconnect Google Drive"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold transition shadow-lg flex items-center gap-2.5 border border-slate-300"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{isSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification Toast Banner */}
      {statusMessage && (
        <>
          {statusMessage.text.includes('Authorized Domain') ? (
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-amber-500/40 text-xs space-y-3 shadow-2xl animate-fade-in">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <span>Domain Authorization Required in Firebase Console</span>
                </div>
                <button
                  onClick={() => setStatusMessage(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-slate-300 leading-relaxed text-xs">
                Firebase Authentication and Google Cloud protect your project by requiring production domains (such as Vercel) to be whitelisted under <b>Authorized Domains</b>.
              </p>

              {/* Copy Boxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                  <div className="truncate">
                    <div className="text-[10px] uppercase font-bold text-slate-400">1. For Firebase Authorized Domains:</div>
                    <div className="font-mono text-xs text-emerald-400 font-semibold truncate select-all">{currentHostname}</div>
                  </div>
                  <button
                    type="button"
                    onClick={copyHostnameToClipboard}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold shrink-0 transition flex items-center gap-1"
                  >
                    {hostnameCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{hostnameCopied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                  <div className="truncate">
                    <div className="text-[10px] uppercase font-bold text-slate-400">2. For GCP OAuth Origins (Google Drive):</div>
                    <div className="font-mono text-xs text-blue-400 font-semibold truncate select-all">{currentOrigin}</div>
                  </div>
                  <button
                    type="button"
                    onClick={copyOriginToClipboard}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold shrink-0 transition flex items-center gap-1"
                  >
                    {originCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Sparkles className="w-3.5 h-3.5 text-blue-400" />}
                    <span>{originCopied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Step-by-Step Instructions & Direct Links */}
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-2 text-[11px]">
                <div className="font-bold text-slate-200">Easy 2-Minute Whitelisting Steps:</div>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-300">
                  <li>
                    Click to open{' '}
                    <a
                      href="https://console.firebase.google.com/project/gen-lang-client-0839554754/authentication/settings"
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-400 underline hover:text-amber-300 font-bold inline-flex items-center gap-1"
                    >
                      Firebase Console &gt; Authentication &gt; Settings &gt; Authorized Domains ↗
                    </a>
                  </li>
                  <li>Under <b>Authorized domains</b>, click <b>Add domain</b>, paste <code className="text-emerald-300 bg-slate-950 px-1 py-0.5 rounded">{currentHostname}</code> (or <code className="text-emerald-300 bg-slate-950 px-1 py-0.5 rounded">vercel.app</code>) and click <b>Save</b>.</li>
                  <li>
                    (For Google Drive Backup) Open{' '}
                    <a
                      href="https://console.cloud.google.com/apis/credentials?project=gen-lang-client-0839554754"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 underline hover:text-blue-300 font-bold inline-flex items-center gap-1"
                    >
                      Google Cloud Console &gt; Credentials ↗
                    </a>
                    , click your Web Client ID, add <code className="text-blue-300 bg-slate-950 px-1 py-0.5 rounded">{currentOrigin}</code> under <b>Authorized JavaScript origins</b> and click <b>Save</b>.
                  </li>
                </ol>
              </div>

              {/* Offline Alternative Notice */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
                <span className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Offline JSON Backups and PDF archives work without any Google Cloud configuration!</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStatusMessage(null);
                    window.scrollTo({ top: 700, behavior: 'smooth' });
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                >
                  Use Offline Full Database Backup ↓
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 transition-all ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0" />}
                {statusMessage.type === 'info' && <Cloud className="w-4 h-4 shrink-0" />}
                <span>{statusMessage.text}</span>
              </div>
              <button
                onClick={() => setStatusMessage(null)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </>
      )}

      {user ? (
        <div className="space-y-6">
          {/* Action Row & Drive Quota */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Quick 1-Click Backup */}
            <div className="sm:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  1-Click Cloud Backup
                </span>
                <p className="text-xs text-slate-300">
                  Instantly bundles all showroom inventory, bike photos, customer ledger accounts, sales receipts, and cashbook into a encrypted archive stored in your personal Google Drive.
                </p>
              </div>

              <div className="pt-4 flex items-center gap-3">
                <button
                  onClick={handleUploadBackup}
                  disabled={isUploading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-lg flex items-center gap-2 shadow-blue-600/20"
                >
                  <CloudUpload className={`w-4 h-4 ${isUploading ? 'animate-bounce' : ''}`} />
                  <span>{isUploading ? 'Uploading to Google Drive...' : 'Backup Showroom to Google Drive'}</span>
                </button>
                <button
                  onClick={loadDriveData}
                  disabled={isLoadingBackups}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Refresh Drive Backups"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingBackups ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Quota Metric Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Drive Storage Quota
              </span>
              <div>
                <div className="text-base font-mono font-bold text-white">
                  {formatBytes(quota?.usageInDrive || quota?.usage)}
                </div>
                <div className="text-[11px] text-slate-500">
                  of {formatBytes(quota?.limit)} total capacity
                </div>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all"
                  style={{
                    width: quota?.limit && quota?.usage
                      ? `${Math.min(100, (Number(quota.usage) / Number(quota.limit)) * 100)}%`
                      : '5%',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Drive Backups List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="uppercase tracking-wider flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-blue-400" />
                Available Google Drive Backups ({backups.length})
              </span>
              <span className="text-[11px] font-normal text-slate-500">
                Sorted by latest modified
              </span>
            </div>

            {isLoadingBackups ? (
              <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                <span>Reading Google Drive files...</span>
              </div>
            ) : backups.length > 0 ? (
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/60">
                {backups.map((file) => (
                  <div
                    key={file.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/40 transition"
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-bold text-slate-200 truncate flex items-center gap-2">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-3">
                        <span>{formatBytes(file.size)}</span>
                        <span>•</span>
                        <span>{file.modifiedTime ? new Date(file.modifiedTime).toLocaleString() : 'Recent'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Restore Button */}
                      <button
                        onClick={() => setBackupToRestore(file)}
                        disabled={isRestoring}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5 transition"
                        title="Restore database from this cloud backup"
                      >
                        <CloudDownload className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>

                      {/* Open in Google Drive */}
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                          title="Open file in Google Drive web"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}

                      {/* Delete File from Drive */}
                      <button
                        onClick={() => setBackupToDelete(file)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                        title="Delete file from Google Drive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-xs">
                No showroom backups found in your Google Drive yet. Click "Backup Showroom to Google Drive" above to create your first cloud backup.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Prompt to Connect Google Drive */
        <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 mx-auto flex items-center justify-center">
            <Cloud className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-sm font-bold text-white">Connect Google Drive to Enable Cloud Sync</h3>
            <p className="text-xs text-slate-400 mt-1">
              Sign in with your Google account to automatically store database backups, sync customer ledgers across multiple computers or tablets, and protect showroom data against hard drive failures.
            </p>
          </div>
          <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-lg inline-flex items-center gap-2 shadow-blue-600/20"
            >
              <Cloud className="w-4 h-4" />
              <span>{isSigningIn ? 'Opening Google Auth...' : 'Sign in with Google'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowOriginHelp(!showOriginHelp)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-medium text-xs transition inline-flex items-center gap-1.5"
            >
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>{showOriginHelp ? 'Hide Origin Helper' : 'OAuth Origin Guide / Error 400'}</span>
            </button>
          </div>

          {/* Collapsible Origin Helper for Google Cloud Console Setup */}
          {showOriginHelp && (
            <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-amber-500/30 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Google OAuth 2.0 Policy: "Error 400: origin_mismatch" Solution
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">
                  GCP Setup
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Google requires any website connecting to Google Drive to have its exact origin registered under <b>"Authorized JavaScript origins"</b> in the Google Cloud Console.
              </p>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Your Current App Origin:</div>
                  <div className="font-mono text-xs text-emerald-400 select-all break-all">{currentOrigin}</div>
                </div>
                <button
                  type="button"
                  onClick={copyOriginToClipboard}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold shrink-0 transition flex items-center gap-1.5"
                >
                  {originCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Clock className="w-3.5 h-3.5" />}
                  <span>{originCopied ? 'Copied!' : 'Copy Origin'}</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-400 space-y-1">
                <div><b>To whitelist this origin in your Google Cloud Console:</b></div>
                <ol className="list-decimal list-inside space-y-0.5 pl-1">
                  <li>Open <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Google Cloud Console Credentials</a>.</li>
                  <li>Click your <b>OAuth 2.0 Web Client ID</b>.</li>
                  <li>Under <b>"Authorized JavaScript origins"</b>, click <b>+ ADD URI</b> and paste <code className="text-amber-300 bg-slate-950 px-1 py-0.5 rounded">{currentOrigin}</code>.</li>
                  <li>Click <b>Save</b> (takes ~1-2 minutes to propagate).</li>
                </ol>
              </div>

              <div className="pt-1 text-[11px] text-emerald-400/90 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                💡 <b>No Google Account needed?</b> You can use the <b>Backup & Restore</b> tab at any time to export or import complete encrypted JSON backups locally with zero cloud configuration!
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          RESTORE CONFIRMATION MODAL (MANDATORY DIALOG)
          ========================================== */}
      {backupToRestore && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Restore from Google Drive?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to restore the showroom database from <b className="font-mono text-white">{backupToRestore.name}</b>?
              <br /><br />
              <span className="text-amber-400 font-bold">Important:</span> This will update your current IndexedDB database with the records and images saved in this cloud backup.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBackupToRestore(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeRestore}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg flex items-center gap-1.5"
              >
                <CloudDownload className="w-4 h-4" />
                <span>Confirm & Restore</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          DELETE CONFIRMATION MODAL (MANDATORY DIALOG)
          ========================================== */}
      {backupToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <Trash2 className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Delete from Google Drive?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete <b className="font-mono text-white">{backupToDelete.name}</b> from your Google Drive?
              <br /><br />
              This file will be permanently removed from your cloud account.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBackupToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition shadow-lg flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete File</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
