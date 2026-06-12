import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Voucher sequence singleton
  await prisma.voucherSequence.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, lastValue: 0 },
  });

  // Current session
  const session = await prisma.session.upsert({
    where: { name: '2024-2025' },
    update: { isCurrent: true },
    create: {
      name: '2024-2025',
      startDate: new Date('2024-08-01'),
      endDate: new Date('2025-06-30'),
      isCurrent: true,
    },
  });

  // Classes
  const classNames = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'];
  const classes = [];
  for (let i = 0; i < classNames.length; i++) {
    const c = await prisma.class.upsert({
      where: { name_section: { name: classNames[i]!, section: 'A' } },
      update: {},
      create: { name: classNames[i]!, section: 'A', sortOrder: i },
    });
    classes.push(c);
  }

  // Sample students
  for (let i = 1; i <= 20; i++) {
    const cls = classes[i % classes.length]!;
    await prisma.student.upsert({
      where: { admissionNo: `ADM-${String(i).padStart(4, '0')}` },
      update: {},
      create: {
        admissionNo: `ADM-${String(i).padStart(4, '0')}`,
        name: `Student ${i}`,
        fatherName: `Father ${i}`,
        gender: i % 2 === 0 ? 'FEMALE' : 'MALE',
        classId: cls.id,
        sessionId: session.id,
        createdBy: 'seed@system',
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log('\u2705 Seed complete: 1 session, 5 classes, 20 students');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
