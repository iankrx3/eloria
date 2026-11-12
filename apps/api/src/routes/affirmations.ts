import { Hono } from 'hono';
import { getTodayAffirmations, type TodayDeps } from '../affirmations/today';
import type { AuthVariables } from '../middleware/auth';

/** 오늘의 확언(docs/API.md). 그날 처음 부르면 이 요청에서 만든다(수 초 걸릴 수 있음). */
export function createAffirmationRoutes(deps: TodayDeps) {
  return new Hono<{ Variables: AuthVariables }>().get('/today', async (c) =>
    c.json(await getTodayAffirmations(deps, c.get('user').id)),
  );
}
