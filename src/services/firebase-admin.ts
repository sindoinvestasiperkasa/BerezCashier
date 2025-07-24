// src/services/firebase-admin.ts
import * as admin from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : undefined;

let db: admin.firestore.Firestore | null = null;

function initializeAdminApp() {
  if (admin.apps.length === 0) {
    if (!serviceAccount) {
      throw new Error(
        'Firebase service account key not found in environment variables. Please set FIREBASE_SERVICE_ACCOUNT_KEY.'
      );
    }
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  db = admin.firestore();
}

/**
 * Returns the admin Firestore instance.
 * Initializes the admin app if it hasn't been already.
 */
export function adminDb(): admin.firestore.Firestore {
  if (!db) {
    initializeAdminApp();
  }
  return db as admin.firestore.Firestore;
}
