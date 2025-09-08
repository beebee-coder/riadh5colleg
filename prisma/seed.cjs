// prisma/seed.cjs
const { PrismaClient } = require('@prisma/client');
const { initializeFirebaseAdmin } = require('../src/lib/firebase-admin-for-seed.js');
const { Role, UserSex } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Démarrage du seeding de la base de données...");

    const admin = initializeFirebaseAdmin();
    const auth = admin.auth();

    const usersToSeed = [
        { email: 'admin@test.com', password: 'password123', role: Role.ADMIN, name: 'Admin', surname: 'User' },
        { email: 'teacher@test.com', password: 'password123', role: Role.TEACHER, name: 'Teacher', surname: 'User' },
        { email: 'agent@test.com', password: 'password123', role: Role.AGENT_ADMINISTRATIF, name: 'Agent', surname: 'Admin' },
        { email: 'parent@test.com', password: 'password123', role: Role.PARENT, name: 'Parent', surname: 'User' },
        { email: 'student@test.com', password: 'password123', role: Role.STUDENT, name: 'Student', surname: 'User' },
    ];

    for (const userData of usersToSeed) {
        try {
            let firebaseUser;
            try {
                // Check if user exists in Firebase
                firebaseUser = await auth.getUserByEmail(userData.email);
                console.log(`🔥 Utilisateur Firebase trouvé: ${userData.email} (UID: ${firebaseUser.uid})`);
            } catch (error) {
                if (error.code === 'auth/user-not-found') {
                    // Create user in Firebase if they don't exist
                    firebaseUser = await auth.createUser({
                        email: userData.email,
                        password: userData.password,
                        displayName: `${userData.name} ${userData.surname}`,
                    });
                    console.log(`🔥 Utilisateur Firebase créé: ${userData.email} (UID: ${firebaseUser.uid})`);
                } else {
                    throw error; // Re-throw other Firebase errors
                }
            }

            // Set custom claims
            await auth.setCustomUserClaims(firebaseUser.uid, { role: userData.role });
            console.log(`✨ Revendications personnalisées définies pour ${userData.email}`);

            // Upsert user in Prisma database
            const user = await prisma.user.upsert({
                where: { id: firebaseUser.uid },
                update: {
                    email: userData.email,
                    role: userData.role,
                    name: `${userData.name} ${userData.surname}`,
                    firstName: userData.name,
                    lastName: userData.surname,
                    active: true,
                },
                create: {
                    id: firebaseUser.uid,
                    email: userData.email,
                    username: userData.email,
                    role: userData.role,
                    name: `${userData.name} ${userData.surname}`,
                    firstName: userData.name,
                    lastName: userData.surname,
                    active: true,
                },
            });
            console.log(`🐘 Utilisateur Prisma créé/mis à jour: ${user.email}`);

            // Create role-specific profiles
            switch (userData.role) {
                case Role.ADMIN:
                    await prisma.admin.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id, name: userData.name, surname: userData.surname } });
                    break;
                case Role.AGENT_ADMINISTRATIF:
                    await prisma.agentAdministratif.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id, name: userData.name, surname: userData.surname } });
                    break;
                case Role.TEACHER:
                    await prisma.teacher.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id, name: userData.name, surname: userData.surname } });
                    break;
                case Role.PARENT:
                    await prisma.parent.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id, name: userData.name, surname: userData.surname, address: 'Default Address' } });
                    break;
                case Role.STUDENT:
                     const parent = await prisma.parent.findFirst();
                     const grade = await prisma.grade.findFirst();
                     const studentClass = await prisma.class.findFirst();
                    if (parent && grade && studentClass) {
                        await prisma.student.upsert({
                            where: { userId: user.id },
                            update: {},
                            create: {
                                userId: user.id,
                                name: userData.name,
                                surname: userData.surname,
                                sex: UserSex.MALE,
                                parentId: parent.id,
                                gradeId: grade.id,
                                classId: studentClass.id,
                            },
                        });
                    } else {
                        console.warn("⚠️ Impossible de créer le profil étudiant: parent, niveau ou classe manquant.");
                    }
                    break;
            }
             console.log(`✅ Profil de rôle créé/mis à jour pour ${userData.email}`);

        } catch (error) {
            console.error(`❌ Erreur lors du seeding pour ${userData.email}:`, error.message);
        }
    }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("🌱 Seeding terminé.");
  });
