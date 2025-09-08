const { PrismaClient, Role, UserSex } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // --- Clean up existing data ---
  console.log('Deleting existing data...');
  // The order is important due to foreign key constraints
  await prisma.teacherAssignment.deleteMany({});
  await prisma.lessonRequirement.deleteMany({});
  await prisma.subjectRequirement.deleteMany({});
  await prisma.teacherConstraint.deleteMany({});
  await prisma.result.deleteMany({});
  await prisma.exam.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.optionalSubjectGroup.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.teacher.deleteMany({});
  await prisma.parent.deleteMany({});
  await prisma.agentAdministratif.deleteMany({});
  await prisma.admin.deleteMany({});
  await prisma.class.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.grade.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('Existing data deleted.');

  // --- Hashed Password ---
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync('password', salt);

  // --- Create Users with Hashed Passwords ---
  console.log('Creating users...');

  // Admin User
  await prisma.user.create({
    data: {
      id: 'clwtrd1230000_admin_seed',
      email: 'admin@test.com',
      username: 'admin',
      name: 'Admin User',
      password: hashedPassword,
      role: Role.ADMIN,
      active: true,
      admin: {
        create: {
          name: 'Admin',
          surname: 'User',
        },
      },
    },
  });

  // Agent Administratif User
  await prisma.user.create({
    data: {
      id: 'clwtrd1230000_agent_seed',
      email: 'agent@test.com',
      username: 'agent',
      name: 'Agent Admin',
      password: hashedPassword,
      role: Role.AGENT_ADMINISTRATIF,
      active: true,
      agentAdministratif: {
        create: {
          name: 'Agent',
          surname: 'Admin',
        },
      },
    },
  });

  // Teacher User
  await prisma.user.create({
    data: {
      id: 'clwtrd1230000_teacher_seed',
      email: 'teacher@test.com',
      username: 'teacher',
      name: 'Teacher User',
      password: hashedPassword,
      role: Role.TEACHER,
      active: true,
      teacher: {
        create: {
          name: 'Teacher',
          surname: 'User',
        },
      },
    },
  });
  
  // Parent User
  const parentUser = await prisma.user.create({
    data: {
      id: 'clwtrd1230000_parent_seed',
      email: 'parent@test.com',
      username: 'parent',
      name: 'Parent User',
      password: hashedPassword,
      role: Role.PARENT,
      active: true,
      parent: {
        create: {
          name: 'Parent',
          surname: 'User',
          address: '123 Test Street'
        },
      },
    },
  });

  // Student User
   await prisma.user.create({
    data: {
      id: 'clwtrd1230000_student_seed',
      email: 'student@test.com',
      username: 'student',
      name: 'Student User',
      password: hashedPassword,
      role: Role.STUDENT,
      active: true,
      student: {
        create: {
          name: 'Student',
          surname: 'User',
          sex: UserSex.MALE,
          birthday: new Date('2010-05-20T00:00:00.000Z'),
          bloodType: 'O+',
          address: '123 Test Street',
          parent: { connect: { userId: parentUser.id } }
        },
      },
    },
  });
  
  console.log('Users created successfully.');
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
