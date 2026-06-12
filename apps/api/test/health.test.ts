import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// Stub env so createApp() can build without real secrets.
vi.mock('../src/config/env', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 4000,
    FRONTEND_URL: 'http://localhost:3000',
    LOG_LEVEL: 'error',
    SUPABASE_URL: 'http://localhost',
    SUPABASE_SERVICE_ROLE_KEY: 'x'.repeat(40),
    DATABASE_URL: 'postgresql://localhost:5432/sms',
    DIRECT_URL: 'postgresql://localhost:5432/sms',
    SENTRY_DSN: '',
  },
}));
vi.mock('../src/config/prisma', () => ({ prisma: { $queryRaw: vi.fn().mockResolvedValue([1]) } }));

import { createApp } from '../src/app';
import { env } from '../src/config/env';

describe('health endpoints', () => {
  const app = createApp(env);

  it('GET /healthz returns ok', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /readyz returns ready when DB reachable', async () => {
    const res = await request(app).get('/readyz');
    expect(res.status).toBe(200);
    expect(res.body.ready).toBe(true);
  });

  it('unknown route returns standardized 404', async () => {
    const res = await request(app).get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});
