import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Configuration } from '../config/configuration.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface DependencyHealth {
  status: 'up' | 'down';
  responseTimeMs?: number;
  error?: string;
}

export interface HealthReport {
  status: 'ok' | 'error';
  application: string;
  timestamp: string;
  uptimeSeconds: number;
  checks: {
    database: DependencyHealth;
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Configuration, true>,
  ) {}

  async check(): Promise<HealthReport> {
    const database = await this.checkDatabase();

    return {
      status: database.status === 'up' ? 'ok' : 'error',
      application: this.config.get('app.name', { infer: true }),
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      checks: { database },
    };
  }

  private async checkDatabase(): Promise<DependencyHealth> {
    const startedAt = performance.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'up',
        responseTimeMs: Math.round(performance.now() - startedAt),
      };
    } catch (error) {
      // Log the real cause, but don't leak connection details to callers.
      this.logger.error(`Database health check failed: ${String(error)}`);
      return { status: 'down', error: 'Database is unreachable' };
    }
  }
}
