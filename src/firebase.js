import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSy_MOCK_API_KEY",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mhcollection-f9e49.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mhcollection-f9e49",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mhcollection-f9e49.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "67986725415",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:67986725415:web:0907f1d44063f4787a8c02",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-HB3RJVS73S"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
