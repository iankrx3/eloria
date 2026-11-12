import { Hono } from 'hono';
import { ensureDaily, type DailyDeps } from '../daily/daily';
import type { AuthVariables } from '../middleware/auth';

/** 오늘의 이야기(docs/API.md). 홈을 열 때 부른다. */
export function createDailyRoutes(deps: DailyDeps) {
  return new Hono<{ Variables: AuthVariables }>().post('/', async (c) =>
    c.json(await ensureDaily(deps, c.get('user').id)),
  );
}
