import { ProviderError, type Providers } from '@eloria/providers';
import type { LifestyleSuggestionsResponse } from '@eloria/shared';
import { ApiError } from '../lib/errors';
import type { AffirmationRepo } from '../repos/affirmation-repo';

/** 사용자당 24시간 라이프스타일 추천 호출 수(마이 ↻, D-46) */
export const LIFESTYLE_CALLS_PER_DAY = 3;

export type LifestyleDeps = {
  repo: AffirmationRepo;
  providers: Pick<Providers, 'lifestyle'>;
  now?: () => Date;
};

const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase();

/**
 * 퀴즈 답·프로필로 라이프스타일 키워드를 추천한다. 저장은 하지 않는다(앱이 고른 뒤 profiles.likes에 쓴다).
 * 이미 있는 칩·"피할 것"과 겹치는 키워드는 뺀다.
 */
export async function suggestLifestyle(
  deps: LifestyleDeps,
  userId: string,
): Promise<LifestyleSuggestionsResponse> {
  const { repo, providers } = deps;
  const now = (deps.now ?? (() => new Date()))();
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  if ((await repo.countCallsSince(userId, 'lifestyle', since)) >= LIFESTYLE_CALLS_PER_DAY) {
    throw new ApiError('RATE_LIMITED', '오늘은 추천을 충분히 받았어요. 내일 다시 받아 보세요.');
  }

  const { context } = await repo.loadUser(userId);
  const startedAt = new Date().toISOString();
  let result;
  try {
    result = await providers.lifestyle.suggest(context);
  } catch (error) {
    if (
      error instanceof ProviderError &&
      (error.code === 'BUDGET_EXCEEDED' || error.code === 'RATE_LIMITED')
    ) {
      throw new ApiError(
        'RATE_LIMITED',
        '지금은 추천을 만들 수 없어요. 잠시 후 다시 시도해 주세요.',
      );
    }
    throw error;
  }
  await repo.recordCall({
    userId,
    kind: 'lifestyle',
    step: 'suggest',
    usage: result.usage,
    startedAt,
    finishedAt: new Date().toISOString(),
  });

  const taken = new Set([...(context.likes ?? []), ...(context.dislikes ?? [])].map(norm));
  const items: string[] = [];
  for (const item of result.set.items) {
    const key = norm(item);
    if (!taken.has(key)) {
      taken.add(key);
      items.push(item.trim());
    }
  }
  return { items };
}
