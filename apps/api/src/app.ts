import { Hono } from 'hono';
import { serve as serveInngest } from 'inngest/hono';
import { functions, inngest } from './inngest';
import { errorJson, handleError } from './lib/errors';
import { requireAuth, type AuthVariables, type TokenVerifier } from './middleware/auth';
import type { QuizRepo } from './repos/quiz-repo';
import { health } from './routes/health';
import { createQuizRoutes } from './routes/quiz';

export type AppDeps = { verifyToken: TokenVerifier; quizRepo: QuizRepo };

export function createApp(deps: AppDeps) {
  const app = new Hono();

  app.onError(handleError);
  app.notFound((c) => errorJson(c, 'NOT_FOUND', '요청한 경로가 없습니다.'));

  app.on(['GET', 'POST', 'PUT'], '/api/inngest', serveInngest({ client: inngest, functions }));

  const v1 = new Hono<{ Variables: AuthVariables }>();
  v1.route('/health', health);
  // health를 제외한 /v1 경로는 모두 Supabase JWT가 필요하다.
  v1.use('*', requireAuth(deps.verifyToken));
  v1.route('/quiz', createQuizRoutes(deps.quizRepo));
  app.route('/v1', v1);

  return app;
}
