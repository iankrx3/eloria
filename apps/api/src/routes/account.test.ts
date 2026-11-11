import { describe, expect, it } from 'vitest';
import { createFakeAccountRepo, createTestApp, sign } from '../test/fakes';

describe('POST /v1/account/delete', () => {
  it('토큰의 사용자만 지우고 사유를 넘긴다', async () => {
    const fake = createFakeAccountRepo();
    const app = createTestApp({ accountRepo: fake.repo });
    const token = await sign({ sub: 'user-1' });
    const res = await app.request('/v1/account/delete', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reasons: ['price', 'unused'] }),
    });
    expect(res.status).toBe(204);
    expect(fake.deleted).toEqual([{ userId: 'user-1', reasons: ['price', 'unused'] }]);
  });

  it('모르는 사유는 거부하고 지우지 않는다', async () => {
    const fake = createFakeAccountRepo();
    const app = createTestApp({ accountRepo: fake.repo });
    const token = await sign({ sub: 'user-1' });
    const res = await app.request('/v1/account/delete', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reasons: ['hate'] }),
    });
    expect(res.status).toBe(400);
    expect(fake.deleted).toEqual([]);
  });

  it('토큰 없이는 지울 수 없다', async () => {
    const fake = createFakeAccountRepo();
    const app = createTestApp({ accountRepo: fake.repo });
    const res = await app.request('/v1/account/delete', { method: 'POST' });
    expect(res.status).toBe(401);
    expect(fake.deleted).toEqual([]);
  });
});
