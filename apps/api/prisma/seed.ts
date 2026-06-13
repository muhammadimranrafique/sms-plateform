import { PrismaClient, Gender, Status, ConcessionType, AlertLevel, AlertStatus } from '@prisma/client';

const prisma = new PrismaClient();

const CLASSES = [
  { name: 'Nursery', section: 'A', sortOrder: 0 },
  { name: 'Nursery', section: 'B', sortOrder: 1 },
  { name: 'Prep', section: 'A', sortOrder: 2 },
  { name: 'Prep', section: 'B', sortOrder: 3 },
  { name: 'Grade 1', section: 'A', sortOrder: 4 },
  { name: 'Grade 1', section: 'B', sortOrder: 5 },
  { name: 'Grade 2', section: 'A', sortOrder: 6 },
  { name: 'Grade 2', section: 'B', sortOrder: 7 },
  { name: 'Grade 3', section: 'A', sortOrder: 8 },
  { name: 'Grade 4', section: 'A', sortOrder: 9 },
  { name: 'Grade 5', section: 'A', sortOrder: 10 },
];

const STUDENTS = [
  { admissionNo: 'ADM-0001', name: 'Muhammad Ahmed', fatherName: 'Abdul Rauf', gender: 'MALE' as Gender, contactNo: '+92 300 1112233', address: 'House 12, Block A, Gulshan-e-Maymar, Karachi' },
  { admissionNo: 'ADM-0002', name: 'Fatima Noor', fatherName: 'Muhammad Tariq', gender: 'FEMALE' as Gender, contactNo: '+92 321 2223344', address: 'Flat 5, Block C, DHA Phase 6, Karachi' },
  { admissionNo: 'ADM-0003', name: 'Abdullah Khan', fatherName: 'Shahid Khan', gender: 'MALE' as Gender, contactNo: '+92 333 3334455', address: 'House 8, Street 4, F-7/3, Islamabad' },
  { admissionNo: 'ADM-0004', name: 'Ayesha Siddiqua', fatherName: 'Muhammad Siddiq', gender: 'FEMALE' as Gender, contactNo: '+92 345 4445566', address: 'Village Ghaziabad, Tehsil Bhalwal, Sargodha' },
  { admissionNo: 'ADM-0005', name: 'Hassan Ali', fatherName: 'Ali Raza', gender: 'MALE' as Gender, contactNo: '+92 312 5556677', address: 'House 15, Model Town, Lahore' },
  { admissionNo: 'ADM-0006', name: 'Zainab Fatima', fatherName: 'Sajid Hussain', gender: 'FEMALE' as Gender, contactNo: '+92 315 6667788', address: 'Street 3, Satellite Town, Rawalpindi' },
  { admissionNo: 'ADM-0007', name: 'Muhammad Usman', fatherName: 'Nasir Mehmood', gender: 'MALE' as Gender, contactNo: '+92 322 7778899', address: 'House 20, Block B, Gulberg, Lahore' },
  { admissionNo: 'ADM-0008', name: 'Hira Batool', fatherName: 'Muhammad Ashraf', gender: 'FEMALE' as Gender, contactNo: '+92 300 8889900', address: 'Mohallah Eidgah, Sadiqabad, Rahim Yar Khan' },
  { admissionNo: 'ADM-0009', name: 'Omar Farooq', fatherName: 'Khalid Mahmood', gender: 'MALE' as Gender, contactNo: '+92 334 9990011', address: 'House 3, Canal View, Faisalabad' },
  { admissionNo: 'ADM-0010', name: 'Mariam Javed', fatherName: 'Javed Iqbal', gender: 'FEMALE' as Gender, contactNo: '+92 341 1100223', address: 'Flat 8, Clifton, Karachi' },
  { admissionNo: 'ADM-0011', name: 'Ibrahim Khalil', fatherName: 'Khalil-ur-Rehman', gender: 'MALE' as Gender, contactNo: '+92 346 2211334', address: 'Street 12, Westridge, Rawalpindi' },
  { admissionNo: 'ADM-0012', name: 'Sana Mirza', fatherName: 'Mirza Baig', gender: 'FEMALE' as Gender, contactNo: '+92 347 3322445', address: 'House 7, Phase 5, DHA, Karachi' },
  { admissionNo: 'ADM-0013', name: 'Rayan Akhtar', fatherName: 'Akhtar Ali', gender: 'MALE' as Gender, contactNo: '+92 311 4433556', address: 'Village Dera Ghazi Khan, Tehsil Taunsa' },
  { admissionNo: 'ADM-0014', name: 'Amna Riaz', fatherName: 'Riaz Ahmad', gender: 'FEMALE' as Gender, contactNo: '+92 313 5544667', address: 'House 25, Garden Town, Lahore' },
  { admissionNo: 'ADM-0015', name: 'Zayan Sheikh', fatherName: 'Sheikh Muhammad', gender: 'MALE' as Gender, contactNo: '+92 317 6655778', address: 'Flat 12, Johar Town, Lahore' },
  { admissionNo: 'ADM-0016', name: 'Laiba Tariq', fatherName: 'Tariq Jameel', gender: 'FEMALE' as Gender, contactNo: '+92 318 7766889', address: 'Street 8, Officers Colony, Multan' },
  { admissionNo: 'ADM-0017', name: 'Muhammad Hamza', fatherName: 'Nadeem Ahmed', gender: 'MALE' as Gender, contactNo: '+92 332 8877990', address: 'House 9, Block D, University Town, Peshawar' },
  { admissionNo: 'ADM-0018', name: 'Eman Shah', fatherName: 'Shahid Afridi', gender: 'FEMALE' as Gender, contactNo: '+92 335 9988001', address: 'Mohallah Qasimabad, Sukkur' },
  { admissionNo: 'ADM-0019', name: 'Ayaan Mahmood', fatherName: 'Mahmood Hasan', gender: 'MALE' as Gender, contactNo: '+92 336 1099123', address: 'House 4, Civic Center, Bahawalpur' },
  { admissionNo: 'ADM-0020', name: 'Areeba Ansari', fatherName: 'Muhammad Ali', gender: 'FEMALE' as Gender, contactNo: '+92 344 2200234', address: 'Flat 6, Block 3, Gulistan-e-Jauhar, Karachi' },
  { admissionNo: 'ADM-0021', name: 'Muhammad Ehsan', fatherName: 'Ehsan-ul-Haq', gender: 'MALE' as Gender, contactNo: '+92 349 3311345', address: 'Village Chakwal, District Chakwal' },
  { admissionNo: 'ADM-0022', name: 'Khadija Tul Kubra', fatherName: 'Abdul Sattar', gender: 'FEMALE' as Gender, contactNo: '+92 355 4422456', address: 'House 11, Shah Faisal Colony, Karachi' },
  { admissionNo: 'ADM-0023', name: 'Arham Shahid', fatherName: 'Shahid Mahmood', gender: 'MALE' as Gender, contactNo: '+92 358 5533567', address: 'Street 2, Saddar, Hyderabad' },
  { admissionNo: 'ADM-0024', name: 'Mahnoor Sheikh', fatherName: 'Sheikh Nadeem', gender: 'FEMALE' as Gender, contactNo: '+92 360 6644678', address: 'House 2, Defence View, Karachi' },
  { admissionNo: 'ADM-0025', name: 'Saad Waseem', fatherName: 'Waseem Akram', gender: 'MALE' as Gender, contactNo: '+92 362 7755789', address: 'Flat 15, Iqbal Town, Lahore' },
  { admissionNo: 'ADM-0026', name: 'Sara Rahim', fatherName: 'Abdul Rahim', gender: 'FEMALE' as Gender, contactNo: '+92 364 8866890', address: 'Village Jhelum, Tehsil Pind Dadan Khan' },
  { admissionNo: 'ADM-0027', name: 'Muzammil Iqbal', fatherName: 'Iqbal Hussain', gender: 'MALE' as Gender, contactNo: '+92 366 9977901', address: 'House 18, Block E, Wapda Town, Lahore' },
  { admissionNo: 'ADM-0028', name: 'Saima Parveen', fatherName: 'Muhammad Yousaf', gender: 'FEMALE' as Gender, contactNo: '+92 368 1088012', address: 'Mohallah Awan Abad, Gujranwala' },
  { admissionNo: 'ADM-0029', name: 'Taha Rizvi', fatherName: 'Rizvi Abbas', gender: 'MALE' as Gender, contactNo: '+92 370 2199123', address: 'House 14, Askari 5, Rawalpindi' },
  { admissionNo: 'ADM-0030', name: 'Noor Fatima', fatherName: 'Muhammad Aslam', gender: 'FEMALE' as Gender, contactNo: '+92 372 3200234', address: 'Flat 3, Blue Area, Islamabad' },
  { admissionNo: 'ADM-0031', name: 'Zaid Ahmad', fatherName: 'Ahmad Nawaz', gender: 'MALE' as Gender, contactNo: '+92 374 4311345', address: 'Street 7, Shahdara, Lahore' },
  { admissionNo: 'ADM-0032', name: 'Aleena Khan', fatherName: 'Naeem Khan', gender: 'FEMALE' as Gender, contactNo: '+92 376 5422456', address: 'House 22, Block F, Gulshan-e-Ravi, Lahore' },
  { admissionNo: 'ADM-0033', name: 'Hanzala Naeem', fatherName: 'Naeem Akhtar', gender: 'MALE' as Gender, contactNo: '+92 378 6533567', address: 'House 10, Canal Garden, Faisalabad' },
  { admissionNo: 'ADM-0034', name: 'Rabia Anjum', fatherName: 'Anjum Naveed', gender: 'FEMALE' as Gender, contactNo: '+92 380 7644678', address: 'Village Sillanwali, Sargodha' },
  { admissionNo: 'ADM-0035', name: 'Saim Ali', fatherName: 'Sabir Ali', gender: 'MALE' as Gender, contactNo: '+92 382 8755789', address: 'House 30, Officers Colony, Sahiwal' },
  { admissionNo: 'ADM-0036', name: 'Hafsa Noor', fatherName: 'Noor Muhammad', gender: 'FEMALE' as Gender, contactNo: '+92 384 9866890', address: 'Flat 8, Hussainabad, Karachi' },
  { admissionNo: 'ADM-0037', name: 'Muhammad Bilal', fatherName: 'Bilal Ahmed', gender: 'MALE' as Gender, contactNo: '+92 386 1977901', address: 'Street 5, Satellite Town, Quetta' },
  { admissionNo: 'ADM-0038', name: 'Fariha Ayub', fatherName: 'Muhammad Ayub', gender: 'FEMALE' as Gender, contactNo: '+92 388 2088012', address: 'House 7, Model Colony, Malir, Karachi' },
  { admissionNo: 'ADM-0039', name: 'Muhammad Ayan', fatherName: 'Tanveer Ahmad', gender: 'MALE' as Gender, contactNo: '+92 390 3199123', address: 'Village Multan Khurd, Okara' },
  { admissionNo: 'ADM-0040', name: 'Iqra Jabeen', fatherName: 'Muhammad Rafiq', gender: 'FEMALE' as Gender, contactNo: '+92 392 4200234', address: 'House 29, Block G, Samanabad, Lahore' },
  { admissionNo: 'ADM-0041', name: 'Ahmad Raza', fatherName: 'Raza Haider', gender: 'MALE' as Gender, contactNo: '+92 394 5311345', address: 'Flat 4, Johar Town, Lahore' },
  { admissionNo: 'ADM-0042', name: 'Zara Asif', fatherName: 'Asif Mahmood', gender: 'FEMALE' as Gender, contactNo: '+92 396 6422456', address: 'House 2, Cavalry Ground, Lahore Cantt' },
  { admissionNo: 'ADM-0043', name: 'Hadi Ali', fatherName: 'Muhammad Saeed', gender: 'MALE' as Gender, contactNo: '+92 398 7533567', address: 'Street 9, PECHS, Karachi' },
  { admissionNo: 'ADM-0044', name: 'Maryam Arshad', fatherName: 'Arshad Mehmood', gender: 'FEMALE' as Gender, contactNo: '+92 400 8644678', address: 'House 16, Green Town, Karachi' },
  { admissionNo: 'ADM-0045', name: 'Musab Khan', fatherName: 'Khalid Khan', gender: 'MALE' as Gender, contactNo: '+92 402 9755789', address: 'Village Kukranwala, Sheikhupura' },
  { admissionNo: 'ADM-0046', name: 'Sabeen Aslam', fatherName: 'Muhammad Aslam', gender: 'FEMALE' as Gender, contactNo: '+92 404 0866890', address: 'House 17, Block A, DHA Phase 2, Islamabad' },
  { admissionNo: 'ADM-0047', name: 'Rehan Ali', fatherName: 'Ali Abbas', gender: 'MALE' as Gender, contactNo: '+92 406 1977901', address: 'Flat 11, Clifton Block 9, Karachi' },
  { admissionNo: 'ADM-0048', name: 'Kinza Riaz', fatherName: 'Riaz Hussain', gender: 'FEMALE' as Gender, contactNo: '+92 408 2088012', address: 'Street 2, Court Road, Abbottabad' },
  { admissionNo: 'ADM-0049', name: 'Muhammad Shayan', fatherName: 'Shabbir Ahmed', gender: 'MALE' as Gender, contactNo: '+92 410 3199123', address: 'House 5, Peoples Colony, Faisalabad' },
  { admissionNo: 'ADM-0050', name: 'Areej Nadeem', fatherName: 'Nadeem Ahmad', gender: 'FEMALE' as Gender, contactNo: '+92 412 4200234', address: 'Mohallah Ghalla Mandi, Sargodha' },
  { admissionNo: 'ADM-0051', name: 'Ali Hamza', fatherName: 'Hamza Ali', gender: 'MALE' as Gender, contactNo: '+92 414 5311345', address: 'House 5, Model Town, Gujranwala' },
  { admissionNo: 'ADM-0052', name: 'Rabia Akhtar', fatherName: 'Akhtar Hussain', gender: 'FEMALE' as Gender, contactNo: '+92 416 6422456', address: 'Village Gangapur, District Sahiwal' },
  { admissionNo: 'ADM-0053', name: 'Muhammad Talha', fatherName: 'Tahir Mahmood', gender: 'MALE' as Gender, contactNo: '+92 418 7533567', address: 'House 21, Block C, Gulshan-e-Jinnah, Faisalabad' },
  { admissionNo: 'ADM-0054', name: 'Sanaullah Khan', fatherName: 'Khan Muhammad', gender: 'MALE' as Gender, contactNo: '+92 420 8644678', address: 'Street 5, Landhi, Karachi' },
  { admissionNo: 'ADM-0055', name: 'Mehwish Iqbal', fatherName: 'Iqbal Ahmed', gender: 'FEMALE' as Gender, contactNo: '+92 422 9755789', address: 'House 8, Block B, Satellite Town, Sialkot' },
];

