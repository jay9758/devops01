export const APPLICATION_NAME = 'devops-task-app';

export interface AppConfig {
  name: string;
  env: string;
  host: string;
  port: number;
  corsOrigins: string[];
}

export interface DatabaseConfig {
  url: string;
}

export interface Configuration {
  app: AppConfig;
  database: DatabaseConfig;
}

function parseList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/**
 * Maps raw environment variables to a typed configuration object.
 * Read it through `ConfigService<Configuration, true>` so every lookup is typed.
 */
export default (): Configuration => ({
  app: {
    name: APPLICATION_NAME,
    env: process.env.NODE_ENV ?? 'development',
    host: process.env.HOST ?? '0.0.0.0',
    port: Number.parseInt(process.env.PORT ?? '3000', 10),
    corsOrigins: parseList(process.env.CORS_ORIGINS),
  },
  database: {
    url: process.env.DATABASE_URL ?? '',
  },
});
