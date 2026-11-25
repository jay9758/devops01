import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration.js';
import { validateEnv } from './config/env.validation.js';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { TasksModule } from './tasks/tasks.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // Loads `.env` when present (local dev). In containers/Azure the real
      // environment variables are used and a missing file is fine.
      load: [configuration],
      validate: validateEnv,
    }),
    PrismaModule,
    HealthModule,
    TasksModule,
  ],
})
export class AppModule {}
