// prisma/seed.cjs

const { PrismaClient } = require('@prisma/client');
const admin = require('firebase-admin');
const { Role } = require('@prisma/client');

// --- Configuration Firebase Admin ---
try {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  console.log('✅ Firebase Admin SDK configuré avec succès pour le seeding.');
} catch (e) {
  console.error('❌ Erreur de configuration Firebase Admin pour le seeding:', e.message);
  process.exit(1);
}
// ------------------------------------

const prisma = new PrismaClient();

const usersToSeed = [
  { email: 'admin@test.com', password: 'password123', role: Role.ADMIN, name: 'Admin User' },
  { email: 'teacher@test.com', password: 'password123', role: Role.TEACHER, name: 'Teacher User' },
  { email: 'agent@test.com', password: 'password123', role: Role.AGENT_ADMINISTRATIF, name: 'Agent User' },
  { email: 'parent@test.com', password: 'password123', role: Role.PARENT, name: 'Parent User' },
  { email: 'student@test.com', password: 'password123', role: Role.STUDENT, name: 'Student User' },
];

async function main() {
  console.log('🌱 Starting database seeding...');

  for (const userData of usersToSeed) {
    const { email, password, role, name } = userData;
    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ') || '';

    try {
      let userRecord;
      
      // 1. Vérifier si l'utilisateur existe déjà dans Firebase Auth
      try {
        userRecord = await admin.auth().getUserByEmail(email);
        console.log(`🙋‍♂️ Utilisateur Firebase déjà existant : ${email} (UID: ${userRecord.uid})`);
        
        // S'assurer que le rôle est correctement défini dans les revendications personnalisées
        if (userRecord.customClaims?.role !== role) {
          await admin.auth().setCustomUserClaims(userRecord.uid, { role });
          console.log(`🏷️  Rôle mis à jour pour ${email} en ${role}.`);
        }
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          // Si l'utilisateur n'existe pas, le créer
          userRecord = await admin.auth().createUser({
            email,
            password,
            emailVerified: true,
            displayName: name,
          });
          await admin.auth().setCustomUserClaims(userRecord.uid, { role });
          console.log(`✨ Utilisateur Firebase créé : ${email} (UID: ${userRecord.uid})`);
        } else {
          // Gérer d'autres erreurs Firebase
          throw error;
        }
      }
      
      const { uid } = userRecord;

      // 2. Vérifier si l'utilisateur existe dans Prisma DB, sinon le créer/mettre à jour
      const existingDbUser = await prisma.user.findUnique({
        where: { id: uid },
      });

      if (!existingDbUser) {
        console.log(`📝 Création de l'enregistrement dans Prisma pour ${email} (UID: ${uid})`);
        await prisma.user.create({
          data: {
            id: uid,
            email,
            username: email,
            role,
            name,
            firstName,
            lastName,
            active: true,
            parent: role === Role.PARENT ? { create: { name: firstName, surname: lastName, address: 'Adresse par défaut' } } : undefined,
            teacher: role === Role.TEACHER ? { create: { name: firstName, surname: lastName } } : undefined,
            admin: role === Role.ADMIN ? { create: { name: firstName, surname: lastName } } : undefined,
            agentAdministratif: role === Role.AGENT_ADMINISTRATIF ? { create: { name: firstName, surname: lastName } } : undefined,
            student: role === Role.STUDENT ? {
              create: {
                name: firstName,
                surname: lastName,
                address: 'Adresse par défaut',
                birthday: new Date('2008-05-12T00:00:00.000Z'),
                bloodType: 'O+',
                sex: 'MALE',
                // Logique pour associer à une classe/parent/niveau si nécessaire
              },
            } : undefined,
          },
        });
      } else {
        console.log(`✅ Utilisateur Prisma déjà existant pour ${email}.`);
      }
      
    } catch (error) {
      console.error(`❌ Erreur lors du seeding pour ${email}:`, error.message);
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error('An error occurred during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
