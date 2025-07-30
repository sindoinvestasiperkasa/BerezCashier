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
  // Diagnostic log to check if credentials are loaded.
  console.log('Attempting to initialize Firebase Admin SDK...');
  if (!credentials || !credentials.project_id) {
      console.error('firebase-credentials.json is not loaded correctly or project_id is missing.');
      throw new Error('firebase-credentials.json is not loaded correctly or project_id is missing.');
  }
  console.log(`Credentials loaded for project: ${credentials.project_id}`);

  if (admin.apps.length === 0) {
    try {
      // Ensure you have replaced the placeholder in the credentials file.
      if (credentials.private_key === 'PLEASE_REPLACE_WITH_YOUR_REAL_PRIVATE_KEY_FROM_FIREBASE_CONSOLE') {
        console.error('Private key in firebase-credentials.json is a placeholder.');
        throw new Error('Private key is a placeholder. Please update src/services/firebase-credentials.json');
      }

      admin.initializeApp({
        credential: admin.credential.cert(credentials as admin.ServiceAccount),
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } catch (error: any) {
        console.error('Failed to initialize Firebase Admin SDK:', error.message);
        throw new Error(`Failed to initialize Firebase Admin SDK. Details: ${error.message}`);
    }
  } else {
    console.log('Firebase Admin SDK already initialized.');
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
