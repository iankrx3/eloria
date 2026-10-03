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
