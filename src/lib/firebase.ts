import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validate config before initialization
export const isConfigValid = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "undefined" && !firebaseConfig.apiKey.includes("YOUR_");

if (!isConfigValid) {
  console.warn("Firebase configuration is missing or invalid. Please set your VITE_FIREBASE_ environment variables.");
}

const app = initializeApp(isConfigValid ? firebaseConfig : { ...firebaseConfig, apiKey: "placeholder-to-prevent-crash" });
export const auth = getAuth(app);
export const db = getFirestore(app);
