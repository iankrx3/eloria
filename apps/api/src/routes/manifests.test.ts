import { apiErrorResponseSchema, manifestResponseSchema } from '@eloria/shared';
import { describe, expect, it } from 'vitest';
import { createRateLimiter } from '../lib/rate-limit';
import { createFakeStoryEvents, createFakeStoryRepo, createTestApp, sign } from '../test/fakes';

const USER_1 = '11111111-1111-4111-8111-111111111111';
const USER_2 = '22222222-2222-4222-8222-222222222222';

async function postManifest(app: ReturnType<typeof createTestApp>, userId: string, body: unknown) {
  const token = await sign({ sub: userId });
  return app.request('/v1/manifests', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /v1/manifests', () => {
  it('꿈과 스토리를 만들고 생성 이벤트를 보낸 뒤 202로 답한다', async () => {
    const store = createFakeStoryRepo();
    const bus = createFakeStoryEvents();
    const app = createTestApp({ storyRepo: store.repo, storyEvents: bus.events });

    const res = await postManifest(app, USER_1, { text: '  청담동 자가  ', tone: 'calm' });

    expect(res.status).toBe(202);
    const { desireId, storyId } = manifestResponseSchema.parse(await res.json());
    expect(store.desires).toEqual([
      { id: desireId, userId: USER_1, text: '청담동 자가', category: 'other' },
    ]);
    expect(store.stories.get(storyId)).toMatchObject({ userId: USER_1, status: 'queued' });
    expect(bus.sent).toEqual([{ storyId, userId: USER_1, tone: 'calm', voiceKey: undefined }]);
  });

  it('빈 꿈은 VALIDATION_FAILED로 거부하고 아무것도 만들지 않는다', async () => {
    const store = createFakeStoryRepo();
    const app = createTestApp({ storyRepo: store.repo });

    const res = await postManifest(app, USER_1, { text: '   ' });

    expect(res.status).toBe(400);
    expect(apiErrorResponseSchema.parse(await res.json()).error.code).toBe('VALIDATION_FAILED');
    expect(store.desires).toHaveLength(0);
  });

  it('분당 한도를 넘으면 RATE_LIMITED(429), 다른 사용자는 영향 없음', async () => {
    const app = createTestApp({
      generationLimiter: createRateLimiter({ limit: 2, windowMs: 60_000 }),
    });

    expect((await postManifest(app, USER_1, { text: 'a' })).status).toBe(202);
    expect((await postManifest(app, USER_1, { text: 'b' })).status).toBe(202);
    const limited = await postManifest(app, USER_1, { text: 'c' });
    expect(limited.status).toBe(429);
    expect(apiErrorResponseSchema.parse(await limited.json()).error.code).toBe('RATE_LIMITED');
    expect((await postManifest(app, USER_2, { text: 'd' })).status).toBe(202);
  });

  it('작업 큐에 넣지 못하면 스토리를 실패(ENQUEUE_FAILED)로 남기고 500', async () => {
    const store = createFakeStoryRepo();
    const app = createTestApp({
      storyRepo: store.repo,
      storyEvents: createFakeStoryEvents({ fail: true }).events,
    });

    const res = await postManifest(app, USER_1, { text: '바다가 보이는 집' });

    expect(res.status).toBe(500);
    const [story] = [...store.stories.values()];
    expect(story).toMatchObject({ status: 'failed', errorCode: 'ENQUEUE_FAILED' });
  });
});
