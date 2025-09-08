// src/lib/firebase-admin-for-seed.js
const admin = require('firebase-admin');

// This separate initializer is for scripts like `seed.cjs` that run in a Node.js environment.
// It uses CommonJS `require` instead of ES module `import`.

function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    console.log("🔥 [Firebase Admin Seed] Initializing Admin SDK for seeding...");
    
    const adminConfig = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    if (!adminConfig.projectId || !adminConfig.clientEmail || !adminConfig.privateKey) {
        const message = "🔥 [Firebase Admin Seed] ❌ Missing Firebase Admin SDK configuration.";
        console.error(message);
        throw new Error(message);
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert(adminConfig),
      });
      console.log("🔥 [Firebase Admin Seed] ✅ Admin SDK initialized successfully.");
    } catch (error) {
      const message = "Could not initialize Firebase Admin SDK for seeding: " + error.message;
      console.error("🔥 [Firebase Admin Seed] ❌ " + message);
      throw new Error(message);
    }
  }
  return admin;
}

module.exports = { initializeFirebaseAdmin };
