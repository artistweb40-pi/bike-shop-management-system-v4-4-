/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig as any);

// Initialize Firebase Auth singleton
export const auth = getAuth(app);

// Initialize Firestore singleton with custom databaseId if configured
const customDbId = (firebaseConfig as any).firestoreDatabaseId;
export const db =
  customDbId && customDbId !== '(default)'
    ? getFirestore(app, customDbId)
    : getFirestore(app);

// Helper to test Firestore connection
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is offline:', error.message);
    }
    return false;
  }
}
