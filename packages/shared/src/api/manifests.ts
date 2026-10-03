import { z } from 'zod';
import { TONE } from '../quiz';
import { DESIRE_CATEGORY, DESIRE_TEXT_MAX } from '../story';

/** POST /v1/manifests: 꿈 등록 + 첫 스토리 생성 요청(docs/API.md 2절) */
export const manifestRequestSchema = z.object({
  text: z.string().trim().min(1).max(DESIRE_TEXT_MAX),
  category: z.enum(DESIRE_CATEGORY).optional(),
  voiceKey: z.string().max(40).optional(),
  tone: z.enum(TONE).optional(),
});
export type ManifestRequest = z.infer<typeof manifestRequestSchema>;

export const manifestResponseSchema = z.object({
  desireId: z.uuid(),
  storyId: z.uuid(),
});
export type ManifestResponse = z.infer<typeof manifestResponseSchema>;
