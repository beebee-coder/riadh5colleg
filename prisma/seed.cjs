const { PrismaClient, Role } = require('@prisma/client');
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');

// Initialize Prisma Client
const prisma = new PrismaClient();

// Initialize Firebase Admin
try {
  console.log('🌱 [Seed] Initializing Firebase Admin...');
  const serviceAccount = require('./school-management-426516-firebase-adminsdk-j8v1y-ab239a045c.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('🔥 [Firebase Admin] Admin SDK initialized successfully.');
} catch (error) {
  console.error('🔥 [Firebase Admin] Error initializing Admin SDK:', error.message);
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error('🔥 [Firebase Admin] Please ensure the serviceAccountKey.json file is in the correct path.');
  }
  process.exit(1);
}

// Predefined users
const users = [
  { email: 'admin@test.com', password: 'password', role: Role.ADMIN, name: 'Admin', surname: 'User' },
  { email: 'agent@test.com', password: 'password', role: Role.AGENT_ADMINISTRATIF, name: 'Agent', surname: 'Admin' },
  { email: 'teacher@test.com', password: 'password', role: Role.TEACHER, name: 'Teacher', surname: 'User' },
  { email: 'student@test.com', password: 'password', role: Role.STUDENT, name: 'Student', surname: 'User', address: '123 Main St', parentEmail: 'parent@test.com' },
  { email: 'parent@test.com', password: 'password', role: Role.PARENT, name: 'Parent', surname: 'User', address: '123 Main St' },
];

async function main() {
  console.log('🌱 [Seed] Starting the seeding process...');

  for (const userData of users) {
    const { email, password, role, name, surname, address, parentEmail } = userData;

    try {
      // Get or create Firebase user
      let firebaseUser;
      try {
        firebaseUser = await admin.auth().getUserByEmail(email);
        console.log(`🔍 [Seed] Firebase user found for ${email} (UID: ${firebaseUser.uid}). Updating role...`);
        // Update user claims if they differ
        if (firebaseUser.customClaims?.role !== role) {
          await admin.auth().setCustomUserClaims(firebaseUser.uid, { role });
        }
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          console.log(`✨ [Seed] No Firebase user for ${email}. Creating one...`);
          firebaseUser = await admin.auth().createUser({
            email,
            password,
            emailVerified: true,
          });
          await admin.auth().setCustomUserClaims(firebaseUser.uid, { role });
          console.log(`✅ [Seed] Firebase user created for ${email} (UID: ${firebaseUser.uid}).`);
        } else {
          throw error; // Re-throw other Firebase errors
        }
      }

      // Upsert user in Prisma
      console.log(`🔄 [Seed] Upserting user in Prisma for ${email}...`);
      const hashedPassword = await bcrypt.hash(password, 10);

      const userPayload = {
        id: firebaseUser.uid,
        email,
        username: email.split('@')[0],
        password: hashedPassword,
        name: `${name} ${surname}`,
        role,
        active: true,
      };

      // Role-specific data
      let profileData = {};
      if (role === Role.ADMIN) {
        profileData = { admin: { create: { name, surname } } };
      } else if (role === Role.AGENT_ADMINISTRATIF) {
        profileData = { agent: { create: { name, surname } } };
      } else if (role === Role.TEACHER) {
        profileData = { teacher: { create: { name, surname } } };
      } else if (role === Role.STUDENT) {
        const parent = await prisma.user.findUnique({ where: { email: parentEmail } });
        profileData = { student: { create: { name, surname, sex: 'MALE', address, parentId: parent.id } } };
      } else if (role === Role.PARENT) {
        profileData = { parent: { create: { name, surname, address } } };
      }

      await prisma.user.upsert({
        where: { email },
        update: userPayload,
        create: { ...userPayload, ...profileData },
      });

      console.log(`✅ [Seed] Profile ${role} for ${email} synchronized.`);
    } catch (error) {
      console.error(`❌ [Seed] Error processing user ${email}:`, error.message);
      if (error.code === 'auth/email-already-exists') {
        console.error(`
          A user with this email may already exist in Firebase under a different UID. 
          Consider deleting it from the Firebase console before re-running the seed.
        `);
      }
    }
  }

  // Seeding Grades
  console.log('🌱 [Seed] Creating Grades...');
  const grades = [7, 8, 9];
  for (const level of grades) {
    await prisma.grade.upsert({
      where: { level },
      update: {},
      create: { level },
    });
    console.log(`- Grade ${level} created/verified.`);
  }

  console.log('🌱 [Seed] All seeding operations are complete.');
}

main()
  .catch((e) => {
    console.error('🔴 [Seed] A critical error occurred:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔚 [Seed] Prisma client disconnected.');
  });
