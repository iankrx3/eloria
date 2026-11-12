import { z } from 'zod';

export const affirmationItemSchema = z.object({
  id: z.uuid(),
  position: z.number().int().min(1),
  text: z.string(),
  theme: z.string().nullable(),
});
export type AffirmationItem = z.infer<typeof affirmationItemSchema>;

/** GET /v1/affirmations/today: 오늘 확언(없으면 이 요청에서 만든다) */
export const todayAffirmationsResponseSchema = z.object({
  day: z.iso.date(),
  items: z.array(affirmationItemSchema),
});
export type TodayAffirmationsResponse = z.infer<typeof todayAffirmationsResponseSchema>;
