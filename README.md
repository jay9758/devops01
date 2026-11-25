# devops-task-app

A small Task Management REST API used as the foundation for a hands-on DevOps
learning project. The app is intentionally simple; later milestones add Docker,
GitHub Actions CI/CD, Azure, Terraform and Kubernetes around it.

| Layer           | Choice                                    |
| --------------- | ----------------------------------------- |
| Runtime         | Node.js 24                                |
| Framework       | NestJS 12 (TypeScript 6, ES modules)      |
| Database        | PostgreSQL 17                             |
| ORM             | Prisma 7 with the `@prisma/adapter-pg` driver adapter |
| Tests           | Vitest (unit + e2e with Supertest)        |
| Lint / format   | oxlint, Prettier                          |

---

## 1. Prerequisites

- **Node.js 24** (`node -v`). An `.nvmrc` is included: `nvm use`.
- **PostgreSQL 17** running locally (or anywhere reachable).

## 2. Local setup

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file and edit DATABASE_URL
cp .env.example .env            # PowerShell: Copy-Item .env.example .env

# 3. Generate the Prisma client (writes TypeScript into src/generated/prisma)
npm run prisma:generate

# 4. Create the tables
npm run prisma:migrate:deploy

# 5. Start the API with hot reload
npm run start:dev
```

Then open <http://localhost:3000/health>.

### Creating the database

With a native PostgreSQL 17 install, create a user and database once
(run in `psql -U postgres`):

```sql
CREATE USER taskapp WITH PASSWORD 'change_me' CREATEDB;
CREATE DATABASE taskdb OWNER taskapp;
```

`CREATEDB` is needed only for `prisma migrate dev`, which uses a temporary
"shadow database" to detect schema drift. Production users don't need it.

Matching `.env` value:

```
DATABASE_URL="postgresql://taskapp:change_me@localhost:5432/taskdb"
```

> **Optional:** if you already have Docker Desktop, a throwaway PostgreSQL 17 is
> one command away (this is not part of the project's Docker setup):
> `docker run -d --name devops-task-pg17 -e POSTGRES_USER=taskapp -e POSTGRES_PASSWORD=change_me -e POSTGRES_DB=taskdb -p 5432:5432 postgres:17-alpine`

## 3. Environment variables

| Variable       | Required | Default       | Description |
| -------------- | -------- | ------------- | ----------- |
| `DATABASE_URL` | yes      | —             | PostgreSQL connection string. Append `?sslmode=require` for Azure Database for PostgreSQL. |
| `PORT`         | no       | `3000`        | HTTP port. |
| `HOST`         | no       | `0.0.0.0`     | Bind address. `0.0.0.0` is required inside containers so traffic from outside the container can reach the app. |
| `NODE_ENV`     | no       | `development` | `development`, `production` or `test`. |
| `CORS_ORIGINS` | no       | *(empty)*     | Comma-separated browser origins allowed to call the API. Empty = CORS disabled. |

Variables are validated at startup (`src/config/env.validation.ts`); the app
refuses to start with a clear error if, for example, `DATABASE_URL` is missing.
`.env` is only for local development. In CI and Azure, set real environment
variables instead. `.env` is git-ignored; never commit credentials.

## 4. npm scripts

| Script                          | What it does |
| ------------------------------- | ------------ |
| `npm run start:dev`             | Run with hot reload (development). |
| `npm run build`                 | `prisma generate` + compile TypeScript to `dist/`. |
| `npm run start:prod`            | Run the compiled app: `node dist/main.js`. |
| `npm test`                      | Unit tests (no database needed). |
| `npm run test:e2e`              | End-to-end tests against the database in `DATABASE_URL`. |
| `npm run test:cov`              | Unit tests with coverage report. |
| `npm run lint` / `npm run format` | oxlint / Prettier. |
| `npm run typecheck`             | Type-check everything without emitting. |
| `npm run prisma:generate`       | Regenerate the Prisma client after schema changes. |
| `npm run prisma:migrate:dev`    | **Dev only.** Create a new migration from schema changes and apply it. |
| `npm run prisma:migrate:deploy` | Apply pending migrations (safe for CI/production). |
| `npm run prisma:migrate:status` | Show which migrations are applied. |
| `npm run prisma:studio`         | Browse the data in a web UI. |

## 5. API

Base URL: `http://localhost:3000`

