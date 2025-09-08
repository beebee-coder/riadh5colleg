// prisma/seed.cjs
const { PrismaClient, Role, UserSex } = require('@prisma/client');
const { initializeFirebaseAdmin } = require('../src/lib/firebase-admin-seed');

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Démarrage du seeding...");

  // Initialiser Firebase Admin
  const admin = await initializeFirebaseAdmin();

  // Définir les données des utilisateurs de test
  const usersToSeed = [
    {
      uid: 'seed_admin_01',
      email: 'admin@test.com',
      role: Role.ADMIN,
      name: 'Admin User',
    },
    {
      uid: 'seed_teacher_01',
      email: 'teacher@test.com',
      role: Role.TEACHER,
      name: 'Teacher User',
    },
    {
      uid: 'seed_student_01',
      email: 'student@test.com',
      role: Role.STUDENT,
      name: 'Student User',
    },
    {
      uid: 'seed_parent_01',
      email: 'parent@test.com',
      role: Role.PARENT,
      name: 'Parent User',
    },
    {
      uid: 'seed_agent_01',
      email: 'agent@test.com',
      role: Role.AGENT_ADMINISTRATIF,
      name: 'Agent User',
    }
  ];

  console.log('🔥 Vérification et création des utilisateurs dans Firebase Auth...');
  for (const userData of usersToSeed) {
    try {
      await admin.auth().getUser(userData.uid);
      console.log(`- L'utilisateur Firebase ${userData.email} (UID: ${userData.uid}) existe déjà.`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        await admin.auth().createUser({
          uid: userData.uid,
          email: userData.email,
          password: 'password', // Mot de passe par défaut pour le seeding
          emailVerified: true,
          displayName: userData.name,
        });
        console.log(`- Utilisateur Firebase ${userData.email} (UID: ${userData.uid}) créé.`);
      } else {
        throw error;
      }
    }
  }


  console.log("🧹 Nettoyage des anciens utilisateurs de la base de données...");
  await prisma.admin.deleteMany({});
  await prisma.teacher.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.parent.deleteMany({});
  await prisma.agentAdministratif.deleteMany({});
  await prisma.user.deleteMany({
    where: {
      id: {
        in: usersToSeed.map(u => u.uid)
      }
    }
  });


  console.log("👤 Création des utilisateurs dans la base de données PostgreSQL...");
  for (const userData of usersToSeed) {
     const [firstName, ...lastNameParts] = userData.name.split(' ');
     const lastName = lastNameParts.join(' ') || '';

    const createdUser = await prisma.user.create({
      data: {
        id: userData.uid, // Utiliser l'UID de Firebase comme ID dans la BDD
        email: userData.email,
        username: userData.email,
        name: userData.name,
        role: userData.role,
        active: true,
        // Pas de mot de passe stocké ici !
      },
    });
    console.log(`- Utilisateur BDD créé : ${createdUser.email}`);

    // Créer le profil de rôle correspondant
    switch (userData.role) {
      case Role.ADMIN:
        await prisma.admin.create({ data: { userId: createdUser.id, name: firstName, surname: lastName } });
        break;
      case Role.TEACHER:
        await prisma.teacher.create({ data: { userId: createdUser.id, name: firstName, surname: lastName } });
        break;
      case Role.PARENT:
        await prisma.parent.create({ data: { userId: createdUser.id, name: firstName, surname: lastName, address: 'Adresse par défaut' } });
        break;
      case Role.STUDENT:
        // Pour les étudiants, nous avons besoin de données supplémentaires (classe, parent, etc.)
        // Pour ce seeding simple, nous créons juste le profil.
        await prisma.student.create({ data: { userId: createdUser.id, name: firstName, surname: lastName, address: 'Adresse par défaut', birthday: new Date(), sex: UserSex.OTHER } });
        break;
      case Role.AGENT_ADMINISTRATIF:
         await prisma.agentAdministratif.create({ data: { userId: createdUser.id, name: firstName, surname: lastName } });
        break;
    }
     console.log(`- Profil ${userData.role} créé pour ${userData.email}`);
  }

  console.log("✅ Seeding terminé avec succès !");
}

main()
  .catch((e) => {
    console.error("❌ Une erreur est survenue pendant le seeding :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
