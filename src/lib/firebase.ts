
"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);
const storage: FirebaseStorage = getStorage(app);

// Aktifkan persistensi offline
// Ini harus dipanggil setelah inisialisasi Firestore
if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db)
      .catch((err) => {
        if (err.code == 'failed-precondition') {
          // Kemungkinan besar karena beberapa tab terbuka, ini normal dalam development.
          // Aplikasi akan tetap berfungsi dengan cache per-tab.
          console.warn("Firestore: Gagal mengaktifkan persistensi offline, mungkin karena ada beberapa tab terbuka.");
        } else if (err.code == 'unimplemented') {
          // Browser tidak mendukung fitur ini.
          console.warn("Firestore: Browser ini tidak mendukung persistensi offline.");
        }
      });
}

export { app, db, auth, storage };
