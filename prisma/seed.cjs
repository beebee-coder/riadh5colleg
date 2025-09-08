// prisma/seed.cjs
const { PrismaClient } = require('@prisma/client');
const admin = require('firebase-admin');
const { hash } = require('bcryptjs');

// Importer les types depuis le fichier généré par Prisma
const { Role, UserSex } = require('@prisma/client');

const prisma = new PrismaClient();

// Initialiser Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}


const users = [
  {
    email: 'admin@test.com',
    password: 'password123',
    role: Role.ADMIN,
    profile: {
      name: 'Adam',
      surname: 'Admin'
    }
  },
  {
    email: 'agent@test.com',
    password: 'password123',
    role: Role.AGENT_ADMINISTRATIF,
    profile: {
        name: 'Ahmed',
        surname: 'Agent'
    }
  },
  {
    email: 'teacher@test.com',
    password: 'password123',
    role: Role.TEACHER,
    profile: {
      name: 'Salim',
      surname: 'Prof',
    },
  },
  {
    email: 'parent@test.com',
    password: 'password123',
    role: Role.PARENT,
    profile: {
      name: 'Farah',
      surname: 'Parent',
      address: '123 Rue des Parents, Tunis'
    }
  },
  {
    email: 'student@test.com',
    password: 'password123',
    role: Role.STUDENT,
    profile: {
      name: 'Karim',
      surname: 'Etudiant',
      phone: '22333444',
      address: '456 Avenue des Études, Sfax',
      bloodType: 'O+',
      birthday: new Date('2010-05-15'),
      sex: UserSex.MALE,
    }
  },
];

