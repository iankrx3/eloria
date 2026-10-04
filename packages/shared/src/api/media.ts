import { z } from 'zod';

/** GET /v1/stories/:id/media: 앱이 직접 서명할 수 없는 경로(library, 해시 캐시)의 서명 URL(API.md 2절) */
export const storyMediaResponseSchema = z.object({
  audioUrl: z.url(),
  coverUrl: z.url().nullable(),
  expiresAt: z.iso.datetime(),
});
export type StoryMediaResponse = z.infer<typeof storyMediaResponseSchema>;
