/**
 * @fileoverview Initializes the Firebase Admin SDK.
 *
 * This file should only be imported on the server side.
 * It initializes the Firebase Admin SDK with credentials from a local file,
 * ensuring that the SDK is only initialized once.
 */
import * as admin from 'firebase-admin';
import credentials from './firebase-credentials.json';

let db: admin.firestore.Firestore | null = null;

/**
 * Initializes the Firebase Admin SDK if not already initialized.
 * IMPORTANT: You must replace the placeholder in firebase-credentials.json with your actual private key.
 */
function initializeAdminApp() {
  if (admin.apps.length === 0) {
    try {
      // Ensure you have replaced the placeholder in the credentials file.
      if (credentials.private_key === 'PLEASE_REPLACE_WITH_YOUR_REAL_PRIVATE_KEY_FROM_FIREBASE_CONSOLE') {
        throw new Error('Private key is a placeholder. Please update src/services/firebase-credentials.json');
      }

      admin.initializeApp({
        credential: admin.credential.cert(credentials as admin.ServiceAccount),
      });
      console.log('Firebase Admin SDK initialized.');
    } catch (error: any) {
        console.error('Failed to initialize Firebase Admin SDK:', error.message);
        throw new Error(`Failed to initialize Firebase Admin SDK. Details: ${error.message}`);
    }
  }
}

/**
 * Returns the admin Firestore instance.
 * Initializes the admin app if it hasn't been already.
 */
export function adminDb(): admin.firestore.Firestore {
  if (!db) {
    initializeAdminApp();
    db = admin.firestore();
  }
  return db;
}
