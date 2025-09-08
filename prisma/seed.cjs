// prisma/seed.cjs
const { PrismaClient, Role, UserSex } = require('@prisma/client');
const { initializeFirebaseAdmin } = require('../src/lib/firebase-admin-for-seed.js');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Démarrage du processus de seeding...");

  let admin;
  try {
    admin = initializeFirebaseAdmin();
  } catch (e) {
    console.error("❌ Impossible d'initialiser Firebase Admin. Assurez-vous que vos variables d'environnement sont correctes.");
    return;
  }
  
  const auth = admin.auth();

  const usersData = [
    { email: 'admin@test.com', password: 'password123', role: Role.ADMIN, name: 'Admin', surname: 'User' },
    { email: 'teacher@test.com', password: 'password123', role: Role.TEACHER, name: 'Teacher', surname: 'User' },
    { email: 'agent@test.com', password: 'password123', role: Role.AGENT_ADMINISTRATIF, name: 'Agent', surname: 'User' },
    { email: 'parent@test.com', password: 'password123', role: Role.PARENT, name: 'Parent', surname: 'User' },
    { email: 'student@test.com', password: 'password123', role: Role.STUDENT, name: 'Student', surname: 'User' },
  ];

  for (const userData of usersData) {
    const { email, password, role, name, surname } = userData;
    console.log(`--- Traitement de l'utilisateur: ${email} ---`);

    try {
      let firebaseUser;
      try {
        firebaseUser = await auth.getUserByEmail(email);
        console.log(`✔️ Utilisateur trouvé dans Firebase Auth: ${firebaseUser.uid}`);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          console.log(`✨ Utilisateur non trouvé dans Firebase Auth. Création en cours...`);
          firebaseUser = await auth.createUser({
            email: email,
            password: password,
            displayName: `${name} ${surname}`,
            emailVerified: true,
            disabled: false,
          });
          console.log(`✔️ Utilisateur créé dans Firebase Auth: ${firebaseUser.uid}`);
        } else {
          throw error;
        }
      }

      // Définir le rôle dans les revendications personnalisées de Firebase
      await auth.setCustomUserClaims(firebaseUser.uid, { role });
      console.log(`👑 Rôle '${role}' défini pour l'utilisateur ${email} dans Firebase.`);

      // Utiliser upsert pour créer ou mettre à jour l'utilisateur dans la base de données locale
      const dbUser = await prisma.user.upsert({
        where: { id: firebaseUser.uid },
        update: {
          role: role,
          name: `${name} ${surname}`,
          firstName: name,
          lastName: surname,
          email: email,
        },
        create: {
          id: firebaseUser.uid,
          email: email,
          username: email,
          name: `${name} ${surname}`,
          firstName: name,
          lastName: surname,
          role: role,
          active: true,
        },
      });
      console.log(`✔️ Utilisateur créé/mis à jour dans la base de données: ${dbUser.email}`);

      // Créer le profil de rôle correspondant si nécessaire
      switch (role) {
        case Role.ADMIN:
          await prisma.admin.upsert({ where: { userId: dbUser.id }, update: {}, create: { userId: dbUser.id, name, surname } });
          break;
        case Role.TEACHER:
          await prisma.teacher.upsert({ where: { userId: dbUser.id }, update: {}, create: { userId: dbUser.id, name, surname } });
          break;
        case Role.AGENT_ADMINISTRATIF:
            await prisma.agentAdministratif.upsert({ where: { userId: dbUser.id }, update: {}, create: { userId: dbUser.id, name, surname } });
            break;
        case Role.PARENT:
          await prisma.parent.upsert({ where: { userId: dbUser.id }, update: {}, create: { userId: dbUser.id, name, surname, address: '' } });
          break;
        case Role.STUDENT:
          const parent = await prisma.parent.findFirst();
          if (parent) {
            await prisma.student.upsert({ where: { userId: dbUser.id }, update: {}, create: { userId: dbUser.id, name, surname, parentId: parent.id, sex: UserSex.MALE, birthday: new Date() } });
          } else {
            console.warn("⚠️ Aucun parent trouvé pour lier à l'étudiant. L'étudiant ne sera pas créé.");
          }
          break;
      }
       console.log(`✔️ Profil de rôle '${role}' créé/mis à jour pour ${email}.`);

    } catch (error) {
      console.error(`❌ Erreur lors du traitement de l'utilisateur ${email}:`, error);
    }
  }
}

main()
  .catch((e) => {
    console.error("❌ Erreur dans le script de seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("🌱 Seeding terminé. Déconnexion de Prisma.");
  });
