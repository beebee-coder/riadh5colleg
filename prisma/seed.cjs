// prisma/seed.cjs
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Démarrage du seeding de la base de données...");

  // --- Niveaux (Grades) ---
  console.log("Création des niveaux...");
  const gradesData = [
    { level: 7 }, { level: 8 }, { level: 9 },
    { level: 1 }, { level: 2 }, { level: 3 }, { level: 4 }
  ];
  for (const data of gradesData) {
    await prisma.grade.upsert({
      where: { level: data.level },
      update: {},
      create: data,
    });
  }
  const grades = await prisma.grade.findMany();
  console.log(`${grades.length} niveaux créés.`);

  // --- Salles (Classrooms) ---
  console.log("Création des salles...");
  const classroomsData = [
    { name: 'Salle 101', capacity: 30, building: 'A' },
    { name: 'Salle 102', capacity: 30, building: 'A' },
    { name: 'Salle 201', capacity: 25, building: 'B' },
    { name: 'Labo de Sciences', capacity: 20, building: 'C' },
    { name: 'Salle d\'Informatique', capacity: 20, building: 'C' },
  ];
  for (const data of classroomsData) {
    await prisma.classroom.upsert({
      where: { name: data.name },
      update: {},
      create: data,
    });
  }
  console.log(`${classroomsData.length} salles créées.`);

  // --- Matières (Subjects) ---
  console.log("Création des matières...");
  const subjectsData = [
    { name: 'Mathématiques', weeklyHours: 4, coefficient: 2 },
    { name: 'Français', weeklyHours: 4, coefficient: 2 },
    { name: 'Anglais', weeklyHours: 3, coefficient: 1 },
    { name: 'Histoire-Géographie', weeklyHours: 3, coefficient: 1 },
    { name: 'Sciences de la Vie et de la Terre', weeklyHours: 2, coefficient: 1 },
    { name: 'Physique-Chimie', weeklyHours: 2, coefficient: 1, isOptional: false },
    { name: 'Informatique', weeklyHours: 1, coefficient: 1, isOptional: false },
    { name: 'Éducation Physique', weeklyHours: 2, coefficient: 1 },
    { name: 'Arts Plastiques', weeklyHours: 1, coefficient: 1 },
    { name: 'Allemand', isOptional: true, weeklyHours: 2, coefficient: 1 },
    { name: 'Espagnol', isOptional: true, weeklyHours: 2, coefficient: 1 },
  ];
   for (const data of subjectsData) {
    await prisma.subject.upsert({
      where: { name: data.name },
      update: {},
      create: data,
    });
  }
  console.log(`${subjectsData.length} matières créées.`);

  // --- Classes ---
  console.log("Création des classes...");
  const classesData = [
    { name: '7ème Base 1', abbreviation: '7B1', gradeLevel: 7 },
    { name: '7ème Base 2', abbreviation: '7B2', gradeLevel: 7 },
    { name: '8ème Base 1', abbreviation: '8B1', gradeLevel: 8 },
    { name: '9ème Base 1', abbreviation: '9B1', gradeLevel: 9 },
  ];

  for (const data of classesData) {
    const grade = grades.find(g => g.level === data.gradeLevel);
    if (grade) {
      await prisma.class.upsert({
        where: { name: data.name },
        update: {},
        create: {
          name: data.name,
          abbreviation: data.abbreviation,
          gradeId: grade.id,
          capacity: 28,
        },
      });
    }
  }
  console.log(`${classesData.length} classes créées.`);
  
  console.log("✅ Seeding terminé avec succès.");
}

main()
  .catch((e) => {
    console.error("❌ Erreur pendant le seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
