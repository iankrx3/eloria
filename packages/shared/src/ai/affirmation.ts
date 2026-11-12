import { z } from 'zod';

/** 오늘의 확언(Figma A01): 하루 10장. 그날 처음 열 때 서버가 만든다(D-45). */
export const AFFIRMATIONS_PER_DAY = 10;
export const AFFIRMATION_TEXT_MAX = 60;
export const AFFIRMATION_THEME_MAX = 12;

/** Gemini가 돌려주는 확언 묶음(구조화 출력) */
export const affirmationSetSchema = z.object({
  items: z
    .array(
      z.object({
        text: z.string().trim().min(4).max(AFFIRMATION_TEXT_MAX),
        theme: z.string().trim().min(1).max(AFFIRMATION_THEME_MAX),
      }),
    )
    .length(AFFIRMATIONS_PER_DAY),
});
export type AffirmationSet = z.infer<typeof affirmationSetSchema>;
