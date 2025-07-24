// src/services/firebase-admin.ts
import * as admin from 'firebase-admin';

// Correctly parse the service account key from environment variables.
const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
let serviceAccount: admin.ServiceAccount | undefined;

if (serviceAccountString) {
  try {
    // The key is stored as a string, so it needs to be parsed into a JSON object.
    serviceAccount = JSON.parse(serviceAccountString);
  } catch (e) {
    console.error('Failed to parse Firebase service account key from environment variables.', e);
  }
}

let db: admin.firestore.Firestore | null = null;

function initializeAdminApp() {
  if (admin.apps.length === 0) {
    if (!serviceAccount) {
      throw new Error(
        'Firebase service account key not found or failed to parse. Please check FIREBASE_SERVICE_ACCOUNT_KEY in your .env file.'
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
