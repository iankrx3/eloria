import { Hono } from 'hono';
import { z } from 'zod';
import { ApiError } from '../lib/errors';
import type { AuthVariables } from '../middleware/auth';
import type { StoryRepo } from '../repos/story-repo';

const idSchema = z.uuid();

/** 스토리 단위 작업(docs/API.md 2절). userId는 검증된 토큰에서만 얻는다. */
export function createStoryRoutes(repo: StoryRepo) {
  return new Hono<{ Variables: AuthVariables }>().delete('/:id', async (c) => {
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
