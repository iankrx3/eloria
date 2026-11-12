import { createMockProviders, ProviderError } from '@eloria/providers';
import { lifestyleSuggestionsResponseSchema } from '@eloria/shared';
import { describe, expect, it } from 'vitest';
import { LIFESTYLE_CALLS_PER_DAY, suggestLifestyle } from '../profile/lifestyle';
import type { AffirmationRepo } from '../repos/affirmation-repo';
import { createFakeAffirmationRepo, createTestApp, sign } from '../test/fakes';

/** 좋아하는 것·피할 것이 있는 사용자 */
function repoWithLikes() {
  const fake = createFakeAffirmationRepo();
  const repo: AffirmationRepo = {
    ...fake.repo,
    async loadUser() {
      return {
        timezone: 'Asia/Seoul',
        context: {
          dream: '바닷가 책방',
          displayName: '서아',
          tone: 'calm',
          people: [],
          likes: ['느린 아침'],
          dislikes: ['혼자여행'],
        },
      };
    },
  };
  return { ...fake, repo };
}

describe('suggestLifestyle', () => {
  it('이미 있는 칩과 피할 것은 빼고 돌려주며 호출을 기록한다', async () => {
    const fake = repoWithLikes();
    const res = await suggestLifestyle(
      { repo: fake.repo, providers: createMockProviders() },
      'user-1',
    );
    expect(res.items).not.toContain('느린 아침');
    expect(res.items).not.toContain('혼자 여행'); // 띄어쓰기만 달라도 같은 것으로 본다
    expect(res.items).toContain('필라테스');
    expect(fake.calls).toEqual(['lifestyle:suggest']);
  });

  it('하루 상한을 넘으면 부르지 않고 RATE_LIMITED', async () => {
    const fake = createFakeAffirmationRepo({ callsSoFar: LIFESTYLE_CALLS_PER_DAY });
    await expect(
      suggestLifestyle({ repo: fake.repo, providers: createMockProviders() }, 'user-1'),
    ).rejects.toMatchObject({ code: 'RATE_LIMITED' });
    expect(fake.calls).toEqual([]);
  });

  it('서버 하루 상한에 걸리면 RATE_LIMITED로 바꾼다', async () => {
    const fake = createFakeAffirmationRepo();
    const providers = {
      lifestyle: {
        async suggest(): Promise<never> {
          throw new ProviderError('BUDGET_EXCEEDED', 'stop');
        },
      },
    };
    await expect(suggestLifestyle({ repo: fake.repo, providers }, 'user-1')).rejects.toMatchObject({
      code: 'RATE_LIMITED',
    });
  });
});

describe('POST /v1/profile/lifestyle-suggestions', () => {
  it('추천 목록을 스키마대로 돌려준다', async () => {
    const token = await sign({ sub: 'user-1' });
    const res = await createTestApp().request('/v1/profile/lifestyle-suggestions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    expect(lifestyleSuggestionsResponseSchema.parse(await res.json()).items.length).toBeGreaterThan(
      0,
    );
  });

  it('상한을 넘으면 429', async () => {
    const token = await sign({ sub: 'user-1' });
    const app = createTestApp({
      profile: {
        repo: createFakeAffirmationRepo({ callsSoFar: 99 }).repo,
        providers: createMockProviders(),
      },
    });
    const res = await app.request('/v1/profile/lifestyle-suggestions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(429);
  });
});
