import { ARIN_STORY_PROMPT_VERSION, FALLBACK_AFFIRMATIONS } from '@eloria/prompts';
import { localDay, type TodayAffirmationsResponse } from '@eloria/shared';
import type { AffirmationRepo, NewAffirmation } from '../repos/affirmation-repo';

export const FALLBACK_PROMPT_VERSION = 'fallback@v1';

/** 이야기 JSON에서 가져온 확언의 주제. 주제 상한(12자) 안이다. */
const STORY_AFFIRMATION_THEME = '오늘';

export type TodayDeps = {
  repo: AffirmationRepo;
  now?: () => Date;
};

/**
 * 오늘 확언 3장을 돌려준다. 이미 저장돼 있으면 그대로 쓴다.
 * 없으면 그날 오늘의 이야기에 들어 있는 3줄을 저장하고, 이야기가 아직 없으면 기본 확언 3장을 저장한다.
 * 기본 확언을 먼저 저장하면 그 날짜는 이야기가 끝나도 바꾸지 않는다. Gemini를 부르지 않는다.
 */
export async function getTodayAffirmations(
  deps: TodayDeps,
  userId: string,
): Promise<TodayAffirmationsResponse> {
  const { repo } = deps;
  const now = (deps.now ?? (() => new Date()))();
  const user = await repo.loadUser(userId);
  const day = localDay(now, user.timezone ?? undefined);

  const existing = await repo.listForDay(userId, day);
  if (existing.length > 0) return { day, items: existing };

  const fromStory = await repo.dailyAffirmations(userId, day);
  const items: NewAffirmation[] = fromStory
    ? fromStory.map((text) => ({ text, theme: STORY_AFFIRMATION_THEME }))
    : FALLBACK_AFFIRMATIONS.slice(0, 3).map((item) => ({ ...item }));
  await repo.saveDay(
    userId,
    day,
    items,
    fromStory ? ARIN_STORY_PROMPT_VERSION : FALLBACK_PROMPT_VERSION,
  );
  return { day, items: await repo.listForDay(userId, day) };
}
