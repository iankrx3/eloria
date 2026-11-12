import { z } from 'zod';

/** 비전 고르기(Figma H05): 한 꿈 입력에 장면 4개 */
export const VISIONS_PER_DESIRE = 4;
export const VISION_TITLE_MAX = 30;
export const VISION_SUMMARY_MAX = 120;

const TIME_OF_DAY = ['dawn', 'morning', 'afternoon', 'evening', 'night'] as const;

/** Gemini가 돌려주는 장면 하나(구조화 출력) */
export const visionIdeaSchema = z.object({
  title: z.string().trim().min(2).max(VISION_TITLE_MAX),
  summary: z.string().trim().min(4).max(VISION_SUMMARY_MAX),
  place: z.string().trim().min(1).max(40),
  timeOfDay: z.enum(TIME_OF_DAY),
});
export type VisionIdea = z.infer<typeof visionIdeaSchema>;

export const visionSetSchema = z.object({
  visions: z.array(visionIdeaSchema).length(VISIONS_PER_DESIRE),
});
export type VisionSet = z.infer<typeof visionSetSchema>;

/** desires.visions 원소 / stories.vision(JSON 컬럼, CLAUDE.md 데이터 규칙) */
export const visionSchema = visionIdeaSchema.extend({
  position: z.number().int().min(1).max(VISIONS_PER_DESIRE),
  /** 이 장면으로 만든 스토리(재생을 눌렀을 때 생긴다) */
  storyId: z.uuid().nullable(),
});
export type Vision = z.infer<typeof visionSchema>;
export const visionListSchema = z.array(visionSchema).max(VISIONS_PER_DESIRE);
