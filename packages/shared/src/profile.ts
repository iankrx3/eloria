import { z } from 'zod';
import { NAME_MAX, TONE } from './quiz';

/** Personal(PRD F-11): 좋아하는 것·싫어하는 것 목록 한도. 프롬프트가 길어지지 않게 둔다. */
export const PERSONAL_LIST_MAX = 10;
export const PERSONAL_ITEM_MAX = 20;

const personalItem = z.string().trim().min(1).max(PERSONAL_ITEM_MAX);
const personalList = z
  .array(personalItem)
  .max(PERSONAL_LIST_MAX)
  .refine((v) => new Set(v).size === v.length, '같은 항목을 두 번 넣을 수 없습니다.');

/** 마이 탭에서 고칠 수 있는 프로필 값. 앱이 RLS로 profiles를 직접 고치기 전에 이 스키마로 검증한다. */
export const personalProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(NAME_MAX),
  tone: z.enum(TONE),
  likes: personalList,
  dislikes: personalList,
});
export type PersonalProfile = z.infer<typeof personalProfileSchema>;

/** 목록에 항목을 더한다. 공백·중복·한도 초과면 그대로 돌려준다. */
export function addPersonalItem(list: readonly string[], raw: string): string[] {
  const item = raw.trim();
  if (!personalItem.safeParse(item).success) return [...list];
  if (list.includes(item) || list.length >= PERSONAL_LIST_MAX) return [...list];
  return [...list, item];
}

/** 목표 수정(H13) "바라는 변화" 선택지 */
export const DESIRED_CHANGES = [
  'wealth',
  'love',
  'career',
  'home',
  'health',
  'travel',
  'family',
  'self_love',
] as const;
export type DesiredChange = (typeof DESIRED_CHANGES)[number];

export const STORY_SCENES_MAX = 5;
export const STORY_SCENE_MAX = 80;
export const PROFILE_TEXT_MAX = 40;
export const NARRATOR_SPEEDS = [0.9, 1.0, 1.1] as const;

/** 목표 수정의 장면 한 개(profiles.story_scenes jsonb 원소) */
export const storySceneSchema = z.object({
  text: z.string().trim().min(1).max(STORY_SCENE_MAX),
  tag: z.enum(DESIRED_CHANGES).nullable(),
});
export type StoryScene = z.infer<typeof storySceneSchema>;
export const storyScenesSchema = z.array(storySceneSchema).max(STORY_SCENES_MAX);

/** 마이페이지·설정에서 고치는 나머지 프로필 값(D-44). 앱이 RLS로 직접 쓰기 전에 검증한다. */
export const profileSettingsSchema = z.object({
  location: z.string().trim().max(PROFILE_TEXT_MAX).nullable(),
  occupation: z.string().trim().max(PROFILE_TEXT_MAX).nullable(),
  desiredChanges: z
    .array(z.enum(DESIRED_CHANGES))
    .max(DESIRED_CHANGES.length)
    .refine((v) => new Set(v).size === v.length),
  storyScenes: storyScenesSchema,
  narratorSpeed: z.union([z.literal(0.9), z.literal(1.0), z.literal(1.1)]),
  preferredVoiceId: z.string().uuid().nullable(),
  affirmationNotifyAt: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  notifyAffirmation: z.boolean(),
  notifyStory: z.boolean(),
  notifyChallenge: z.boolean(),
  visionPhotoPath: z.string().max(300).nullable(),
  challengeStartedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
});
export type ProfileSettings = z.infer<typeof profileSettingsSchema>;
