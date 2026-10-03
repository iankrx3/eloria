import { manifestRequestSchema, type ManifestResponse } from '@eloria/shared';
import { Hono } from 'hono';
import type { StoryEvents } from '../inngest/events';
import { ApiError } from '../lib/errors';
import type { RateLimiter } from '../lib/rate-limit';
import type { AuthVariables } from '../middleware/auth';
import type { StoryRepo } from '../repos/story-repo';

/**
 * POST /v1/manifests: 꿈 등록 + 첫 스토리 생성 요청(docs/API.md 2절, ARCHITECTURE 2.1).
 * 생성은 Inngest가 하고 여기서는 행을 만들고 이벤트만 보낸 뒤 202로 바로 답한다.
 * 무료·구독 생성 한도(generation_quota) 검사는 M5에서 붙인다(ROADMAP).
 */
export function createManifestRoutes(deps: {
  repo: StoryRepo;
  events: StoryEvents;
  limiter: RateLimiter;
}) {
  return new Hono<{ Variables: AuthVariables }>().post('/', async (c) => {
    const userId = c.get('user').id;
    const body = manifestRequestSchema.parse(await c.req.json());

    if (!deps.limiter.take(userId)) {
      throw new ApiError('RATE_LIMITED', '잠시 후 다시 시도해 주세요.');
    }

    const created = await deps.repo.createManifest(userId, {
      text: body.text,
      category: body.category ?? 'other',
    });

    try {
      await deps.events.requestGeneration({
        storyId: created.storyId,
        userId,
        tone: body.tone,
        voiceKey: body.voiceKey,
      });
    } catch (e) {
      await deps.repo.markFailed(created.storyId, 'ENQUEUE_FAILED');
      throw e;
    }

    return c.json(created satisfies ManifestResponse, 202);
  });
}
