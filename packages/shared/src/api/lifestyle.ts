import { z } from 'zod';
import { PERSONAL_ITEM_MAX, PERSONAL_LIST_MAX } from '../profile';

/** POST /v1/profile/lifestyle-suggestions: 퀴즈 답 기반 라이프스타일 추천. 저장은 앱이 고른 뒤에 한다. */
export const lifestyleSuggestionsResponseSchema = z.object({
  items: z.array(z.string().min(1).max(PERSONAL_ITEM_MAX)).max(PERSONAL_LIST_MAX),
});
export type LifestyleSuggestionsResponse = z.infer<typeof lifestyleSuggestionsResponseSchema>;
