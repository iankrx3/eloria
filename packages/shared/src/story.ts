import { z } from 'zod';

/** 스토리 상태와 전이(docs/AI_PIPELINE.md 3절) */
export const STORY_STATUS = [
  'queued',
  'planning',
  'writing',
  'reviewing',
  'text_ready',
  'audio_ready',
  'ready',
  'failed',
] as const;
export const storyStatusSchema = z.enum(STORY_STATUS);
export type StoryStatus = z.infer<typeof storyStatusSchema>;

export const STORY_KIND = ['on_demand', 'daily', 'library'] as const;
export const DESIRE_CATEGORY = [
  'wealth',
  'love',
  'career',
  'health',
  'confidence',
  'other',
] as const;
export type DesireCategory = (typeof DESIRE_CATEGORY)[number];

export const DESIRE_TEXT_MAX = 200;

/** 앱은 text_ready부터 읽기, audio_ready부터 재생을 허용한다(ARCHITECTURE 2.1). */
export function canReadStory(status: StoryStatus) {
  return status === 'text_ready' || status === 'audio_ready' || status === 'ready';
}

export function canPlayStory(status: StoryStatus) {
  return status === 'audio_ready' || status === 'ready';
}

/** Inngest 이벤트 `story/generate.requested`의 데이터(docs/API.md 4절) */
export const storyGenerateRequestedSchema = z.object({
  storyId: z.uuid(),
  tone: z.enum(['calm', 'excited', 'powerful']).optional(),
  voiceKey: z.string().max(40).optional(),
});
export type StoryGenerateRequested = z.infer<typeof storyGenerateRequestedSchema>;
