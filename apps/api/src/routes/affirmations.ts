import { Hono } from 'hono';
import { getTodayAffirmations, type TodayDeps } from '../affirmations/today';
import type { AuthVariables } from '../middleware/auth';

/** 오늘의 확언(docs/API.md). 그날 처음이면 오늘 이야기의 3줄 또는 기본 3줄을 저장한다. */
export function createAffirmationRoutes(deps: TodayDeps) {
  return new Hono<{ Variables: AuthVariables }>().get('/today', async (c) =>
    c.json(await getTodayAffirmations(deps, c.get('user').id)),
  );
}
