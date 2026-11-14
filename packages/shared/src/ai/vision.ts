import { z } from 'zod';

/** 비전 고르기(Figma H05): 한 꿈 입력에 장면 4개 */
export const VISIONS_PER_DESIRE = 4;
export const VISION_TITLE_MAX = 30;
export const VISION_SUMMARY_MAX = 120;

const TIME_OF_DAY = ['dawn', 'morning', 'afternoon', 'evening', 'night'] as const;

/** 예전 vision@v1이 돌려주던 장면. 라이브러리 테스트와 그 프롬프트만 남긴다. */
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

/** 10-1 장면 미리보기. 새로 쓸 때 hint는 40자. */
export const ARIN_SCENE_HINT_MAX = 40;
export const arinSceneIdeaSchema = z.object({
  title: z.string().trim().min(1).max(VISION_TITLE_MAX),
  hint: z.string().trim().min(1).max(ARIN_SCENE_HINT_MAX),
});
export type ArinSceneIdea = z.infer<typeof arinSceneIdeaSchema>;

export const arinSceneSetSchema = z.object({
  scenes: z.array(arinSceneIdeaSchema).length(VISIONS_PER_DESIRE),
});
export type ArinSceneSet = z.infer<typeof arinSceneSetSchema>;

/**
 * 저장된 장면의 hint 상한. 예전 summary(최대 120)를 hint로 읽는다.
 * 새로 만드는 장면은 ARIN_SCENE_HINT_MAX를 쓴다.
 */
export const VISION_HINT_READ_MAX = 160;

function withHint(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  const row = value as Record<string, unknown>;
  if (typeof row.hint === 'string') return value;
  if (typeof row.summary === 'string') return { ...row, hint: row.summary };
  return value;
}

/** desires.visions 원소 / stories.vision. 예전 행의 summary는 hint로 읽는다. */
export const visionSchema = z.preprocess(
  withHint,
  z.object({
    title: z.string().trim().min(1).max(VISION_TITLE_MAX),
    hint: z.string().trim().min(1).max(VISION_HINT_READ_MAX),
    position: z.number().int().min(1).max(VISIONS_PER_DESIRE),
    /** 이 장면으로 만든 스토리(재생을 눌렀을 때 생긴다) */
    storyId: z.uuid().nullable(),
  }),
);
export type Vision = z.infer<typeof visionSchema>;
export const visionListSchema = z.array(visionSchema).max(VISIONS_PER_DESIRE);
