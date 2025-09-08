// prisma/seed.cjs
const { PrismaClient } = require('@prisma/client');
const { initializeFirebaseAdmin } = require('../src/lib/firebase-admin-for-seed');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

const usersToSeed = [
  {
    email: 'admin@test.com',
    password: 'password123',
    role: 'ADMIN',
    name: 'Admin',
    surname: 'User',
    profileData: {},
  },
  {
    email: 'teacher@test.com',
    password: 'password123',
    role: 'TEACHER',
    name: 'Teacher',
    surname: 'User',
    profileData: {},
  },
  {
    email: 'agent@test.com',
    password: 'password123',
    role: 'AGENT_ADMINISTRATIF',
    name: 'Agent',
    surname: 'Admin',
    profileData: {},
  },
  {
    email: 'parent@test.com',
    password: 'password123',
    role: 'PARENT',
    name: 'Parent',
    surname: 'User',
    profileData: { address: '123 Main St' },
  },
  {
    email: 'student@test.com',
    password: 'password123',
    role: 'STUDENT',
    name: 'Student',
    surname: 'User',
    profileData: {
      bloodType: 'O+',
      birthday: new Date('2010-05-20T00:00:00.000Z'),
      sex: 'MALE',
      address: '456 School Ln',
      phone: '555-1234',
    },
  },
];

async function main() {
  console.log('🌱 Starting database seeding...');
  const admin = await initializeFirebaseAdmin();
  const auth = admin.auth();

  for (const userData of usersToSeed) {
    const { email, password, role, name, surname, profileData } = userData;

    try {
      // 1. Get or Create Firebase User
      let firebaseUser;
      try {
        firebaseUser = await auth.getUserByEmail(email);
        console.log(`🔥 Found existing Firebase user: ${email} (UID: ${firebaseUser.uid})`);
      } catch (error) {
        if ((error as any).code === 'auth/user-not-found') {
          console.log(`🔥 Firebase user ${email} not found. Creating...`);
          firebaseUser = await auth.createUser({
            email,
            password,
            displayName: `${name} ${surname}`,
            emailVerified: true,
            disabled: false,
          });
          console.log(`🔥 Created Firebase user: ${email} (UID: ${firebaseUser.uid})`);
        } else {
          throw error; // Re-throw other Firebase errors
        }
      }

      const { uid } = firebaseUser;

      // 2. Set Firebase Custom Claims
      await auth.setCustomUserClaims(uid, { role });
      console.log(`👑 Set custom claim 'role: ${role}' for ${email}`);

      // 3. Create or Update user in PostgreSQL database using the Firebase UID
      const dbUser = await prisma.user.upsert({
        where: { id: uid },
        update: {
          email: email,
          username: email,
          name: `${name} ${surname}`,
          firstName: name,
          lastName: surname,
          role: role,
        },
        create: {
          id: uid,
          email: email,
          username: email,
          name: `${name} ${surname}`,
          firstName: name,
          lastName: surname,
          role: role,
        },
      });

      console.log(`📦 Synced user in DB: ${dbUser.email}`);

      // 4. Create or Update role-specific profile
      switch (role) {
        case 'ADMIN':
          await prisma.admin.upsert({
            where: { userId: uid },
            update: { name, surname },
            create: { userId: uid, name, surname, ...profileData },
          });
          break;
        case 'TEACHER':
          await prisma.teacher.upsert({
            where: { userId: uid },
            update: { name, surname },
            create: { userId: uid, name, surname, ...profileData },
          });
          break;
        case 'AGENT_ADMINISTRATIF':
          await prisma.agentAdministratif.upsert({
             where: { userId: uid },
             update: { name, surname },
             create: { userId: uid, name, surname, ...profileData },
          });
          break;
        case 'PARENT':
          await prisma.parent.upsert({
            where: { userId: uid },
            update: { name, surname },
            create: { userId: uid, name, surname, ...profileData },
          });
          break;
        case 'STUDENT':
          await prisma.student.upsert({
            where: { userId: uid },
            update: { name, surname },
            create: { userId: uid, name, surname, ...profileData },
          });
          break;
      }
      console.log(`✅ Successfully seeded user: ${email}`);
    } catch (error) {
      console.error(`❌ Failed to seed user ${email}:`, error);
    }
  }

  console.log('🌱 Seeding finished.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
