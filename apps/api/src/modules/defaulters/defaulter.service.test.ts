import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  $queryRaw: vi.fn(),
  defaulterAlert: {
    findFirst: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
  },
}));
vi.mock('../../config/prisma', () => ({ prisma: mockPrisma }));

import * as service from './defaulter.service';
import { NotFoundError } from '../../shared/errors';

beforeEach(() => vi.clearAllMocks());

describe('determineAlertLevel', () => {
  it('returns YELLOW for 1-30 days', () => {
    expect(service.determineAlertLevel(1)).toBe('YELLOW');
    expect(service.determineAlertLevel(15)).toBe('YELLOW');
    expect(service.determineAlertLevel(30)).toBe('YELLOW');
  });

  it('returns ORANGE for 31-60 days', () => {
    expect(service.determineAlertLevel(31)).toBe('ORANGE');
    expect(service.determineAlertLevel(45)).toBe('ORANGE');
    expect(service.determineAlertLevel(60)).toBe('ORANGE');
  });

  it('returns RED for 61+ days', () => {
    expect(service.determineAlertLevel(61)).toBe('RED');
    expect(service.determineAlertLevel(90)).toBe('RED');
    expect(service.determineAlertLevel(365)).toBe('RED');
  });
});

describe('generateAlerts', () => {
  it('creates alerts for overdue students without existing alerts', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      { student_id: 1, overdue_days: 45, amount_due: '5000' },
      { student_id: 2, overdue_days: 10, amount_due: '2000' },
    ]);
    mockPrisma.defaulterAlert.findFirst.mockResolvedValue(null);

    const res = await service.generateAlerts(1);
    expect(res.generated).toBe(2);
    expect(mockPrisma.defaulterAlert.create).toHaveBeenCalledTimes(2);
  });

  it('updates existing alerts when level changes', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      { student_id: 1, overdue_days: 70, amount_due: '8000' },
    ]);
    mockPrisma.defaulterAlert.findFirst.mockResolvedValue({
      id: 10, alertLevel: 'YELLOW', overdueDays: 30, amountDue: 5000,
    });

    const res = await service.generateAlerts(1);
    expect(res.generated).toBe(0);
    expect(res.updated).toBe(1);
    expect(mockPrisma.defaulterAlert.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 10 } }),
    );
  });

  it('skips alerts that have not changed', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      { student_id: 1, overdue_days: 70, amount_due: '8000' },
    ]);
    mockPrisma.defaulterAlert.findFirst.mockResolvedValue({
      id: 10, alertLevel: 'RED', overdueDays: 70, amountDue: 8000,
    });

    const res = await service.generateAlerts(1);
    expect(res.updated).toBe(0);
    expect(mockPrisma.defaulterAlert.update).not.toHaveBeenCalled();
  });
});

describe('getAlerts', () => {
  it('returns paginated alerts', async () => {
    const mockAlerts = [{ id: 1, student: { name: 'A' } }];
    mockPrisma.defaulterAlert.findMany.mockResolvedValue(mockAlerts);
    mockPrisma.defaulterAlert.count.mockResolvedValue(1);

    const res = await service.getAlerts(1);
    expect(res.alerts).toEqual(mockAlerts);
    expect(res.total).toBe(1);
  });
});

describe('resolveAlert', () => {
  it('resolves an existing alert', async () => {
    mockPrisma.defaulterAlert.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.defaulterAlert.update.mockResolvedValue({ id: 1, status: 'RESOLVED' });

    const res = await service.resolveAlert(1, 'admin@test.com');
    expect(res.status).toBe('RESOLVED');
  });

  it('throws on missing alert', async () => {
    mockPrisma.defaulterAlert.findUnique.mockResolvedValue(null);
    await expect(service.resolveAlert(999, 'admin')).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('dismissAlert', () => {
  it('dismisses an existing alert', async () => {
    mockPrisma.defaulterAlert.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.defaulterAlert.update.mockResolvedValue({ id: 1, status: 'DISMISSED' });

    const res = await service.dismissAlert(1);
    expect(res.status).toBe('DISMISSED');
  });

  it('throws on missing alert', async () => {
    mockPrisma.defaulterAlert.findUnique.mockResolvedValue(null);
    await expect(service.dismissAlert(999)).rejects.toBeInstanceOf(NotFoundError);
  });
});
