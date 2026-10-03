import { apiErrorResponseSchema, healthResponseSchema } from '@eloria/shared';
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { handleError } from './lib/errors';
import { requireAuth, type AuthVariables } from './middleware/auth';
import { createTestApp, sign, verifyToken } from './test/fakes';

const app = () => createTestApp();

/** 인증 미들웨어만 붙인 테스트용 앱 */
function protectedApp() {
  const p = new Hono<{ Variables: AuthVariables }>();
  p.onError(handleError);
  p.use('*', requireAuth(verifyToken));
  p.get('/me', (c) => c.json(c.get('user')));
  return p;
}

describe('GET /v1/health', () => {
  it('토큰 없이 ok를 돌려준다', async () => {
    const res = await app().request('/v1/health');
    expect(res.status).toBe(200);
    expect(healthResponseSchema.safeParse(await res.json()).success).toBe(true);
  });
});

describe('requireAuth', () => {
  it('토큰이 없으면 API.md 에러 형식으로 401', async () => {
    const res = await protectedApp().request('/me');
    expect(res.status).toBe(401);
    const body = apiErrorResponseSchema.parse(await res.json());
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('유효한 토큰이면 sub와 익명 여부를 넘긴다', async () => {
    const token = await sign({ sub: 'user-1', is_anonymous: true });
    const res = await protectedApp().request('/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 'user-1', isAnonymous: true });
  });

  it('발급자가 다르거나 만료된 토큰은 거부한다', async () => {
    const wrongIssuer = await sign({ sub: 'u' }, { issuer: 'https://evil.example/auth/v1' });
    const expired = await sign({ sub: 'u' }, { expiresIn: '-1m' });
    for (const token of [wrongIssuer, expired]) {
      const res = await protectedApp().request('/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(401);
    }
  });
});

describe('없는 경로', () => {
  it('NOT_FOUND 형식으로 404', async () => {
    const res = await app().request('/nope');
    expect(res.status).toBe(404);
    expect(apiErrorResponseSchema.parse(await res.json()).error.code).toBe('NOT_FOUND');
  });
});
