// prisma/seed.cjs
const { PrismaClient } = require('@prisma/client');
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Configuration Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
} catch (e) {
  console.error('Erreur d\'initialisation de Firebase Admin dans le seed :', e.message);
  process.exit(1);
}

const usersToSeed = [
    {
        email: 'admin@test.com',
        username: 'admin',
        password: 'password123',
        name: 'Admin',
        surname: 'User',
        role: 'ADMIN',
    },
    {
        email: 'teacher@test.com',
        username: 'teacher',
        password: 'password123',
        name: 'Teacher',
        surname: 'User',
        role: 'TEACHER',
    },
    {
        email: 'agent@test.com',
        username: 'agent',
        password: 'password123',
        name: 'Agent',
        surname: 'Admin',
        role: 'AGENT_ADMINISTRATIF',
    },
    {
        email: 'parent@test.com',
        username: 'parent',
        password: 'password123',
        name: 'Parent',
        surname: 'User',
        role: 'PARENT',
    },
    {
        email: 'student@test.com',
        username: 'student',
        password: 'password123',
        name: 'Student',
        surname: 'User',
        role: 'STUDENT',
    },
];

async function main() {
    console.log('🌱 Démarrage du seeding...');
    const auth = admin.auth();

    for (const userData of usersToSeed) {
        let uid;
        let userExistsInFirebase = true;

        try {
            console.log(`🔍 Vérification de l'utilisateur Firebase: ${userData.email}`);
            const userRecord = await auth.getUserByEmail(userData.email);
            uid = userRecord.uid;
            console.log(`✅ L'utilisateur Firebase existe déjà avec l'UID: ${uid}`);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                console.log(`🔥 L'utilisateur Firebase n'existe pas. Création...`);
                userExistsInFirebase = false;
            } else {
                throw error; // Propage les autres erreurs Firebase
            }
        }

        if (!userExistsInFirebase) {
            const newUserRecord = await auth.createUser({
                email: userData.email,
                password: userData.password,
                displayName: `${userData.name} ${userData.surname}`,
                emailVerified: true,
                disabled: false,
            });
            uid = newUserRecord.uid;
            console.log(`✅ Utilisateur Firebase créé avec UID: ${uid}`);
        }
        
        await auth.setCustomUserClaims(uid, { role: userData.role });
        console.log(`👑 Revendication de rôle (${userData.role}) définie pour l'UID: ${uid}`);

        console.log(`📦 Upsert dans la base de données PostgreSQL pour UID: ${uid}`);
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        const userInDb = await prisma.user.upsert({
            where: { id: uid },
            update: {
                email: userData.email,
                username: userData.username,
                name: `${userData.name} ${userData.surname}`,
                role: userData.role,
                active: true,
            },
            create: {
                id: uid,
                email: userData.email,
                username: userData.username,
                name: `${userData.name} ${userData.surname}`,
                firstName: userData.name,
                lastName: userData.surname,
                role: userData.role,
                active: true,
                password: hashedPassword,
            },
        });
        console.log(`✅ Utilisateur dans la DB pour ${userInDb.email} OK.`);
        
        console.log(`👤 Création/mise à jour du profil de rôle ${userData.role}...`);
        
        // Création des profils spécifiques au rôle
        if (userData.role === 'ADMIN') {
            await prisma.admin.upsert({ where: { userId: uid }, update: {}, create: { userId: uid, name: userData.name, surname: userData.surname } });
        } else if (userData.role === 'TEACHER') {
            await prisma.teacher.upsert({ where: { userId: uid }, update: {}, create: { userId: uid, name: userData.name, surname: userData.surname } });
        } else if (userData.role === 'AGENT_ADMINISTRATIF') {
            await prisma.agentAdministratif.upsert({ where: { userId: uid }, update: {}, create: { userId: uid, name: userData.name, surname: userData.surname } });
        } else if (userData.role === 'PARENT') {
            await prisma.parent.upsert({ where: { userId: uid }, update: {}, create: { userId: uid, name: userData.name, surname: userData.surname, address: 'Adresse par défaut' } });
        } else if (userData.role === 'STUDENT') {
            const parentUser = usersToSeed.find(u => u.role === 'PARENT');
            if (parentUser) {
              const parentRecord = await auth.getUserByEmail(parentUser.email);
              const parentProfile = await prisma.parent.findUnique({ where: { userId: parentRecord.uid } });
              if (parentProfile) {
                await prisma.student.upsert({ 
                  where: { userId: uid }, 
                  update: {}, 
                  create: { userId: uid, name: userData.name, surname: userData.surname, parentId: parentProfile.id } 
                });
              }
            }
        }
        console.log('---');
    }

    console.log('✅ Seeding terminé avec succès.');
}

main()
    .catch((e) => {
        console.error('❌ Erreur globale durant le seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
