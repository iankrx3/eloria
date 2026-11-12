import { FALLBACK_AFFIRMATIONS } from '@eloria/prompts';
import {
  createMockProviders,
  ProviderError,
  type Providers,
  type SafetyTarget,
} from '@eloria/providers';
import { todayAffirmationsResponseSchema, type SafetyVerdict } from '@eloria/shared';
import { describe, expect, it } from 'vitest';
import { FALLBACK_PROMPT_VERSION, getTodayAffirmations } from '../affirmations/today';
import { createFakeAffirmationRepo, createTestApp, sign } from '../test/fakes';

const NOW = () => new Date('2026-11-12T15:30:00Z'); // 서울 11월 13일 00:30

/** 검수 결과를 차례로 돌려주는 mock */
function providersWith(verdicts: SafetyVerdict[]): Pick<Providers, 'story' | 'affirmation'> {
  const base = createMockProviders();
  return {
    affirmation: base.affirmation,
    story: {
      ...base.story,
      async reviewSafety(_text: string, _target: SafetyTarget) {
        const verdict = verdicts.shift() ?? { verdict: 'pass', reasons: [] };
        return { verdict, usage: { provider: 'mock', model: 'mock', estCostUsd: 0 } };
      },
    },
  };
}

describe('getTodayAffirmations', () => {
  it('처음이면 만들고 검수를 통과한 10장을 사용자 날짜로 저장한다', async () => {
    const fake = createFakeAffirmationRepo();
    const res = await getTodayAffirmations(
      { repo: fake.repo, providers: providersWith([]), now: NOW },
      'user-1',
    );
    expect(res.day).toBe('2026-11-13');
    expect(res.items).toHaveLength(10);
    expect(res.items[0]?.text).toContain('바닷가 책방');
    expect(fake.calls).toEqual(['write', 'review']);
  });

  it('같은 날 다시 부르면 새로 만들지 않는다', async () => {
    const fake = createFakeAffirmationRepo();
    const deps = { repo: fake.repo, providers: providersWith([]), now: NOW };
    const first = await getTodayAffirmations(deps, 'user-1');
    const second = await getTodayAffirmations(deps, 'user-1');
    expect(second).toEqual(first);
    expect(fake.calls).toHaveLength(2);
  });

  it('rewrite면 한 번 다시 쓰고, 그래도 통과 못 하면 기본 확언', async () => {
    const fake = createFakeAffirmationRepo();
    const res = await getTodayAffirmations(
      {
        repo: fake.repo,
        providers: providersWith([
          { verdict: 'rewrite', reasons: ['guaranteed_outcome'] },
          { verdict: 'rewrite', reasons: ['guaranteed_outcome'] },
        ]),
        now: NOW,
      },
      'user-1',
    );
    expect(fake.calls).toEqual(['write', 'review', 'rewrite', 'review-rewrite']);
    expect(res.items.map((i) => i.text)).toEqual(FALLBACK_AFFIRMATIONS.map((a) => a.text));
    expect(fake.days.get('user-1:2026-11-13')?.[0]?.promptVersion).toBe(FALLBACK_PROMPT_VERSION);
  });

  it('하루 시도 상한을 넘으면 Gemini를 부르지 않고 기본 확언', async () => {
    const fake = createFakeAffirmationRepo({ callsSoFar: 8 });
    const res = await getTodayAffirmations(
      { repo: fake.repo, providers: providersWith([]), now: NOW },
      'user-1',
    );
    expect(fake.calls).toEqual([]);
    expect(res.items[0]?.text).toBe(FALLBACK_AFFIRMATIONS[0]?.text);
  });

  it('서버 하루 상한에 걸리면 기본 확언, 다른 공급자 오류는 던진다', async () => {
    const base = createMockProviders();
    const failing = (code: ProviderError['code']) => ({
      story: base.story,
      affirmation: {
        promptVersion: 'x',
        async writeAffirmations(): Promise<never> {
          throw new ProviderError(code, 'stop');
        },
      },
    });
    const fake = createFakeAffirmationRepo();
    const res = await getTodayAffirmations(
      { repo: fake.repo, providers: failing('BUDGET_EXCEEDED'), now: NOW },
      'user-1',
    );
    expect(res.items).toHaveLength(10);
    await expect(
      getTodayAffirmations(
        { repo: createFakeAffirmationRepo().repo, providers: failing('UPSTREAM'), now: NOW },
        'user-2',
      ),
    ).rejects.toThrow(ProviderError);
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
    expect(body.items).toHaveLength(10);
  });

  it('토큰이 없으면 401', async () => {
    const res = await createTestApp().request('/v1/affirmations/today');
    expect(res.status).toBe(401);
  });
});
