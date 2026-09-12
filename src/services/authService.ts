/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from './firebase';

export interface AuthUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/**
 * Translate Firebase error codes into human-readable messages
 */
export function getFriendlyAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Invalid email or password. Please verify and try again.';
    case 'auth/user-not-found':
      return 'No account found with this email address. Please create an account first.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address format.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please ensure you are connected to the internet.';
    case 'auth/too-many-requests':
      return 'Access temporarily disabled due to many failed login attempts. Please try again later or reset password.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completing authentication.';
    case 'auth/popup-blocked':
      return 'Popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is being enabled in Firebase. Please ensure Email/Password provider is enabled.';
    default:
      return errorCode.replace('auth/', '').replace(/-/g, ' ');
  }
}

/**
 * Sign in with email and password
 */
export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return credential.user;
}

/**
 * Create a new user with email, password, and optional showroom display name
 */
export async function registerWithEmail(
  email: string,
  pass: string,
  displayName?: string
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  if (displayName && credential.user) {
    await updateProfile(credential.user, { displayName });
  }
  return credential.user;
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Sign in with Google provider
 */
export async function loginWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const credential = await signInWithPopup(auth, provider);
  return credential.user;
}

/**
 * Sign out current user
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Listen to auth state changes
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get current authenticated user
 */
export function getCurrentAuthUser(): User | null {
  return auth.currentUser;
}
