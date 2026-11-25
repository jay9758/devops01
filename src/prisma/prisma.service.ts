import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import type { Configuration } from '../config/configuration.js';
import { PrismaClient } from '../generated/prisma/client.js';

/**
 * Prisma 7 requires a driver adapter: the client talks to PostgreSQL through
 * the `pg` driver (via @prisma/adapter-pg) instead of a bundled Rust engine.
 * The connection string is handed to the adapter here at runtime; it is not
 * read from schema.prisma.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService<Configuration, true>) {
    const adapter = new PrismaPg({
      connectionString: config.get('database.url', { infer: true }),
      // Fail fast instead of hanging forever when the database is unreachable
      // (pg's default connection timeout is "no timeout").
      connectionTimeoutMillis: 5_000,
      max: 10,
    });
    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    // The app still starts if the database is down: the pool reconnects on
    // the next query, and GET /health reports the database as "down" meanwhile.
    try {
      await this.$connect();
      await this.$queryRaw`SELECT 1`;
      this.logger.log('Database connection established');
    } catch (error) {
      this.logger.error(
        `Database is not reachable at startup: ${(error as Error).message}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Database connection closed');
  }
}
