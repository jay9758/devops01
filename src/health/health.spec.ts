import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';

describe('Health', () => {
  let controller: HealthController;
  const prisma = { $queryRaw: vi.fn() };
  const config = { get: vi.fn().mockReturnValue('devops-task-app') };

  beforeEach(async () => {
    vi.clearAllMocks();
    // Silence the expected error log from the "database down" case.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    })
      .setLogger({
        log: () => undefined,
        error: () => undefined,
        warn: () => undefined,
      })
      .compile();

    controller = moduleRef.get(HealthController);
  });

  it('reports ok when the database responds', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    const report = await controller.check();

    expect(report).toMatchObject({
      status: 'ok',
      application: 'devops-task-app',
      checks: { database: { status: 'up' } },
    });
    expect(new Date(report.timestamp).toISOString()).toBe(report.timestamp);
  });

  it('responds 503 with details when the database is down', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('ECONNREFUSED'));

    const error = await controller.check().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ServiceUnavailableException);
    const body = (error as ServiceUnavailableException).getResponse();
    expect(body).toMatchObject({
      status: 'error',
      checks: {
        database: { status: 'down', error: 'Database is unreachable' },
      },
    });
  });
});
