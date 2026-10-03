import { z } from 'zod';
import { quizAnswerSchemas, quizQuestionKeySchema } from '../quiz';

/** POST /v1/quiz/answers. 답변은 문항별 형식으로 다시 검증한다. */
export const quizAnswerRequestSchema = z
  .object({
    questionKey: quizQuestionKeySchema,
    answer: z.unknown(),
  })
  .superRefine((value, ctx) => {
    const result = quizAnswerSchemas[value.questionKey].safeParse(value.answer);
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({ ...issue, path: ['answer', ...issue.path] });
      }
    }
  });
export type QuizAnswerRequest = z.infer<typeof quizAnswerRequestSchema>;

/** POST /v1/quiz/complete 응답. 프로필에 반영된 값만 돌려준다. */
export const quizCompleteResponseSchema = z.object({
  profile: z.object({
    displayName: z.string().nullable(),
    relationshipStatus: z.string().nullable(),
    tone: z.string().nullable(),
    listenTime: z.string().nullable(),
    notifyAt: z.string().nullable(),
  }),
});
export type QuizCompleteResponse = z.infer<typeof quizCompleteResponseSchema>;
