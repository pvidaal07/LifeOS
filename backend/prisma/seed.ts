import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Módulos disponibles en LifeOS
const MODULES = [
  { key: 'dashboard', order: 0 },
  { key: 'studies', order: 1 },
  { key: 'sports', order: 2 },
  { key: 'nutrition', order: 3 },
  { key: 'habits', order: 4 },
];

async function main() {
  console.log('🌱 Seeding database...\n');

  // ─── Crear usuario demo ───────────────────────────
  const hashedPassword = await bcrypt.hash('demo1234', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@lifeos.dev' },
    update: {},
    create: {
      email: 'demo@lifeos.dev',
      passwordHash: hashedPassword,
      name: 'Usuario Demo',
      settings: {
        create: {
          timezone: 'Europe/Madrid',
          theme: 'system',
          locale: 'es',
        },
      },
      reviewSettings: {
        create: {
          baseIntervals: [1, 7, 30, 90],
          perfectMultiplier: 2.5,
          goodMultiplier: 2.0,
          regularMultiplier: 1.2,
          badReset: true,
        },
      },
    },
  });

  // ─── Crear módulos por defecto ────────────────────
  for (const mod of MODULES) {
    await prisma.userModule.upsert({
      where: {
        userId_moduleKey: {
          userId: user.id,
          moduleKey: mod.key,
        },
      },
      update: {},
      create: {
        userId: user.id,
        moduleKey: mod.key,
        isActive: true,
        displayOrder: mod.order,
      },
    });
  }

  // ─── Crear plan de estudio de ejemplo ─────────────
  const plan = await prisma.studyPlan.create({
    data: {
      userId: user.id,
      name: 'Plan de Ejemplo',
      description: 'Un plan de estudio para probar LifeOS',
      subjects: {
        create: [
          {
            name: 'Bases de Datos',
            color: '#6366f1',
            displayOrder: 0,
            topics: {
              create: [
                { name: 'Modelo Relacional', displayOrder: 0 },
                { name: 'Normalización', displayOrder: 1 },
                { name: 'SQL Básico', displayOrder: 2 },
                { name: 'SQL Avanzado', displayOrder: 3 },
              ],
            },
          },
          {
            name: 'Sistemas Operativos',
            color: '#ec4899',
            displayOrder: 1,
            topics: {
              create: [
                { name: 'Procesos e Hilos', displayOrder: 0 },
                { name: 'Gestión de Memoria', displayOrder: 1 },
                { name: 'Sistemas de Archivos', displayOrder: 2 },
              ],
            },
          },
        ],
      },
    },
  });

  console.log('✅ Seed completado con éxito\n');
  console.log('   📧 Usuario demo: demo@lifeos.dev');
  console.log('   🔑 Contraseña:   demo1234');
  console.log(`   📚 Plan creado:  ${plan.name}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
