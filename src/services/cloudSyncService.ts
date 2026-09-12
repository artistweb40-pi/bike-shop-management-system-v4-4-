/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { dbManager } from '../db/indexedDB';
import { ShowroomSettings } from '../types';

export const SYNC_COLLECTIONS = [
  'bikes',
  'purchases',
  'sales',
  'expenses',
  'documents',
  'customers',
  'sellers',
  'financeAccounts',
  'payments',
  'cashbook',
] as const;

export type SyncCollectionName = (typeof SYNC_COLLECTIONS)[number];

export interface CloudSyncStatus {
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  error: string | null;
  syncedCount: number;
}

/**
 * Recursively removes keys with `undefined` values and sanitizes payloads for Firestore.
 * Firestore strictly forbids `undefined` in document fields and batches.
 */
export function sanitizeForFirestore<T = any>(value: any): T {
  if (value === undefined) {
    return null as any;
  }
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'number' && isNaN(value)) {
      return 0 as any;
    }
    return value;
  }
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : (value.toISOString() as any);
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForFirestore(item)) as any;
  }
  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(value)) {
    if (val !== undefined) {
      sanitized[key] = sanitizeForFirestore(val);
    }
  }
  return sanitized as T;
}

class CloudSyncService {
  private activeListeners: Unsubscribe[] = [];
  private currentUserId: string | null = null;
  private isProcessingRemoteUpdate = false;
  private statusListeners: ((status: CloudSyncStatus) => void)[] = [];

  private status: CloudSyncStatus = {
    isSyncing: false,
    lastSyncedAt: null,
    error: null,
    syncedCount: 0,
  };

  public getStatus(): CloudSyncStatus {
    return { ...this.status };
  }

