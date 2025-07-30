/**
 * @fileoverview Initializes the Firebase Admin SDK using environment variables.
 *
 * This file should only be imported on the server side.
 * It initializes the Firebase Admin SDK with credentials from environment variables,
 * ensuring that the SDK is only initialized once.
 */
import * as admin from 'firebase-admin';

// Function to initialize the app and return the firestore instance.
function initializeAdmin() {
  // Check if the app is already initialized to prevent re-initialization.
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Construct the credential object from environment variables.
  const serviceAccount = {
    type: process.env.TYPE,
    project_id: process.env.PROJECT_ID,
    private_key_id: process.env.PRIVATE_KEY_ID,
    // Replace \\n with \n to ensure the private key is formatted correctly.
    private_key: (process.env.PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    client_email: process.env.CLIENT_EMAIL,
    client_id: process.env.CLIENT_ID,
    auth_uri: process.env.AUTH_URI,
    token_uri: process.env.TOKEN_URI,
    auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
    universe_domain: process.env.UNIVERSE_DOMAIN,
  } as admin.ServiceAccount;

  // Explicitly check for the placeholder private key. This is a critical check.
  if (!serviceAccount.private_key || serviceAccount.private_key.includes('PLEASE_REPLACE')) {
    throw new Error('STOP: Firebase Admin private key is missing or is a placeholder. Please check your .env file.');
  }

  // Initialize the Firebase Admin SDK.
  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  return app;
}

// Immediately initialize the app.
initializeAdmin();

// Export a function that returns the admin Firestore instance.
export function adminDb(): admin.firestore.Firestore {
  return admin.firestore();
}

    