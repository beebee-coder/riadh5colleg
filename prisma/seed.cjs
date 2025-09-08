const { PrismaClient } = require('@prisma/client');
const { initializeFirebaseAdmin } = require('../src/lib/firebase-admin');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const usersToSeed = [
  { email: 'admin@test.com', role: 'ADMIN', name: 'Admin User' },
  { email: 'teacher@test.com', role: 'TEACHER', name: 'Teacher User' },
  { email: 'agent@test.com', role: 'AGENT_ADMINISTRATIF', name: 'Agent User' },
  { email: 'parent@test.com', role: 'PARENT', name: 'Parent User' },
  { email: 'student@test.com', role: 'STUDENT', name: 'Student User' },
];

async function main() {
  console.log('🌱 Démarrage du script de seeding...');
  const admin = await initializeFirebaseAdmin();
  const auth = admin.auth();

  for (const userData of usersToSeed) {
    const { email, role, name } = userData;
    const password = 'password123';
    console.log(`--- Traitement de l'utilisateur : ${email} ---`);

    try {
      let firebaseUser;
      try {
        // 1. Récupérer l'utilisateur depuis Firebase Auth
        console.log(`[Firebase] Recherche de l'utilisateur ${email}...`);
        firebaseUser = await auth.getUserByEmail(email);
        console.log(`[Firebase] Utilisateur trouvé. UID: ${firebaseUser.uid}`);
        // Mettre à jour le rôle si nécessaire
        if (firebaseUser.customClaims?.role !== role) {
          await auth.setCustomUserClaims(firebaseUser.uid, { role });
          console.log(`[Firebase] Rôle mis à jour pour ${email} à ${role}.`);
        }
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          console.log(`[Firebase] Utilisateur non trouvé. Création de ${email}...`);
          firebaseUser = await auth.createUser({
            email,
            password,
            displayName: name,
            emailVerified: true,
          });
          await auth.setCustomUserClaims(firebaseUser.uid, { role });
          console.log(`[Firebase] Utilisateur créé avec UID: ${firebaseUser.uid} et rôle: ${role}`);
        } else {
          throw error; // Relancer les autres erreurs Firebase
        }
      }

      const { uid } = firebaseUser;
      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ') || '';
      
      const hashedPassword = await bcrypt.hash(password, 10);

      // 2. Créer ou Mettre à jour l'utilisateur dans PostgreSQL avec l'UID de Firebase
      console.log(`[Prisma] Upsert de l'utilisateur dans la base de données avec l'UID: ${uid}`);
      const dbUser = await prisma.user.upsert({
        where: { id: uid },
        update: { role: role, name: name, firstName: firstName, lastName: lastName },
        create: {
          id: uid,
          email,
          username: email,
          name,
          firstName,
          lastName,
          password: hashedPassword,
          role: role,
          active: true,
        },
      });
      console.log(`[Prisma] Utilisateur ${dbUser.email} synchronisé.`);

      // 3. Créer le profil de rôle correspondant si nécessaire
      if (role === 'ADMIN' && !(await prisma.admin.findUnique({ where: { userId: uid } }))) {
        await prisma.admin.create({ data: { userId: uid, name: firstName, surname: lastName } });
        console.log(`[Prisma] Profil Admin créé pour ${email}.`);
      } else if (role === 'TEACHER' && !(await prisma.teacher.findUnique({ where: { userId: uid } }))) {
        await prisma.teacher.create({ data: { userId: uid, name: firstName, surname: lastName } });
        console.log(`[Prisma] Profil Teacher créé pour ${email}.`);
      } else if (role === 'AGENT_ADMINISTRATIF' && !(await prisma.agentAdministratif.findUnique({ where: { userId: uid } }))) {
        await prisma.agentAdministratif.create({ data: { userId: uid, name: firstName, surname: lastName } });
        console.log(`[Prisma] Profil Agent Administratif créé pour ${email}.`);
      } else if (role === 'PARENT' && !(await prisma.parent.findUnique({ where: { userId: uid } }))) {
        await prisma.parent.create({ data: { userId: uid, name: firstName, surname: lastName, address: 'N/A' } });
        console.log(`[Prisma] Profil Parent créé pour ${email}.`);
      } else if (role === 'STUDENT' && !(await prisma.student.findUnique({ where: { userId: uid } }))) {
        // La création d'étudiant nécessite plus d'infos (classe, parent, etc), donc nous créons un profil de base
        await prisma.student.create({ data: { userId: uid, name: firstName, surname: lastName, address: 'N/A', bloodType: 'O+' } });
        console.log(`[Prisma] Profil Student de base créé pour ${email}.`);
      }
    } catch (error) {
      console.error(`❌ Échec du seeding pour l'utilisateur ${email}:`, error);
    }
  }

  console.log('✅ Seeding terminé avec succès.');
}

main()
  .catch((e) => {
    console.error('❌ Une erreur est survenue durant le seeding :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