  public subscribeStatus(listener: (status: CloudSyncStatus) => void): () => void {
    this.statusListeners.push(listener);
    listener(this.getStatus());
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener);
    };
  }

  private updateStatus(patch: Partial<CloudSyncStatus>) {
    this.status = { ...this.status, ...patch };
    this.statusListeners.forEach((l) => l(this.getStatus()));
  }

  /**
   * Start real-time Firestore synchronization for the authenticated user.
   * Listens to all showroom collections in Firestore and updates local IndexedDB when changes arrive.
   */
  public startRealtimeSync(userId: string, onDataChanged: () => void): () => void {
    this.stopRealtimeSync();
    this.currentUserId = userId;

    // 1. Listen to each collection
    SYNC_COLLECTIONS.forEach((storeName) => {
      try {
        const colRef = collection(db, 'users', userId, storeName);
        const unsubscribe = onSnapshot(
          colRef,
          async (snapshot) => {
            if (snapshot.empty && !this.status.lastSyncedAt) {
              // Initial empty snapshot - might need initial push from local
              return;
            }

            // Check if changes came from another client
            let hasRemoteChanges = false;

            for (const change of snapshot.docChanges()) {
              const docId = change.doc.id;
              const data = change.doc.data();

              // Skip if pending local write to prevent echo
              if (change.doc.metadata.hasPendingWrites) {
                continue;
              }

              if (change.type === 'added' || change.type === 'modified') {
                try {
                  await dbManager.put(storeName, data as any);
                  hasRemoteChanges = true;
                } catch (err) {
                  console.error(`Failed to save remote doc to ${storeName}:`, err);
                }
              } else if (change.type === 'removed') {
                try {
                  await dbManager.delete(storeName, docId);
                  hasRemoteChanges = true;
                } catch (err) {
                  console.error(`Failed to delete remote doc from ${storeName}:`, err);
                }
              }
            }

            if (hasRemoteChanges) {
              this.isProcessingRemoteUpdate = true;
              try {
                onDataChanged();
                this.updateStatus({
                  lastSyncedAt: new Date(),
                  error: null,
                });
              } finally {
                this.isProcessingRemoteUpdate = false;
              }
            }
          },
          (error) => {
            console.error(`Firestore real-time sync error on ${storeName}:`, error);
            this.updateStatus({ error: error.message });
          }
        );

        this.activeListeners.push(unsubscribe);
      } catch (err: any) {
        console.error(`Failed to attach listener for ${storeName}:`, err);
      }
    });

    // 2. Listen to showroom settings
    try {
      const settingsDocRef = doc(db, 'users', userId, 'settings', 'general');
      const unsubscribeSettings = onSnapshot(
        settingsDocRef,
        async (snap) => {
          if (snap.exists() && !snap.metadata.hasPendingWrites) {
            const remoteSettings = snap.data() as ShowroomSettings;
            if (remoteSettings && remoteSettings.shopName) {
              await dbManager.saveSettings(remoteSettings);
              onDataChanged();
              this.updateStatus({ lastSyncedAt: new Date() });
            }
          }
        },
        (err) => {
          console.error('Settings sync error:', err);
        }
      );
      this.activeListeners.push(unsubscribeSettings);
    } catch (err) {
      console.error('Failed to attach settings listener:', err);
    }

    // 3. Trigger initial two-way reconciliation in the background
    this.reconcileInitialSync(userId, onDataChanged).catch((err) => {
      console.warn('Initial reconciliation error:', err);
    });

    return () => this.stopRealtimeSync();
  }

  /**
   * Stop all active real-time listeners
   */
  public stopRealtimeSync(): void {
    this.activeListeners.forEach((unsub) => {
      try {
        unsub();
      } catch (err) {
        console.error('Error unsubscribing listener:', err);
      }
    });
    this.activeListeners = [];
    this.currentUserId = null;
  }

  /**
   * Initial reconciliation when user logs in:
   * If Firestore has data, pull down missing records to IndexedDB.
   * If IndexedDB has records not yet in Firestore, upload them.
   */
  public async reconcileInitialSync(userId: string, onDataChanged: () => void): Promise<void> {
    if (this.status.isSyncing) return;
    this.updateStatus({ isSyncing: true, error: null });

    try {
      let totalSynced = 0;

      for (const storeName of SYNC_COLLECTIONS) {
        // Fetch remote records from Firestore
        const colRef = collection(db, 'users', userId, storeName);
        const remoteSnap = await getDocs(colRef);
        const localList = await dbManager.getAll<any>(storeName);

        const remoteMap = new Map<string, any>();
        remoteSnap.docs.forEach((d) => remoteMap.set(d.id, d.data()));

        const localMap = new Map<string, any>();
        localList.forEach((item) => {
          if (item && item.id) localMap.set(item.id, item);
        });

        // 1. Download missing/remote items to IndexedDB
        for (const [id, remoteDoc] of remoteMap.entries()) {
          if (!localMap.has(id)) {
            await dbManager.put(storeName, remoteDoc);
            totalSynced++;
          }
        }

        // 2. Upload local items not yet in Firestore
        const batch = writeBatch(db);
        let batchCount = 0;

        for (const [id, localDoc] of localMap.entries()) {
          if (!remoteMap.has(id)) {
            const docRef = doc(db, 'users', userId, storeName, id);
            batch.set(docRef, sanitizeForFirestore({ ...localDoc, userId }), { merge: true });
            batchCount++;
            totalSynced++;
          }
        }

        if (batchCount > 0) {
          await batch.commit();
        }
      }

      // Settings sync
      const settingsDocRef = doc(db, 'users', userId, 'settings', 'general');
      const localSettings = await dbManager.getSettings();
      if (localSettings) {
        await setDoc(settingsDocRef, sanitizeForFirestore({ ...localSettings, userId }), { merge: true });
      }

      this.updateStatus({
        isSyncing: false,
        lastSyncedAt: new Date(),
        syncedCount: totalSynced,
        error: null,
      });

      onDataChanged();
    } catch (err: any) {
      console.error('Initial cloud reconciliation failed:', err);
      this.updateStatus({
        isSyncing: false,
        error: err.message || 'Sync failed',
      });
    }
  }

  /**
   * Upload all local IndexedDB data to Firestore (force sync)
   */
  public async pushAllToCloud(userId: string): Promise<{ success: boolean; count: number; error?: string }> {
    this.updateStatus({ isSyncing: true, error: null });

    try {
      let count = 0;

      for (const storeName of SYNC_COLLECTIONS) {
        const localItems = await dbManager.getAll<any>(storeName);
        if (localItems.length === 0) continue;

        // Write in batches of up to 400 (Firestore limit is 500)
        const batchSize = 400;
        for (let i = 0; i < localItems.length; i += batchSize) {
          const chunk = localItems.slice(i, i + batchSize);
          const batch = writeBatch(db);

          chunk.forEach((item) => {
            if (item && item.id) {
              const docRef = doc(db, 'users', userId, storeName, String(item.id));
              batch.set(docRef, sanitizeForFirestore({ ...item, userId }), { merge: true });
              count++;
            }
          });

          await batch.commit();
        }
      }

      // Settings
      const settings = await dbManager.getSettings();
      if (settings) {
        const docRef = doc(db, 'users', userId, 'settings', 'general');
        await setDoc(docRef, sanitizeForFirestore({ ...settings, userId }), { merge: true });
        count++;
      }

      this.updateStatus({
        isSyncing: false,
        lastSyncedAt: new Date(),
        syncedCount: count,
        error: null,
      });

      return { success: true, count };
    } catch (err: any) {
      console.error('Push all to cloud failed:', err);
      this.updateStatus({
        isSyncing: false,
        error: err.message || 'Cloud upload failed',
      });
      return { success: false, count: 0, error: err.message };
    }
  }

  /**
   * Save a single modified entity to Firestore immediately
   */
  public async pushEntity(userId: string, storeName: SyncCollectionName, entity: any): Promise<void> {
    if (!userId || !entity || !entity.id) return;
    try {
      const docRef = doc(db, 'users', userId, storeName, String(entity.id));
      await setDoc(docRef, sanitizeForFirestore({ ...entity, userId }), { merge: true });
      this.updateStatus({ lastSyncedAt: new Date() });
    } catch (err) {
      console.warn(`Failed to push ${storeName}/${entity.id} to cloud:`, err);
    }
  }

  /**
   * Delete a single entity from Firestore immediately
   */
  public async deleteEntity(userId: string, storeName: SyncCollectionName, docId: string): Promise<void> {
    if (!userId || !docId) return;
    try {
      const docRef = doc(db, 'users', userId, storeName, docId);
      await deleteDoc(docRef);
      this.updateStatus({ lastSyncedAt: new Date() });
    } catch (err) {
      console.warn(`Failed to delete ${storeName}/${docId} from cloud:`, err);
    }
  }
}

export const cloudSyncService = new CloudSyncService();
