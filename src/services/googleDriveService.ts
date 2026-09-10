/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App and Auth
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig as any);
const auth = getAuth(app);

// Scopes required for Google Drive backup, restore, and file management
export const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({ prompt: 'select_account' });

export interface GoogleUser {
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}

export interface DriveFile {
  id: string;
  name: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface DriveQuota {
  limit?: string;
  usage?: string;
  usageInDrive?: string;
  userName?: string;
  userEmail?: string;
  userPhoto?: string;
}

// In-memory token and user cache (NEVER stored in localStorage or sessionStorage)
let cachedAccessToken: string | null = null;
let cachedUser: GoogleUser | null = null;
let isSigningIn = false;
let authStateListeners: Array<(user: GoogleUser | null, token: string | null) => void> = [];

/**
 * Initialize auth listener. Clears token on logout.
 */
export const initAuth = (
  onAuthSuccess?: (user: GoogleUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  const listener = (user: GoogleUser | null, token: string | null) => {
    if (user && token) {
      if (onAuthSuccess) onAuthSuccess(user, token);
    } else {
      if (onAuthFailure) onAuthFailure();
    }
  };

  authStateListeners.push(listener);

  // If already authenticated in memory, fire immediately
  if (cachedUser && cachedAccessToken) {
    listener(cachedUser, cachedAccessToken);
  }

  // Firebase auth state observer
  const unsubscribeFirebase = onAuthStateChanged(auth, async (user: User | null) => {
    if (!user) {
      cachedAccessToken = null;
      cachedUser = null;
      listener(null, null);
    } else if (cachedAccessToken && cachedUser) {
      listener(cachedUser, cachedAccessToken);
    }
  });

  // Return unsubscribe cleanup function
  return () => {
    authStateListeners = authStateListeners.filter((l) => l !== listener);
    unsubscribeFirebase();
  };
};

/**
 * Perform Google Sign-in via Firebase Auth Popup
 */
export const googleSignIn = async (): Promise<{ user: GoogleUser; accessToken: string } | null> => {
  if (isSigningIn) return null;

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error(
        'Authentication succeeded, but Google Drive access token was not provided by Google. Please ensure you allow Google Drive permissions.'
      );
    }

    const token = credential.accessToken;
    cachedAccessToken = token;

    const profile: GoogleUser = {
      displayName: result.user.displayName || 'Google User',
      email: result.user.email,
      photoURL: result.user.photoURL,
    };
    cachedUser = profile;

    // Notify all active listeners
    authStateListeners.forEach((fn) => fn(profile, token));
    return { user: profile, accessToken: token };
  } catch (error: any) {
    // Handle user cancellation gracefully
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request' ||
      error?.message?.includes('popup-closed-by-user') ||
      error?.message?.includes('popup_closed') ||
      error?.message?.includes('closed')
    ) {
      return null;
    }

    // Handle domain authorization issues gracefully
    if (
      error?.code === 'auth/unauthorized-domain' ||
      error?.message?.includes('unauthorized-domain')
    ) {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'current origin';
      throw new Error(
        `Authorized Domain Configuration: "${origin}" needs to be authorized in Firebase Console / Google Cloud Console under Authorized Domains. You can also export/import full JSON backups offline without any Google setup.`
      );
    }

    console.error('Google Sign In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Sign out and clear in-memory access token
 */
export const googleSignOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (err) {
    console.warn('Signout warning:', err);
  }
  cachedAccessToken = null;
  cachedUser = null;
  authStateListeners.forEach((fn) => fn(null, null));
};

/**
 * Retrieve the current in-memory access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = (): GoogleUser | null => {
  return cachedUser;
};

/**
 * Fetch Google Drive storage quota and user details
 */
export const getDriveStorageQuota = async (): Promise<DriveQuota | null> => {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const response = await fetch(
      'https://www.googleapis.com/drive/v3/about?fields=storageQuota,user',
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Drive quota: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      limit: data.storageQuota?.limit,
      usage: data.storageQuota?.usage,
      usageInDrive: data.storageQuota?.usageInDrive,
      userName: data.user?.displayName,
      userEmail: data.user?.emailAddress,
      userPhoto: data.user?.photoLink,
    };
  } catch (err) {
    console.error('Failed to get Drive storage quota:', err);
    return null;
  }
};

/**
 * List showroom backup files in Google Drive
 */
export const listDriveBackups = async (): Promise<DriveFile[]> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Please sign in with Google to access Google Drive.');
  }

  const query = encodeURIComponent("trashed = false and (name contains 'BikeShop' or name contains 'PakShowroom') and mimeType = 'application/json'");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,size,createdTime,modifiedTime,webViewLink)&orderBy=modifiedTime desc&pageSize=20`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to list files: ${response.statusText}`);
  }

  const data = await response.json();
  return data.files || [];
};

/**
 * Upload a complete Showroom Database backup to Google Drive using multipart upload
 */
export const uploadBackupToDrive = async (
  backupData: any,
  fileName?: string
): Promise<DriveFile> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Please sign in with Google to upload to Google Drive.');
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const actualFileName = fileName || `BikeShop_V4_Showroom_Backup_${timestamp}.json`;

  const metadata = {
    name: actualFileName,
    mimeType: 'application/json',
    description: 'Usman Trader and Autos - Complete Showroom Database Backup (V4 IndexedDB)',
    properties: {
      app: 'PakShowroomV4',
      type: 'complete_backup',
      exportedAt: new Date().toISOString(),
    },
  };

  const fileContent = JSON.stringify(backupData, null, 2);
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,createdTime,modifiedTime,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to upload backup: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Download a backup file from Google Drive and parse its JSON content
 */
export const downloadBackupFromDrive = async (fileId: string): Promise<any> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Please sign in with Google to download from Google Drive.');
  }

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to download backup: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Delete a file from Google Drive (Caller MUST confirm with user first!)
 */
export const deleteDriveFile = async (fileId: string): Promise<void> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Please sign in with Google to delete files.');
  }

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok && response.status !== 204) {
    throw new Error(`Failed to delete file from Google Drive: ${response.statusText}`);
  }
};
