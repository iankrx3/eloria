import { z } from 'zod';

/** 장면 계획(docs/AI_PIPELINE.md 4.1). Gemini 구조화 출력과 stories.scene_plan 컬럼이 이 형식을 따른다. */
export const scenePlanSchema = z.object({
  title: z.string().min(1).max(12),
  goal: z.string().min(1),
  setting: z.object({
    place: z.string().min(1),
    timeOfDay: z.enum(['dawn', 'morning', 'afternoon', 'evening', 'night']),
    season: z.string().optional(),
  }),
  beats: z
    .array(
      z.object({
        kind: z.enum(['arrival', 'situation', 'emotion', 'action', 'daily_life', 'gratitude']),
        description: z.string().min(1),
        sensoryDetails: z.array(z.string().min(1)).min(2),
      }),
    )
    .min(4)
    .max(6),
  identityStatements: z.array(z.string().min(1)).min(2).max(3),
  /** 프로필의 사람만. 새 인물을 지어내지 않는다. */
  people: z.array(z.object({ name: z.string().min(1), role: z.string().min(1) })),
  /** 영어, 얼굴이 특정되지 않는 장면 */
  imagePrompt: z.string().min(1),
  tone: z.enum(['calm', 'excited', 'powerful']),
});
export type ScenePlan = z.infer<typeof scenePlanSchema>;
