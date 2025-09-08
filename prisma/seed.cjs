const { PrismaClient } = require('@prisma/client');
const { Role, UserSex } = require('@prisma/client');
const admin = require('firebase-admin');

// Load environment variables
require('dotenv').config();

const prisma = new PrismaClient();

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  if (admin.apps.length) {
    return admin;
  }
  
  const adminConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (!adminConfig.projectId || !adminConfig.clientEmail || !adminConfig.privateKey) {
    throw new Error('Firebase Admin SDK configuration is incomplete. Check environment variables.');
  }
  
  admin.initializeApp({
    credential: admin.credential.cert(adminConfig),
  });
  
  return admin;
}


const users = [
  {
    email: 'admin@test.com',
    password: 'password',
    role: Role.ADMIN,
    profile: {
      name: 'Admin',
      surname: 'User',
    },
  },
  {
    email: 'agent@test.com',
    password: 'password',
    role: Role.AGENT_ADMINISTRATIF,
    profile: {
      name: 'Agent',
      surname: 'Administratif',
    },
  },
  {
    email: 'teacher@test.com',
    password: 'password',
    role: Role.TEACHER,
    profile: {
      name: 'Teacher',
      surname: 'User',
      phone: '123456789',
      address: '123 Teacher Lane',
      bloodType: 'O+',
      sex: UserSex.MALE,
    },
  },
  {
    email: 'student@test.com',
    password: 'password',
    role: Role.STUDENT,
    profile: {
      name: 'Student',
      surname: 'User',
      phone: '987654321',
      address: '456 Student St',
      bloodType: 'A+',
      birthday: new Date('2010-05-15'),
      sex: UserSex.FEMALE,
    },
  },
  {
    email: 'parent@test.com',
    password: 'password',
    role: Role.PARENT,
    profile: {
      name: 'Parent',
      surname: 'User',
      phone: '555555555',
      address: '789 Parent Ave',
    },
  },
];

async function seedUser(firebaseAuth, userData) {
  const { email, password, role, profile } = userData;
  let firebaseUser;

  try {
    // Check if user exists in Firebase Auth
    firebaseUser = await firebaseAuth.getUserByEmail(email);
    console.log(`User ${email} already exists in Firebase. Updating...`);
    await firebaseAuth.updateUser(firebaseUser.uid, {
      password: password,
      emailVerified: true,
    });
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log(`User ${email} not found in Firebase. Creating...`);
      firebaseUser = await firebaseAuth.createUser({
        email: email,
        password: password,
        emailVerified: true,
      });
    } else {
      throw error; // Re-throw other errors
    }
  }

  // Set custom claims
  await firebaseAuth.setCustomUserClaims(firebaseUser.uid, { role });
  console.log(`Custom claims set for ${email}.`);

  // Upsert user in Prisma database
  const fullName = `${profile.name} ${profile.surname}`;
  const prismaUser = await prisma.user.upsert({
    where: { email: email },
    update: {
      name: fullName,
      firstName: profile.name,
      lastName: profile.surname,
      role: role,
    },
    create: {
      id: firebaseUser.uid, // Use Firebase UID as the primary key
      email: email,
      username: email,
      name: fullName,
      firstName: profile.name,
      lastName: profile.surname,
      role: role,
      active: true,
    },
  });

  // Create or update role-specific profile
  const profileData = { userId: prismaUser.id, ...profile };
  
  switch (role) {
    case Role.ADMIN:
      await prisma.admin.upsert({ where: { userId: prismaUser.id }, update: profileData, create: profileData });
      break;
    case Role.AGENT_ADMINISTRATIF:
       await prisma.agentAdministratif.upsert({ where: { userId: prismaUser.id }, update: profileData, create: profileData });
       break;
    case Role.TEACHER:
      await prisma.teacher.upsert({ where: { userId: prismaUser.id }, update: profileData, create: profileData });
      break;
    case Role.STUDENT:
       const parent = await prisma.parent.findFirst();
       const grade = await prisma.grade.findFirst();
       const classe = await prisma.class.findFirst();
       if (!parent || !grade || !classe) {
           console.warn('Cannot create student profile: Missing Parent, Grade, or Class data.');
           return;
       }
      const studentProfileData = { ...profileData, parentId: parent.id, gradeId: grade.id, classId: classe.id };
      await prisma.student.upsert({ where: { userId: prismaUser.id }, update: studentProfileData, create: studentProfileData });
      break;
    case Role.PARENT:
      await prisma.parent.upsert({ where: { userId: prismaUser.id }, update: profileData, create: profileData });
      break;
  }
  
  console.log(`Successfully seeded user: ${email} with role: ${role}`);
}

async function main() {
    console.log("🚀 Starting the seeding process...");
    const firebaseAdmin = initializeFirebaseAdmin();
    const firebaseAuth = firebaseAdmin.auth();

    // 1. Seed Grades first as they are dependencies
    console.log('Seeding grades...');
    await prisma.grade.upsert({ where: { level: 7 }, update: {}, create: { level: 7 } });
    await prisma.grade.upsert({ where: { level: 8 }, update: {}, create: { level: 8 } });
    await prisma.grade.upsert({ where: { level: 9 }, update: {}, create: { level: 9 } });

    // 2. Seed a default class
    console.log('Seeding a default class...');
    const grade7 = await prisma.grade.findUnique({ where: { level: 7 } });
    if (grade7) {
        await prisma.class.upsert({
            where: { name: '7ème Base 1' },
            update: {},
            create: { name: '7ème Base 1', gradeId: grade7.id, capacity: 30, abbreviation: '7B1' },
        });
    }

    // 3. Seed users
    for (const user of users) {
        await seedUser(firebaseAuth, user);
    }

    console.log("✅ Seeding process completed successfully.");
}

main()
  .catch((e) => {
    console.error("❌ An error occurred during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
