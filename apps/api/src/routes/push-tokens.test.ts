import { describe, expect, it } from 'vitest';
import { createFakePushRepo, createTestApp, sign } from '../test/fakes';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const TOKEN = 'ExponentPushToken[abc123]';

async function post(app: ReturnType<typeof createTestApp>, userId: string | null, body: unknown) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userId) headers.Authorization = `Bearer ${await sign({ sub: userId })}`;
  return app.request('/v1/push-tokens', { method: 'POST', headers, body: JSON.stringify(body) });
}

describe('POST /v1/push-tokens', () => {
  it('토큰을 저장하고 204를 돌려준다', async () => {
    const push = createFakePushRepo();
    const app = createTestApp({ pushRepo: push.repo });

    expect((await post(app, A, { token: TOKEN, platform: 'android' })).status).toBe(204);
    expect(push.tokens.get(TOKEN)).toEqual({ userId: A, platform: 'android' });
  });

  it('같은 기기에서 다른 계정으로 등록하면 토큰이 새 사용자로 옮겨 간다', async () => {
    const push = createFakePushRepo();
    const app = createTestApp({ pushRepo: push.repo });

    await post(app, A, { token: TOKEN, platform: 'ios' });
    await post(app, B, { token: TOKEN, platform: 'ios' });
    expect(await push.repo.listTokens(A)).toEqual([]);
    expect(await push.repo.listTokens(B)).toEqual([TOKEN]);
  });

  it('형식이 틀린 토큰은 400, 토큰 없는 요청은 401', async () => {
    const app = createTestApp();
    expect((await post(app, A, { token: 'fcm-raw-token', platform: 'android' })).status).toBe(400);
    expect((await post(app, null, { token: TOKEN, platform: 'android' })).status).toBe(401);
  });
});
