import { z } from 'zod';
import { DESIRE_CATEGORY, DESIRE_TEXT_MAX } from '../story';
import { visionSchema } from '../ai/vision';

/** POST /v1/visions: 꿈을 등록하고 장면 4개를 받는다(H04 → H05) */
export const visionsRequestSchema = z.object({
  text: z.string().trim().min(1).max(DESIRE_TEXT_MAX),
  category: z.enum(DESIRE_CATEGORY).optional(),
});
export type VisionsRequest = z.infer<typeof visionsRequestSchema>;

export const visionsResponseSchema = z.object({
  desireId: z.uuid(),
  /** 입력 검수에서 막히면 장면 없이 이유만 온다(SAFETY_CRISIS = 도움 안내) */
  blocked: z.enum(['SAFETY_BLOCKED', 'SAFETY_CRISIS']).nullable(),
  visions: z.array(visionSchema),
});
export type VisionsResponse = z.infer<typeof visionsResponseSchema>;

/** POST /v1/visions/:desireId/:position/story → 그 장면으로 이야기 생성 시작 */
export const visionStoryResponseSchema = z.object({ storyId: z.uuid() });
export type VisionStoryResponse = z.infer<typeof visionStoryResponseSchema>;

/** POST /v1/daily: 오늘의 이야기(없으면 만든다). 꿈이 하나도 없으면 storyId = null */
export const dailyResponseSchema = z.object({
  day: z.iso.date(),
  storyId: z.uuid().nullable(),
});
export type DailyResponse = z.infer<typeof dailyResponseSchema>;
