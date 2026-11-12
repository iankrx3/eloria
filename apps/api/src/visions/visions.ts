import { ProviderError, type Providers, type Usage } from '@eloria/providers';
import { isCrisis, type Vision, type VisionsRequest, type VisionsResponse } from '@eloria/shared';
import type { StoryEvents } from '../inngest/events';
import { ApiError } from '../lib/errors';
import type { RateLimiter } from '../lib/rate-limit';
import type { AffirmationRepo } from '../repos/affirmation-repo';
import type { StoryRepo } from '../repos/story-repo';
import type { VisionRepo } from '../repos/vision-repo';

/**
 * 사용자당 24시간 비전 장면 제안 기록 행(입력 검수 + 장면 제안 = 한 번에 2행, 6번).
 * 장면 제안은 짧은 글 하나라 싸지만 무료 쿼터를 지키려고 묶어 둔다(D-48).
 */
export const VISION_CALLS_PER_DAY = 12;

export type VisionDeps = {
  repo: VisionRepo;
  /** 사용자 맥락(퀴즈·프로필)과 기록·상한 계산을 확언·추천과 같이 쓴다. */
  personal: AffirmationRepo;
  providers: Pick<Providers, 'story' | 'vision'>;
  stories: Pick<StoryRepo, 'markFailed'>;
  events: StoryEvents;
  limiter: RateLimiter;
  now?: () => Date;
};

const busy = () =>
  new ApiError('RATE_LIMITED', '지금은 장면을 만들 수 없어요. 잠시 후 다시 시도해 주세요.');

/**
 * 꿈을 등록하고 장면 4개를 만든다(H04 → H05). 입력 검수를 먼저 하고, 막히면 장면 없이 이유만 준다.
 * 음성은 만들지 않는다. 사용자가 장면 하나를 재생하면 그때 그 장면만 이야기로 만든다.
 */
export async function createVisions(
  deps: VisionDeps,
  userId: string,
  body: VisionsRequest,
): Promise<VisionsResponse> {
  const now = (deps.now ?? (() => new Date()))();
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  if (!deps.limiter.take(userId)) throw new ApiError('RATE_LIMITED', '잠시 후 다시 시도해 주세요.');
  if ((await deps.personal.countCallsSince(userId, 'vision', since)) >= VISION_CALLS_PER_DAY) {
    throw new ApiError('RATE_LIMITED', '오늘은 장면을 충분히 만들었어요. 내일 다시 시도해 주세요.');
  }

  const desireId = await deps.repo.createDesire(userId, {
    text: body.text,
    category: body.category ?? 'other',
  });

  async function call<T extends { usage: Usage }>(step: string, fn: () => Promise<T>) {
    const startedAt = new Date().toISOString();
    const result = await fn();
    await deps.personal.recordCall({
      userId,
      kind: 'vision',
      step,
      usage: result.usage,
      startedAt,
      finishedAt: new Date().toISOString(),
    });
    return result;
  }

  try {
    const { verdict } = await call('review-input', () =>
      deps.providers.story.reviewSafety(body.text, 'dream'),
    );
    if (verdict.verdict === 'block') {
      return {
        desireId,
        blocked: isCrisis(verdict) ? 'SAFETY_CRISIS' : 'SAFETY_BLOCKED',
        visions: [],
      };
    }

    const { context } = await deps.personal.loadUser(userId);
    const { set } = await call('suggest', () =>
      deps.providers.vision.suggest({ ...context, dream: body.text }),
    );
    const visions: Vision[] = set.visions.map((v, i) => ({ ...v, position: i + 1, storyId: null }));
    await deps.repo.saveVisions(desireId, visions);
    return { desireId, blocked: null, visions };
  } catch (error) {
    if (
      error instanceof ProviderError &&
      (error.code === 'BUDGET_EXCEEDED' || error.code === 'RATE_LIMITED')
    ) {
      throw busy();
    }
    throw error;
  }
}

/** 고른 장면으로 이야기 생성을 시작한다(H05 재생 → H06). 같은 장면을 다시 누르면 같은 이야기. */
export async function startVisionStory(
  deps: VisionDeps,
  userId: string,
  desireId: string,
  position: number,
): Promise<{ storyId: string }> {
  const visions = await deps.repo.findVisions(userId, desireId);
  const vision = visions?.find((v) => v.position === position);
  if (!visions || !vision) throw new ApiError('NOT_FOUND', '장면을 찾을 수 없어요.');
  if (vision.storyId) return { storyId: vision.storyId };
  if (!deps.limiter.take(userId)) throw new ApiError('RATE_LIMITED', '잠시 후 다시 시도해 주세요.');

  const storyId = await deps.repo.createVisionStory(userId, desireId, vision);
  await deps.repo.saveVisions(
    desireId,
    visions.map((v) => (v.position === position ? { ...v, storyId } : v)),
  );
  try {
    await deps.events.requestGeneration({ storyId, userId });
  } catch (e) {
    await deps.stories.markFailed(storyId, 'ENQUEUE_FAILED');
    throw e;
  }
  return { storyId };
}
