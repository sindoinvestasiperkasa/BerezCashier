// src/services/firebase-admin.ts
import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let serviceAccount: admin.ServiceAccount | undefined;
const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

if (base64Key) {
  try {
    // Decode the Base64 string into a JSON string
    const serviceAccountJson = Buffer.from(base64Key, 'base64').toString('utf8');
    // Parse the JSON string into an object
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch (e) {
    console.error('Failed to parse Firebase service account key from Base64.', e);
  }
}

let db: admin.firestore.Firestore | null = null;

function initializeAdminApp() {
  if (admin.apps.length === 0) {
    if (!serviceAccount) {
      throw new Error(
        'Firebase service account key not found or failed to parse. Please check FIREBASE_SERVICE_ACCOUNT_BASE64 in your .env file.'
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
  return db!;
}