const FEE_HEADS = [
  { name: 'Tuition Fee', code: 'TUITION', description: 'Monthly tuition fee', sortOrder: 0 },
  { name: 'Admission Fee', code: 'ADMISSION', description: 'One-time admission fee', sortOrder: 1 },
  { name: 'Exam Fee', code: 'EXAM', description: 'Term examination fee', sortOrder: 2 },
  { name: 'Library Fee', code: 'LIBRARY', description: 'Annual library fee', sortOrder: 3 },
  { name: 'Transport Fee', code: 'TRANSPORT', description: 'Monthly transport fee', sortOrder: 4 },
  { name: 'Sports Fee', code: 'SPORTS', description: 'Annual sports fee', sortOrder: 5 },
  { name: 'Lab Fee', code: 'LAB', description: 'Science lab fee', sortOrder: 6 },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function getClassId(classRecords: { id: number; name: string; section: string | null }[], index: number): number {
  const cls = CLASSES[index % CLASSES.length]!;
  const record = classRecords.find(
    (c) => c.name === cls.name && (c.section ?? '') === (cls.section ?? ''),
  );
  return record!.id;
}

async function main() {
  console.log('Clearing existing data...');
  await prisma.paymentAllocation.deleteMany();
  await prisma.feePayment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.feeCharge.deleteMany();
  await prisma.voucherLine.deleteMany();
  await prisma.voucherPrintLog.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.promotionBatch.deleteMany();
  await prisma.promotionRule.deleteMany();
  await prisma.feeStructureItem.deleteMany();
  await prisma.feeStructure.deleteMany();
  await prisma.feeHead.deleteMany();
  await prisma.studentConcession.deleteMany();
  await prisma.feeConcession.deleteMany();
  await prisma.defaulterAlert.deleteMany();
  await prisma.bounceFeeRule.deleteMany();
  await prisma.studentLedger.deleteMany();
  await prisma.student.deleteMany();
  await prisma.class.deleteMany();
  await prisma.session.deleteMany();
  await prisma.voucherSequence.deleteMany();
  await prisma.auditLog.deleteMany();

  console.log('Creating voucher sequence...');
  await prisma.voucherSequence.create({ data: { id: 1, lastValue: 0 } });

  console.log('Creating sessions...');
  const session2023 = await prisma.session.create({
    data: {
      name: '2023-2024',
      startDate: new Date('2023-08-01'),
      endDate: new Date('2024-06-30'),
      isCurrent: false,
    },
  });

  const session2024 = await prisma.session.create({
    data: {
      name: '2024-2025',
      startDate: new Date('2024-08-01'),
      endDate: new Date('2025-06-30'),
      isCurrent: true,
    },
  });

  console.log('Creating classes...');
  const classRecords = await Promise.all(
    CLASSES.map((c) =>
      prisma.class.upsert({
        where: { name_section: { name: c.name, section: c.section ?? '' } },
        update: {},
        create: c,
      }),
    ),
  );

  console.log('Creating fee heads...');
  const feeHeads = await Promise.all(
    FEE_HEADS.map((h) =>
      prisma.feeHead.upsert({
        where: { code: h.code },
        update: {},
        create: h,
      }),
    ),
  );

  const feeHeadMap = new Map(feeHeads.map((h) => [h.code, h.id]));

  console.log('Creating fee structures for each class...');
  for (const cls of classRecords) {
    await prisma.feeStructure.create({
      data: {
        name: `${cls.name}${cls.section ? ' ' + cls.section : ''} Fee Structure`,
        classId: cls.id,
        sessionId: session2024.id,
        items: {
          create: [
            { feeHeadId: feeHeadMap.get('TUITION')!, amount: randomInt(3000, 12000) },
            { feeHeadId: feeHeadMap.get('EXAM')!, amount: randomInt(500, 2000) },
            { feeHeadId: feeHeadMap.get('LIBRARY')!, amount: randomInt(200, 500) },
            { feeHeadId: feeHeadMap.get('SPORTS')!, amount: randomInt(200, 1000) },
          ],
        },
      },
    });
  }

  console.log('Creating 2023-2024 session students...');
  const oldStudents = [];
  for (let i = 0; i < 30; i++) {
    const s = await prisma.student.create({
      data: {
        admissionNo: `ADM-${String(i + 56).padStart(4, '0')}`,
        name: STUDENTS[i]!.name,
        fatherName: STUDENTS[i]!.fatherName,
        gender: STUDENTS[i]!.gender,
        contactNo: STUDENTS[i]!.contactNo,
        address: STUDENTS[i]!.address,
        dob: new Date(`2016-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`),
        classId: getClassId(classRecords, i + 5),
        sessionId: session2023.id,
        status: 'ACTIVE' as Status,
        createdBy: 'seed@system',
      },
    });
    oldStudents.push(s);
  }

  console.log('Creating promotions from 2023-2024 to 2024-2025...');
  const batchId = crypto.randomUUID();
  await prisma.promotionBatch.create({
    data: {
      id: batchId,
      status: 'EXECUTED',
      promotedBy: 'seed@system',
      remarks: 'Annual promotion 2024',
    },
  });

  for (const student of oldStudents) {
    const currentClassIndex = CLASSES.findIndex(
      (c) => classRecords.find((r) => r.id === student.classId)?.name === c.name && (classRecords.find((r) => r.id === student.classId)?.section ?? '') === (c.section ?? ''),
    );
    const newClassIndex = Math.min(currentClassIndex + 1, CLASSES.length - 1);
    const newClass = classRecords[newClassIndex]!;

    await prisma.promotion.create({
      data: {
        studentId: student.id,
        oldClassId: student.classId,
        newClassId: newClass.id,
        oldSessionId: session2023.id,
        newSessionId: session2024.id,
        promotedBy: 'seed@system',
        batchId,
        remarks: 'Annual promotion 2024',
      },
    });
  }

  console.log('Creating current session students...');
  const currentStudents = [];
  for (let i = 0; i < STUDENTS.length; i++) {
    const s = STUDENTS[i]!;
    const classId = getClassId(classRecords, i);
    const dobYear = 2015 + Math.floor(i / 10);
    const dobMonth = (i % 12) + 1;

    const student = await prisma.student.create({
      data: {
        admissionNo: s.admissionNo,
        name: s.name,
        fatherName: s.fatherName,
        gender: s.gender,
        contactNo: s.contactNo,
        address: s.address,
        dob: new Date(`${dobYear}-${String(dobMonth).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`),
        classId,
        sessionId: session2024.id,
        status: 'ACTIVE' as Status,
        createdBy: 'seed@system',
      },
    });
    currentStudents.push(student);
  }

  console.log('Creating vouchers with fee head lines...');
  let voucherCount = 0;
  for (const student of currentStudents) {
    const numVouchers = randomInt(1, 4);
    const feeStructure = await prisma.feeStructure.findUnique({
      where: { classId_sessionId: { classId: student.classId, sessionId: session2024.id } },
      include: { items: { include: { feeHead: true } } },
    });

    if (!feeStructure) continue;

    const months = ['2024-08', '2024-09', '2024-10', '2024-11', '2024-12', '2025-01', '2025-02', '2025-03', '2025-04', '2025-05'];
    const usedMonths = new Set<string>();

    for (let v = 0; v < numVouchers; v++) {
      const feeMonth = months.filter((m) => !usedMonths.has(m))[randomInt(0, months.length - usedMonths.size - 1)] ?? months[0]!;
      usedMonths.add(feeMonth);

      const totalAmount = feeStructure.items.reduce((s, item) => s + item.amount.toNumber(), 0);
      const statuses = ['PENDING', 'PAID', 'PENDING', 'PAID', 'PAID'] as const;
      const status = pick(statuses);

      voucherCount++;
      const voucherNo = `VCH-${String(voucherCount).padStart(5, '0')}`;

      const voucher = await prisma.voucher.create({
        data: {
          voucherNo,
          studentId: student.id,
          voucherDate: new Date('2024-08-01'),
          dueDate: new Date(`2024-${String(randomInt(8, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`),
          amount: totalAmount,
          netAmount: totalAmount,
          feeMonth,
          status,
        },
      });

      for (const item of feeStructure.items) {
        await prisma.voucherLine.create({
          data: {
            voucherId: voucher.id,
            feeHeadId: item.feeHeadId,
            description: item.feeHead.name,
            amount: item.amount,
          },
        });

        await prisma.feeCharge.create({
          data: {
            studentId: student.id,
            feeHeadId: item.feeHeadId,
            sessionId: session2024.id,
            feeMonth,
            amount: item.amount,
            dueDate: voucher.dueDate,
            status: status === 'PAID' ? 'PAID' : 'UNPAID',
            paidAmount: status === 'PAID' ? item.amount : 0,
          },
        });
      }
    }
  }

  await prisma.voucherSequence.update({
    where: { id: 1 },
    data: { lastValue: voucherCount },
  });

  console.log('Creating a promotion rule...');
  await prisma.promotionRule.create({
    data: {
      name: 'Default Promotion Rule 2024-2025',
      sessionId: session2024.id,
      passPercentage: 40,
      feeClearanceRequired: true,
    },
  });

  console.log('Creating fee concessions...');
  const concessions = await Promise.all([
    prisma.feeConcession.create({
      data: {
        name: 'Sibling Discount',
        type: ConcessionType.PERCENTAGE,
        value: 10,
        description: '10% discount for siblings',
        criteria: { siblingEnrolled: true },
      },
    }),
    prisma.feeConcession.create({
      data: {
        name: 'Merit Scholarship',
        type: ConcessionType.PERCENTAGE,
        value: 25,
        description: '25% merit-based scholarship for top performers',
        criteria: { minPercentage: 85 },
      },
    }),
    prisma.feeConcession.create({
      data: {
        name: 'Need-Based Aid',
        type: ConcessionType.PERCENTAGE,
        value: 15,
        description: '15% need-based financial assistance',
        criteria: { incomeBelow: 50000 },
      },
    }),
    prisma.feeConcession.create({
      data: {
        name: 'Staff Child Concession',
        type: ConcessionType.PERCENTAGE,
        value: 50,
        description: '50% concession for staff children',
        criteria: { isStaffChild: true },
      },
    }),
  ]);

  console.log('Assigning concessions to students...');
  const allStudents = await prisma.student.findMany({ take: 20 });
  const tuitionHead = feeHeads.find((h) => h.code === 'TUITION')!;
  const examHead = feeHeads.find((h) => h.code === 'EXAM')!;
  const libraryHead = feeHeads.find((h) => h.code === 'LIBRARY')!;

  if (allStudents.length >= 4) {
    await prisma.studentConcession.create({
      data: {
        studentId: allStudents[0]!.id,
        concessionId: concessions[1]!.id, // Merit Scholarship
        feeHeadId: tuitionHead.id,
        startMonth: '2024-08',
        endMonth: '2025-06',
        approvedBy: 'seed@system',
        remarks: 'Top performer in annual exams',
      },
    });
    await prisma.studentConcession.create({
      data: {
        studentId: allStudents[2]!.id,
        concessionId: concessions[0]!.id, // Sibling Discount
        feeHeadId: tuitionHead.id,
        startMonth: '2024-08',
        endMonth: '2025-06',
        approvedBy: 'seed@system',
        remarks: 'Sibling already enrolled',
      },
    });
    await prisma.studentConcession.create({
      data: {
        studentId: allStudents[4]!.id,
        concessionId: concessions[2]!.id, // Need-Based Aid
        feeHeadId: tuitionHead.id,
        startMonth: '2024-08',
        endMonth: '2025-06',
        approvedBy: 'seed@system',
        remarks: 'Financial assistance approved',
      },
    });
    await prisma.studentConcession.create({
      data: {
        studentId: allStudents[4]!.id,
        concessionId: concessions[2]!.id,
        feeHeadId: examHead.id,
        startMonth: '2024-08',
        endMonth: '2025-06',
        approvedBy: 'seed@system',
      },
    });
    await prisma.studentConcession.create({
      data: {
        studentId: allStudents[4]!.id,
        concessionId: concessions[2]!.id,
        feeHeadId: libraryHead.id,
        startMonth: '2024-08',
        endMonth: '2025-06',
        approvedBy: 'seed@system',
      },
    });
    await prisma.studentConcession.create({
      data: {
        studentId: allStudents[6]!.id,
        concessionId: concessions[3]!.id, // Staff Child
        feeHeadId: tuitionHead.id,
        startMonth: '2024-08',
        endMonth: '2025-06',
        approvedBy: 'seed@system',
        remarks: 'Child of staff member',
      },
    });
  }

  console.log('Creating bounce fee rule...');
  await prisma.bounceFeeRule.create({
    data: {
      name: 'Standard Cheque Bounce Fee',
      fee: 500,
      isActive: true,
    },
  });

  console.log('Creating defaulter alerts for students with overdue vouchers...');
  const overdueVouchers = await prisma.voucher.findMany({
    where: { status: 'PENDING' },
    include: { student: true },
    take: 5,
  });
  for (const v of overdueVouchers) {
    const overdueDays = Math.floor((Date.now() - v.dueDate.getTime()) / (1000 * 60 * 60 * 24));
    await prisma.defaulterAlert.create({
      data: {
        studentId: v.studentId,
        sessionId: session2024.id,
        overdueDays: Math.max(overdueDays, 15),
        amountDue: v.amount,
        alertLevel: overdueDays > 60 ? AlertLevel.RED : overdueDays > 30 ? AlertLevel.ORANGE : AlertLevel.YELLOW,
        status: AlertStatus.ACTIVE,
      },
    });
  }

  console.log('Running daily aggregation refresh...');
  await prisma.$executeRawUnsafe("SELECT refresh_daily_aggregation(CURRENT_DATE)");

  const studentCount = await prisma.student.count();
  const classCount = await prisma.class.count();
  const sessionCount = await prisma.session.count();
  const voucherCountTotal = await prisma.voucher.count();
  const promotionCount = await prisma.promotion.count();
  const feeStructureCount = await prisma.feeStructure.count();
  const feeHeadCount = await prisma.feeHead.count();
  const concessionCount = await prisma.feeConcession.count();
  const studentConcessionCount = await prisma.studentConcession.count();
  const defaulterAlertCount = await prisma.defaulterAlert.count();
  const bounceRuleCount = await prisma.bounceFeeRule.count();

  console.log('\n========================================');
  console.log('Seed Complete');
  console.log('========================================');
  console.log(`  Sessions:           ${sessionCount}`);
  console.log(`  Classes:            ${classCount}`);
  console.log(`  Students:           ${studentCount}`);
  console.log(`  Promotions:         ${promotionCount}`);
  console.log(`  Vouchers:           ${voucherCountTotal}`);
  console.log(`  Fee Heads:          ${feeHeadCount}`);
  console.log(`  Fee Structures:     ${feeStructureCount}`);
  console.log(`  Fee Concessions:    ${concessionCount}`);
  console.log(`  Student Concessions:${studentConcessionCount}`);
  console.log(`  Defaulter Alerts:   ${defaulterAlertCount}`);
  console.log(`  Bounce Fee Rules:   ${bounceRuleCount}`);
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
