import { canAccessLibraryItem, LIMITS, type StoryMediaResponse } from '@eloria/shared';
import { Hono } from 'hono';
import { z } from 'zod';
import type { StoryEvents } from '../inngest/events';
import { ApiError } from '../lib/errors';
import type { RateLimiter } from '../lib/rate-limit';
import type { AuthVariables } from '../middleware/auth';
import type { StoryRepo } from '../repos/story-repo';

const idSchema = z.uuid();

/** 서명 URL 유효 시간(ARCHITECTURE 5절: 1시간, 만료 시 재발급) */
export const MEDIA_URL_TTL_SEC = 60 * 60;

const reviseBody = z.object({
  request: z.string().trim().min(1).max(200),
});

/** 스토리 단위 작업(docs/API.md 2절). userId는 검증된 토큰에서만 얻는다. */
export function createStoryRoutes(
  repo: StoryRepo,
  extra?: { events: StoryEvents; limiter: RateLimiter },
) {
  const routes = new Hono<{ Variables: AuthVariables }>()
    .get('/:id/media', async (c) => {
      const userId = c.get('user').id;
      const storyId = idSchema.parse(c.req.param('id'));

      const media = await repo.findMedia(userId, storyId);
      if (!media) throw new ApiError('NOT_FOUND', '스토리를 찾을 수 없어요.');
      // 구독 여부는 subscriptions(M5)가 생기면 서버에서 확인한다. 그 전에는 페이월이 꺼져 있다.
      if (
        media.access === 'library' &&
        !canAccessLibraryItem({ isFree: media.isFree, subscribed: false })
      ) {
        throw new ApiError('FORBIDDEN', '구독하면 들을 수 있어요.');
      }
      if (!media.audioPath) throw new ApiError('NOT_FOUND', '아직 음성이 없어요.');

      const urls = await repo.signMedia(
        { audio: media.audioPath, cover: media.coverPath },
        MEDIA_URL_TTL_SEC,
      );
      const expiresAt = new Date(Date.now() + MEDIA_URL_TTL_SEC * 1000).toISOString();
      return c.json({ ...urls, expiresAt } satisfies StoryMediaResponse);
    })
    .delete('/:id', async (c) => {
      const userId = c.get('user').id;
      const storyId = idSchema.parse(c.req.param('id'));

      const story = await repo.findOwnedStatus(userId, storyId);
      if (!story) throw new ApiError('NOT_FOUND', '스토리를 찾을 수 없어요.');

      // 생성 중에 지우면 파이프라인이 나중에 올린 음성 파일이 주인 없이 남는다. 끝난 뒤에만 지운다.
      // text_ready에 오류 코드가 있으면(TTS_FAILED) 음성 단계가 끝난 것이다.
      const { status, errorCode } = story;
      const finished =
        status === 'failed' ||
        status === 'audio_ready' ||
        status === 'ready' ||
        (status === 'text_ready' && errorCode !== null);
      if (!finished) throw new ApiError('CONFLICT', '스토리를 만드는 중에는 지울 수 없어요.');

      await repo.deleteStory(userId, storyId);
      return c.body(null, 204);
    });

  if (extra) {
    routes.post('/:id/revise', async (c) => {
      const userId = c.get('user').id;
      const storyId = idSchema.parse(c.req.param('id'));
      const body = reviseBody.parse(await c.req.json());
      if (!extra.limiter.take(userId)) {
        throw new ApiError('RATE_LIMITED', '잠시 후 다시 시도해 주세요.');
      }
      const used = await repo.countCustomWishSlots(userId, new Date());
      if (used >= LIMITS.CUSTOM_WISHES_PER_DAY) {
        throw new ApiError(
          'QUOTA_EXCEEDED',
          '오늘 만들 수 있는 이야기를 다 썼어요. 내일 다시 시도해 주세요.',
        );
      }
      const created = await repo.createRevision(userId, storyId, body.request);
      if (!created) throw new ApiError('NOT_FOUND', '고칠 이야기를 찾을 수 없어요.');
      try {
        await extra.events.requestGeneration({ storyId: created.storyId, userId });
      } catch (e) {
        await repo.markFailed(created.storyId, 'ENQUEUE_FAILED');
        throw e;
      }
      return c.json(created, 202);
    });
  }

  return routes;
}