async function main() {
  console.log("🔥 Démarrage du script de seeding...");

  // 1. Clear existing users from Firebase Auth
  console.log("🗑️ Nettoyage des utilisateurs Firebase existants...");
  try {
    const listUsersResult = await admin.auth().listUsers(1000);
    const uidsToDelete = listUsersResult.users.map(u => u.uid);
    if(uidsToDelete.length > 0) {
      await admin.auth().deleteUsers(uidsToDelete);
      console.log(`✅ ${uidsToDelete.length} utilisateurs Firebase supprimés.`);
    } else {
       console.log("✅ Aucun utilisateur Firebase à supprimer.");
    }
  } catch (error) {
    console.error("❌ Erreur lors de la suppression des utilisateurs Firebase:", error);
    // On continue même en cas d'erreur ici, car la base de données peut être vide.
  }

  // 2. Upsert users in a loop
  for (const userData of users) {
    console.log(`- Traitement de l'utilisateur : ${userData.email} (${userData.role})`);
    
    // Create or update user in Firebase Auth
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().getUserByEmail(userData.email);
      console.log(`  - L'utilisateur Firebase existe déjà. Mise à jour...`);
      await admin.auth().updateUser(firebaseUser.uid, {
        password: userData.password,
        disabled: false,
      });
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`  - L'utilisateur Firebase n'existe pas. Création...`);
        firebaseUser = await admin.auth().createUser({
          email: userData.email,
          password: userData.password,
          emailVerified: true,
          disabled: false,
        });
      } else {
        throw error;
      }
    }

    await admin.auth().setCustomUserClaims(firebaseUser.uid, { role: userData.role });
    console.log(`  - Rôle Firebase "${userData.role}" défini.`);

    const fullName = `${userData.profile.name} ${userData.profile.surname}`;
    const hashedPassword = await hash(userData.password, 10);

    // Upsert user in Prisma
    const dbUser = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        id: firebaseUser.uid,
        role: userData.role,
        name: fullName,
        firstName: userData.profile.name,
        lastName: userData.profile.surname,
        password: hashedPassword,
        active: true,
      },
      create: {
        id: firebaseUser.uid,
        email: userData.email,
        username: userData.email.split('@')[0],
        role: userData.role,
        name: fullName,
        firstName: userData.profile.name,
        lastName: userData.profile.surname,
        password: hashedPassword,
        active: true,
      },
    });

    console.log(`  - Utilisateur Prisma créé/mis à jour : ${dbUser.email}`);

    // Create or update role-specific profile
    switch (userData.role) {
      case Role.ADMIN:
        await prisma.admin.upsert({
          where: { userId: dbUser.id },
          update: { name: userData.profile.name, surname: userData.profile.surname },
          create: { userId: dbUser.id, name: userData.profile.name, surname: userData.profile.surname },
        });
        break;
      case Role.AGENT_ADMINISTRATIF:
          await prisma.agentAdministratif.upsert({
              where: { userId: dbUser.id },
              update: { name: userData.profile.name, surname: userData.profile.surname },
              create: { userId: dbUser.id, name: userData.profile.name, surname: userData.profile.surname },
          });
          break;
      case Role.TEACHER:
        await prisma.teacher.upsert({
          where: { userId: dbUser.id },
          update: { name: userData.profile.name, surname: userData.profile.surname },
          create: { userId: dbUser.id, name: userData.profile.name, surname: userData.profile.surname },
        });
        break;
      case Role.PARENT:
        await prisma.parent.upsert({
          where: { userId: dbUser.id },
          update: { name: userData.profile.name, surname: userData.profile.surname, address: userData.profile.address },
          create: { userId: dbUser.id, name: userData.profile.name, surname: userData.profile.surname, address: userData.profile.address },
        });
        break;
      case Role.STUDENT:
        // Pour les étudiants, on doit s'assurer que le parent et la classe existent
        const parentUser = await prisma.user.findUnique({ where: { email: 'parent@test.com' } });
        if (parentUser) {
          const parentProfile = await prisma.parent.findUnique({ where: { userId: parentUser.id } });
          if(parentProfile) {
            await prisma.student.upsert({
              where: { userId: dbUser.id },
              update: { ...userData.profile, parentId: parentProfile.id },
              create: { userId: dbUser.id, ...userData.profile, parentId: parentProfile.id },
            });
          }
        }
        break;
    }
     console.log(`  - Profil de rôle "${userData.role}" créé/mis à jour.`);
  }

  // --- Seed other data ---
  console.log("\n🌱 Initialisation des données de base de l'école...");

  // Create Grades
  await prisma.grade.deleteMany({});
  const grades = await prisma.grade.createMany({
    data: [ { level: 7 }, { level: 8 }, { level: 9 } ],
  });
  console.log(`  - ✅ ${grades.count} niveaux créés.`);

  // Create Subjects
  await prisma.subject.deleteMany({});
  const subjects = await prisma.subject.createMany({
    data: [
      { name: "Mathématiques", weeklyHours: 4, coefficient: 2 },
      { name: "Français", weeklyHours: 4, coefficient: 2 },
      { name: "Anglais", weeklyHours: 3, coefficient: 1.5 },
      { name: "Sciences Physiques", weeklyHours: 3, coefficient: 1.5 },
      { name: "Sciences Naturelles", weeklyHours: 3, coefficient: 1.5 },
      { name: "Informatique", weeklyHours: 2, coefficient: 1 },
      { name: "Histoire-Géographie", weeklyHours: 2, coefficient: 1 },
    ],
  });
   console.log(`  - ✅ ${subjects.count} matières créées.`);

  // Create Classrooms
  await prisma.classroom.deleteMany({});
  const classrooms = await prisma.classroom.createMany({
    data: [
      { name: "Salle 101", capacity: 30, building: "A" },
      { name: "Salle 102", capacity: 30, building: "A" },
      { name: "Labo Info 1", capacity: 20, building: "B" },
    ],
  });
  console.log(`  - ✅ ${classrooms.count} salles créées.`);

  // Create Classes
  await prisma.class.deleteMany({});
  const grade7 = await prisma.grade.findFirst({ where: { level: 7 } });
  if(grade7) {
    await prisma.class.createMany({
      data: [
        { name: "7ème Base 1", abbreviation: "7B1", capacity: 28, gradeId: grade7.id },
        { name: "7ème Base 2", abbreviation: "7B2", capacity: 28, gradeId: grade7.id },
      ]
    });
    console.log(`  - ✅ 2 classes de 7ème créées.`);
  }

  console.log("\n🎉 Seeding terminé avec succès !");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
