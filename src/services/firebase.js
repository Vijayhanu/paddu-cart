// Firebase configuration and initialization
// Update your credentials in a .env.local file or directly here.
// Example:
// VITE_FIREBASE_API_KEY=your_api_key
// VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
// VITE_FIREBASE_PROJECT_ID=your_project_id
// VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
// VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
// VITE_FIREBASE_APP_ID=your_app_id

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// Initialize Firebase only if keys are present/configured.
// This prevents errors during local development mock testing.
let app;
let auth;
let firebaseDb;

try {
  if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    firebaseDb = getFirestore(app);
    console.log("Firebase initialized successfully!");
  } else {
    // Stubs for mock mode
    auth = {
      currentUser: null,
      signInWithEmailAndPassword: async () => ({ user: { email: 'admin@paddupoint.com' } }),
      signOut: async () => {},
      onAuthStateChanged: (cb) => {
        // Return dummy unsubscribe
        return () => {};
      }
    };
    firebaseDb = {};
  }
} catch (error) {
  console.warn("Firebase initialization failed. Falling back to mock dashboard.", error);
}

export { auth, firebaseDb };

/*
================================================================================
FIRESTORE COLLECTION SCHEMA SCHEMES FOR PRODUCTION DEPLOYMENT
================================================================================

1. Collection: `menu`
   - Document ID: Auto-generated or custom (e.g. `plain_paddu`)
   - Fields:
     - `name`: string (e.g. "Plain Paddu")
     - `price`: number (e.g. 40)
     - `category`: string (e.g. "Plain")
     - `description`: string (e.g. "Served with spicy chutney")
     - `available`: boolean (e.g. true)
     - `image`: string (URL to stored image or empty)

2. Collection: `orders`
   - Document ID: Auto-generated
   - Fields:
     - `orderNumber`: number (e.g. 1024)
     - `timestamp`: timestamp
     - `status`: string ("Pending" | "Preparing" | "Ready" | "Delivered")
     - `orderType`: string ("Dine In" | "Parcel")
     - `tableNumber`: string (e.g. "3" or null)
     - `totalPrice`: number (e.g. 130)
     - `feedbackSubmitted`: boolean (e.g. false)
     - `items`: array of maps
       - `id`: string
       - `name`: string
       - `price`: number
       - `quantity`: number
     - `time_pending`: timestamp
     - `time_preparing`: timestamp
     - `time_ready`: timestamp
     - `time_delivered`: timestamp

3. Collection: `feedback`
   - Document ID: Auto-generated
   - Fields:
     - `orderId`: string
     - `orderNumber`: number
     - `rating`: number (1-5)
     - `comment`: string
     - `timestamp`: timestamp

4. Collection: `settings`
   - Document ID: `config` (single document)
   - Fields:
     - `upiId`: string (e.g. "vijay@okaxis")
     - `whatsappNumber`: string (e.g. "+919876543210")
     - `preparationTime`: string (e.g. "15")
*/
