import { FALLBACK_AFFIRMATIONS } from '@eloria/prompts';
import { ProviderError, type Providers, type Usage } from '@eloria/providers';
import { localDay, type SafetyVerdict, type TodayAffirmationsResponse } from '@eloria/shared';
import type { AffirmationRepo, NewAffirmation } from '../repos/affirmation-repo';

/**
 * 사용자 한 명이 24시간 안에 확언 생성에 쓸 수 있는 Gemini 호출 수(기록 행 기준).
 * 한 번 만들 때 최대 4행(작성·검수·재작성·재검수)이라 두 번 시도할 수 있다(D-45).
 */
export const AFFIRMATION_CALLS_PER_DAY = 8;

export const FALLBACK_PROMPT_VERSION = 'fallback@v1';

export type TodayDeps = {
  repo: AffirmationRepo;
  providers: Pick<Providers, 'story' | 'affirmation'>;
  now?: () => Date;
};

/** 검수할 때 10장을 한 글로 이어 붙인다(번호를 붙여 어느 줄인지 알 수 있게). */
const asScript = (items: NewAffirmation[]) => items.map((a, i) => `${i + 1}. ${a.text}`).join('\n');

/**
 * 오늘 확언을 돌려준다. 없으면 이 요청에서 만든다: 작성 → 검수 → (rewrite면) 1회 재작성 → 재검수.
 * 검수를 끝내 통과하지 못하거나 하루 상한·공급자 한도에 걸리면 기본 확언을 저장해 보여 준다.
 * 그 밖의 공급자 오류는 던져서 앱이 다시 시도하게 한다.
 */
export async function getTodayAffirmations(
  deps: TodayDeps,
  userId: string,
): Promise<TodayAffirmationsResponse> {
  const { repo, providers } = deps;
  const now = (deps.now ?? (() => new Date()))();
  const user = await repo.loadUser(userId);
  const day = localDay(now, user.timezone ?? undefined);

  const existing = await repo.listForDay(userId, day);
  if (existing.length > 0) return { day, items: existing };

  const save = async (items: readonly NewAffirmation[], version: string) => {
    await repo.saveDay(userId, day, [...items], version);
    return { day, items: await repo.listForDay(userId, day) };
  };

  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  if ((await repo.countCallsSince(userId, since)) >= AFFIRMATION_CALLS_PER_DAY) {
    return save(FALLBACK_AFFIRMATIONS, FALLBACK_PROMPT_VERSION);
  }

  async function call<T extends { usage: Usage }>(step: string, fn: () => Promise<T>) {
    const startedAt = new Date().toISOString();
    const result = await fn();
    await repo.recordCall({
      userId,
      step,
      usage: result.usage,
      startedAt,
      finishedAt: new Date().toISOString(),
    });
    return result;
  }

  try {
    const ctx = user.context;
    let { set } = await call('write', () => providers.affirmation.writeAffirmations(ctx));
    let verdict: SafetyVerdict = (
      await call('review', () => providers.story.reviewSafety(asScript(set.items), 'script'))
    ).verdict;
    if (verdict.verdict === 'rewrite') {
      ({ set } = await call('rewrite', () =>
        providers.affirmation.writeAffirmations(ctx, { safetyFeedback: verdict }),
      ));
      verdict = (
        await call('review-rewrite', () =>
          providers.story.reviewSafety(asScript(set.items), 'script'),
        )
      ).verdict;
    }
    if (verdict.verdict !== 'pass') return save(FALLBACK_AFFIRMATIONS, FALLBACK_PROMPT_VERSION);
    return save(set.items, providers.affirmation.promptVersion);
  } catch (error) {
    if (
      error instanceof ProviderError &&
      (error.code === 'BUDGET_EXCEEDED' || error.code === 'RATE_LIMITED')
    ) {
      return save(FALLBACK_AFFIRMATIONS, FALLBACK_PROMPT_VERSION);
    }
    throw error;
  }
}
