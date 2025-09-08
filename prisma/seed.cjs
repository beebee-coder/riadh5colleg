const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  const password = await bcrypt.hash('password123', 10);

  // Users data with roles
  const users = [
    {
      id: 'clvwnn1ke000008jp1lre0h4d',
      email: 'admin@test.com',
      username: 'admin',
      name: 'Admin User',
      firstName: 'Admin',
      lastName: 'User',
      role: Role.ADMIN,
      password: password,
      active: true,
      admin: {
        create: {
          name: 'Admin',
          surname: 'User',
          phone: '123456789'
        }
      }
    },
    {
      id: 'clvwnn1ko000108jph1f44k1a',
      email: 'agent@test.com',
      username: 'agent',
      name: 'Agent Admin',
      firstName: 'Agent',
      lastName: 'Admin',
      role: Role.AGENT_ADMINISTRATIF,
      password: password,
      active: true,
      agentAdministratif: {
        create: {
          name: 'Agent',
          surname: 'Admin',
          phone: '123456789'
        }
      }
    },
    {
      id: 'clvwnn1kp000208jp4j7e0c4b',
      email: 'teacher@test.com',
      username: 'teacher',
      name: 'Teacher User',
      firstName: 'Teacher',
      lastName: 'User',
      role: Role.TEACHER,
      password: password,
      active: true,
      teacher: {
        create: {
          name: 'Teacher',
          surname: 'User',
          phone: '123456789'
        }
      }
    },
    {
      id: 'clvwnn1kq000308jpc3b51f7e',
      email: 'parent@test.com',
      username: 'parent',
      name: 'Parent User',
      firstName: 'Parent',
      lastName: 'User',
      role: Role.PARENT,
      password: password,
      active: true,
      parent: {
        create: {
          name: 'Parent',
          surname: 'User',
          phone: '123456789',
          address: '123 Parent Street'
        }
      }
    },
    {
      id: 'clvwnn1kr000408jpf5a7g5j2',
      email: 'student@test.com',
      username: 'student',
      name: 'Student User',
      firstName: 'Student',
      lastName: 'User',
      role: Role.STUDENT,
      password: password,
      active: true,
      student: {
        create: {
          name: 'Student',
          surname: 'User',
          phone: '123456789',
          address: '123 Student Street',
          birthday: new Date('2010-01-01'),
          bloodType: 'O+',
          sex: 'MALE',
        }
      }
    }
  ];

  // Upsert users
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
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