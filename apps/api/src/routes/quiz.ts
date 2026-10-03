import {
  collectQuizAnswers,
  profileFromQuizAnswers,
  quizAnswerRequestSchema,
  toCamel,
  type QuizCompleteResponse,
} from '@eloria/shared';
import { Hono } from 'hono';
import type { AuthVariables } from '../middleware/auth';
import type { QuizRepo } from '../repos/quiz-repo';

/** 퀴즈 답변 저장과 완료(docs/API.md 2절). userId는 검증된 토큰에서만 얻는다. */
export function createQuizRoutes(repo: QuizRepo) {
  return new Hono<{ Variables: AuthVariables }>()
    .post('/answers', async (c) => {
      const { questionKey, answer } = quizAnswerRequestSchema.parse(await c.req.json());
      await repo.upsertAnswer(c.get('user').id, questionKey, answer);
      return c.body(null, 204);
    })
    .post('/complete', async (c) => {
      const userId = c.get('user').id;
      const answers = collectQuizAnswers(await repo.listAnswers(userId));
      const profile = await repo.completeQuiz(
        userId,
        profileFromQuizAnswers(answers),
        answers.people ?? [],
      );
      return c.json({ profile: toCamel(profile) } satisfies QuizCompleteResponse);
    });
}
