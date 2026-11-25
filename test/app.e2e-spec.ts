import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { setupApp } from '../src/app.setup.js';

/**
 * Boots the real application against the database in DATABASE_URL
 * (migrations must already be applied). Each test cleans up after itself.
 */
describe('Task API (e2e)', () => {
  let app: INestApplication<App>;
  const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /health reports the app and database as healthy', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);

    expect(res.body).toMatchObject({
      status: 'ok',
      application: 'devops-task-app',
      checks: { database: { status: 'up' } },
    });
  });

  it('supports the full task lifecycle', async () => {
    const server = app.getHttpServer();

    const created = await request(server)
      .post('/tasks')
      .send({ title: '  E2E task  ', priority: 'HIGH' })
      .expect(201);
    expect(created.body).toMatchObject({
      title: 'E2E task',
      description: null,
      status: 'PENDING',
      priority: 'HIGH',
    });
    const id: string = created.body.id;

    const list = await request(server).get('/tasks').expect(200);
    expect(list.body.map((t: { id: string }) => t.id)).toContain(id);

    await request(server).get(`/tasks/${id}`).expect(200);

    const updated = await request(server)
      .patch(`/tasks/${id}`)
      .send({ status: 'COMPLETED', description: 'done' })
      .expect(200);
    expect(updated.body).toMatchObject({
      status: 'COMPLETED',
      description: 'done',
    });

    await request(server).delete(`/tasks/${id}`).expect(204);
    await request(server).get(`/tasks/${id}`).expect(404);
  });

  it('rejects invalid payloads with 400', async () => {
    const server = app.getHttpServer();

    await request(server).post('/tasks').send({}).expect(400);
    await request(server)
      .post('/tasks')
      .send({ title: 'x', status: 'DONE' })
      .expect(400);
    await request(server)
      .post('/tasks')
      .send({ title: 'x', unexpected: true })
      .expect(400);
    await request(server)
      .patch(`/tasks/${UNKNOWN_ID}`)
      .send({ title: null })
      .expect(400);
  });

  it('rejects malformed ids with 400', async () => {
    await request(app.getHttpServer()).get('/tasks/not-a-uuid').expect(400);
  });

  it('returns 404 for unknown tasks', async () => {
    const server = app.getHttpServer();

    await request(server).get(`/tasks/${UNKNOWN_ID}`).expect(404);
    await request(server)
      .patch(`/tasks/${UNKNOWN_ID}`)
      .send({ title: 'x' })
      .expect(404);
    await request(server).delete(`/tasks/${UNKNOWN_ID}`).expect(404);
  });
});