| Method | Endpoint     | Success | Description |
| ------ | ------------ | ------- | ----------- |
| GET    | `/health`    | 200     | App and database health (503 if the database is down). |
| GET    | `/tasks`     | 200     | List all tasks, newest first. |
| GET    | `/tasks/:id` | 200     | Get one task. |
| POST   | `/tasks`     | 201     | Create a task. |
| PATCH  | `/tasks/:id` | 200     | Update some fields of a task. |
| DELETE | `/tasks/:id` | 204     | Delete a task. |

**Task fields**

| Field         | Type                                    | Notes |
| ------------- | --------------------------------------- | ----- |
| `id`          | UUID                                    | Generated. |
| `title`       | string                                  | Required, 1–200 characters, trimmed. |
| `description` | string \| null                          | Optional, max 2000 characters. Send `null` in PATCH to clear it. |
| `status`      | `PENDING` \| `IN_PROGRESS` \| `COMPLETED` | Default `PENDING`. |
| `priority`    | `LOW` \| `MEDIUM` \| `HIGH`             | Default `MEDIUM`. |
| `createdAt`   | ISO timestamp                           | Generated. |
| `updatedAt`   | ISO timestamp                           | Updated automatically. |

**Errors** use NestJS's standard shape:

```json
{ "statusCode": 400, "error": "Bad Request", "message": ["title should not be empty"] }
```

- `400`: invalid body, unknown fields, malformed JSON, or an `:id` that isn't a UUID
- `404`: task not found
- `503`: `/health` only, when the database is unreachable

### Examples (curl)

```bash
# Health
curl http://localhost:3000/health

# Create
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Set up CI pipeline","priority":"HIGH"}'

# List
curl http://localhost:3000/tasks

# Get / update / delete (replace <id>)
curl http://localhost:3000/tasks/<id>
curl -X PATCH http://localhost:3000/tasks/<id> \
  -H "Content-Type: application/json" -d '{"status":"COMPLETED"}'
curl -X DELETE http://localhost:3000/tasks/<id>
```

More examples, including error cases, are in [requests.http](requests.http). That
file works with the VS Code REST Client extension.

### Health check

```json
{
  "status": "ok",
  "application": "devops-task-app",
  "timestamp": "2026-11-24T18:15:04.934Z",
  "uptimeSeconds": 7,
  "checks": {
    "database": { "status": "up", "responseTimeMs": 3 }
  }
}
```

When the database is unreachable the endpoint returns **HTTP 503** with
`"status": "error"` and `"database": { "status": "down" }`. The application
itself keeps running and reconnects automatically when the database comes back.
Azure App Service health checks and Kubernetes probes act on the status code.

## 6. Database migrations

Schema changes go through versioned SQL migrations in `prisma/migrations/`,
which **are committed to git**.

**Changing the schema (development):**

1. Edit `prisma/schema.prisma`.
2. `npm run prisma:migrate:dev -- --name describe_your_change`
   This writes a new migration SQL file and applies it to your local DB.
3. `npm run prisma:generate` to refresh the TypeScript client. Prisma 7 no
   longer does this automatically after `migrate dev`.
4. Commit the schema and the new migration folder together.

**Applying migrations (CI, staging, production):**

```bash
npm run prisma:migrate:deploy
```

`migrate deploy` only applies committed migrations that haven't run yet. It
never generates new ones, never resets data, and needs no shadow database.
Run it as a separate deployment step before starting the new app version.
**Never run `migrate dev` against a shared or production database.**

## 7. Prisma 7 setup: what's different

Prisma 7 changed several defaults. This project follows them:

1. **CLI config lives in `prisma7.config.ts`.** The schema path, migrations path
   and database URL for the CLI are set here. The `url` is no longer in
   `schema.prisma`. Prisma 7.10 looks for `prisma7.config.ts` first; the older
   `prisma.config.ts` name is still read as a legacy fallback.
