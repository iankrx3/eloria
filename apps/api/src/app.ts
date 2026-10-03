import { LIMITS } from '@eloria/shared';
import { Hono } from 'hono';
import { serve as serveInngest } from 'inngest/hono';
import type { InngestFunction } from 'inngest';
import { inngest, ping } from './inngest';
import type { StoryEvents } from './inngest/events';
import { errorJson, handleError } from './lib/errors';
import { createRateLimiter, type RateLimiter } from './lib/rate-limit';
import { requireAuth, type AuthVariables, type TokenVerifier } from './middleware/auth';
import type { PushRepo } from './repos/push-repo';
import type { QuizRepo } from './repos/quiz-repo';
import type { StoryRepo } from './repos/story-repo';
import { health } from './routes/health';
import { createManifestRoutes } from './routes/manifests';
import { createPushTokenRoutes } from './routes/push-tokens';
import { createQuizRoutes } from './routes/quiz';
import { createStoryRoutes } from './routes/stories';

export type AppDeps = {
  verifyToken: TokenVerifier;
  quizRepo: QuizRepo;
  storyRepo: StoryRepo;
  pushRepo: PushRepo;
  storyEvents: StoryEvents;
  /** 생성 요청 분당 한도. 기본값은 LIMITS.GENERATION_REQUESTS_PER_MINUTE */
  generationLimiter?: RateLimiter;
  /** /api/inngest로 서빙할 함수. 서버는 실제 저장소·어댑터로 만든 함수를 넘긴다. */
  inngestFunctions?: InngestFunction.Any[];
};

export function createApp(deps: AppDeps) {
  const app = new Hono();

  app.onError(handleError);
  app.notFound((c) => errorJson(c, 'NOT_FOUND', '요청한 경로가 없습니다.'));

  app.on(
    ['GET', 'POST', 'PUT'],
    '/api/inngest',
    serveInngest({ client: inngest, functions: deps.inngestFunctions ?? [ping] }),
  );

  const v1 = new Hono<{ Variables: AuthVariables }>();
  v1.route('/health', health);
  // health를 제외한 /v1 경로는 모두 Supabase JWT가 필요하다.
  v1.use('*', requireAuth(deps.verifyToken));
  v1.route('/quiz', createQuizRoutes(deps.quizRepo));
  v1.route('/stories', createStoryRoutes(deps.storyRepo));
  v1.route('/push-tokens', createPushTokenRoutes(deps.pushRepo));
  v1.route(
    '/manifests',
    createManifestRoutes({
      repo: deps.storyRepo,
      events: deps.storyEvents,
      limiter:
        deps.generationLimiter ??
        createRateLimiter({ limit: LIMITS.GENERATION_REQUESTS_PER_MINUTE, windowMs: 60_000 }),
    }),
  );
  app.route('/v1', v1);

  return app;
}
