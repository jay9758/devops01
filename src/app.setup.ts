import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Configuration } from './config/configuration.js';

/**
 * Cross-cutting HTTP setup shared by main.ts and the e2e tests, so tests run
 * against exactly the same pipeline as production.
 */
export function setupApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties that have no decorators
      forbidNonWhitelisted: true, // ...and reject the request if any were sent
      transform: true, // turn payloads into DTO class instances
    }),
  );

  // CORS is only needed when a browser app on another origin calls the API.
  // It stays disabled unless CORS_ORIGINS lists explicit origins.
  const config = app.get(ConfigService<Configuration, true>);
  const origins = config.get('app.corsOrigins', { infer: true });
  if (origins.length > 0) {
    app.enableCors({
      origin: origins,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    });
  }
}
