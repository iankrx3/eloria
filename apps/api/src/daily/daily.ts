import { dailyDay, LIMITS, type DailyResponse } from '@eloria/shared';
import type { StoryEvents } from '../inngest/events';
import type { DailyRepo } from '../repos/daily-repo';

export type DailyDeps = {
  repo: DailyRepo;
  events: StoryEvents;
  now?: () => Date;
};

/**
 * 오늘의 이야기("당신을 위한 이야기" 매일 갱신, H01). 이미 있으면 그대로, 없으면 가장 최근 꿈으로
 * 짧은 이야기(DAILY_TARGET_CHARS)를 만들기 시작한다. 꿈이 없으면 storyId = null.
 */
export async function ensureDaily(
  deps: DailyDeps,
  userId: string,
  opts: { touch?: boolean } = {},
): Promise<DailyResponse> {
  const now = (deps.now ?? (() => new Date()))();
  if (opts.touch !== false) await deps.repo.touchActive(userId);
  const day = dailyDay(now, (await deps.repo.timezone(userId)) ?? undefined);

  const existing = await deps.repo.findDaily(userId, day);
  if (existing) return { day, storyId: existing };

  const desireId = await deps.repo.latestDesireId(userId);
  if (!desireId) return { day, storyId: null };

  const { storyId, created } = await deps.repo.createDaily(userId, desireId, day);
  if (created) await deps.events.requestGeneration({ storyId, userId });
  return { day, storyId };
}

/** 사전 생성(크론) 대상: 최근 N일 안에 앱을 연 사용자, 최대 개수 */
export const DAILY_PREGEN_MAX_USERS = 20;

export async function pregenerateDailies(deps: DailyDeps): Promise<number> {
  const now = (deps.now ?? (() => new Date()))();
  const since = new Date(
    now.getTime() - LIMITS.DAILY_PREGEN_ACTIVE_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const users = await deps.repo.activeUserIds(since, DAILY_PREGEN_MAX_USERS);
  for (const userId of users) await ensureDaily(deps, userId, { touch: false });
  return users.length;
}
