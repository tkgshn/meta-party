import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate configuration
if (!firebaseConfig.projectId) {
  throw new Error('Firebase configuration is missing. Please check your environment variables.');
}

// Initialize Firebase app (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);

// Connect to emulators in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Check if we're not already connected to avoid errors
  try {
    if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectAuthEmulator(auth, 'http://localhost:9099');
      console.log('🔥 Connected to Firebase emulators');
    }
  } catch (error) {
    // Emulators might already be connected
    console.log('Firebase emulators connection skipped:', error);
  }
}

export default app;