import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { setupApp } from './app.setup.js';
import type { Configuration } from './config/configuration.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  setupApp(app);

  // Run OnModuleDestroy hooks (e.g. closing the DB pool) on SIGTERM/SIGINT,
  // which is how Docker, Azure and Kubernetes stop a container.
  app.enableShutdownHooks();

  const config = app.get(ConfigService<Configuration, true>);
  const { host, port, name, env } = config.get('app', { infer: true });

  await app.listen(port, host);
  Logger.log(
    `${name} listening on http://${host}:${port} (${env})`,
    'Bootstrap',
  );
}

await bootstrap();
