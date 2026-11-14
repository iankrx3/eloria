import { ARIN_STORY_PROMPT_VERSION, FALLBACK_AFFIRMATIONS } from '@eloria/prompts';
import { todayAffirmationsResponseSchema } from '@eloria/shared';
import { describe, expect, it } from 'vitest';
import { FALLBACK_PROMPT_VERSION, getTodayAffirmations } from '../affirmations/today';
import { createFakeAffirmationRepo, createTestApp, sign } from '../test/fakes';

const NOW = () => new Date('2026-11-12T15:30:00Z'); // 서울 11월 13일 00:30
const LINES = ['나는 여기 있다.', '나는 충분하다.', '나는 천천히 간다.'];

describe('getTodayAffirmations', () => {
  it('오늘의 이야기가 없으면 기본 확언 3장을 저장하고 Gemini는 부르지 않는다', async () => {
    const fake = createFakeAffirmationRepo();
    const res = await getTodayAffirmations({ repo: fake.repo, now: NOW }, 'user-1');
    expect(res.day).toBe('2026-11-13');
    expect(res.items.map((item) => item.text)).toEqual(
      FALLBACK_AFFIRMATIONS.slice(0, 3).map((item) => item.text),
    );
    expect(fake.days.get('user-1:2026-11-13')?.[0]?.promptVersion).toBe(FALLBACK_PROMPT_VERSION);
    expect(fake.calls).toEqual([]);
  });

  it('같은 날 다시 부르면 다시 저장하지 않는다', async () => {
    const fake = createFakeAffirmationRepo();
    const deps = { repo: fake.repo, now: NOW };
    const first = await getTodayAffirmations(deps, 'user-1');
    const second = await getTodayAffirmations(deps, 'user-1');
    expect(second).toEqual(first);
    expect(fake.days.size).toBe(1);
  });

  it('오늘의 이야기에 확언 3개가 있으면 그 문장을 쓴다', async () => {
    const fake = createFakeAffirmationRepo({ dailyLines: LINES });
    const res = await getTodayAffirmations({ repo: fake.repo, now: NOW }, 'user-1');
    expect(res.items.map((item) => item.text)).toEqual(LINES);
    expect(res.items.every((item) => item.theme === '오늘')).toBe(true);
    expect(fake.days.get('user-1:2026-11-13')?.[0]?.promptVersion).toBe(ARIN_STORY_PROMPT_VERSION);
  });
});

describe('GET /v1/affirmations/today', () => {
  it('토큰의 사용자 확언을 스키마대로 돌려준다', async () => {
    const app = createTestApp();
    const token = await sign({ sub: 'user-1' });
    const res = await app.request('/v1/affirmations/today', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = todayAffirmationsResponseSchema.parse(await res.json());
    expect(body.items).toHaveLength(3);
  });

  it('토큰이 없으면 401', async () => {
    const res = await createTestApp().request('/v1/affirmations/today');
    expect(res.status).toBe(401);
  });
});
