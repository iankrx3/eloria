import { z } from 'zod';
import { PERSONAL_ITEM_MAX } from '../profile';

/** 라이프스타일 AI 추천(Figma P01 ↻): 한 번에 6개, 칩 한 개 길이는 직접 넣는 칩과 같다. */
export const LIFESTYLE_SUGGESTIONS = 6;

export const lifestyleSetSchema = z.object({
  items: z.array(z.string().trim().min(1).max(PERSONAL_ITEM_MAX)).min(3).max(LIFESTYLE_SUGGESTIONS),
});
export type LifestyleSet = z.infer<typeof lifestyleSetSchema>;
