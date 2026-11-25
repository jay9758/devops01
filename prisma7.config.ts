// Prisma CLI configuration (Prisma 7).
//
// Prisma 7 no longer loads `.env` automatically, so dotenv is imported here.
// In CI/CD or Azure, DATABASE_URL comes from real environment variables and
// the missing .env file is simply ignored.
//
// `process.env` is used instead of the `env()` helper on purpose: `env()`
// throws when the variable is missing, which would break `prisma generate`
// in build pipelines that have no database (generation never needs one).
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
