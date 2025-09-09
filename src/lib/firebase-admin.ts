// src/lib/firebase-admin.ts
import admin from 'firebase-admin';

let isInitialized = false;

/**
 * A singleton pattern to initialize Firebase Admin SDK.
 * Ensures that the SDK is initialized only once.
 */
export async function initializeFirebaseAdmin() {
  if (isInitialized) {
    return;
  }

  console.log("🔥 [Firebase Admin] Initializing Admin SDK...");

  if (admin.apps.length > 0) {
    isInitialized = true;
    console.log("🔥 [Firebase Admin] ✅ Admin SDK was already initialized.");
    return;
  }
  
  const adminConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (!adminConfig.projectId || !adminConfig.clientEmail || !adminConfig.privateKey) {
      console.error("🔥 [Firebase Admin] ❌ Missing Firebase Admin SDK configuration. Check environment variables.");
      throw new Error('Firebase Admin SDK configuration is incomplete.');
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(adminConfig),
    });
    isInitialized = true;
    console.log("🔥 [Firebase Admin] ✅ Admin SDK initialized successfully.");
  } catch (error: any) {
    console.error("🔥 [Firebase Admin] ❌ Error initializing Admin SDK:", error.message);
    throw new Error("Could not initialize Firebase Admin SDK: " + error.message);
  }
}

/**
 * Returns the Firebase Admin Auth service.
 * Throws an error if the SDK has not been initialized.
 * @returns {admin.auth.Auth} The Firebase Admin Auth service.
 */
export function getAdminAuth(): admin.auth.Auth {
    if (!isInitialized) {
        throw new Error("Firebase Admin SDK not initialized. Call initializeFirebaseAdmin() first.");
    }
    return admin.auth();
}