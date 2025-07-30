/**
 * @fileoverview Initializes the Firebase Admin SDK.
 *
 * This file should only be imported on the server side.
 * It initializes the Firebase Admin SDK with credentials from a local file,
 * ensuring that the SDK is only initialized once.
 */
import * as admin from 'firebase-admin';
import credentials from './firebase-credentials.json';

// A function to initialize the app and return the firestore instance.
function initializeAdmin() {
  // Check if the app is already initialized to prevent re-initialization.
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Explicitly check for the placeholder private key. This is a critical check.
  if (credentials.private_key === 'PLEASE_REPLACE_WITH_YOUR_REAL_PRIVATE_KEY_FROM_FIREBASE_CONSOLE') {
    throw new Error('STOP: Private key in src/services/firebase-credentials.json is a placeholder. You must replace it with your actual service account private key from the Firebase console.');
  }

  // Initialize the Firebase Admin SDK.
  const app = admin.initializeApp({
    credential: admin.credential.cert(credentials as admin.ServiceAccount),
  });

  return app;
}

// Immediately initialize the app.
initializeAdmin();

// Export a function that returns the admin Firestore instance.
export function adminDb(): admin.firestore.Firestore {
  return admin.firestore();
}
