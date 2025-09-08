// prisma/seed.cjs
const { PrismaClient, Role, UserSex } = require('@prisma/client');
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Initialiser Firebase Admin
function initializeFirebaseAdmin() {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };

  if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log("✅ Initialisation de Firebase Admin réussie pour le seeding.");
    } catch (e) {
        console.error("❌ Erreur d'initialisation de Firebase Admin :", e);
        process.exit(1);
    }
  }
  return admin;
}

const firebaseAdmin = initializeFirebaseAdmin();

async function getOrCreateFirebaseUser(email, password, displayName, role) {
    try {
        let userRecord = await firebaseAdmin.auth().getUserByEmail(email).catch(() => null);
        if (userRecord) {
            console.log(`Utilisateur Firebase déjà existant pour ${email}, UID: ${userRecord.uid}`);
            // Optionnel : Mettre à jour le rôle si nécessaire
            const currentClaims = userRecord.customClaims || {};
            if (currentClaims.role !== role) {
                await firebaseAdmin.auth().setCustomUserClaims(userRecord.uid, { ...currentClaims, role });
            }
            return userRecord;
        } else {
            console.log(`Création de l'utilisateur Firebase pour ${email}...`);
            userRecord = await firebaseAdmin.auth().createUser({
                email,
                password,
                displayName,
                emailVerified: true,
            });
            await firebaseAdmin.auth().setCustomUserClaims(userRecord.uid, { role });
            console.log(`Utilisateur Firebase créé pour ${email}, UID: ${userRecord.uid}`);
            return userRecord;
        }
    } catch (error) {
        console.error(`Erreur avec l'utilisateur Firebase ${email}:`, error.message);
        throw error;
    }
}

async function main() {
    console.log("🚀 Démarrage du processus de seeding...");
    const password = "password123";
    const hashedPassword = await bcrypt.hash(password, 10);

    const testUsers = [
        { email: 'admin@test.com', name: 'Admin User', role: Role.ADMIN },
        { email: 'teacher@test.com', name: 'Teacher User', role: Role.TEACHER },
        { email: 'student@test.com', name: 'Student User', role: Role.STUDENT },
        { email: 'parent@test.com', name: 'Parent User', role: Role.PARENT },
        { email: 'agent@test.com', name: 'Agent User', role: Role.AGENT_ADMINISTRATIF },
    ];

    for (const userData of testUsers) {
        const firebaseUser = await getOrCreateFirebaseUser(userData.email, password, userData.name, userData.role);
        
        const [firstName, ...lastNameParts] = userData.name.split(' ');
        const lastName = lastNameParts.join(' ') || '';

        console.log(`Synchonisation de l'utilisateur ${userData.email} dans la base de données PostgreSQL avec l'UID: ${firebaseUser.uid}...`);
        
        const dbUser = await prisma.user.upsert({
            where: { id: firebaseUser.uid },
            update: {
                role: userData.role,
                name: userData.name,
                firstName: firstName,
                lastName: lastName,
            },
            create: {
                id: firebaseUser.uid,
                email: userData.email,
                username: userData.email.split('@')[0],
                name: userData.name,
                firstName: firstName,
                lastName: lastName,
                password: hashedPassword,
                role: userData.role,
                active: true,
            }
        });

        // Create role-specific profiles
        if (userData.role === Role.ADMIN && dbUser) {
            await prisma.admin.upsert({ where: { userId: dbUser.id }, update: {}, create: { userId: dbUser.id, name: dbUser.firstName, surname: dbUser.lastName } });
        }
        if (userData.role === Role.TEACHER && dbUser) {
            await prisma.teacher.upsert({ where: { userId: dbUser.id }, update: {}, create: { userId: dbUser.id, name: dbUser.firstName, surname: dbUser.lastName } });
        }
        if (userData.role === Role.PARENT && dbUser) {
             await prisma.parent.upsert({ where: { userId: dbUser.id }, update: {}, create: { userId: dbUser.id, name: dbUser.firstName, surname: dbUser.lastName, address: 'Default Address' } });
        }
        if (userData.role === Role.STUDENT && dbUser) {
            // Find a default class and grade to assign the student to.
            const defaultClass = await prisma.class.findFirst();
            if (defaultClass) {
                await prisma.student.upsert({ where: { userId: dbUser.id }, update: {}, create: { userId: dbUser.id, name: dbUser.firstName, surname: dbUser.lastName, classId: defaultClass.id, gradeId: defaultClass.gradeId } });
            } else {
                 console.warn("⚠️ Aucune classe par défaut trouvée pour assigner l'étudiant de test.");
            }
        }
         if (userData.role === Role.AGENT_ADMINISTRATIF && dbUser) {
            await prisma.agentAdministratif.upsert({ where: { userId: dbUser.id }, update: {}, create: { userId: dbUser.id, name: dbUser.firstName, surname: dbUser.lastName } });
        }
    }
    
    // --- Seeding Other Data ---
    console.log('Seeding des Niveaux (Grades)...');
    const gradesData = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => ({ level }));
    await prisma.grade.createMany({ data: gradesData, skipDuplicates: true });

    console.log('Seeding des Classes...');
    const gradesInDb = await prisma.grade.findMany();
    const classesData = gradesInDb.flatMap(grade =>
        ['A', 'B'].map(section => ({
            name: `Classe ${grade.level}${section}`,
            abbreviation: `${grade.level}${section}`,
            gradeId: grade.id,
            capacity: 25,
        }))
    );
    await prisma.class.createMany({ data: classesData, skipDuplicates: true });

    console.log('Seeding des Matières (Subjects)...');
    const subjectsData = [
      { name: 'Mathématiques', weeklyHours: 4, coefficient: 2 },
      { name: 'Français', weeklyHours: 4, coefficient: 2 },
      { name: 'Physique-Chimie', weeklyHours: 3, coefficient: 1.5 },
      { name: 'SVT', weeklyHours: 3, coefficient: 1.5 },
      { name: 'Histoire-Géographie', weeklyHours: 2, coefficient: 1 },
      { name: 'Anglais', weeklyHours: 2, coefficient: 1 },
      { name: 'EPS', weeklyHours: 2, coefficient: 1 },
      { name: 'Arts Plastiques', weeklyHours: 1, coefficient: 1 },
    ];
    await prisma.subject.createMany({ data: subjectsData, skipDuplicates: true });

    console.log('Seeding des Salles (Classrooms)...');
    const classroomsData = Array.from({ length: 10 }, (_, i) => ({
      name: `Salle ${100 + i + 1}`,
      capacity: 30,
      building: (i % 2 === 0) ? 'A' : 'B'
    }));
    await prisma.classroom.createMany({ data: classroomsData, skipDuplicates: true });

    console.log("✅ Seeding terminé avec succès.");
}

main()
  .catch((e) => {
    console.error("❌ Erreur pendant le seeding :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
