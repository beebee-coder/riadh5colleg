const { PrismaClient } = require('@prisma/client');
const { initializeFirebaseAdmin } = require('../src/lib/firebase-admin-for-seed.js');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const admin = initializeFirebaseAdmin();
  const auth = admin.auth();

  console.log('🌱 Starting database seeding...');

  // 1. Nettoyage complet
  console.log('🧹 Clearing existing data...');
  const allUserIds = (await prisma.user.findMany({ select: { id: true } })).map(u => u.id);
  if (allUserIds.length > 0) {
      try {
        await auth.deleteUsers(allUserIds);
        console.log(`🔥 Deleted ${allUserIds.length} users from Firebase Auth.`);
      } catch(e) {
        console.warn(`⚠️ Could not delete all users from Firebase, some may not exist. Error: ${e.message}`);
      }
  }
  
  await prisma.teacherAssignment.deleteMany({});
  await prisma.subjectRequirement.deleteMany({});
  await prisma.teacherConstraint.deleteMany({});
  await prisma.lessonRequirement.deleteMany({});
  await prisma.result.deleteMany({});
  await prisma.exam.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.chatroomMessage.deleteMany({});
  await prisma.sessionParticipant.deleteMany({});
  await prisma.chatroomSession.deleteMany({});
  await prisma.scheduleDraft.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.parent.deleteMany({});
  await prisma.teacher.deleteMany({});
  await prisma.admin.deleteMany({});
  await prisma.agentAdministratif.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.class.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.classroom.deleteMany({});
  await prisma.grade.deleteMany({});
  
  console.log('✅ Data cleared.');

  // 2. Création des utilisateurs avec des rôles
  const usersToCreate = [
    { email: 'admin@test.com', password: 'password123', role: 'ADMIN', name: 'Admin User' },
    { email: 'teacher@test.com', password: 'password123', role: 'TEACHER', name: 'Teacher User' },
    { email: 'agent@test.com', password: 'password123', role: 'AGENT_ADMINISTRATIF', name: 'Agent User' },
    { email: 'parent@test.com', password: 'password123', role: 'PARENT', name: 'Parent User' },
    { email: 'student@test.com', password: 'password123', role: 'STUDENT', name: 'Student User' },
  ];

  for (const userData of usersToCreate) {
    try {
      console.log(`Creating user: ${userData.email}`);
      const userRecord = await auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.name,
      });

      console.log(`Successfully created Firebase user: ${userRecord.uid}`);
      await auth.setCustomUserClaims(userRecord.uid, { role: userData.role });

      const [firstName, ...lastNameParts] = userData.name.split(' ');
      const lastName = lastNameParts.join(' ') || '';

      const createdUser = await prisma.user.create({
        data: {
          id: userRecord.uid,
          email: userData.email,
          role: userData.role,
          name: userData.name,
          username: userData.email,
          firstName,
          lastName,
          active: true,
        },
      });

      switch (userData.role) {
        case 'ADMIN':
          await prisma.admin.create({ data: { userId: createdUser.id, name: firstName, surname: lastName } });
          break;
        case 'TEACHER':
          await prisma.teacher.create({ data: { userId: createdUser.id, name: firstName, surname: lastName } });
          break;
        case 'AGENT_ADMINISTRATIF':
          await prisma.agentAdministratif.create({ data: { userId: createdUser.id, name: firstName, surname: lastName }});
          break;
        case 'PARENT':
          await prisma.parent.create({ data: { userId: createdUser.id, name: firstName, surname: lastName, address: 'Default Address' } });
          break;
        case 'STUDENT':
          // For simplicity, student is created without class/grade/parent here. 
          // You can add logic to link them if necessary.
          await prisma.student.create({ data: { userId: createdUser.id, name: firstName, surname: lastName, birthday: new Date() } });
          break;
      }
      console.log(`✅ Created DB profile for ${userData.email}`);
    } catch (error) {
      console.error(`❌ Failed to create user ${userData.email}:`, error.message);
    }
  }

  console.log('🎉 Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
