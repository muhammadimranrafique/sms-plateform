import type { Prisma } from '@prisma/client';
import type { CreateStudentDto, UpdateStudentDto, StudentQuery } from '@sms/types';
import { prisma } from '../../config/prisma';
import { audit, withAuditContext } from '../../shared/audit';
import { paginate, toSkipTake } from '../../shared/pagination';
import {
  NotFoundError,
  ConflictError,
  PreconditionFailedError,
} from '../../shared/errors';
import type { Actor } from '../../shared/types';

const withRefs = { class: true, session: true } satisfies Prisma.StudentInclude;

export async function listStudents(q: StudentQuery) {
  const where: Prisma.StudentWhereInput = {
    deletedAt: null,
    ...(q.search && {
      OR: [
        { name: { contains: q.search, mode: 'insensitive' } },
        { admissionNo: { contains: q.search, mode: 'insensitive' } },
        { fatherName: { contains: q.search, mode: 'insensitive' } },
        { contactNo: { contains: q.search, mode: 'insensitive' } },
      ],
    }),
    ...(q.classId && { classId: q.classId }),
    ...(q.sessionId && { sessionId: q.sessionId }),
    ...(q.status && { status: q.status }),
    ...(q.gender && { gender: q.gender }),
    ...(q.fromDob && { dob: { ...(q.fromDob && { gte: q.fromDob }), ...(q.toDob && { lte: q.toDob }) } }),
    ...(q.fromAdmissionDate && {
      createdAt: { ...(q.fromAdmissionDate && { gte: q.fromAdmissionDate }), ...(q.toAdmissionDate && { lte: q.toAdmissionDate }) },
    }),
  };

  const [data, total] = await prisma.$transaction([
    prisma.student.findMany({
      where,
      include: withRefs,
      ...toSkipTake(q.page, q.limit),
      orderBy: { [q.sortBy]: q.sortDir },
    }),
    prisma.student.count({ where }),
  ]);

  return paginate(data, total, q.page, q.limit);
}

export async function getStudent(id: number) {
  const student = await prisma.student.findFirst({
    where: { id, deletedAt: null },
    include: { ...withRefs, vouchers: { take: 10, orderBy: { createdAt: 'desc' } }, feeCharges: { take: 10, orderBy: { createdAt: 'desc' }, include: { feeHead: true } } },
  });
  if (!student) throw new NotFoundError('Student');
  return student;
}

export async function createStudent(dto: CreateStudentDto, user: Actor, requestId: string) {
  const exists = await prisma.student.findUnique({ where: { admissionNo: dto.admissionNo } });
  if (exists) throw new ConflictError(`Admission No '${dto.admissionNo}' already exists`);

  const student = await withAuditContext(user, (tx) =>
    tx.student.create({ data: { ...dto, createdBy: user.email }, include: withRefs }),
  );

  await audit(user, {
    action: 'INSERT',
    tableName: 'students',
    recordId: student.id,
    newValues: dto,
    requestId,
  });
  return student;
}

export async function updateStudent(id: number, dto: UpdateStudentDto, user: Actor) {
  const existing = await prisma.student.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new NotFoundError('Student');

  if (
    dto.expectedUpdatedAt &&
    existing.updatedAt.getTime() !== new Date(dto.expectedUpdatedAt).getTime()
  ) {
    throw new PreconditionFailedError(
      'Student was modified by someone else. Reload and retry.',
    );
  }

  const { expectedUpdatedAt: _ignore, ...data } = dto;
  return withAuditContext(user, (tx) =>
    tx.student.update({ where: { id }, data, include: withRefs }),
  );
}

export async function deleteStudent(id: number, user: Actor) {
  const existing = await prisma.student.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new NotFoundError('Student');

  await withAuditContext(user, (tx) =>
    tx.student.update({ where: { id }, data: { status: 'LEFT', deletedAt: new Date() } }),
  );
}
