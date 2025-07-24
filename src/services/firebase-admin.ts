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
 */
function initializeAdminApp() {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(credentials as admin.ServiceAccount),
    });
    console.log('Firebase Admin SDK initialized.');
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
