// prisma/seed.cjs
const { PrismaClient, Role, UserSex } = require('@prisma/client');
const { getAuth } = require('firebase-admin/auth');
const { initializeFirebaseAdmin } = require('../src/lib/firebase-admin.ts');

const prisma = new PrismaClient();

const usersToSeed = [
  {
    email: 'admin@test.com',
    password: 'password',
    role: Role.ADMIN,
    profile: { name: 'Admin', surname: 'User' },
  },
  {
    email: 'agent@test.com',
    password: 'password',
    role: Role.AGENT_ADMINISTRATIF,
    profile: { name: 'Agent', surname: 'Administratif' },
  },
  {
    email: 'teacher@test.com',
    password: 'password',
    role: Role.TEACHER,
    profile: { name: 'Teacher', surname: 'User' },
  },
  {
    email: 'student@test.com',
    password: 'password',
    role: Role.STUDENT,
    profile: { 
      name: 'Student', 
      surname: 'User',
      birthday: new Date('2010-05-12'),
      sex: UserSex.MALE,
      address: '123 Test Street',
      bloodType: 'O+',
    },
  },
  {
    email: 'parent@test.com',
    password: 'password',
    role: Role.PARENT,
    profile: { 
      name: 'Parent', 
      surname: 'User',
      address: '456 Test Avenue',
      phone: '123-456-7890'
    },
  },
];

async function main() {
  console.log("🌱 [Seed] Initialisation de Firebase Admin...");
  await initializeFirebaseAdmin();
  const auth = getAuth();
  console.log("🌱 [Seed] Démarrage du processus de seeding...");

  for (const userData of usersToSeed) {
    const { email, password, role, profile } = userData;
    let userRecord;

    try {
      // Tenter de récupérer l'utilisateur par email
      userRecord = await auth.getUserByEmail(email);
      console.log(`🔍 [Seed] Utilisateur Firebase trouvé pour ${email} (UID: ${userRecord.uid}). Mise à jour du rôle...`);
      // S'assurer que le rôle est à jour
      await auth.setCustomUserClaims(userRecord.uid, { role });
    } catch (error) {
      // Si l'utilisateur n'existe pas, le créer
      if (error.code === 'auth/user-not-found') {
        console.log(`✨ [Seed] Création de l'utilisateur Firebase pour ${email}...`);
        userRecord = await auth.createUser({
          email: email,
          password: password,
          displayName: `${profile.name} ${profile.surname}`,
        });
        await auth.setCustomUserClaims(userRecord.uid, { role });
        console.log(`✅ [Seed] Utilisateur Firebase créé avec UID: ${userRecord.uid}`);
      } else {
        // Gérer d'autres erreurs Firebase
        console.error(`❌ [Seed] Erreur Firebase pour ${email}:`, error);
        continue; // Passer au prochain utilisateur en cas d'erreur
      }
    }

    // Upsert (créer ou mettre à jour) l'utilisateur dans Prisma
    console.log(`🔄 [Seed] Upsert de l'utilisateur dans Prisma pour ${email}...`);
    const dbUser = await prisma.user.upsert({
      where: { email: email },
      update: { role: role, name: `${profile.name} ${profile.surname}` },
      create: {
        id: userRecord.uid,
        email: email,
        username: email,
        role: role,
        name: `${profile.name} ${profile.surname}`,
        firstName: profile.name,
        lastName: profile.surname,
      },
    });

    // Créer ou mettre à jour le profil de rôle correspondant
    switch (role) {
      case Role.ADMIN:
        await prisma.admin.upsert({ where: { userId: dbUser.id }, update: {}, create: { userId: dbUser.id, ...profile }});
        break;
      case Role.AGENT_ADMINISTRATIF:
        await prisma.agentAdministratif.upsert({ where: { userId: dbUser.id }, update: {}, create: { userId: dbUser.id, ...profile }});
        break;
      case Role.TEACHER:
        await prisma.teacher.upsert({ where: { userId: dbUser.id }, update: {}, create: { userId: dbUser.id, ...profile }});
        break;
      case Role.STUDENT:
        await prisma.student.upsert({ where: { userId: dbUser.id }, update: {}, create: { userId: dbUser.id, ...profile }});
        break;
      case Role.PARENT:
        await prisma.parent.upsert({ where: { userId: dbUser.id }, update: {}, create: { userId: dbUser.id, ...profile }});
        break;
    }
     console.log(`✅ [Seed] Profil ${role} pour ${email} synchronisé.`);
  }

  // --- Seeding des données de l'application (Niveaux, Classes, etc.) ---
  console.log("🌱 [Seed] Création des niveaux (Grades)...");
  const grades = [];
  for (let i = 7; i <= 9; i++) {
      const grade = await prisma.grade.upsert({
          where: { level: i },
          update: {},
          create: { level: i },
      });
      grades.push(grade);
      console.log(`- Niveau ${i} créé/vérifié.`);
  }

  console.log("🌱 [Seed] Toutes les opérations de seeding sont terminées.");
}

main()
  .catch((e) => {
    console.error("❌ [Seed] Une erreur est survenue durant le seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
