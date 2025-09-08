
const { PrismaClient } = require('@prisma/client');
const admin = require('firebase-admin');

const prisma = new PrismaClient();

// Initialisation de Firebase Admin SDK
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


const users = [
  { email: 'admin@test.com', password: 'password123', role: 'ADMIN', name: 'Admin User' },
  { email: 'teacher@test.com', password: 'password123', role: 'TEACHER', name: 'Teacher User' },
  { email: 'agent@test.com', password: 'password123', role: 'AGENT_ADMINISTRATIF', name: 'Agent User' },
  { email: 'parent@test.com', password: 'password123', role: 'PARENT', name: 'Parent User' },
  { email: 'student@test.com', password: 'password123', role: 'STUDENT', name: 'Student User' },
];

async function main() {
  console.log('Start seeding...');

  for (const userData of users) {
    const { email, password, role, name } = userData;
    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ') || '';
    
    // Vérifier si l'utilisateur existe déjà dans Prisma
    const existingUserInDb = await prisma.user.findUnique({ where: { email } });
    if (existingUserInDb) {
      console.log(`User ${email} already exists in DB. Skipping.`);
      continue;
    }

    try {
      // 1. Créer l'utilisateur dans Firebase Auth
      console.log(`Creating user ${email} in Firebase Auth...`);
      const userRecord = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: name,
        emailVerified: true,
        disabled: false,
      });
      
      console.log(`Successfully created new user in Firebase Auth: ${userRecord.uid}`);

      // 2. Définir le rôle personnalisé dans les "claims" Firebase
      await admin.auth().setCustomUserClaims(userRecord.uid, { role: role });
      console.log(`Custom claims set for ${email}.`);

      // 3. Créer l'utilisateur et le profil associé dans la base de données Prisma
      await prisma.$transaction(async (tx) => {
        const userInDb = await tx.user.create({
          data: {
            id: userRecord.uid, // Utiliser l'UID de Firebase comme ID
            email,
            username: email.split('@')[0],
            role,
            name,
            firstName,
            lastName,
            active: true
          }
        });

        switch (role) {
          case 'ADMIN':
            await tx.admin.create({ data: { userId: userInDb.id, name: firstName, surname: lastName } });
            break;
          case 'TEACHER':
            await tx.teacher.create({ data: { userId: userInDb.id, name: firstName, surname: lastName } });
            break;
          case 'AGENT_ADMINISTRATIF':
            await tx.agentAdministratif.create({ data: { userId: userInDb.id, name: firstName, surname: lastName } });
            break;
          case 'PARENT':
            await tx.parent.create({ data: { userId: userInDb.id, name: firstName, surname: lastName, address: 'Adresse par défaut' } });
            break;
          case 'STUDENT':
            // Pour l'étudiant, on doit le lier à un parent et à une classe fictifs
            const defaultParent = await tx.parent.findFirst();
            const defaultClass = await tx.class.findFirst();
            if (defaultParent && defaultClass) {
              await tx.student.create({ data: { 
                userId: userInDb.id, 
                name: firstName, 
                surname: lastName, 
                classId: defaultClass.id, 
                gradeId: defaultClass.gradeId, 
                parentId: defaultParent.id,
                birthday: new Date('2008-01-01'),
                sex: 'MALE',
                bloodType: 'O+'
              } });
            } else {
              console.warn(`Could not create student profile for ${email}: No default parent or class found.`);
            }
            break;
        }
        console.log(`Prisma profile created for ${email}.`);
      });

    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`User ${email} already exists in Firebase Auth. Skipping.`);
      } else {
        console.error(`Failed to create user ${email}:`, error);
      }
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
