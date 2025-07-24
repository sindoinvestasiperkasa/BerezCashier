"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCOrDrR-0t2WA0iM1s8MGZcQBf4L5VEiqY",
  authDomain: "berez-04d60.firebaseapp.com",
  projectId: "berez-04d60",
  storageBucket: "berez-04d60.firebasestorage.app",
  messagingSenderId: "892398272290",
  appId: "1:892398272290:web:1758dee6a40f447e816f7b",
};

const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);

export { app, db, auth };
