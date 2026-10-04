import { canAccessLibraryItem, type StoryMediaResponse } from '@eloria/shared';
import { Hono } from 'hono';
import { z } from 'zod';
import { ApiError } from '../lib/errors';
import type { AuthVariables } from '../middleware/auth';
import type { StoryRepo } from '../repos/story-repo';

const idSchema = z.uuid();

/** 서명 URL 유효 시간(ARCHITECTURE 5절: 1시간, 만료 시 재발급) */
export const MEDIA_URL_TTL_SEC = 60 * 60;

/** 스토리 단위 작업(docs/API.md 2절). userId는 검증된 토큰에서만 얻는다. */
export function createStoryRoutes(repo: StoryRepo) {
  return new Hono<{ Variables: AuthVariables }>()
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
}