2. **`.env` is not loaded automatically.** `prisma7.config.ts` does
   `import 'dotenv/config'` so local CLI commands pick up `.env`. The app loads
   `.env` through `@nestjs/config`.
3. **`process.env.DATABASE_URL` instead of `env('DATABASE_URL')`.** The `env()`
   helper throws when the variable is missing, which would break
   `prisma generate` in build pipelines that have no database. Generation
   doesn't need a database.
4. **New `prisma-client` generator.** The client is generated as plain
   TypeScript into `src/generated/prisma` (git-ignored) and compiled with the
   app into `dist/`. It is no longer a hidden package inside `node_modules`.
   Generator options `moduleFormat = "esm"` and `importFileExtension = "js"`
   match this project's ES-module setup.
5. **Driver adapter is required.** The client connects through the standard
   `pg` driver via `@prisma/adapter-pg` (see `src/prisma/prisma.service.ts`).
   There is no Rust query engine binary at runtime, so the Docker image will be
   simpler. Pool settings such as a 5-second connection timeout are configured
   on the adapter.
6. **Versions are pinned to 7.x.** At the time of writing npm's `latest` tag
   for `prisma` points to an 8.x release candidate, so `npm i prisma@latest`
   would jump a major version. Prisma's CLI may show an "update available"
   banner; ignore it until you deliberately upgrade.

Two related `package.json` entries:

- `allowScripts` approves Prisma's install scripts (npm 11 blocks dependency
  install scripts by default). The scripts download the migration engine used
  by `prisma migrate`.
- `overrides.effect` lifts a transitive dependency of the Prisma CLI to a
  patched release (GHSA-7589-6fvf-x4pw), so `npm audit` is clean. It affects
  only CLI tooling, not the running API. Remove it once Prisma ships the fix.

## 8. Testing

```bash
npm test             # unit tests: services, controllers, DTO and env validation
npm run test:e2e     # boots the whole app and calls the real HTTP endpoints
```

E2E tests need a migrated database at `DATABASE_URL`. Each test deletes the
data it creates. In CI, point `DATABASE_URL` at a disposable database.

## 9. Project structure

```
prisma/
  schema.prisma            # data model
  migrations/              # versioned SQL migrations (committed)
prisma7.config.ts          # Prisma CLI configuration
src/
  main.ts                  # bootstrap: listen on HOST:PORT, graceful shutdown
  app.module.ts            # root module
  app.setup.ts             # validation pipe + CORS (shared with e2e tests)
  config/                  # typed configuration + env validation
  prisma/                  # PrismaService (DB connection) + error helpers
  health/                  # GET /health
  tasks/                   # task CRUD: controller, service, DTOs
  generated/prisma/        # generated Prisma client (git-ignored)
test/
  app.e2e-spec.ts          # end-to-end tests
requests.http              # API request examples
```

## 10. Ready for deployment

These properties will matter in later milestones:

- **12-factor config:** all settings come from environment variables and are
  validated at startup.
- **Binds to `0.0.0.0` and honours `PORT`**, which containers and Azure App
  Service require.
- **Graceful shutdown:** `enableShutdownHooks()` closes the DB pool on
  `SIGTERM`, which is how Docker, Azure and Kubernetes stop containers.
- **Health endpoint** with a meaningful status code.
- **Build artifact:** `npm run build` produces `dist/`. The production start
  command is `node dist/main.js`. Run migrations with `prisma migrate deploy`
  as a separate step; this needs the `prisma/` folder and `prisma7.config.ts`.

## Troubleshooting

- **`Cannot find module '../generated/prisma/client.js'`**: run
  `npm run prisma:generate`.
- **App starts but every request returns HTML or a redirect**: another process
  is already using port 3000. On Windows two processes can listen on the same
  port without an error. Set `PORT` to another value in `.env`.
- **`P1001: Can't reach database server`**: PostgreSQL isn't running or
  `DATABASE_URL` is wrong.
- **`prisma migrate dev` fails with permission denied creating a database**:
  give your user `CREATEDB` (see *Creating the database*).
