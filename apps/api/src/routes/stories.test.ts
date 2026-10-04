import { apiErrorResponseSchema, storyMediaResponseSchema, type StoryStatus } from '@eloria/shared';
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

describe('GET /v1/stories/:id/media', () => {
  const LIBRARY = '44444444-4444-4444-8444-444444444444';

  async function media(app: ReturnType<typeof createTestApp>, userId: string, id: string) {
    const token = await sign({ sub: userId });
    return app.request(`/v1/stories/${id}/media`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  it('공용 리추얼은 누구나 서명 URL을 받는다(페이월 전)', async () => {
    const store = createFakeStoryRepo();
    store.library.set(LIBRARY, { isFree: false, audioPath: `library/${LIBRARY}/a.wav` });
    const res = await media(createTestApp({ storyRepo: store.repo }), OTHER, LIBRARY);

    expect(res.status).toBe(200);
    const body = storyMediaResponseSchema.parse(await res.json());
    expect(body.audioUrl).toContain(`library/${LIBRARY}/a.wav`);
    expect(body.coverUrl).toBeNull();
  });

  it('본인 스토리는 받고, 남의 스토리는 404', async () => {
    const store = createFakeStoryRepo();
    store.stories.set(STORY, {
      userId: OWNER,
      desireId: 'd1',
      status: 'ready',
      audioPath: 'x.mp3',
    });
    const app = createTestApp({ storyRepo: store.repo });

    expect((await media(app, OWNER, STORY)).status).toBe(200);
    expect((await media(app, OTHER, STORY)).status).toBe(404);
  });

  it('음성이 아직 없으면 404', async () => {
    const store = createFakeStoryRepo();
    store.library.set(LIBRARY, { isFree: true, audioPath: null });
    expect((await media(createTestApp({ storyRepo: store.repo }), OWNER, LIBRARY)).status).toBe(
      404,
    );
  });
});
