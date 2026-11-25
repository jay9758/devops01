import { NotFoundException } from '@nestjs/common';
import { Prisma, type Task } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { TasksService } from './tasks.service.js';

const TASK_ID = '6f1c1a52-6c2c-4a8e-9f0e-2a3b4c5d6e7f';

const sampleTask: Task = {
  id: TASK_ID,
  title: 'Write README',
  description: null,
  status: 'PENDING',
  priority: 'MEDIUM',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const recordNotFound = () =>
  new Prisma.PrismaClientKnownRequestError('Record not found', {
    code: 'P2025',
    clientVersion: 'test',
  });

describe('TasksService', () => {
  let service: TasksService;
  let prisma: {
    task: {
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    prisma = {
      task: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };
    service = new TasksService(prisma as unknown as PrismaService);
  });

  describe('findAll', () => {
    it('returns tasks ordered by newest first', async () => {
      prisma.task.findMany.mockResolvedValue([sampleTask]);

      await expect(service.findAll()).resolves.toEqual([sampleTask]);
      expect(prisma.task.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('returns the task when it exists', async () => {
      prisma.task.findUnique.mockResolvedValue(sampleTask);

      await expect(service.findOne(TASK_ID)).resolves.toEqual(sampleTask);
      expect(prisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: TASK_ID },
      });
    });

    it('throws NotFoundException when the task does not exist', async () => {
      prisma.task.findUnique.mockResolvedValue(null);

      await expect(service.findOne(TASK_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('persists the task', async () => {
      const dto = { title: 'Write README', priority: 'HIGH' as const };
      prisma.task.create.mockResolvedValue({ ...sampleTask, ...dto });

      const result = await service.create(dto);

      expect(prisma.task.create).toHaveBeenCalledWith({ data: dto });
      expect(result.priority).toBe('HIGH');
    });
  });

  describe('update', () => {
    it('updates and returns the task', async () => {
      const dto = { status: 'COMPLETED' as const };
      prisma.task.update.mockResolvedValue({ ...sampleTask, ...dto });

      const result = await service.update(TASK_ID, dto);

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: TASK_ID },
        data: dto,
      });
      expect(result.status).toBe('COMPLETED');
    });

    it('maps Prisma "record not found" to NotFoundException', async () => {
      prisma.task.update.mockRejectedValue(recordNotFound());

      await expect(
        service.update(TASK_ID, { title: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rethrows unexpected errors', async () => {
      const failure = new Error('connection lost');
      prisma.task.update.mockRejectedValue(failure);

      await expect(service.update(TASK_ID, { title: 'x' })).rejects.toBe(
        failure,
      );
    });
  });

  describe('remove', () => {
    it('deletes the task', async () => {
      prisma.task.delete.mockResolvedValue(sampleTask);

      await expect(service.remove(TASK_ID)).resolves.toBeUndefined();
      expect(prisma.task.delete).toHaveBeenCalledWith({
        where: { id: TASK_ID },
      });
    });

    it('maps Prisma "record not found" to NotFoundException', async () => {
      prisma.task.delete.mockRejectedValue(recordNotFound());

      await expect(service.remove(TASK_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
