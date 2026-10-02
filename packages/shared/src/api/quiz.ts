import { z } from 'zod';
import { quizQuestionKeySchema } from '../quiz';

export const quizAnswerRequestSchema = z.object({
  questionKey: quizQuestionKeySchema,
  answer: z.unknown(),
});
export type QuizAnswerRequest = z.infer<typeof quizAnswerRequestSchema>;
