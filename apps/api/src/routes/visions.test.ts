import { createMockProviders, type SafetyTarget } from '@eloria/providers';
import { visionsResponseSchema, type SafetyVerdict } from '@eloria/shared';
import { describe, expect, it } from 'vitest';
import { ensureDaily, pregenerateDailies } from '../daily/daily';
import { createRateLimiter, type RateLimiter } from '../lib/rate-limit';
import {
  createFakeAffirmationRepo,
  createFakeDailyRepo,
  createFakeStoryEvents,
  createFakeVisionRepo,
  createTestApp,
  sign,
} from '../test/fakes';

const auth = async (sub = 'user-1') => ({ Authorization: `Bearer ${await sign({ sub })}` });

function setup(verdict?: SafetyVerdict, generationLimiter?: RateLimiter) {
  const visions = createFakeVisionRepo();
  const personal = createFakeAffirmationRepo();
  const events = createFakeStoryEvents();
  const base = createMockProviders();
  const providers = {
    ...base,
    story: {
      ...base.story,
      async reviewSafety(_t: string, _target: SafetyTarget) {
        return {
          verdict: verdict ?? { verdict: 'pass' as const, reasons: [] },
          usage: { provider: 'mock' as const, model: 'mock', estCostUsd: 0 },
        };
      },
    },
  };
  const app = createTestApp({
    visions: { repo: visions.repo, providers },
    affirmations: { repo: personal.repo },
    storyEvents: events.events,
    generationLimiter,
  });
  return { app, visions, personal, events };
}

describe('POST /v1/visions', () => {
  it('꿈을 등록하고 장면 4개를 저장해 돌려준다(음성은 만들지 않음)', async () => {
    const { app, visions, personal, events } = setup();
    const res = await app.request('/v1/visions', {
      method: 'POST',
      headers: { ...(await auth()), 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '바닷가 책방을 여는 삶' }),
    });
    expect(res.status).toBe(200);
    const body = visionsResponseSchema.parse(await res.json());
    expect(body.blocked).toBeNull();
    expect(body.visions.map((v) => v.position)).toEqual([1, 2, 3, 4]);
    expect(visions.desires.get(body.desireId)?.visions).toHaveLength(4);
    expect(personal.calls).toEqual(['vision:review-input', 'vision:suggest']);
    expect(events.sent).toEqual([]);
  });

  it('위기 신호면 장면 없이 SAFETY_CRISIS', async () => {
    const { app } = setup({ verdict: 'block', reasons: ['self_harm'] });
    const res = await app.request('/v1/visions', {
      method: 'POST',
      headers: { ...(await auth()), 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '...' }),
    });
    const body = visionsResponseSchema.parse(await res.json());
    expect(body).toMatchObject({ blocked: 'SAFETY_CRISIS', visions: [] });
  });
});

describe('POST /v1/visions/:desireId/:position/story', () => {
  it('고른 장면만 이야기로 만들고, 다시 눌러도 같은 이야기', async () => {
    const { app, visions, events } = setup();
    const created = visionsResponseSchema.parse(
      await (
        await app.request('/v1/visions', {
          method: 'POST',
          headers: { ...(await auth()), 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: '바닷가 책방을 여는 삶' }),
        })
      ).json(),
    );
    const pick = async () =>
      app.request(`/v1/visions/${created.desireId}/3/story`, {
        method: 'POST',
        headers: await auth(),
      });
    const first = await pick();
    expect(first.status).toBe(202);
    const { storyId } = (await first.json()) as { storyId: string };
    const again = (await (await pick()).json()) as { storyId: string };
    expect(again.storyId).toBe(storyId);
    expect(visions.stories).toHaveLength(1);
    expect(visions.stories[0]?.vision.position).toBe(3);
    expect(events.sent).toEqual([{ storyId, userId: 'user-1' }]);
  });

  it('남의 꿈이면 404', async () => {
    const { app } = setup();
    const created = visionsResponseSchema.parse(
      await (
        await app.request('/v1/visions', {
          method: 'POST',
          headers: { ...(await auth()), 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: '책방' }),
        })
      ).json(),
    );
    const res = await app.request(`/v1/visions/${created.desireId}/1/story`, {
      method: 'POST',
      headers: await auth('user-2'),
    });
    expect(res.status).toBe(404);
  });

  it('오늘 직접 소원 3편을 넘기면 만들지 않는다', async () => {
    // 분당 3회와 겹치지 않게, 이 테스트만 한도를 넉넉히 둔다.
    const { app, visions } = setup(
      undefined,
      createRateLimiter({ limit: 10, windowMs: 60_000 }),
    );
    const created = visionsResponseSchema.parse(
      await (
        await app.request('/v1/visions', {
          method: 'POST',
          headers: { ...(await auth()), 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: '책방' }),
        })
      ).json(),
    );
    for (const position of [1, 2, 3]) {
      const res = await app.request(`/v1/visions/${created.desireId}/${position}/story`, {
        method: 'POST',
        headers: await auth(),
      });
      expect(res.status).toBe(202);
    }
    const blocked = await app.request(`/v1/visions/${created.desireId}/4/story`, {
      method: 'POST',
      headers: await auth(),
    });
    expect(blocked.status).toBe(429);
    expect(((await blocked.json()) as { error: { code: string } }).error.code).toBe(
      'QUOTA_EXCEEDED',
    );
    expect(visions.stories.filter((s) => !s.failed)).toHaveLength(3);
  });
});

describe('ensureDaily', () => {
  const NOW = () => new Date('2026-11-12T23:00:00Z'); // 서울 13일 08:00

  it('하루 한 편만 만들고 같은 날 다시 부르면 그대로', async () => {
    const daily = createFakeDailyRepo();
    const events = createFakeStoryEvents();
    const deps = { repo: daily.repo, events: events.events, now: NOW };
    const first = await ensureDaily(deps, 'user-1');
    const second = await ensureDaily(deps, 'user-1');
    expect(first.day).toBe('2026-11-13');
    expect(second.storyId).toBe(first.storyId);
    expect(events.sent).toHaveLength(1);
    expect(daily.touched).toEqual(['user-1', 'user-1']);
  });

  it('꿈이 없으면 만들지 않는다', async () => {
    const daily = createFakeDailyRepo({ desireId: null });
    const events = createFakeStoryEvents();
    const res = await ensureDaily({ repo: daily.repo, events: events.events, now: NOW }, 'u');
    expect(res.storyId).toBeNull();
    expect(events.sent).toEqual([]);
  });

  it('사전 생성은 활동 기록을 건드리지 않는다', async () => {
    const daily = createFakeDailyRepo();
    const events = createFakeStoryEvents();
    const n = await pregenerateDailies({ repo: daily.repo, events: events.events, now: NOW });
    expect(n).toBe(2);
    expect(events.sent).toHaveLength(2);
    expect(daily.touched).toEqual([]);
  });

  it('POST /v1/daily', async () => {
    const res = await createTestApp().request('/v1/daily', {
      method: 'POST',
      headers: await auth(),
    });
    expect(res.status).toBe(200);
    expect(((await res.json()) as { storyId: string | null }).storyId).toBeTruthy();
  });
});
