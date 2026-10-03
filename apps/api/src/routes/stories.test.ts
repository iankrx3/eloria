import { apiErrorResponseSchema, type StoryStatus } from '@eloria/shared';
import { describe, expect, it } from 'vitest';
import { createFakeStoryRepo, createTestApp, sign } from '../test/fakes';

const OWNER = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const STORY = '33333333-3333-4333-8333-333333333333';

function setup(status: StoryStatus, errorCode?: string) {
  const store = createFakeStoryRepo();
  store.stories.set(STORY, { userId: OWNER, desireId: 'd1', status, errorCode });
  return { store, app: createTestApp({ storyRepo: store.repo }) };
}

async function del(app: ReturnType<typeof createTestApp>, userId: string, id = STORY) {
  const token = await sign({ sub: userId });
  return app.request(`/v1/stories/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

describe('DELETE /v1/stories/:id', () => {
  it('끝난 본인 스토리는 지운다(204)', async () => {
    const { app, store } = setup('ready');
    expect((await del(app, OWNER)).status).toBe(204);
    expect(store.stories.has(STORY)).toBe(false);
  });

  it('실패했거나 음성만 실패한 스토리도 지울 수 있다', async () => {
    for (const [status, code] of [
      ['failed', 'GENERATION_FAILED'],
      ['text_ready', 'TTS_FAILED'],
    ] as const) {
      const { app, store } = setup(status, code);
      expect((await del(app, OWNER)).status).toBe(204);
      expect(store.stories.has(STORY)).toBe(false);
    }
  });

  it('남의 스토리는 있어도 NOT_FOUND(404)이고 지우지 않는다', async () => {
    const { app, store } = setup('ready');
    const res = await del(app, OTHER);
    expect(res.status).toBe(404);
    expect(apiErrorResponseSchema.parse(await res.json()).error.code).toBe('NOT_FOUND');
    expect(store.stories.has(STORY)).toBe(true);
  });

  it('만드는 중이면 CONFLICT(409)', async () => {
    for (const status of ['queued', 'writing', 'text_ready'] as const) {
      const { app, store } = setup(status);
      const res = await del(app, OWNER);
      expect(res.status).toBe(409);
      expect(apiErrorResponseSchema.parse(await res.json()).error.code).toBe('CONFLICT');
      expect(store.stories.has(STORY)).toBe(true);
    }
  });

  it('id가 uuid가 아니면 VALIDATION_FAILED', async () => {
    const { app } = setup('ready');
    expect((await del(app, OWNER, 'not-a-uuid')).status).toBe(400);
  });
});
