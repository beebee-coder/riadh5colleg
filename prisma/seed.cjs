// prisma/seed.cjs
const { PrismaClient } = require('@prisma/client');
const admin = require('firebase-admin');

const prisma = new PrismaClient();

// Initialisation de Firebase Admin SDK
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (admin.apps.length === 0) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log("🔥 [Firebase Admin Seed] SDK Admin initialisé avec succès.");
    } catch(e) {
        console.error("❌ [Firebase Admin Seed] Erreur d'initialisation :", e);
        process.exit(1);
    }
}


const users = [
  {
    id: 'seed-admin-01',
    email: 'admin@test.com',
    role: 'ADMIN',
    name: 'Admin User',
    password: 'password'
  },
  {
    id: 'seed-teacher-01',
    email: 'teacher@test.com',
    role: 'TEACHER',
    name: 'Teacher User',
    password: 'password'
  },
  {
    id: 'seed-student-01',
    email: 'student@test.com',
    role: 'STUDENT',
    name: 'Student User',
    password: 'password'
  },
  {
    id: 'seed-parent-01',
    email: 'parent@test.com',
    role: 'PARENT',
    name: 'Parent User',
    password: 'password'
  },
  {
    id: 'seed-agent-01',
    email: 'agent@test.com',
    role: 'AGENT_ADMINISTRATIF',
    name: 'Agent User',
    password: 'password'
  }
];

async function seed() {
  console.log("🌱 Démarrage du processus de seeding...");

  // --- Nettoyage des utilisateurs Firebase ---
  try {
    console.log("🔥 Suppression des anciens utilisateurs Firebase...");
    const listUsersResult = await admin.auth().listUsers(1000);
    const uidsToDelete = listUsersResult.users.map(u => u.uid);
    if(uidsToDelete.length > 0) {
      const deleteResult = await admin.auth().deleteUsers(uidsToDelete);
      console.log(`✅ ${deleteResult.successCount} utilisateurs Firebase supprimés.`);
      if (deleteResult.failureCount > 0) {
        console.warn(`⚠️ ${deleteResult.failureCount} utilisateurs Firebase n'ont pas pu être supprimés.`);
      }
    } else {
      console.log("ℹ️ Aucun utilisateur Firebase à supprimer.");
    }
  } catch(error) {
    console.error("❌ Erreur lors de la suppression des utilisateurs Firebase :", error);
  }

  // --- Création/Mise à jour des utilisateurs ---
  for (const user of users) {
    try {
      console.log(`🔥 Création de l'utilisateur Firebase pour ${user.email}...`);
      await admin.auth().createUser({
        uid: user.id,
        email: user.email,
        password: user.password,
        displayName: user.name,
        emailVerified: true,
        disabled: false
      });
      await admin.auth().setCustomUserClaims(user.id, { role: user.role });
      console.log(`✅ Utilisateur Firebase créé/mis à jour pour ${user.email}`);

      console.log(`📦 Mise à jour de la base de données PostgreSQL pour ${user.email}...`);
      const [firstName, ...lastNameParts] = user.name.split(' ');
      const lastName = lastNameParts.join(' ') || '';
      
      const userData = {
        id: user.id,
        email: user.email,
        username: user.email,
        role: user.role,
        name: user.name,
        firstName: firstName,
        lastName: lastName,
        active: true,
      };

      await prisma.user.upsert({
        where: { id: user.id },
        update: userData,
        create: userData,
      });

      // Create role-specific profile
      switch(user.role) {
        case 'ADMIN':
          await prisma.admin.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });
          break;
        case 'TEACHER':
          await prisma.teacher.upsert({ where: { userId: user.id }, update: { name: firstName, surname: lastName }, create: { userId: user.id, name: firstName, surname: lastName } });
          break;
        case 'PARENT':
           await prisma.parent.upsert({ where: { userId: user.id }, update: { name: firstName, surname: lastName }, create: { userId: user.id, name: firstName, surname: lastName, address: 'N/A' } });
           break;
        case 'STUDENT':
          // Student requires a class, grade, and parent. We skip creating a profile here as it needs relationships.
          break;
        case 'AGENT_ADMINISTRATIF':
          await prisma.agentAdministratif.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });
          break;
      }
      console.log(`✅ Base de données mise à jour pour ${user.email}.`);

    } catch (error) {
      if (error.code === 'auth/uid-already-exists') {
        console.warn(`⚠️ L'utilisateur avec l'UID ${user.id} existe déjà dans Firebase. Tentative de mise à jour.`);
        await admin.auth().updateUser(user.id, {
           email: user.email,
           password: user.password,
           displayName: user.name,
        });
        await admin.auth().setCustomUserClaims(user.id, { role: user.role });
      } else {
        console.error(`❌ Erreur lors du seeding pour l'utilisateur ${user.email}:`, error);
      }
    }
  }

  console.log("🎉 Seeding terminé avec succès !");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
